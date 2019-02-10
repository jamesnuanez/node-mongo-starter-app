//=============================================================================
// Setup
//=============================================================================
const express = require('express');
const router  = express.Router();

//=============================================================================
// Middleware
//=============================================================================
router.use((req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'Please log in to access that page');
    res.redirect('/login')
    return;
  }
  next();
});

router.use((req, res, next) => {
  res.locals.user = req.user;
  next();
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
  req.logout();
  req.flash('info', 'See you next time')
  res.redirect('/')
});

//=============================================================================
// Export routes
//=============================================================================
module.exports = router;