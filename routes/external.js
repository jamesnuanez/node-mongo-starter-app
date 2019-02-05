//=============================================================================
// Setup
//=============================================================================
const express = require('express');
const router  = express.Router();

//=============================================================================
// Middleware
//=============================================================================
router.use((req, res, next) => {
  res.locals.menu = [
    { page: 'Home',           slug: '' },
    { page: 'Create account', slug: 'create-account' },
    { page: 'Log in',         slug: 'login' },
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

router.get('/login', (req, res) => {
  res.render('external/login', { title: 'Log in'});
});

//=============================================================================
// Export routes
//=============================================================================
module.exports = router;
