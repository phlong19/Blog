const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const postSchema = new Schema(
  {
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    imageId: { type: String, required: true },
    content: { type: String, required: true },
    description: { type: String, required: true },
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
        required: true,
      },
    ],
    slug: { type: String, required: true, unique: true },
    // views
    like: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
      },
    ],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
        required: false,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
