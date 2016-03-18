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
        color  : getRandomColor(),
        posX   : 300, //Math.round(Math.random() * world.width),
        posY   : 300, //Math.round(Math.random() * world.height),
        dir    : Math.round(Math.random() * 360),
        health : 100,
        mode   : 'normal'
      };
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
    io.to(socket.id).emit('player created', players[socket.nickname].data);
  });

  // This takes regular client data
  socket.on('client update', function(playerData) {
    players[playerData.name].data = playerData;
  });

  // This is the main pipe to everyone
  var gameUpdates = setInterval(function() {
    socket.emit('update players', players);
  }, 100);

  function updatePlayers() {
    io.emit('playerList', Object.keys(players));
  }

  function getRandomColor() {
    var colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'blue', 'coral', 'brown', 'aqua', 'cyan'];
    var i = Math.floor(Math.random() * 10);
    return colors[i];
  }

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
