const mongoose = require('mongoose');

const Schema = mongoose.Schema;

//Storing User details

const UserSchema = new Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true, unique: true },
    bio: { type: String},
    email: { type: String, required: true, trim: true, unique: true },
    password: { type: String, required: true },
    profilePic: { type: String, default: "/images/profilePic.jpeg" },
    coverPhoto: { type: String},
    likes: [{type: Schema.Types.ObjectId, ref: 'Post'}],
    shares: [{type: Schema.Types.ObjectId, ref: 'Post'}],
    following: [{type: Schema.Types.ObjectId, ref: 'User'}],
    followers: [{type: Schema.Types.ObjectId, ref: 'User'}],
    isVerified: {type: String, default: false},
    resetPassword: {type: String}
}, { timestamps: true });

var User = mongoose.model('User', UserSchema);
module.exports = User;