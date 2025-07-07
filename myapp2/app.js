const cors = require('cors');
require('./db');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
const methodOverride = require('method-override');
const http = require('http');
const { Server } = require('socket.io');

var app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3001', // Your React app's port
    credentials: true,
  }
});

var usersRouter = require('./routes/users');
var postsRouter = require('./routes/posts');
var commentRouter = require('./routes/comment');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));
// app.use('/', indexRouter);
// app.use('/users', usersRouter);
// app.use('/posts', postsRouter);
// app.use('/comments', commentRouter);
app.use('/', authRouter);

let chatHistory = [];

io.on('connection', (socket) => {
  // Send chat history to new client
  socket.emit('chat history', chatHistory);

  // Listen for new messages
  socket.on('chat message', (msg) => {
    chatHistory.push(msg);
    io.emit('chat message', msg); // Broadcast to all clients
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

server.listen(3002, () => {
  console.log('Socket.IO server running on http://localhost:3000');
});

module.exports = app;
