//=============================================================================
// General setup
//=============================================================================
const express       = require('express');
const mongoose      = require('mongoose');
const session       = require('express-session');
const flash         = require('connect-flash');
const MongoStore    = require('connect-mongo')(session);
const bodyParser    = require('body-parser');
const passport      = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const app = express();
require('dotenv').config({ path: 'variables.env' });
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(flash());

//=============================================================================
// Mongoose setup
//=============================================================================
mongoose.connect(process.env.DATABASE, { useNewUrlParser: true });
mongoose.connection.on('error', console.error.bind(console, '!!! Mongoose connection error:'));
mongoose.connection.once('open', () => {
console.log(`# Mongoose connected`);
console.log('#-------------------------------------------------------------------------------');
});

require('./models/User.js')
const User = mongoose.model('User');

//=============================================================================
// Session
//=============================================================================
app.use(session({
  secret: 'alksdjfasd8f9ajsdfqw23hf2987fa9ysd8fa',
  name:   'session',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60000 },
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
}));

//=============================================================================
// Passport
//=============================================================================
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username' });
      }
      if (user.password !== password) {
        return done(null, false, { message: 'Incorrect password' });
      }
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//=============================================================================
// Middleware
//=============================================================================
// Console log every request
app.use((req, res, next) => {
  console.log(`${new Date()} ${req.originalUrl}`);
  next();
});

// Things available to all routes
app.use((req, res, next) => {
  res.locals.siteName = 'Site Name';
  res.locals.flashes  = req.flash();
  console.log(res.locals.flashes);
  console.log(req.user);
  next();
});

// Both external and internal menus available for testing
app.use((req, res, next) => {
  res.locals.externalMenu = [
    { page: 'Home',           slug: '' },
    { page: 'Create account', slug: 'create-account' },
    { page: 'Log in',         slug: 'login' },
    { page: 'Password reset', slug: 'password-reset' },
    { page: 'Test Flash',     slug: 'test-flash' },
  ];
  next();
});

app.use((req, res, next) => {
  res.locals.internalMenu = [
    { page: 'Account home', slug: 'account/' },
    { page: 'Edit account', slug: 'account/edit-account' },
    { page: 'Invite users', slug: 'account/invite-users' },
    { page: 'Log out',      slug: 'account/logout' },
  ];
  next();
});

//=============================================================================
// Test flash
//=============================================================================
app.get('/test-flash', (req, res) => {
  req.flash('info', 'hello');
  req.flash('info', 'hello2');
  req.flash('info', 'hello3');
  req.flash('anotherthing', 'asdf');
  res.redirect('/');
});

app.get('/test-flash-result', (req, res) => {
  // console.log(req.flash());
  // res.json(req.flash());
  res.json(req.flash());
});

app.get('/login-test', (req, res) => {
  if (req.isAuthenticated()) {
    res.send('authenticated')
  } else {
    res.send('NOT authenticated')
  }
});

//=============================================================================
// Routes
//=============================================================================
const external  = require('./routes/external');
const internal  = require('./routes/internal');

app.use('/',         external);
app.use('/account/', internal);

//=============================================================================
// Launch app
//=============================================================================
app.listen(process.env.PORT, () => {
  console.log('')
  console.log('#===============================================================================');
  console.log(`# Express app started on port ${process.env.PORT}`);
  console.log('#===============================================================================');
});
