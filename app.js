var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var players = {};

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('initialize', function(msg) {
    console.log(msg);
    io.emit('playerList', players);
  });

  socket.on('x', function(x) {
    console.log("x=" + x);
  });
  socket.on('y', function(y) {
    console.log("y=" + y);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
