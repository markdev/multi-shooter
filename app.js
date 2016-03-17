var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var players = {'a':{}};

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
  socket.on('initialize', function(msg) {
    console.log(msg);
    updatePlayers;
  });

  socket.on('signup', function(username) {
    if (Object.keys(players).indexOf(username) == -1) {
      // player does not exist, create the player
      socket.nickname = username; 
      players[socket.nickname] = socket;
      io.to(socket.id).emit('signup successful', socket.nickname);
      updatePlayers();
    } else {
      // player exists, send error
      io.to(socket.id).emit('signup error', '"' + username + '" is already taken.');
    }
  });

  socket.on('x', function(x) {
    console.log("x=" + x);
  });
  socket.on('y', function(y) {
    console.log("y=" + y);
  });

  function updatePlayers() {
    io.emit('playerList', Object.keys(players));
  }

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
