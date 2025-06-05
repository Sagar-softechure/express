const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const authenticate = require('../middleware/authenticate');
const dummyUserId = '665f3ab9b87d7c1234567890'; // Replace with actual User _id from your DB


router.post('/:postId', authenticate, async (req, res) => {
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

router.get('/edit/:id', authenticate, async (req, res) => {
    const commentId = req.params.id;
    const comment = await Comment.findById(commentId);
    res.render('form', { commentData: comment });
});

router.delete('/:id', authenticate, async (req, res) => {
    const commentId = req.params.id;
  
    try {
      // First, find the user by ID
      const comment = await Comment.findById(commentId);
  
      if (!comment) {
        return res.status(404).send('User not found.');
      }
  
      // Prevent deletion if user is protected
      if (comment.protected) {
        return res.status(403).send('This user cannot be deleted.');
      }
  
      // Proceed to delete
      await Comment.findByIdAndDelete(commentId);
      res.redirect('/posts/view/' + comment.post);
      console.log('Comment deleted successfully');
    } catch (err) {
      console.error(err);
      res.status(500).send('Invalid comment ID or delete failed.');
    }
  });

router.put('/:id', authenticate, async (req, res) => {
    const commentId = req.params.id;
    const { content } = req.body;
    const comment = await Comment.findByIdAndUpdate(commentId, { content }, { new: true });
    res.redirect('/posts/view/' + comment.post);
  });

module.exports = router;
