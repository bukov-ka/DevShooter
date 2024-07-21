const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:9000",
    methods: ["GET", "POST"]
  }
});

let players = {};
let bullets = [];

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Initialize the new player
  players[socket.id] = {
    x: Math.random() * 800,
    y: Math.random() * 600,
    health: 100
  };

  console.log('New player created:', socket.id, players[socket.id]);

  // Send the new player info to all connected clients
  io.emit('newPlayer', { id: socket.id, ...players[socket.id] });

  // Send the current state of all players to the new player
  console.log('Sending current players to new player:', players);
  socket.emit('currentPlayers', players);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });

  socket.on('playerMove', (position) => {
    console.log('Player moved:', socket.id, position);
    players[socket.id] = { ...players[socket.id], ...position };
    socket.broadcast.emit('playerMoved', { id: socket.id, ...position });
  });

  socket.on('shoot', (bullet) => {
    console.log('Player shot:', socket.id, bullet);
    const newBullet = { ...bullet, playerId: socket.id };
    bullets.push(newBullet);
    io.emit('bulletShot', newBullet);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});