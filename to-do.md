# To do
* When posting data, check if post is for current user
  - `if (req.params.id !== req.user._id.toString()) { /* don't allow post */ }`
  - `if (req.body.id   !== req.user._id.toString()) { /* don't allow post */ }`
* Don't require login for email verification (but add an "undo" option on the verification confirmation page)
* When clicking an email link, if logged in as a different user than expected by email, log out first
* If session times out, say session timed out (don't just say that you need to log in)
* After typing incorrect username/password, show username entered the first time
* Remove bodyparser (no longer needed)
* Use async await instead of callbacks and promises (need to promisify some functions).
* Is 'passwordResetInProgress' necessary? It stays true if password reset token expires.
* Move verification to a helper function or middleware (check if verification token exists, if not create one, set email verification request date, then send email) (in case account created without a verification token and then they later click "resend verification email". could happen if server goes down between account being created and verification token being saved to account)
* Add to user model if account was created from an "invite user" email, and link to original account
* Make a 404 page
* Improve logging
  - Better date format when logging to console
  - Log traffic to database (include datetime, user id, and URL)
  - Log errors to database
  - Log events to database: sign-up, login fail, password reset, user invite, account deletion, etc. (include datetime, user id, event type, data before change, data after change)
* Change password: create new error message if old password entered incorrectly (currently says "Password or username is incorrect", but should say "Old password is incorrect")
* Change email: create new message text for email sent to new email address (currently says "An account was created on Site Name with this email address")

# Bugs
* POST after session expires gives a "Cannot GET /..." error page
  - Steps to reproduce:
  - Log in
  - Go to change email page
  - Wait for session to expire or delete cookie
  - Click "Update" to attempt to update email
  - You are redirected to the login page
  - Log in
  - You will see a blank page with the message "Cannot GET /account/change-email/1234..."
* Flash messages aren't shown when account lock page is loaded for the first time
  - Scenario 1: Verification email sent. Steps to replicate:
    * Load any internal page once the 'Resend verification email' flash message is being displayed (but before the account has been locked).
    * Wait for the verification timeout to pass so that the account is locked.
    * Click the link in the flash message to resend the verification email.
    * It will show the lock page WITHOUT showing the flash message saying the email was sent.
  - Senario 2: Email reverted. Steps to replicate:
    * Log into account before verifying email
    * Change email address
    * Wait for account verification timeout to pass
    * Click the revert link from the email
    * You get the verification required screen without the flash saying email was reverted
    * In this case it should be safe to consider the email verified as they clicked a link from an email sent to them
* res.redirect in middleware doesn't show flashes
