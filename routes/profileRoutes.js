const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require("body-parser")
const bcrypt = require("bcrypt");
const User = require('../schemas/UserSchema');


router.get("/", (req, res, next) => {

    var payload = {

        pageTitle: req.session.user.username,
        profileUser: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
        userLoggedIn: req.session.user,
    }
    res.status(200).render("profilePage", payload);
})

router.get("/:username/following", async (req, res, next) => {

    var payload = await getPayload(req.params.username, req.session.user);
    payload.selectedTab =  "following";
    res.status(200).render("followersAndFollowing", payload);
})

router.get("/:username/followers", async (req, res, next) => {

    var payload = await getPayload(req.params.username, req.session.user);
    payload.selectedTab =  "followers";
    res.status(200).render("followersAndFollowing", payload);
})

router.get("/:username", async (req, res, next) => {

    var payload = await getPayload(req.params.username, req.session.user)
    res.status(200).render("profilePage", payload);
})
async function getPayload(username, userLoggedIn) {
       var user = await User.findOne({ username: username })

       if(user == null) {

           user = await User.findById(username);
           
           if(user == null) {
            return {
                pageTitle: "User not found",
                userLoggedInJs: JSON.stringify(userLoggedIn),
                userLoggedIn: userLoggedIn,
            }
           }
        }
        return {
            pageTitle: user.username,
            userLoggedInJs: JSON.stringify(userLoggedIn),
            userLoggedIn: userLoggedIn,
            profileUser: user,
        }

}
module.exports = router;