const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const authenticate = require('../middleware/authenticate');

router.post('/:postId', authenticate, async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  try {
    const comment = new Comment({
      post: postId,
      content,
      author: req.user.id
    });

    await comment.save();

    // Emit to all clients
    req.app.get('io').emit('comment-broadcast', {
      postId,
      content: comment.content,
      createdAt: comment.createdAt,
      author: req.user.id
    });

    res.status(200).json({ message: 'Comment added' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not save comment');
  }
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
