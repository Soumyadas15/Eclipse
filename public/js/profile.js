$(document).ready(() => {
     loadPosts();
});

function loadPosts() {
    $.get("/api/posts", {postedBy: profileUserId, isComment: false}, results => {
        outputPosts(results, $(".postsContainer"))
    })
}

function outputPosts(results, container){
    container.html("");

    results.forEach(result => {
        var html = createPostHtml(result)
        container.append(html);
    });
    if(results.length = 0){
        container.append("<span class='noPosts'>Nothing to show on feed</span>")
    }
}