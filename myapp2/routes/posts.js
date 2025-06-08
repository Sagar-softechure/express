const express = require('express');
const Post = require('../models/Post');
const router = express.Router();
const User = require('../models/User');
const Comment = require('../models/Comment');
const authenticate = require('../middleware/authenticate');
router.get('/' ,async (req, res) => {
    const users = await User.find();
    const posts = await Post.find().populate('author');
    const comments = await Comment.find();
    res.render('posts', { posts, users, comments });
});

router.post('/',authenticate, async (req, res) => {
    const { title, content, author, tags, isPublished } = req.body;
  
    if (!title || !content) {
      return res.status(400).send('Title and content are required.');
    }
  
    try {
      const post = new Post({ 
        title, 
        content,
        author: author || null,
        tags: tags || [],
        isPublished: isPublished === 'on'
      });
      await post.save();
      res.redirect('/posts?message=Post created successfully');
    } catch (err) {
      console.error(err);
      res.status(500).send('Something went wrong.'+err);
    }
  });
  router.get('/edit/:id', authenticate, async(req,res)=>{
    const userId = req.params.id;
    try {
      const post = await Post.findById(userId);
  
      if (!post) {
        return res.status(404).send('Post not found');
      }
      const users = await User.find();
      
      res.render('form', {title:'Edit Post',postData:post,users:users});
    } catch (err) {
      console.error(err);
      res.status(500).send('Invalid post or server error');
    }
  });
  router.get('/view/:id',authenticate ,async (req, res) => {
    const postId = req.params.id;
  
    try {
      const post = await Post.findById(postId);
  
      if (!post) {
        return res.status(404).send('Post not found');
      }
      const comments = await Comment.find({ post: postId });
      res.render('single', {
        title: 'Post Details',
        post: post,
        comments: comments
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Invalid post ID or server error');
    }
  });
  router.get('/delete/:id', authenticate , async(req,res)=>{
    const postId = req.params.id;
    await Post.findByIdAndDelete(postId);
    res.redirect('/posts');
  });
  router.put('/:id',authenticate , async (req, res) => {
    const postId = req.params.id;
    const updateData = {};
  
    if (req.body.title) updateData.title = req.body.title;
    if (req.body.content) updateData.content = req.body.content;
    if (req.body.author) updateData.author = req.body.author;
    if (req.body.tags) updateData.tags = req.body.tags.split(',');
    if (req.body.isPublished) updateData.isPublished = req.body.isPublished === 'on';
  
    if (Object.keys(updateData).length === 0) {
      return res.status(400).send('No fields to update provided.');
    }
  
    try {
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        updateData,
        { new: true, runValidators: true }
      );
  
      if (!updatedPost) {
        return res.status(404).send('Post not found.');
      }
      res.send('updated successfully')
    } catch (err) {
      console.error(err);
      res.status(500).send('Invalid post ID or update failed.');
    }
  });
  
module.exports = router;