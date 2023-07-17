const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: { type: String, required: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    active: { type: Boolean, default: false },
    activation_code: { type: String, required: true },
    activation_expiration: Date,
    reset_code: String,
    reset_expiration: Date,
    avatarUrl: { type: String, required: false },
    avatarId: { type: String, required: false },
    shortDes: { type: String, required: false },
    social: [
      {
        link: {
          type: String,
          required: false,
        },
        icon: String,
      },
    ],
    level: { type: Number, default: 1 },
    banned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
