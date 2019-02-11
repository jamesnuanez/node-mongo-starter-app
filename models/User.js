const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true,
    lowercase: true,
    required: 'Username required',
  },
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);