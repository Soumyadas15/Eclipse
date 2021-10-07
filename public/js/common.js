var cropper;
var selectedUsers = [];
var timer;

const urlParts = ["search", "notifications", "messages", "profile"];
const url = window.location.href;
const segments = new URL(url).pathname.split('/');
const last = segments.pop() || segments.pop(); // Handle potential trailing slash

$(document).ready(() => {
    refreshMessagesBadge();
    refreshNotificationsBadge();
})
//Exclude
if(last === "users" && last === "") {
    $("nav a[href='/']").css("color", "var(--myred)");
}
if(last === "users" && last === "" ) {
    $("nav a[href='/profile']").css("color", "var(--myred)");
}
if(last === "users") {
    $("nav a[href='/search']").css("color", "var(--myred)");
}
if(last === "posts") {
    $("nav a[href='/search']").css("color", "var(--myred)");
}
if(last === "users" && last === "" ) {
    $("nav a[href='/messages']").css("color", "var(--myred)");
}
if(last === "users" && last === "") {
    $("nav a[href='/notifications']").css("color", "var(--myred)");
}
urlParts.forEach(page => {
    if(page === last) {
        $(`nav a[href="/${page}"]`).css("color", "var(--myred)");
    }
});

$("#postTextarea, #commentTextarea").keyup(event => {
    var textbox = $(event.target);
    var value = textbox.val().trim();

    var isModal = textbox.parents(".modal").length == 1;
    var submitButton = isModal ? $("#submitReplyButton") : $("#submitPostButton");

    if(submitButton.length == 0) return alert("No submit button found");

    if (value == "") {
        submitButton.prop("disabled", true);
        return;
    }

    submitButton.prop("disabled", false);
})

$("#submitPostButton, #submitReplyButton").click(() => {
    var button = $(event.target);
    var isModal = button.parents(".modal").length == 1;
    var textbox = isModal ? $("#commentTextarea") : $("#postTextarea");

    var data = {
        content: textbox.val()
    }
    if (isModal) {
        var id = button.data().id;
        if(id == null) return alert("Button id is null");
        data.commentOn = id;
    }
    $.post("/api/posts", data, postData => {

        if(postData.commentOn){
            emitNotification(postData.commentOn.postedBy);
            location.reload();
        }
        else{
            var html = createPostHtml(postData);
            $(".postsContainer").prepend(html);
            textbox.val("");
            button.prop("disabled", true);
        }
    })
})

$("#commentModal").on("show.bs.modal", (event) => {
    var button = $(event.relatedTarget);
    var postId = getPostIdFromElement(button);
    $("#submitReplyButton").data("id", postId);

    $.get("/api/posts/" + postId, results => {
        console.log(results.postData);
        outputPosts(results.postData, $("#originalPostContainer"));
    })
})

$("#deletePostModal").on("show.bs.modal", (event) => {
    var button = $(event.relatedTarget);
    var postId = getPostIdFromElement(button);
    $("#deletePostButton").data("id", postId);
})


$("#commentModal").on("hidden.bs.modal", (event) => {
    $("#originalPostContainer").html("");
})

//Sending message to users

$("#userSearchTextbox").keydown((event) => {
    clearTimeout(timer);
    var textbox = $(event.target);
    var value = textbox.val();

    if (value == "" && (event.which == 8 || event.keycode == 8)) {
        // remove user from selection
        selectedUsers.pop();
        updateSelectedUsersHtml();
        $(".resultsContainer").html("");

    if(selectedUsers.length == 0){
        $("#createChatButton").prop("disabled", true);
    }
        return;
    }
    timer = setTimeout(() => {
        value = textbox.val().trim();
         if(value == "") {
            $(".resultsContainer").html("");
        }
        else {
            searchUsers(value);
        }
    }, 10)

})

//chat button

$("#createChatButton").click(() => {
    var data = JSON.stringify(selectedUsers);

    $.post("/api/chats", { users: data }, chat => {

        if(!chat || !chat._id) return alert("Invalid response from server.");

        window.location.href = `/messages/${chat._id}`;
    })
})

//page highlight


//Dark mode

$(".darkModeToggle").click((event) => {
    document.body.classList.toggle('dark');

})

//delete posts

$("#deletePostButton").click((event) => {
    var postId = $(event.target).data("id");

    $.ajax({
        url: `/api/posts/${postId}`,
        type: "DELETE",
        success: (data, status, xhr) => {
            if(xhr.status != 202){
                alert("Unable to delete");
                return;
            }
            location.reload();
        }
    })
})

//image preview and crop

$("#filePhoto").change(function(){    
    if(this.files && this.files[0]) {
        var reader = new FileReader();
        reader.onload = (e) => {
            var image = document.getElementById("imagePreview");
            image.src = e.target.result;

            if(cropper !== undefined) {
                cropper.destroy();
            }

            cropper = new Cropper(image, {
                aspectRatio: 1 / 1,
                background: false
            });

        }
        reader.readAsDataURL(this.files[0]);
    }
    else {
        console.log("nope")
    }
})

//cover photo crop

$("#coverPhoto").change(function(){    
    if(this.files && this.files[0]) {
        var reader = new FileReader();
        reader.onload = (e) => {
            var image = document.getElementById("coverPreview");
            image.src = e.target.result;

            if(cropper !== undefined) {
                cropper.destroy();
            }

            cropper = new Cropper(image, {
                aspectRatio: 20 / 9,
                background: false
            });

        }
        reader.readAsDataURL(this.files[0]);
    }
    else {
        console.log("nope")
    }
})

//upload image 

$("#imageUploadButton").click(() => {
    var canvas = cropper.getCroppedCanvas();

    if(canvas == null) {
        alert("Could not upload image. Make sure it is an image file.");
        return;
    }

    canvas.toBlob((blob) => {
        var formData = new FormData();
        formData.append("croppedImage", blob);
        
        $.ajax({
            url: "api/users/profilePicture",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: () => {
                location.reload();
            }

        })
    });
})

//cover photo upload

$("#coverPhotoUploadButton").click(() => {
    var canvas = cropper.getCroppedCanvas();

    if(canvas == null) {
        alert("Could not upload image. Make sure it is an image file.");
        return;
    }

    canvas.toBlob((blob) => {
        var formData = new FormData();
        formData.append("croppedImage", blob);
        
        $.ajax({
            url: "api/users/coverPhoto",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: () => {
                location.reload();
            }

        })
    });
})


//Post likes

$(document).on("click", ".likeButton", (event) => {
    var button = $(event.target);
    var postId = getPostIdFromElement(button);
    if(postId === undefined) return;

    $.ajax({
         url: `/api/posts/${postId}/like`,
         type: "PUT",
         success: (postData) => {
             button.find("span").text(postData.likes.length || "");
             if(postData.likes.includes(userLoggedIn._id)) {
                 button.addClass("active");
                 emitNotification(postData.postedBy);
             }
             else {
                 button.removeClass("active");
             }
         }
    })
})

//shares

$(document).on("click", ".shareButton", (event) => {
    var button = $(event.target);
    var postId = getPostIdFromElement(button);
    if(postId === undefined) return;

    $.ajax({
         url: `/api/posts/${postId}/share`,
         type: "POST",
         success: (postData) => {
             button.find("span").text(postData.shareUsers.length || "");
             if(postData.shareUsers.includes(userLoggedIn._id)) {
                 button.addClass("active");
                 emitNotification(postData.postedBy);
             }
             else {
                 button.removeClass("active");
             }
         }
    })
})

$(document).on("click", ".post", () => {
    var element = $(event.target);
    var postId = getPostIdFromElement(element);
    if(postId !== undefined && !element.is("button")) {
        window.location.href = '/posts/'+postId;
    }
});

// follow button event handler

$(document).on("click", ".followButton", (e) => {
    var button = $(e.target);
    var userId = button.data().user;
    
    $.ajax({
        url: `/api/users/${userId}/follow`,
        type: "PUT",
        success: (data, status, xhr) => {
            if(xhr.status == 404){
                alert ("No user found");
                return;
            }
            
            var difference = 1;
            if(data.following && data.following.includes(userId)) {
                button.addClass("following");
                button.text("Following");
                emitNotification(userId);
            }
            else {
                button.removeClass("following");
                button.text("Follow");
                difference = -1;
            }

            var followersLabel = $("#followersValue");
            if(followersLabel.length != 0){
                var followersText = followersLabel.text();
                followersText = parseInt(followersText);
                followersLabel.text(followersText + difference)
            }
        }
   })

});

$(document).on("click", ".notification.active", (e) => {
    var container = $(e.target);
    var notificationId = container.data().id;

    var href = container.attr("href");
    e.preventDefault();

    var callback = () => window.location = href;
    markNotificationsAsOpened(notificationId, callback);
})


//posts

function getPostIdFromElement(element){
    var isRoot = element.hasClass("post");
    var rootElement = isRoot ? element:element.closest(".post");
    var postId = rootElement.data().id;
    if(postId === undefined) return alert("Post not found");
    return postId;
}

//Displaying posts

function createPostHtml(postData, greenBackground = false) {
   // if(postData == null) return alert("Null post object!!!");
    var shareProfilePic = isShare ? postData.postedBy.profilePic : null;

    var isShare = postData.shareData !== undefined; // to check if it is a retweet
    var sharedByProfile = isShare ? postData.postedBy.username : null;
    var sharedBy = isShare ? postData.postedBy.firstName + " " +postData.postedBy.lastName : null;
    postData = isShare ? postData.shareData : postData; 

    console.log(isShare);

    var postedBy = postData.postedBy;
    if (postedBy._id === undefined) {
        return console.log("Object undefined");
    }
    var displayName = postedBy.firstName + " " + postedBy.lastName;
    if(displayName === undefined) {
        return console.log("Error loading name");
    }
    var timestamp = timeDifference(new Date(), new Date(postData.createdAt))
    var likeButtonActiveClass = postData.likes.includes(userLoggedIn._id) ? "active": "";  //preserving like button color
    var shareButtonActiveClass = postData.shareUsers.includes(userLoggedIn._id) ? "active": "";  //preserving share button color
    var greenBackgroundClass = greenBackground ? "greenBackground": ""; //identify the comment
    var shareText = '';
    if(isShare) {
     shareText = `<span class = 'shareBox'>
                <i class="fas fa-share"></i>
                <form action = '/profile/${sharedByProfile}' class = 'shareName'><button>${sharedBy}</button></form> shared ${displayName}'s post
                </span>`
    }
    if(postedBy._id === undefined) return console.log("user object undefined");

    //verified profile
    var verified = "";
        if(postedBy.username == "itsmesoumya" || postedBy.username == "fuckyou") {
             verified = `<div><i class="fas fa-check-circle"></i></div>`
        }


    //var commentedOnUser = ;
    var commentSign = "";
    if(postData.commentOn && postData.commentOn._id) {
        if(!postData.commentOn._id){
            return alert("Unpopulated comment data");
        }
        else if(!postData.commentOn.postedBy._id){
            return alert("Unpopulated posted by");
        }
        var commentedOnUsername = postData.commentOn.postedBy.username;
        var commentedOnFullname = postData.commentOn.postedBy.firstName + " " + postData.commentOn.postedBy.lastName;
        commentSign = `<div class = 'commentSign'>
                        commented on
                        <form action = '/profile/${commentedOnUsername}' class = 'commentName'>
                        <button>${commentedOnFullname}</button>
                        </form>
                        's post
                      </div>`
    }
    var buttons = "";
    if(postData.postedBy._id == userLoggedIn._id) {
        buttons = `<button class = 'headerDeleteButton' data-id = "${postData._id}" data-toggle="modal" data-target="#deletePostModal"><i class="fas fa-trash"></i></button>`
    }
    return `<div class='post ${greenBackgroundClass}' data-id='${postData._id}'>
                <div class = 'shareTextContainer'>
                    ${shareText}
                </div>
                <div class='mainContentContainer'>
                    <div class='postContentContainer'>
                        <div class='header'>
                            <div class='userImageContainer'>
                            <img src='${postedBy.profilePic}'>
                            </div>
                            <form action = '/profile/${postedBy.username}' class = 'mainName'>
                            <button>${displayName}</button>
                            </form>
                            ${verified}
                            <span class='date'>${timestamp}</span>
                              ${buttons}
                        </div>
                        ${commentSign}
                        <div class='postBody'>
                            <span>${postData.content}</span>
                        </div>
                        <div class='postFooter'>
                           <div class = 'postButtonContainer blue'>
                              <button class='likeButton ${likeButtonActiveClass}'>
                                 <i class="fas fa-thumbs-up"></i>
                                 <span>${postData.likes.length || ""}</span>
                              </button>
                           </div>
                           <div class = 'postButtonContainer'>
                              <button data-toggle='modal' data-target='#commentModal'>
                                 <i class="fas fa-comments"></i>
                              </button>
                           </div>
                           <div class = 'postButtonContainer green'>
                              <button class ='shareButton ${shareButtonActiveClass}'>
                                 <i class="fas fa-share"></i>
                                 <span>${postData.shareUsers.length || ""}</span>
                              </button>
                           </div>
                        </div>
                    </div>
                </div>
            </div>`;
}

function timeDifference(current, previous) {

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
         return Math.round(elapsed/1000) + ' seconds ago';   
    }

    else if (elapsed < msPerHour) {
        if (msPerMinute == 1) {
            return "1 minute ago"  
         }
         return Math.round(elapsed/msPerMinute) + ' mins ago';   
    }

    else if (elapsed < msPerDay ) {
        if (msPerHour < 1) {
            return '1 hour ago'  
         }
         return Math.round(elapsed/msPerHour ) + ' hrs ago';   
    }

    else if (elapsed < msPerMonth) {
        if (msPerDay == 1) {
           return "1 day ago"  
        }
        return Math.round(elapsed/msPerDay) + ' days ago';   
    }

    else if (elapsed < msPerYear) {
        if (msPerMonth == 1) {
            return "1 month ago"  
         }
        return Math.round(elapsed/msPerMonth) + ' months ago';   
    }

    else {
        if (msPerYear == 1) {
            return "1 year ago"  
         }
        return Math.round(elapsed/msPerYear ) + ' years ago';   
    }
}
function outputPosts(results, container){
    container.html("");

    if(!Array.isArray(results)){
        results = [results]
    }

    results.forEach(result => {
        var html = createPostHtml(result)
        container.append(html);
    });
    if(results.length = 0){
        container.append("<span class='noPosts'>Nothing to show on feed</span>")
    }
}

function outputPostsWithComments(results, container) {
    container.html("");

    if(results.commentOn !== undefined && results.commentOn._id !== undefined) {
        var html = createPostHtml(results.commentOn)
        container.append(html);
    }
    var mainPostHtml = createPostHtml(results.postData, true)
    container.append(mainPostHtml);

    results.comments.forEach(result => {
        var html = createPostHtml(result)
        container.append(html);
    });
}

function outputUsers(results, container) {
    container.html("");

    results.forEach(result => {
        var html = createUserHtml(result, true);
        container.append(html);
    });

    if(results.length == 0) {
        container.append("<span class='noResults'>No results found</span>")
    }
}

function createUserHtml(userData, showFollowButton) {

    var name = userData.firstName + " " + userData.lastName;
    var isFollowing = userLoggedIn.following && userLoggedIn.following.includes(userData._id);
    var text = isFollowing ? "Following" : "Follow"
    var buttonClass = isFollowing ? "followButton following" : "followButton"

    var followButton = "";
    if(showFollowButton && userLoggedIn._id != userData._id){
             followButton = `<div class = 'followButtonContainer'>
                               <button class = '${buttonClass}' data-user= '${userData._id}'>${text}</button>  
                             </div>`
    }

    return `<div class='user'>
                <div class='userImageContainer'>
                    <img src='${userData.profilePic}'>
                </div>
                <div class='userDetailsContainer'>
                    <div class='header'>
                        <a href='/profile/${userData.username}'>${name}</a>
                    </div>
                <span class='username'>@${userData.username}</span>
                ${followButton}
                </div>
            </div>`;
}

function searchUsers(searchTerm) {
    $.get("/api/users", { search: searchTerm }, results => {
        outputSelectableUsers(results, $(".resultsContainer"));
    })
}
function outputSelectableUsers(results, container) {
    container.html("");

    results.forEach(result => {
        
        if(result._id == userLoggedIn._id || selectedUsers.some(u => u._id == result._id)) {
            return;
        }

        var html = createUserHtml(result, false);
        var element = $(html);
        element.click(() => userSelected(result))

        container.append(element);
    });

    if(results.length == 0) {
        container.append("<span class='noResults'>No results found</span>")
    }
}

function userSelected(user) {
    selectedUsers.push(user);
    updateSelectedUsersHtml()
    $("#userSearchTextbox").val("").focus();
    $(".resultsContainer").html("");
    $("#createChatButton").prop("disabled", false);
}

function updateSelectedUsersHtml() {
    var elements = [];

    selectedUsers.forEach(user => {
        var name = user.firstName + " " + user.lastName;
        var userElement = $(`<span class='selectedUser'>${name}</span>`);
        elements.push(userElement);
    })

    $(".selectedUser").remove();
    $("#selectedUsers").prepend(elements);
}
function getChatName(chatData){
    var chatName = chatData.chatName;

    if(!chatName){
       var otherChatUsers = getOtherChatUsers(chatData.users);
       var namesArray = otherChatUsers.map(user => user.firstName + " " + user.lastName);
       chatName = namesArray.join(", ")
    }

    return chatName;
}
function getOtherChatUsers(users){
    if(users.length == 1) return users;

    return users.filter(user => user._id != userLoggedIn._id);
}

function messageReceived(newMessage) {
    if($(`[data-room = "${newMessage.chat._id}" ]"`).length == 0) {
        // Show popup notification
        showMessagePopup(newMessage);
    }
    else {
        addChatMessageHtml(newMessage);
    }

    refreshMessagesBadge()
}

function markNotificationsAsOpened(notificationId = null, callback = null) {
    if(callback == null) callback = () => location.reload();

    var url = notificationId != null ? `/api/notifications/${notificationId}/markAsOpened` : `/api/notifications/markAsOpened`;
    $.ajax({
        url: url,
        type: "PUT",
        success: () => callback()
    })
}

function refreshMessagesBadge() {
    $.get("/api/chats", { unreadOnly: true }, (data) => {
        
        var numResults = data.length;

        if(numResults > 0) {
            $("#messagesBadge").text(numResults).addClass("active");
        }
        else {
            $("#messagesBadge").text("").removeClass("active");
        }

    })
}

function refreshNotificationsBadge() {
    $.get("/api/notifications", { unreadOnly: true }, (data) => {
        
        var numResults = data.length;

        if(numResults > 0) {
            $("#notificationsBadge").text(numResults).addClass("active");
        }
        else {
            $("#notificationsBadge").text("").removeClass("active");
        }

    })
}

function showNotificationPopup(data) {
    var html = createNotificationHtml(data);
    var element = $(html);
    element.hide().prependTo("#notificationList").slideDown("fast");

     setTimeout(() => element.fadeOut(400), 3000);
}


function showMessagePopup(data) {

    if(!data.chat.latestMessage._id){
        data.chat.latestMessage = data; 
    }
    var html = createChatHtml(data.chat);
    var element = $(html);
    element.hide().prependTo("#notificationList").slideDown("fast");

     setTimeout(() => element.fadeOut(400), 3000);
}


 function outputNotificationList(notifications, container) {
    notifications.forEach(notification => {
        var html = createNotificationHtml(notification);
        container.append(html);
    })

    if(notifications.length == 0) {
        container.append("<span class='noResults'>Nothing to show.</span>");
    }
}

function createNotificationHtml(notification) {
    var userFrom = notification.userFrom;
    var text = getNotificationText(notification);
    var headText = getNotificationTextHeading(notification);
    var href = getNotificationUrl(notification);
    var className = notification.opened ? "" : "active";

    var image = `<img src='${userFrom.profilePic}'>`;

    return `<a href='${href}' class='notificationListItem notification ${className}' data-id='${notification._id}'>
                <div class='resultsImageContainer'>
                    <img src='${userFrom.profilePic}'>
                </div>
                <div class='resultsDetailsContainer'>
                    <span class = 'heading'>${headText}</span>
                    <span class='Text'>${text}</span>
                </div>
            </a>`;

}
function getNotificationText(notification) {

    var userFrom = notification.userFrom;

    if(!userFrom.firstName || !userFrom.lastName) {
        return alert("user from data not populated");
    }

    var userFromName = `${userFrom.firstName} ${userFrom.lastName}`;
    
    var text;

    if(notification.notificationType == "share") {
        text = `${userFromName} shared your post`;
    }
    else if(notification.notificationType == "postLike") {
        text = `${userFromName} liked your post`;
    }
    else if(notification.notificationType == "comment") {
        text = `${userFromName} commented on your post`;
    }
    else if(notification.notificationType == "follow") {
        text = `${userFromName} started following you`;
    }

    return `<span class='ellipsis'>${text}</span>`;
}

function getNotificationTextHeading(notification) {

    var userFrom = notification.userFrom;

    if(!userFrom.firstName || !userFrom.lastName) {
        return alert("user from data not populated");
    }

    var userFromName = `${userFrom.firstName} ${userFrom.lastName}`;
    
    var text;

    if(notification.notificationType == "share") {
        text = `New share:&nbsp`;
    }
    else if(notification.notificationType == "postLike") {
        text = `New like:  &nbsp`;
    }
    else if(notification.notificationType == "comment") {
        text = `New comment:  &nbsp`;
    }
    else if(notification.notificationType == "follow") {
        text = `New follower:  &nbsp`;
    }

    return `<span class='ellipsis'>${text}</span>`;
}

function getNotificationUrl(notification) { 
    var url = "#";

    if(notification.notificationType == "share" || 
        notification.notificationType == "postLike" || 
        notification.notificationType == "reply") {
            
        url = `/posts/${notification.entityId}`;
    }
    else if(notification.notificationType == "follow") {
        url = `/profile/${notification.entityId}`;
    }

    return url;
}

function createChatHtml(chatData) {
    var chatName = getChatName(chatData);
    var image = getChatImageElements(chatData);
    var latestMessage = getLatestMessage(chatData.latestMessage);

    // var activeClass = !chatData.latestMessage || chatData.latestMessage.readBy.includes(userLoggedIn._id) ? "" : "active";

    
    return `<form action = '/messages/${chatData._id}' class = 'chatListBox'>
                <button class='resultListItem'>
                ${image}
                <div class='resultsDetailsContainer'>
                    <span class='heading'>${chatName}</span>
                    <span class='subText'>${latestMessage}</span>
                </div>
            </button>
            </form>`;
}

function getChatImageElements(chatData){
    var otherChatUsers = getOtherChatUsers(chatData.users);

    var groupChatClass = "";
    var chatImage = getUserChatImageElement(otherChatUsers[0]);

    if(otherChatUsers.length > 1) {
        groupChatClass = "groupChatImage";
        chatImage += getUserChatImageElement(otherChatUsers[1]);
    }

    return `<div class = 'resultsImageContainer ${groupChatClass}'>${chatImage}</div>`;
}

function getUserChatImageElement(user) {
    if(!user || !user.profilePic) {
        return alert("Invalid user");
    }

    return `<img src='${user.profilePic}' alt='User's prfile pic'>`;
}

function getLatestMessage(latestMessage){
    if(latestMessage != null){
        var sender = latestMessage.sender;
        return `${sender.firstName} ${sender.lastName}: ${latestMessage.content}`;
    }

    return "New chat";
}