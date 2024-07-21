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

io.on('connection', (socket) => {
  console.log('a user connected');
  
  players[socket.id] = { x: 0, y: 0 };

  socket.on('disconnect', () => {
    console.log('user disconnected');
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });

  socket.on('playerMove', (position) => {
    players[socket.id] = position;
    io.emit('playerUpdate', { id: socket.id, ...position });
  });

  socket.emit('currentPlayers', players); // Send current players to the new client
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
