const helmet=require('helmet');
const compression=require('compression');
const morgan=require('morgan');
const fs= require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');

const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const accessLogStream = fs.createWriteStream(
  path.join(__dirname,'access.log'),
  {flags : 'a'}
);
app.use(helmet());
app.use(compression());

app.use(morgan('combined',{stream : accessLogStream }));

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const game = 'DumbCharades';

// Run when client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, rooms }) => {

 if(io.nsps['/'].adapter.rooms[rooms] && io.nsps['/'].adapter.rooms[rooms].length > 1){
      console.log("room is full");
      socket.emit('message', formatMessage(game, 'Room is full,Go to some other room!'));
 }
 else
 {
    //sendbutton
    socket.emit('send_button');

    const user = userJoin(socket.id, username, rooms);

    socket.join(user.rooms);

    // Welcome current player
    socket.emit('message', formatMessage(game, 'Welcome to DumbCharades'));

    // Broadcast when a player connects
    socket.broadcast
      .to(user.rooms)
      .emit(
        'message',
        formatMessage(game, `${user.username} has joined the game`)
      );

   //words and mark
   socket.broadcast.to(user.rooms).emit('button');

  //countdown timer
  socket.on('set_time',()=>{
  io.to(user.rooms).emit('start_timer');
  });

   //score display 
   socket.on('score', mark => {
      io.to(user.rooms).emit('mark',mark);
   });
  
  //server-side messages
  socket.on('servermsg', mess => {
      io.to(user.rooms).emit('message',formatMessage(game, mess));
   });
  

   // Send players and room info
    io.to(user.rooms).emit('roomUsers', {
      rooms: user.rooms,
      users: getRoomUsers(user.rooms)
    });
}
  });
//when player(one who acts) tries to reveal answer
   socket.on('no', () => {
     socket.emit('message', formatMessage(game, 'Dont try to give answers!'));
  });
  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);
try{
    io.to(user.rooms).emit('message', formatMessage(user.username, msg));
}
catch(err){
  console.log(err);
}
  });

  // Runs when player disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.rooms).emit(
        'message',
        formatMessage(game, `${user.username} has left the game`)
      );

      // Send players and room info
      io.to(user.rooms).emit('roomUsers', {
        rooms: user.rooms,
        users: getRoomUsers(user.rooms)
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

