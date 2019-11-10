
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

 const mailOptions = {
  from:    process.env.EMAIL_FROM,
  to:      process.env.EMAIL_TO,
  subject: 'Test subject-allnow',
  text:    'Plain text email',
  html:    '<p><strong>HTML</strong> email</p>',
}

//=============================================================================
// Email verification
//=============================================================================
exports.emailVerification = async (req, res) => {

	console.log('------------------------------');
  console.log(req.protocol);
	console.log('------------------------------');
	console.log(req.headers.host);
	console.log('------------------------------');
	console.log(req.headers);
	console.log('------------------------------');
  try {
    const emailVerificationHTML = `
    <p>
      <a href="${req.headers.origin}/account/verify-email/${req.user.emailVerificationToken}">
        Verify email with ${res.locals.siteName}
      </a>
    </p>
    <p>An account was created on ${res.locals.siteName} with this email address.</p>
    <p>Click the link above to verify your email.</p>
    `;

    const emailVerificationText = `
    An account was created on ${res.locals.siteName} with this email address.
    Please visit the following URL to verify your email address.
    ${req.headers.origin}/account/verify-email/${req.user.emailVerificationToken}
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to:   req.user.email,
      subject: `${res.locals.siteName} | Email verification required`,
      text: emailVerificationText,
      html: emailVerificationHTML,
    });
    
  } catch (error) {
    console.log(error);
    req.flash('error', error);
    res.redirect('back');
  }

};

//=============================================================================
// Email changed (notification to old email address)
//=============================================================================
exports.emailChangeNotification = async (req, res, oldEmail, oldEmailToken, linkExpirationTime) => {

  try {
    const emailChangeNotificationHTML = `
    <p>
      Your email on ${res.locals.siteName} has been changed:
    </p>
    <p>
      Old email: ${oldEmail}
    </p>
    <p>
      New email: ${req.user.email}
    </p>
    <p>
      Please click one of the links below to indicate if you intended to make this change:
    </p>
    <p>
      <a href="${req.headers.origin}/email-change/confirm/${oldEmailToken}">
        I authorized this change
      </a>
    </p>
    <p>
      <a href="${req.headers.origin}/email-change/revert/${oldEmailToken}">
        I want to change the email back
      </a>
    </p>
    <p>
      Link expires in ${linkExpirationTime}.
    </p>
    `;

    const emailChangeNotificationText = `
    The email on your account at ${res.locals.siteName} has been changed from ${oldEmail} to ${req.user.email}.

    If you did not make this change, please visit the following URL to cancel the email change and create a new password:

    ${req.headers.origin}/account/email-change/revert/${oldEmailToken}
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to:   oldEmail,
      subject: `${res.locals.siteName} | Email has been changed`,
      text: emailChangeNotificationText,
      html: emailChangeNotificationHTML,
    });
    
  } catch (error) {
    console.log(error);
    req.flash('error', error);
    res.redirect('back');
  }

};

//=============================================================================
// Password reset
//=============================================================================
exports.passwordReset = (req, res, user) => {

  const passwordResetHTML = `
  <p>
    <a href="${req.headers.origin}/password-reset/${user.passwordResetToken}">
      Create a new password for ${res.locals.siteName}
    </a>
  </p>
  <p>A password reset was requested for your account at ${res.locals.siteName}.</p>
  <p>Click the link above to create a new password.</p>
  `;

  const passwordResetText = `
  A password reset was requested for your account at ${res.locals.siteName}.
  Please visit the following URL to create a new password.
  ${req.headers.origin}/password-reset/${user.passwordResetToken}
  `;

  transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to:   user.email,
    subject: `${res.locals.siteName} | Password reset`,
    text: passwordResetText,
    html: passwordResetHTML,
  }, function(error, info) {
    if (error) {
      console.log(error);
      req.flash('error', error);
      res.redirect('back');
    } else {
      req.flash('success', 'Password reset email sent');
      res.redirect('/login');
    };
  });
};

//=============================================================================
// Invite user
//=============================================================================
exports.inviteUser = (req, res) => {
  const inviteUserHTML = `
    <p>
      ${req.user.email} has invited you to create an account on ${res.locals.siteName}.
    </p>
    <p>
      <a href="${req.headers.origin}/create-account?email=${req.body.email}">
        Click here to create an account
      </a>
    </p>
  `;

  const inviteUserText = `
    ${req.user.email} has invited you to create an account on ${res.locals.siteName}.
    Visit the following link to create an account.
    ${req.headers.origin}/create-account?email=${req.body.email}
  `;

  transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to:   req.body.email,
    subject: `${res.locals.siteName} | You've been invited to create an account`,
    text: inviteUserText,
    html: inviteUserHTML,
  }, function(error, info) {
    if (error) {
      console.log(error);
      req.flash('error', error);
      res.redirect('back');
    } else {
      req.flash('success', 'Invitation email sent');
      res.redirect('back');
    };
  });
};
