const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const commentSchema = new Schema(
  {
    content: { type: String, required: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    childComment: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
        required: false,
      },
    ],
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
