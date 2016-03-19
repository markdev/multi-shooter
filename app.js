"use strict"

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var players = {}; // I want to be able to use associativity
var fish = [];
var shots = [];
var orbs = [];

const serverPushFrequency = 100;            // in milliseconds
const world = { height: 10000, width: 10000 }; // UPDATE ON CLIENT SIDE TOO
const shotspeed = 20;
const shotduration = 20;

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



/*
  socket.on('mobile test', function(e) {
    console.log('mobile test:');
    console.log(e);
  });
  */




  // Adds shots to the array
  socket.on('shot fired', function(shot) {
    shot.duration = shotduration;
    shots.push(shot);
  });  

  // This is the main pipe to everyone
  var gameUpdates = setInterval(function() {
    players = updatePositions(players);
    socket.emit('update players', players);
    shots = updateShots(shots);
    socket.emit('update shots', shots);
  }, serverPushFrequency);

  function updatePositions(items) {
    if (items) {
      for (var item in items) {
        var iData = items[item].data;
        if (iData.posX < 0) iData.posX += world.width;
        if (iData.posY < 0) iData.posY += world.height;
        if (iData.posX > world.width) iData.posX -= world.width;
        if (iData.posX > world.height) iData.posX -= world.height;
      }
    }
    return items;
  };

  function updateShots(shots) {
    for (var shot in shots) {
      var s = shots[shot];
      s.posX += shotspeed * Math.cos(s.theta);
      s.posY += shotspeed * Math.sin(s.theta);
      if (s.posX < 0) s.posX += world.width;
      if (s.posY < 0) s.posY += world.height;
      if (s.posX > world.width) s.posX -= world.width;
      if (s.posY > world.height) s.posY -= world.height;
      s.duration--;
      if (s.duration <= 0) shots.splice(shot, 1);    
    }
    return shots;
  }

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
