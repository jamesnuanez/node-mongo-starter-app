//=============================================================================
// Setup
//=============================================================================
const express  = require('express');
const mongoose = require('mongoose');
const crypto   = require('crypto');
const mail     = require('../mail/mail');
const router   = express.Router();
const User     = mongoose.model('User');

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
  if (!req.body.email) {
    req.flash('error', 'Email required');
    res.redirect('back');
    return;
  }
  User.findOne({ email: req.body.email }, (err, user) => {
    console.log('2');
    if (err) {
      console.log('3');
      console.log(err);
      req.flash('error', err);
      res.redirect('back');
    } else if (!user) {
      console.log('4');
      req.flash('error', 'User does not exist');
      res.redirect('back');
    } else {
      console.log('5');
      crypto.randomBytes(32, (err, buf) => {
        console.log('6');
        if (err) throw err;
        user.passwordResetInProgress = true;
        user.passwordResetRequestDate = Date.now();
        user.passwordResetToken = buf.toString('hex');
        user.passwordResetTokenExpiration = Date.now() + (60 * 1000);
        user.save((err, user) => {
          console.log('7');
          if (err) throw err;
          mail.passwordReset(req, res, user);
        })
      });
    };
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
  if (!req.body.password) {
    req.flash('error', 'Email required');
    res.redirect('back');
    return;
  }
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
