$(document).ready(() => {
    $.get("/api/posts", {followingOnly: true}, results => {
        outputPosts(results, $(".postsContainer"))
    })
})
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