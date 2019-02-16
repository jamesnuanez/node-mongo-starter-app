//=============================================================================
// Setup
//=============================================================================
const express  = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const crypto   = require('crypto');
const User     = mongoose.model('User');
const router   = express.Router();
const mail     = require('../mail/mail')

//=============================================================================
// Middleware
//=============================================================================
router.use((req, res, next) => {
  res.locals.siteSection = 'External';
  res.locals.menu = [
    { page: 'Home',           slug: '' },
    { page: 'Create account', slug: 'create-account' },
    { page: 'Log in',         slug: 'login' },
    { page: 'Password reset', slug: 'password-reset' },
    { page: 'Test Flash', slug: 'test-flash' },
  ];
  next();
});

//=============================================================================
// Nodemailer config
//=============================================================================
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

//=============================================================================
// Routes
//=============================================================================
router.get('/', (req, res) => {
  res.render('external/home', { title: 'Home'});
});

router.get('/create-account', (req, res) => {
  res.render('external/create-account', { title: 'Create account'});
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
              mail.emailVerification(req, res, user.emailVerificationToken);
            });
          });
        };
      });
    };
  });
});

router.get('/verify-account/:token', (req, res) => {
  User.findOneAndUpdate(
    { emailVerificationToken: req.params.token },
    {
      emailVerified: true,
      emailVerificationDate: Date.now,
    },
    { new: true },
    (err, user) => {
      if (err) {
        console.log(err);
        req.flash('error', err);
        res.redirect('/');
      } else {
        console.log(user.email);
        res.send(req.params.token);
      }
  });
});

router.get('/login', (req, res) => {
  res.render('external/login', { title: 'Log in'});
});

router.post('/login',
  passport.authenticate('local', {
    successRedirect: '/account',
    failureRedirect: '/login',
    failureFlash: true,
    successFlash: 'Welcome!',
  })
);

router.get('/password-reset', (req, res) => {
  res.render('external/password-reset', { title: 'Password reset'});
});

router.post('/password-reset', (req, res) => {
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

router.get('/password-reset/:token', (req, res) => {
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

router.post('/password-reset/:token', (req, res) => {
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
