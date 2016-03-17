"use strict"

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var players = {'a':{}};

const world = { height: 1000, width: 1000 };

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {

  /*************** 
    Socket Events 
  ***************/
  socket.on('initialize', function(msg) {
    console.log(msg);
    updatePlayers();
  });

  socket.on('disconnect', function(data){
    if (!socket.nickname) return;
    delete players[socket.nickname];
    updatePlayers();
  });

  socket.on('signup', function(username) {
    if (Object.keys(players).indexOf(username) == -1) {
      // player does not exist, create the player
      socket.nickname = username; 
      players[socket.nickname] = {'socket': socket};
      io.to(socket.id).emit('signup successful', socket.nickname);
      updatePlayers();
      console.log(Object.keys(players));
    } else {
      // player exists, send error
      io.to(socket.id).emit('signup error', '"' + username + '" is already taken.');
    }
  });

  socket.on('start game', function() {
    let data = {
      name   : socket.nickname,
      posX   : Math.round(Math.random() * world.width),
      posY   : Math.round(Math.random() * world.height),
      dir    : Math.round(Math.random() * 360),
      health : 100,
      mode   : 'normal'
    };
    players[socket.nickname].data = data;
    io.to(socket.id).emit('player created', data);
  });

  function updatePlayers() {
    io.emit('playerList', Object.keys(players));
  }

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
