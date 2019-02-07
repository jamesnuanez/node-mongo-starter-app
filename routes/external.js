//=============================================================================
// Setup
//=============================================================================
const express = require('express');
const router  = express.Router();

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
  ];
  next();
});

const username = 'asdf';
const password = 'qwer';

//=============================================================================
// Routes
//=============================================================================
router.get('/', (req, res) => {
  res.render('external/home', { title: 'Home'});
});

router.get('/create-account', (req, res) => {
  res.render('external/create-account', { title: 'Create account'});
});

router.get('/login', (req, res) => {
  res.render('external/login', { title: 'Log in'});
});

router.post('/login', (req, res) => {
  if (req.body.username === username && req.body.password === password) {
    // res.cookie('login', 'true', { maxAge: 60000 })
    res.redirect('/account');
  } else {
    res.send('nope');
  }
});

router.get('/password-reset', (req, res) => {
  res.render('external/password-reset', { title: 'Password reset'});
});

//=============================================================================
// Export routes
//=============================================================================
module.exports = router;
