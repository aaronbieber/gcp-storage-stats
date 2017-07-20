const secrets = require('app/secrets')();
const config = require('../config.json')[process.env.NODE_ENV || 'development'];
const router = require('express').Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

module.exports = (app) => {
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
  router.get('/google',
             passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));

  // GET /auth/google/callback
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  If authentication fails, the user will be redirected back to the
  //   login page.  Otherwise, the primary route function function will be called,
  //   which, in this example, will redirect the user to the home page.
  router.get('/google/callback',
             passport.authenticate('google', { failureRedirect: '/login' }),
             function(req, res) {
               console.log('success, redirecting to index');
               res.redirect('/');
             });

  router.get('/logout', (req, res) => {
    delete(req.session.passport);
    res.redirect('/');
  });

  return router;
};
