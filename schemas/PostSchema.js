const mongoose = require('mongoose');

const Schema = mongoose.Schema;

//Storing post details

const PostSchema = new Schema({
    content: { type: String, trim: true },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    // pinned: Boolean,
    likes: [{type: Schema.Types.ObjectId, ref: 'User'}],
    shareUsers: [{type: Schema.Types.ObjectId, ref: 'User'}],
    shareData: {type: Schema.Types.ObjectId, ref: 'Post'},
    commentOn: {type: Schema.Types.ObjectId, ref: 'Post'}
}, { timestamps: true });

var Post = mongoose.model('Post', PostSchema);
module.exports = Post;