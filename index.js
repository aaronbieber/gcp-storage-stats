const config = require('./config.json')[process.env.NODE_ENV || 'development'];
const secrets = require('app/secrets')();
const _ = require('underscore');
const Promise = require('bluebird');
const mustache = require('mustache-express');
const express = require('express');

const app = express();
app.engine('mustache', mustache());
app.set('view engine', 'mustache');
app.set('views', __dirname + '/public/templates');
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
  resave: false,
  saveUninitialized: false
}));

app.use('/', require('./routes/home.js'));
app.use('/auth', require('./routes/auth.js')(app));
app.use('/storage', require('./routes/storage.js'));

// Start the server
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
server.timeout = 240000;
