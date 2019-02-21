const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    trim: true,
    lowercase: true,
    required: 'Username required',
  },
  signupDate: {
    type: Date,
    default: Date.now,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,

  /*
  set to false when email changed
  set back to true if original email says yes this change was correct
  cannot change email more than once in given time unless this is true
  */
  emailChangeConfirmed: Boolean,

  /*
  Email verification timeframe is based off of the following date
  */
  emailChangeDate: {
    type: Date,
    default: Date.now,
  },
  
  /*
  This is used to prevent the 'verification required' message from 
  showing immediately after the verification email has been sent
  */
  verificationEmailSentDate: {
    type: Date,
    default: Date.now,
  },
  emailVerificationDate: Date,
  passwordResetInProgress: {
    type: Boolean,
    default: false,
  },
  passwordResetRequestDate: Date,
  passwordResetToken: String,
  passwordResetTokenExpiration: Date,
  oldEmails: [{
    oldEmail: String,
    dateAdded: Date,
    dateReplaced: Date,
    oldEmailToken: String,
    wasVerified: Boolean,
    confirmedReplacement: Boolean,
    revertedToThisEmail: Boolean,
  }],
  rejectedEmails: [{
    rejectedEmail: String,
    dateAdded: Date,
    dateRejected: Date,
    wasVerified: Boolean,
  }],
});

userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

module.exports = mongoose.model('User', userSchema);
