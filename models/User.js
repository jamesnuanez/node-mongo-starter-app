const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true,
    lowercase: true,
    required: 'Username required',
  },
  password: {
    type: String,
    trim: true,
    require: 'Password required',
  },
});

module.exports = mongoose.model('User', userSchema);