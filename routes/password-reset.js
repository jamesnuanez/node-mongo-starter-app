//=============================================================================
// Setup
//=============================================================================
const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const User     = mongoose.model('User');

//=============================================================================
// Middleware
//=============================================================================

//=============================================================================
// Routes
//=============================================================================
//-----------------------------------------------------------------------------
// Password reset request form
//-----------------------------------------------------------------------------
router.get('/', (req, res) => {
  res.render('external/password-reset', { title: 'Password reset'});
});

router.post('/', (req, res) => {
  console.log(req.body.email);
  crypto.randomBytes(32, (err, buf) => {
    if (err) throw err;
    User.findOneAndUpdate(
      { email: req.body.email },
      {
        passwordResetInProgress: true,
        passwordResetRequestDate: Date.now(),
        passwordResetToken: buf.toString('hex'),
        passwordResetTokenExpiration: Date.now() + (60 * 1000),
      },
      { new: true },
      (err, user) => {
        console.log(user)
        if (err) throw err;
        mail.passwordReset(req, res, user);
      }
    );
  });
});

//-----------------------------------------------------------------------------
// Create new password
//-----------------------------------------------------------------------------
router.get('/:token', (req, res) => {
  User.findOne(
    { passwordResetToken: req.params.token },
    (err, user) => {
      if (err) throw err;
      if (!user) {
        req.flash('error', 'Invalid password reset link');
        res.redirect('/password-reset')
      } else if (user.passwordResetTokenExpiration < Date.now()) {
        req.flash('error', 'Password reset link has expired');
        res.redirect('/password-reset')
      } else {
        res.render('external/password-new', { title: 'New password' });
      };
    }
  )
});

router.post('/:token', (req, res) => {
  User.findOne(
    { passwordResetToken: req.params.token },
    (err, user) => {
      if (err) throw err;
      if (!user) {
        req.flash('error', 'Invalid password reset link');
        res.redirect('/password-reset')
      } else if (user.passwordResetTokenExpiration < Date.now()) {
        req.flash('error', 'Password reset link has expired');
        res.redirect('/password-reset')
      } else {
        user.setPassword(req.body.password, (err) => {
          if (err) throw err;
          user.passwordResetInProgress = false;
          user.passwordResetToken = undefined;
          user.passwordResetTokenExpiration = undefined;
          user.save((err) => {
            if (err) throw err;
            req.flash('success', 'Password reset successfully');
            res.redirect('/login');
          });
        });
      };
    }
  )
});

//=============================================================================
// Export routes
//=============================================================================
module.exports = router;
