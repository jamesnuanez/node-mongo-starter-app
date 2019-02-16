//=============================================================================
// General setup
//=============================================================================
const express       = require('express');
const session       = require('express-session');
const bodyParser    = require('body-parser');
const flash         = require('connect-flash');
const mongoose      = require('mongoose');
const MongoStore    = require('connect-mongo')(session);
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
  secret: process.env.SESSION_SECRET,
  name: 'session',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 600000 },
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
}));

//=============================================================================
// Passport
//=============================================================================
app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//=============================================================================
// Custom middleware
//=============================================================================
// Applies to all routes
app.use((req, res, next) => {
  console.log(`${new Date()} ${req.originalUrl}`);
  res.locals.siteName = 'Site Name';
  res.locals.flashes  = req.flash();
  next();
});

// Both external and internal menus available for testing purposes
app.use((req, res, next) => {
  res.locals.externalMenu = [
    { page: 'Home',           slug: '' },
    { page: 'Create account', slug: 'create-account' },
    { page: 'Log in',         slug: 'login' },
    { page: 'Password reset', slug: 'password-reset' },
  ];
  next();
});

app.use((req, res, next) => {
  res.locals.internalMenu = [
    { page: 'Account home',    slug: 'account/' },
    { page: 'Account details', slug: 'account/account-details' },
    { page: 'Change email',    slug: 'account/change-email' },
    { page: 'Change password', slug: 'account/change-password' },
    { page: 'Delete account',  slug: 'account/delete-account' },
    { page: 'Invite users',    slug: 'account/invite-users' },
    { page: 'Log out',         slug: 'account/logout' },
  ];
  next();
});

//=============================================================================
// Routes
//=============================================================================
const external      = require('./routes/external');
const internal      = require('./routes/internal');
const passwordReset = require('./routes/password-reset');

app.use('/',               external);
app.use('/account/',       internal);
app.use('/password-reset', passwordReset)

//=============================================================================
// Launch app
//=============================================================================
app.listen(process.env.PORT, () => {
  console.log('')
  console.log('#===============================================================================');
  console.log(`# Express app started on port ${process.env.PORT}`);
  console.log('#===============================================================================');
});
