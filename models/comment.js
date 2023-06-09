const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const commentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);

/*
request postId, userId, comment's content

let post;

Post.findOne({_id:postId})
.then(postData=>{
    if(!post){blabla}
    post=postData;
    const comment=new Comment({
        userId:userId,
        postId:postId,
        content: comment's content,
    });
    return comment.save();
})
.then(comment=>{
    post.comments.push(comment);
    return post.save();
})
.then(savedPost=>{
    success;
})
.catch(err=>{
    const error=new Error(err);
    error.statusCode=500;
    return next(error); 
});
    
*/
