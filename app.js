"use strict"

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var players = {};

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
      socket.nickname = username; 
      let data = {
        name   : socket.nickname,
        posX   : 300, //Math.round(Math.random() * world.width),
        posY   : 300, //Math.round(Math.random() * world.height),
        dir    : Math.round(Math.random() * 360),
        health : 100,
        mode   : 'normal'
      };
      console.log('data');
      console.log(data);
      // player does not exist, create the player
      players[socket.nickname] = {'data':data};
      io.to(socket.id).emit('signup successful', socket.nickname);
      updatePlayers();
      console.log(Object.keys(players));
    } else {
      // player exists, send error
      io.to(socket.id).emit('signup error', '"' + username + '" is already taken.');
    }
  });

  socket.on('start game', function() {
    console.log('start game');
    console.log(players[socket.nickname].data);
    io.to(socket.id).emit('player created', players[socket.nickname].data);
  });

  // This takes regular client data
  socket.on('client update', function(playerData) {
    console.log(playerData);
    console.log(players);
    players[playerData.name].data = playerData;
  });

  // This is the main pipe to everyone
  var gameUpdates = setInterval(function() {
    socket.emit('update players', players);
  }, 100);

  function updatePlayers() {
    io.emit('playerList', Object.keys(players));
  }

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
