const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const postSchema = new Schema(
  {
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    content: { type: String, required: true },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: { type: Boolean, required: true },
    category: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: false,
      },
    ],
    // slug
    // views
    like: { type: Number, required: false },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
