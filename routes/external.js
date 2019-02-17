//=============================================================================
// Setup
//=============================================================================
const express  = require('express');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const mongoose = require('mongoose');
const crypto   = require('crypto');
const mail     = require('../mail/mail')
const router   = express.Router();
const User     = mongoose.model('User');

//=============================================================================
// Middleware
//=============================================================================
router.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

//=============================================================================
// Routes
//=============================================================================
//-----------------------------------------------------------------------------
// Home
//-----------------------------------------------------------------------------
router.get('/', (req, res) => {
  if (req.user) {
    res.locals.specialMessage = `Hi ${req.user.email}, you're already logged in. <a href="/account">Go to your account</a>`;
  } else {
    res.locals.specialMessage = '';
  }
  res.render('external/home', { title: 'Home'});
});

//-----------------------------------------------------------------------------
// Login
//-----------------------------------------------------------------------------
router.get('/login', (req, res) => {
  res.render('external/login', { title: 'Log in'});
});

router.post('/login',
  cookieParser(),
  passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true,
    successFlash: 'Welcome!',
  }),
  (req, res) => {
    /*
    Check if user attempted to access a page while logged out. If so, redirect
    to that page. If not, redirect to the account home page.
    */
    const redirect = req.cookies.requestedUrl || '/account';
    res.clearCookie('requestedUrl');
    res.redirect(redirect);
  }
);

//-----------------------------------------------------------------------------
// Create account
//-----------------------------------------------------------------------------
router.get('/create-account', (req, res) => {
  res.render('external/create-account', { title: 'Create account', email: req.query.email });
});

router.post('/create-account', (req, res, next) => {
  const user = new User({email: req.body.email});
  User.register(user, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      req.flash('error', err.message);
      res.redirect('back');
    } else {
      req.login(user, function(err) {
        if (err) {
          console.log(err);
          req.flash('error', err);
        } else {
          crypto.randomBytes(32, (err, buf) => {
            if (err) throw err;
            user.emailVerificationToken = buf.toString('hex');
            user.save((err) => {
              if (err) throw err;
              req.flash('success', 'Account created');
              mail.emailVerification(req, res);
            });
          });
        };
      });
    };
  });
});

//-----------------------------------------------------------------------------
// Verify email
//-----------------------------------------------------------------------------
router.get('/verify-email/:token', (req, res) => {
  User.findOne(
    { emailVerificationToken: req.params.token },
    (err, user) => {
      if (err) {
        console.log(err);
        req.flash('error', err);
        res.redirect('/');
      } else if (!user) {
        req.flash('error', 'Invalid verification link');
        res.redirect('/');
      } else {
        console.log(user)
        if (user.emailVerified === true) {
          req.flash('info', 'Email already verified');
          res.redirect('/')
        } else {
          user.emailVerified = true;
          user.emailVerificationDate = Date.now();
          user.save((err) => {
            if (err) {
              console.log(err);
              req.flash('error', err);
              res.redirect('/');
            } else {
              req.flash('success', 'Email verified');
              res.redirect('/');
            }
          });
        };
      };
    }
  );
});

router.get('/resend-verification-email', (req, res) => {
  // if account verified: 'already verified'
  // else send email
  // redirect w flash: email sent
  req.flash('info', 'Verification email sent')
  res.redirect('back');
}),

//=============================================================================
// Export routes
//=============================================================================
module.exports = router;
