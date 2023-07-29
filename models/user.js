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
    avatarUrl: {
      type: String,
      default:
        'https://res.cloudinary.com/ddot3p3my/image/upload/v1690302821/users/image_2023-07-25_233343045_zggymb.png',
    },
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
    warning: { type: Number, default: 0 },
    banned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
