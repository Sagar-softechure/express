var express = require('express');
var router = express.Router();
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const bcrypt = require('bcryptjs');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const jwt = require('jsonwebtoken');
  router.get('/login', function(req, res, next) {
    res.render('login', { title: 'Login' });
  });
  
  router.get('/register', function(req, res, next) {
    res.render('register', { title: 'Register' });
  });
  
  router.post('/register', async function(req, res, next) {
    const { name, email, password, confirmPassword } = req.body;
    try {
      if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match');
      }
    const user = new User({ name, email, password });
    await user.save();
    res.redirect('/users');
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).send('Email already exists');
      }
      
      res.status(500).send('Something went wrong');
    }
  });
  
  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    // Validate input
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required.' });
  
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: 'User not found' });
  
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid credentials' });
  
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
  
    // Save refresh token in DB
    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
  
    // Send refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // Change to true in production with HTTPS
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  
    // Send access token in JSON response
    res.json({
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  });

  router.post('/refresh', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
  
    if (!refreshToken)
      return res.status(401).json({ message: 'No refresh token found' });
  
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  
      // Check if refresh token exists in DB
      const tokenInDb = await RefreshToken.findOne({ token: refreshToken });
      if (!tokenInDb)
        return res.status(403).json({ message: 'Invalid refresh token' });
  
      // Generate new access token
      const accessToken = generateAccessToken({ _id: decoded.id, role: decoded.role });
  
      res.json({ accessToken });
    } catch (err) {
      return res.status(403).json({ message: 'Invalid or expired refresh token' });
    }
  });

  router.post('/logout', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
  
    if (!refreshToken) {
      return res.status(200).json({ message: 'Already logged out' });
    }
  
    try {
      // Delete refresh token from DB
      await RefreshToken.deleteOne({ token: refreshToken });
  
      // Clear the cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: false, // set to true in production with HTTPS
        sameSite: 'strict'
      });
  
      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
      return res.status(500).json({ message: 'Error during logout' });
    }
  });
  

  module.exports = router;
