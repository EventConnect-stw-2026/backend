const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: '',
      maxlength: 300
    },
    location: {
      type: String,
      default: '',
      maxlength: 120
    },
    interests: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model('User', userSchema);