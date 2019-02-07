//=============================================================================
// General setup
//=============================================================================
const express   = require('express');
const session = require('express-session');
const mongoose  = require('mongoose');
// const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo')(session);
const bodyParser = require('body-parser');

const app = express();
require('dotenv').config({ path: 'variables.env' });
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(cookieParser());

//=============================================================================
// Session
//=============================================================================

app.use(session({
  secret: 'something random',
  name:   'session',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60000 },
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
}));

app.get('/session', (req, res) => {
  res.send(`<form method="POST"><input type="text" name="text"><button>Submit</button></form><p>${req.session.entry}</p>`)
});

app.post('/session', (req, res) => {
  req.session.entry = req.body.text;
  res.redirect('/session')
});

app.get('/session-clear', (req, res) => {
  req.session.destroy(function(err) {
    console.log(err);
    res.redirect('/session');
  });
});

//=============================================================================
// Mongoose setup
//=============================================================================
mongoose.connect(process.env.DATABASE, { useNewUrlParser: true });
mongoose.connection.on('error', console.error.bind(console, 'Mongoose connection error:'));
mongoose.connection.once('open', () => {
console.log(`# Mongoose connected`);
console.log('#-------------------------------------------------------------------------------');
});

//=============================================================================
// Middleware
//=============================================================================
// Console log every request
app.use((req, res, next) => {
  console.log(`${new Date()} ${req.originalUrl}`);
  next();
});

// Site name available to all routes
app.locals.siteName = 'Site Name';

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
