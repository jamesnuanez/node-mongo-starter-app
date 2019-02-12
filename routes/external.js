//=============================================================================
// Setup
//=============================================================================
const express  = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const User     = mongoose.model('User');
const router   = express.Router();

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
    if (err) return next(err);
    req.login(user, function(err) {
      if (err) return next(err);
      res.redirect('/account');
    });
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

//=============================================================================
// Export routes
//=============================================================================
module.exports = router;
