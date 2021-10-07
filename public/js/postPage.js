$(document).ready(() => {
    $.get("/api/posts/" + postId, results => {
        outputPostsWithComments(results, $(".postsContainer"))
    })
})