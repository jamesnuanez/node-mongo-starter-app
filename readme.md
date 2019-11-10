# Node.js MongoDB Starter App
This fully functional starter application is built with Node.js, Express, MongoDB, Mongoose, Passport.js, and Nodemailer, and includes full-featured user management.

### Features
* Account creation
* User authentication
* Password reset
* Verification emails
* Email and password change
* User invitation
* Account deletion

### Technology used
* Node.js
* Express
* MongoDB
* Mongoose
* Passport.js
* Nodemailer
* EJS

## Details

### External features
* account creation
  - email is username
  - logs in automatically upon account creation
* log in
* password reset (sends email)
* handles logged in user viewing external page
  - show a flash messages linking to internal account
  - disable account features (create account, log in, password reset)
* handles logged out user attempting to access an internal page
  - show a flash saying you need to be logged in
  - redirect to login page with message if user is not logged in
  - redirect user to requested page once logged in (page is remembered until browser is closed)

### Internal features
* account details
* change email
* change password
* send verification email
  - resend verification email
  - show flash message if email not verified in 5 minutes
  - account lock out if not verified in 1 hour
  - email change
    * notifies old email address
      - email change can be reverted from old email
      - email change can be confirmed from old email
    * sends new verification email to new email address
    * prevent two email changes in one day unless email change is verified from old email (without this, an attacker could change the email twice in order to give themselves a revert email link that could be used after the original user reverted the email)
  - Note: timeouts can be adjusted in /routes/internal.js in the `Timeouts` section
* delete account
* invite users
  - invitation email links to create account page with the email field automatically populated
  - remember originally requested page and go back there (remembered until they close browser?)
* log out

### What's not included
* CSS
* Front end JavaScript
* User's name (email address is used in all places a name would be used)
* Password strength requirements
* Protection against excessive login attempts
  - prevent more than __ login attempts per __ seconds (to prevent scripted login attack)
  - lock account after # of password attempts (at least for a time)
* Undelete account (account is actually deleted, there is no soft delete)
* Goodbye email when user deletes account (this would be useful if accounts were only soft deleted, as this could give users a one-click solution to reopen their account)

## To do list and known bug list
See `to-do.md`
