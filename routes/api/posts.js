const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require("body-parser")
const User = require('../../schemas/UserSchema');
const Post = require('../../schemas/PostSchema');
const Notification = require('../../schemas/NotificationSchema');

app.use(bodyParser.urlencoded({ extended: false }));


router.get("/", async (req, res, next) => {

    var searchObj = req.query;

    if(searchObj.isComment !== undefined) {
        var isComment = searchObj.isComment == "true";
        searchObj.commentOn = { $exists: isComment };
        delete searchObj.isComment;
    }
    
    if(searchObj.search !== undefined) {
        searchObj.content = { $regex: searchObj.search, $options: "i" };
        delete searchObj.search;
    }

    if(searchObj.followingOnly !== undefined){
        var followingOnly = searchObj.followingOnly == "true";

        if(followingOnly){
            var objectIds = [];
            if(!req.session.user.following){
                req.session.user.following = [];
            }
            req.session.user.following.forEach(user => {
                objectIds.push(user);
            })

            objectIds.push(req.session.user._id);

            searchObj.postedBy = { $in: objectIds };
        }

        delete searchObj.followingOnly;
    }
    var results = await getPosts(searchObj);
    res.status(200).send(results);
})

router.get("/:id", async (req, res, next) => {
    var postId = req.params.id;
    var postData = await getPosts({_id: postId});
    postData = postData[0];

    var results = {
        postData: postData
    }

    // if(postData.commentOn !== undefined) {
    //     results.commentOn = postData.commentOn;
    // }
    if(postData.commentOn != null) {
        results.commentOn = postData.commentOn
    
        if(results.commentOn.content != null) { // ADDING LINKS TO REPLIES
            const postBody = results.commentOn.content
 
            const textToArr = postBody.split(" ")
 
            textToArr.forEach((word, index) => {
                if(word.match(/\bhttps?/i)) {
                    word = `<p><a href="${word}" class="postLink" target="_blank" style="color: #007bff;">${word}</a></p>`
                    textToArr[index] = word
                }
                else if(!word.match(/\bhttps?/i) && word.indexOf("www") !== -1) {
                    word = `<p><a href="https://${word}" class="postLink" target="_blank" style="color: #007bff;">${word}</a></p>`
                    textToArr[index] = word
                }
            })
 
            results.commentOn.content = textToArr.join(" ")
        }
 }


    results.comments = await getPosts({ commentOn: postId});
    res.status(200).send(results);
})

router.post("/", async (req, res, next) => {
    if (!req.body.content) {
        console.log("Content param not sent with request");
        return res.sendStatus(400);
    }

    var postData = {
        content: req.body.content,
        postedBy: req.session.user
    }

    if(req.body.commentOn) {
        postData.commentOn = req.body.commentOn;
    }


    Post.create(postData)
    .then(async newPost => {
        newPost = await User.populate(newPost, { path: "postedBy" })
        newPost = await User.populate(newPost, { path: "commentOn" })

        if(newPost.commentOn !== undefined) {
            await Notification.insertNotification(req.body.commentOn, req.session.user._id, "comment", newPost._id);
        }

        res.status(201).send(newPost);
    })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
})

router.put("/:id/like", async (req, res, next) => {

    var postId = req.params.id;
    var userId = req.session.user._id;

    var isLiked = req.session.user.likes && req.session.user.likes.includes(postId);

    var option = isLiked ? "$pull" : "$addToSet";

    // Insert user like
    req.session.user = await User.findByIdAndUpdate(userId, { [option]: { likes: postId } }, { new: true})
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })

    // Insert post like
    var post = await Post.findByIdAndUpdate(postId, { [option]: { likes: userId } }, { new: true})
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })

    if(!isLiked) {
        await Notification.insertNotification(post.postedBy, userId, "postLike", post._id);
    }


    res.status(200).send(post)
})


router.post("/:id/share", async (req, res, next) => {
    var postId = req.params.id;
    var userId = req.session.user._id;

    // Try and delete retweet
    var deletedPost = await Post.findOneAndDelete({ postedBy: userId, shareData: postId })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })

    var option = deletedPost != null ? "$pull" : "$addToSet";

    var repost = deletedPost;

    if (repost == null) {
        repost = await Post.create({ postedBy: userId, shareData: postId })
        .catch(error => {
            console.log(error);
            res.sendStatus(400);
        })
    }

    // Insert user like
    req.session.user = await User.findByIdAndUpdate(userId, { [option]: { shares: repost._id } }, { new: true })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })

    // Insert post like
    var post = await Post.findByIdAndUpdate(postId, { [option]: { shareUsers: userId } }, { new: true })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
    
    
    if(!deletedPost) {
        await Notification.insertNotification(post.postedBy, userId, "share", post._id);
    }


    res.status(200).send(post)
})


router.delete("/:id", (req, res, next) => {
    Post.findByIdAndDelete(req.params.id)
    .then(() => res.sendStatus(202))
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
})
async function getPosts(filter) {
    var results = await Post.find(filter)
    .populate("postedBy")
    .populate("shareData")
    
    .populate("commentOn")
    .sort({ "createdAt": -1 })
    .catch(error => console.log(error))
    results = await User.populate(results, { path: "commentOn.postedBy"});
    results.forEach(post => { // ADDING LINKS TO TWEETS
        if(post.content != null) {
            const postBody = post.content
   
            const textToArr = postBody.split(" ")
   
            textToArr.forEach((word, index) => {
                if(word.match(/\bhttps?/i)) {
                    word = `<p><a href="${word}" class="postLink" target="_blank" style="color: #007bff;">${word}</a></p>`
                    textToArr[index] = word
                }
                else if(!word.match(/\bhttps?/i) && word.indexOf("www") !== -1) {
                    word = `<p><a href="https://${word}" class="postLink" target="_blank" style="color: #007bff;">${word}</a></p>`
                    textToArr[index] = word
                }
            })
   
            post.content = textToArr.join(" ")
        }
  })
   
  results.forEach(post => { // ADDING LINKS TO RETWEETS
   
      if(post.shareData != null) {
              
          if(post.shareData.content != null) {
              const postBody = post.shareData.content
      
              const textToArr = postBody.split(" ")
      
              textToArr.forEach((word, index) => {
                  if(word.match(/\bhttps?/i)) {
                      word = `<p><a href="${word}" class="postLink" target="_blank" style="color: #007bff;">${word}</a></p>`
                      textToArr[index] = word
                  }
                  else if(!word.match(/\bhttps?/i) && word.indexOf("www") !== -1) {
                      word = `<p><a href="https://${word}" class="postLink" target="_blank" style="color: #007bff;">${word}</a></p>`
                      textToArr[index] = word
                  }
              })
      
              post.shareData.content = textToArr.join(" ")
          }
      }    
  })
  
    return await User.populate(results, { path: "shareData.postedBy"});
}

module.exports = router;