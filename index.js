const config = require('./config.json')[process.env.NODE_ENV || 'development'];
const secrets = require('./secrets.json');
const storage = require('@google-cloud/storage')();
const _ = require('underscore');
const Promise = require('bluebird');
const mustache = require('mustache-express');
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const filesize = require('filesize');
const moment = require('moment');
const twilio = require('twilio')(
  secrets.twilio_account_sid,
  secrets.twilio_auth_token
);

const app = express();
app.engine('mustache', mustache());
app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');
app.use(express.static('public'));

const session = require('express-session');
const MemcachedStore = require('connect-memjs')(session);
const store = new MemcachedStore({
  servers: config.memcached_servers,
  username: 'gcp-redis',
  password: secrets.memcached_password
});
app.use(session({
  secret: 'chinese whispers',
  store: store,
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

// Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.
passport.use(new GoogleStrategy(
  {
    clientID: secrets.google_oauth_id,
    clientSecret: secrets.google_oauth_secret,
    callbackURL: config.oauth_callback_url
  },
  function(accessToken, refreshToken, profile, done) {
    var err = null,
        user = null;

    console.log('login by ' + profile.id);

    if (profile.id == '101919358637930006851') {
      console.log('looks like my guy');
      user = {id: profile.id, name: profile.displayName};
    } else {
      console.log('invalid user. exterminate.');
      err = 'Invalid user.';
      user = false;
    }

    return done(err, user);
  }
));

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
app.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    console.log('success, redirecting to index');
    res.redirect('/');
  });

app.get('/', (req, res) => {
  var user;
  if (req.session.passport && req.session.passport.user) {
    user = req.session.passport.user.name;
    console.log(req.session.passport);
  }

  res.render('index', {user: user});
});

app.get('/storage/files', (req, res) => {
  if ('x-appengine-cron' in req.headers
      || (req.session.passport
          && req.session.passport.user)) {

    console.log('Starting the file traversal...');
    var startTime = moment(Date.now());
    storageList().then((data) => {
      sendMessage(data);
      var endTime = moment(Date.now());
      var duration = moment.duration(endTime.diff(startTime)).humanize();
      console.log('File traversal completed in ' + duration + '.');

      res.status(200).send(data);
    });
  } else {
    res.status(401).send('<h1>Not Authorized</h1>');
  }
});

app.get('/storage/async', (req, res) => {
  res.render('async');
});

// Start the server
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
server.timeout = 240000;

var sendMessage = (data) => {
  twilio.messages.create({
    to: secrets.my_number,
    from: secrets.twilio_number,
    body: formatMessage(data)
  })
    .then((message) => {
      res.status(200).send(message.sid);
    })
    .catch((err) => {
      if (err) {
        next(err);
        return;
      }
    });
};

var formatMessage = (data) => {
  return 'GCS contains '
    + data.totals.files.toLocaleString()
    + ' files, totaling '
    + data.totals.size + '.';
};

var storageList = () => {
  return new Promise((resolve, reject) => {
    var returnMessage = '';
    var bucketData = [];

    console.log('Retrieving buckets...');
    storage.getBuckets().then((data) => {
      var buckets = data[0];

      console.log('Buckets retrieved. Reading files...');
      var bucketReaders = buckets.map((bucket) => {
        return new Promise((resolve, reject) => {
          console.log('Streaming files for ' + bucket.name + '...');
          var files = 0;
          var size = 0;
          var lastLogged = 0;
          var bucketNode = {
            name: bucket.name,
            files: 0,
            size: 0
          };

          bucket.getFilesStream()
            .on('data', (file) => {
              files += 1;
              size += file.metadata.size * 1;
              if (files - lastLogged > 1000) {
                lastLogged = files;
                console.log(bucket.name + ': ' + files);
              }
            })
            .on('end', () => {
              bucketNode['files'] = files;
              bucketNode['size'] = size;
              console.log('Completed ' + bucketNode.name + ':');
              console.log(bucketNode);
              resolve(bucketNode);
            });
        });
      });

      return Promise.all(bucketReaders);
    }).then((data) => {
      var totals = data.reduce((acc, b) => {
        acc.files += b.files;
        acc.size += b.size;
        return acc;
      }, {files: 0, size: 0});

      totals.size = filesize(totals.size);

      resolve({
        totals: totals,
        buckets: data
      });
    }).catch((e) => {
      console.log(e);
    });
  });
};
