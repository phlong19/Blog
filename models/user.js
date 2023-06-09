const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const userSchema = new Schema(
  {
    email: { type: String, required: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    avatarUrl: { type: String, required: false },
    level: { type: Number, default: 1 },
    banned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
