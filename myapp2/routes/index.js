var express = require('express');
var router = express.Router();
const User = require('../models/User');

router.get('/', function(req, res, next) {
  res.render('index', { title: 'hello world' });
  // res.send('Hello user');
});


module.exports = router;
  