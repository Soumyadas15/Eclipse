const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require("body-parser")
const bcrypt = require("bcrypt");
const User = require('../schemas/UserSchema');


router.get("/:id", (req, res, next) => {
    var payload = {
        pageTitle: "Post",
        postId: req.params.id,
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
    }
    res.status(200).render("postPage", payload);
})
module.exports = router;