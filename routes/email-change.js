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

const revertEmailLinkExpirationTime = 2 * 60 * 1000;
const revertEmailLinkExpirationTimeFormatted = 'two minutes';

//=============================================================================
// Middleware
//=============================================================================
router.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

//=============================================================================
// Helper function
//=============================================================================
const getUserAndOldEmail = (token) => {
  return new Promise((resolve, reject) => {
    User.findOne(
      { oldEmails: { $elemMatch: { oldEmailToken: token }}},
      (err, user) => {
        if (err) reject(err);
        const oldEmailObject = user.oldEmails.filter(oldEmail => {
          return oldEmail.oldEmailToken === token
        });
        resolve([user, oldEmailObject[0]]);
      }
    );
  });
};

//=============================================================================
// Routes
//=============================================================================
//-----------------------------------------------------------------------------
// Confirm email change
//-----------------------------------------------------------------------------
router.get('/confirm/:token', async (req, res) => {
  try {
    const [user, oldEmailObject] = await getUserAndOldEmail(req.params.token);

    if (!user) {
      req.flash('error', 'Invalid link');
    } else if (oldEmailObject.dateReplaced < Date.now() - revertEmailLinkExpirationTime) {
      req.flash('error', 'Link has expired');
    } else if (oldEmailObject.revertedToThisEmail === true) {
      req.flash('error', 'Email cannot be confirmed, it has been reverted')
    } else if (user.emailChangeConfirmed === true) {
      req.flash('info', 'Email change already confirmed');
    } else {
      user.emailChangeConfirmed = true;
      await user.save();
      req.flash('success', 'Email change confirmed');
    }
    if (req.user) {
      res.redirect('/account');
    } else {
      res.redirect('/');
    }
  } catch(error) {
    console.error(error);
  }
}),

//-----------------------------------------------------------------------------
// Revert email change
//-----------------------------------------------------------------------------
router.get('/revert/:token', async (req, res) => {
  try {
    const [user, oldEmailObject] = await getUserAndOldEmail(req.params.token);

    if (!user) {
      req.flash('error', 'Invalid link');
    } else if (oldEmailObject.dateReplaced < Date.now() - revertEmailLinkExpirationTime) {
      req.flash('error', 'Link has expired');
    } else if (oldEmailObject.revertedToThisEmail === true) {
      req.flash('error', 'Email has already been reverted')
    } else {
      res.render(
        'email-change/revert',
        {
          title: 'Revert email change',
          user,
          oldEmail: oldEmailObject.oldEmail,
        }
      );
      return;
    }

    if (req.user) {
      res.redirect('/account');
    } else {
      res.redirect('/');
    }

  } catch(error) {
    console.error(error);
  };
});

router.post('/revert/:token', async (req, res) => {
  try {
    const [user, oldEmailObject] = await getUserAndOldEmail(req.params.token);

    if (!user) {
      req.flash('error', 'Invalid link');
    } else if (oldEmailObject.dateReplaced < Date.now() - revertEmailLinkExpirationTime) {
      req.flash('error', 'Link has expired');
    } else if (oldEmailObject.revertedToThisEmail === true) {
      req.flash('error', 'Email has already been reverted')
    } else {
      user.rejectedEmails.push({
        rejectedEmail: user.email,
        dateAdded: user.emailChangeDate,
        dateRejected: Date.now(),
        wasVerified: user.emailVerified,
      })
      user.email = oldEmailObject.oldEmail;
      user.emailChangeDate = Date.now();
      user.emailVerified = true;
      user.emailVerificationDate = Date.now();
      user.emailVerificationToken = undefined;
      user.emailChangeConfirmed = undefined;
      await user.save();
      await User.update(
        { 'oldEmails.oldEmailToken': oldEmailObject.oldEmailToken },
        { $set: { 'oldEmails.$.revertedToThisEmail': true }}
      );
      req.flash('success', `Email reverted to ${user.email}`);
      res.redirect(`/email-change/revert-confirmation/${req.params.token}`);
      return;
    }

    if (req.user) {
      res.redirect('/account');
    } else {
      res.redirect('/');
    }

  } catch(error) {
    console.error(error);
  };
});

//-----------------------------------------------------------------------------
// After reverting email change, change password
//-----------------------------------------------------------------------------
router.get('/revert-confirmation/:token', async (req, res) => {
  try {
    const [user, oldEmailObject] = await getUserAndOldEmail(req.params.token);

    if (!user) {
      req.flash('error', 'Invalid link');
    } else if (oldEmailObject.dateReplaced < Date.now() - revertEmailLinkExpirationTime) {
      req.flash('error', 'Link has expired, please use reset password page if needed');
    } else {
      res.render('email-change/revert-confirmation', { title: 'Revert email confirmation' })
      return;
    }

    if (req.user) {
      res.redirect('/account');
    } else {
      res.redirect('/');
    }

  } catch(error) {
    console.error(error);
  }
});

router.post('/revert-confirmation/:token', async (req, res) => {
  try {
    const [user, oldEmailObject] = await getUserAndOldEmail(req.params.token);

    if (!user) {
      req.flash('error', 'Invalid link');
    } else if (oldEmailObject.dateReplaced < Date.now() - revertEmailLinkExpirationTime) {
      req.flash('error', 'Link has expired, please use reset password page if needed');
    } else {
      await user.setPassword(req.body.password);
      await user.save();
      req.login(user, (err) => {
        if (err) throw err;
        req.flash('success', 'Password reset successfully');
        res.redirect('/account');
        return;
      });
      return;
    }

    if (req.user) {
      res.redirect('/account');
    } else {
      res.redirect('/');
    }

  } catch(error) {
    console.error(error);
  }
});

//=============================================================================
// Export routes
//=============================================================================
module.exports = router;
