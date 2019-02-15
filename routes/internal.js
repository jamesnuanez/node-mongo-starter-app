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
  if (req.params.id === req.user._id.toString()) {
    User.findByIdAndUpdate(
      req.params.id,
      { email: req.body.email },
      { new: true },
      function(err, user) {
        req.login(user, function(err) {
          if (err) {
            console.log(err);
            req.flash('error', err.message);
            res.redirect('back');
          } else {
            req.flash('success', 'Email updated');
            res.redirect('/account/account-details');
          }
        });
      },
    );
  } else {
    req.flash('error', 'Something went wrong');
    res.redirect('/account/account-details');
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
// Invite users
//-----------------------------------------------------------------------------
router.get('/invite-users', (req, res) => {
  res.render('internal/invite-users', { title: 'Invite users' });
});

//-----------------------------------------------------------------------------
// Logout
//-----------------------------------------------------------------------------
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('info', 'See you next time')
  res.redirect('/')
});

//=============================================================================
// Export routes
//=============================================================================
module.exports = router;