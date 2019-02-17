//=============================================================================
// Setup
//=============================================================================
const express  = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const crypto   = require('crypto');
const mail     = require('../mail/mail');
const router   = express.Router();
const User     = mongoose.model('User');

//=============================================================================
// Middleware
//=============================================================================
router.use(
  cookieParser(),
  (req, res, next) => {
    if (!req.isAuthenticated()) {
      /*
      Adding a cookie in order to redirect to the requested page once logged in.
      Using cookie parser instead of session so that this cookie gets cleared
      when the browser closes, instead of when the session expires.
      */
      res.cookie('requestedUrl', req.originalUrl);
      req.flash('error', 'Please log in to access that page');
      res.redirect('/login')
      return;
    }
    next();
  }
);

router.use((req, res, next) => {
  res.locals.user = req.user;
  if (req.user.emailVerified === false) {
    res.locals.specialMessage = 'Email address not verified. <a href="/account/resend-verification-email">Resend verification email</a>';
  } else {
    res.locals.specialMessage = '';
  }
  next();
});

//=============================================================================
// Routes
//=============================================================================
//-----------------------------------------------------------------------------
// Account home
//-----------------------------------------------------------------------------
router.get('/', (req, res) => {
  res.render('internal/home', { title: 'Account home' });
});

//-----------------------------------------------------------------------------
// Account details and editing
//-----------------------------------------------------------------------------
router.get('/account-details', (req, res) => {
  res.render('internal/account-details', { title: 'Account details' });
});

router.get('/change-email', (req, res) => {
  res.render('internal/change-email', { title: 'Change email' });
});

router.post('/change-email/:id', (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    User.findByIdAndUpdate(
      req.params.id,
      { email: req.body.email },
      { new: true },
      function(err, user) {
        req.login(user, function(err) {
          if (err) {
            console.log(err);
            req.flash('error', err.message);
            res.redirect('back');
          } else {
            crypto.randomBytes(32, (err, buf) => {
              if (err) throw err;
              user.emailVerificationToken = buf.toString('hex');
              user.emailVerified = false;
              user.save((err, user) => {
                req.flash('success', 'Email updated');
                res.redirect('/account/account-details');
              }); 
            });
          }
        });
      },
    );
  } else {
    req.flash('error', 'Something went wrong');
    res.redirect('/account/account-details');
  };
});

router.get('/change-password', (req, res) => {
  res.render('internal/change-password', { title: 'Change password' });
});

router.post('/change-password/:id', (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    const user = User.findById(req.params.id, function(err, user) {
      user.changePassword(req.body['password-old'], req.body['password-new'], function(err) {
        if (err) {
          console.log(err);
          req.flash('error', err.message);
          res.redirect('back');
        } else {
          req.flash('success', 'Password updated');
          res.redirect('/account/account-details');
        }
      });
    });
  } else {
    req.flash('error', 'Something went wrong');
    res.redirect('back')
  }
});

router.get('/delete-account', (req, res) => {
  res.render('internal/delete-account', { title: 'Delete account'});
});

router.post('/delete-account/:id', (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    User.findByIdAndDelete(req.params.id, function(err, user) {
      if (err) {
        console.log(err);
        req.flash('error', err.message);
        res.redirect('back');
      } else {
        req.flash('success', 'Account deleted');
        res.redirect('/');
      };
    });
  } else {
    req.flash('error', 'Something went wrong');
    res.redirect('back');
  };
});

//-----------------------------------------------------------------------------
// Invite user
// -----------------------------------------------------------------------------
router.get('/invite-user', (req, res) => {
  res.render('internal/invite-user', { title: 'Invite user' } );
});

router.post('/invite-user', (req, res) => {
  if (!req.body.email) {
    req.flash('error', 'Please provide an email address');
    res.redirect('back');
  } else {
    mail.inviteUser(req, res);
  };
});

//-----------------------------------------------------------------------------
// Resend verification email
//-----------------------------------------------------------------------------
router.get('/resend-verification-email', (req, res) => {
  if (req.user.emailVerified === true) {
    req.flash('info', 'Email already verified');
  } else {
    mail.emailVerification(req, res);
  };
}),


//=============================================================================
// Export routes
//=============================================================================
module.exports = router;
