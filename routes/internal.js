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

const showMessageTime = 30 * 1000;
const lockAcountTime  = 60 * 1000;
const revertEmailLinkExpirationTime = 2 * 60 * 1000;
const revertEmailLinkExpirationTimeFormatted = 'two minutes';

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
    req.user.emailChangeDate < (Date.now() - lockAcountTime)
  ) {
    return res.redirect('/account/verification-required');
  } else if (
    req.user.emailVerified === false &&
    req.user.verificationEmailSentDate < (Date.now() - showMessageTime)
  ) {
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
  // If user doesn't match (logged out and into another account or changed post url)
  if (req.params.id !== req.user._id.toString()) {
    req.flash('error', 'Something went wrong');
    res.redirect('/account/account-details');

  // If email being submitted is same as exiting email
  } else if (req.user.email === req.body.email) {
    req.flash('info', 'Email was not changed');
    res.redirect('/account/account-details');

  // If trying to change email twice before original email has confirmed
  } else if (
    req.user.emailChangeDate > Date.now() - revertEmailLinkExpirationTime && 
    req.user.emailChangeConfirmed === false
  ) {
    req.flash('error', `You cannot change your account twice in 
      ${revertEmailLinkExpirationTimeFormatted} unless you confirm
      the change through the link sent to the old email.`)
    res.redirect('/account/account-details');

  // Otherwise go ahead
  } else {
    User.findById(req.params.id, (err, user) => {
      // Get old email token (to cancel email change)
      crypto.randomBytes(32, (err, buf) => {
        if (err) throw err;
        const oldEmail = user.email;
        const oldEmailToken = buf.toString('hex');
        user.oldEmails.push({
          oldEmail,
          dateAdded: user.emailChangeDate,
          dateReplaced: Date.now(),
          oldEmailToken,
          wasVerified: user.emailVerified,
        })
        user.email = req.body.email;
        user.emailVerified = false;
        user.emailChangeConfirmed = false;
        // Get new email verification token
        crypto.randomBytes(32, (err, buf) => {
          if (err) throw err;
          user.emailChangeDate = Date.now();
          user.emailVerificationToken = buf.toString('hex');
          user.verificationEmailSentDate = Date.now();
          user.save((err, user) => {
            req.login(user, function(err) {
              if (err) {
                console.log(err);
                req.flash('error', err.message);
                res.redirect('back');
              } else {
                mail.emailChangeNotification(req, res, oldEmail, oldEmailToken)
                  .then(() => {
                    mail.emailVerification(req, res)
                  })
                  .then(() => {
                    req.flash('success', `Email updated and verification email sent to ${user.email}`)
                    res.redirect('/account/account-details')
                  });
              };
            });
          });
        });
      });
    });
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
    User.findByIdAndUpdate(
      req.user._id,
      { verificationEmailSentDate: Date.now() },
      { new: true },
      (err, user) => {
        if (err) throw err;
        mail.emailVerification(req, res)
          .then(() => {
            req.flash('success', `A new verification email has been sent to ${user.email}`)
            res.redirect('back');
          });
      }
    );
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
        if (
          req.user.emailVerified === false &&
          req.user.emailChangeDate < (Date.now() - lockAcountTime)
        ) {
          res.redirect('/account/verification-required');
        } else {
          res.redirect('/account');
        }
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
  if (
    req.user.emailVerified === true || 
    req.user.emailChangeDate > (Date.now() - lockAcountTime)
  ) {
    req.flash('info', 'Email already verified');
    return res.redirect('/account');
  };
  res.render('internal/verification-required', { title: 'Verification required'})
});

//=============================================================================
// Export routes
//=============================================================================
module.exports = router;
