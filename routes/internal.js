//=============================================================================
// Setup
//=============================================================================
const express = require('express');
const router  = express.Router();

//=============================================================================
// Middleware
//=============================================================================
router.use((req, res, next) => {
  if (req.cookies['login']) {
    next();
  } else {
    res.send('nope')
  };
});

router.use((req, res, next) => {
  res.locals.siteSection = 'Internal';
  res.locals.menu = [
    { page: 'Account home', slug: 'account/' },
    { page: 'Edit account', slug: 'account/edit-account' },
    { page: 'Invite users', slug: 'account/invite-users' },
    { page: 'Log out',      slug: 'account/logout' },
  ];
  next();
});

//=============================================================================
// Routes
//=============================================================================
router.get('/', (req, res) => {
  res.render('internal/home', { title: 'Account home' });
});

router.get('/edit-account', (req, res) => {
  res.render('internal/edit-account', { title: 'Edit account' });
});

router.get('/invite-users', (req, res) => {
  res.render('internal/invite-users', { title: 'Invite users' });
});

router.get('/logout', (req, res) => {
  res.clearCookie('login');
  res.redirect('/')
});

//=============================================================================
// Export routes
//=============================================================================
module.exports = router;