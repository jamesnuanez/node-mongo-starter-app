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
/* Check if user is logged in */
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

/* If user's email is not verified, show a message */
router.use((req, res, next) => {
  res.locals.user = req.user;
  if (req.originalUrl.includes('verif')) {
    return next();
  } else if (
    req.user.emailVerified === false &&
    req.user.signupDate < (Date.now() - (24 * 60 * 60 * 1000))
  ) {
    return res.redirect('/account/verification-required');
  } else if (req.user.emailVerified === false) {
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
  if (req.params.id !== req.user._id.toString()) {
    req.flash('error', 'Something went wrong');
    res.redirect('/account/account-details');
  } else {
    User.findById(
      req.params.id,
      function(err, user) {
        user.email = req.body.email;
        user.emailVerified = false;
        crypto.randomBytes(32, (err, buf) => {
          if (err) throw err;
          user.emailVerificationToken = buf.toString('hex');
          user.save((err, user) => {
            req.login(user, function(err) {
              if (err) {
                console.log(err);
                req.flash('error', err.message);
                res.redirect('back');
              } else {
                req.flash('success', 'Email updated');
                mail.emailVerification(req, res);
              };
            });
          });
        });
      }
    );
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
// Email verification
//-----------------------------------------------------------------------------
router.get('/resend-verification-email', (req, res) => {
  if (req.user.emailVerified === true) {
    req.flash('info', 'Email already verified');
    res.redirect('back');
  } else {
    mail.emailVerification(req, res);
  };
}),

router.get('/verify-email/:token', (req, res) => {
  User.findOne(
    { emailVerificationToken: req.params.token },
    (err, user) => {
      if (err) {
        console.log(err);
        req.flash('error', err);
        res.redirect('/account');
      } else if (!user) {
        req.flash('error', 'Invalid verification link');
        res.redirect('/account');
      } else {
        if (user.emailVerified === true) {
          req.flash('info', 'Email already verified');
          res.redirect('/account')
        } else {
          user.emailVerified = true;
          user.emailVerificationDate = Date.now();
          user.save((err) => {
            if (err) {
              console.log(err);
              req.flash('error', err);
              res.redirect('/account');
            } else {
              req.flash('success', 'Email verified');
              res.redirect('/account');
            }
          });
        };
      };
    }
  );
});

router.get('/verification-required', (req, res) => {
  res.render('internal/verification-required', { title: 'Verification required'})
});

//=============================================================================
// Export routes
//=============================================================================
module.exports = router;
