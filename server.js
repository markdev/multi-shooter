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
const shotData = {size: 20}; // UPDATE ON THE CLIENT SIDE TOO

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
        id     : socket.id,
        name   : socket.nickname,
        color  : getRandomColor(),
        posX   : 300, //Math.round(Math.random() * world.width),
        posY   : 300, //Math.round(Math.random() * world.height),
        dir    : Math.round(Math.random() * 360),
        health : 100,
        mode   : 'normal',
        width  : 100,
        height : 100
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
    if (players[playerData.name]) {
      players[playerData.name].data = playerData;
    }
  });

  // Adds shots to the array
  socket.on('shot fired', function(shot) {
    shot.duration = shotduration;
    shots.push(shot);
  });  

  // This is the main pipe to everyone
  var gameUpdates = setInterval(function() {
    shots = updateShots(shots);
    players = updatePositions(players);
    var res = collisionDetection(shots, players);
    shots = res.shots;
    players = res.players;
    socket.emit('update shots', shots);
    socket.emit('update players', players);
  }, serverPushFrequency);

  function collisionDetection(shots, players) {
    for (var shot in shots) {
      var s = shots[shot];
      for (var player in players) {
        var p = players[player].data;
        if (p.name != s.firer) {
          if (s.posX + shotData.size > p.posX && s.posX < p.posX + p.width && s.posY + shotData.size > p.posY && s.posY < p.posY + p.height) {
            shots.splice(shot, 1); // takes the shot out of circulation
            p.health -= s.damage;
            console.log(p.name + " is down to " + p.health);
            io.to(p.id).emit('update health', p.health);
            if (p.health <= 0) {
              delete players[player];
              //players = killPlayer(players, player);
              io.to(p.id).emit('youre dead', '');
            } else {
              // alertHitPlayer(p);
            }
            
            //console.log(p.name + " is down to " + p.health);
          }
        }
      }
    }
    return {shots: shots, players: players};
  }
/*
  function killPlayer(players, player) {
    delete players[player];
  }
*/
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

http.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:3000');
});
