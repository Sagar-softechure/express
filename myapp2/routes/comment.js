const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const dummyUserId = '665f3ab9b87d7c1234567890'; // Replace with actual User _id from your DB


router.post('/:postId', async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const comment = new Comment({
        post: postId,
        content,
        author: dummyUserId
    });
    await comment.save();
    res.redirect(`/posts/view/${postId}`);
});


module.exports = router;
