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
let grenades = [];

const playerTypes = ['Backend Developer', 'Frontend Developer', 'QA'];

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Initialize the new player with a random type
  players[socket.id] = {
    x: Math.random() * 800,
    y: Math.random() * 600,
    health: 100,
    type: playerTypes[Math.floor(Math.random() * playerTypes.length)]
  };

  console.log('New player created:', socket.id, players[socket.id]);

  // Send the new player info to all connected clients
  io.emit('newPlayer', { id: socket.id, ...players[socket.id] });

  // Send the current state of all players to the new player
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

  socket.on('bulletFired', (bulletData) => {
    console.log('Bullet fired:', bulletData);
    const newBullet = { ...bulletData, id: Date.now().toString() };
    bullets.push(newBullet);
    io.emit('bulletFired', newBullet);
  });

  socket.on('grenadeThrown', (grenadeData) => {
    console.log('Grenade thrown:', grenadeData);
    const newGrenade = { ...grenadeData, id: Date.now().toString() };
    grenades.push(newGrenade);
    io.emit('grenadeCreated', newGrenade);

    // Simulate grenade explosion after 3 seconds
    setTimeout(() => {
      io.emit('grenadeExploded', { id: newGrenade.id, position: newGrenade.position });
      grenades = grenades.filter(g => g.id !== newGrenade.id);
    }, 3000);
  });
});

// Game loop
setInterval(() => {
  // Update bullet positions
  bullets.forEach(bullet => {
    bullet.position.x += bullet.velocity.x * 10;
    bullet.position.y += bullet.velocity.y * 10;

    console.log('Bullet position updated:', bullet.id, bullet.position);

    // Check for collisions with players
    Object.entries(players).forEach(([playerId, player]) => {
      if (playerId !== bullet.playerId) {
        const dx = player.x - bullet.position.x;
        const dy = player.y - bullet.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 25) { // Assuming player radius is 25
          player.health -= 34; // Bullet damage
          if (player.health <= 0) {
            io.emit('playerKilled', { id: playerId, killerId: bullet.playerId });
            player.health = 100; // Respawn with full health
            player.x = Math.random() * 800;
            player.y = Math.random() * 600;
          }
          io.emit('playerDamaged', { id: playerId, health: player.health });
          bullets = bullets.filter(b => b.id !== bullet.id);
        }
      }
    });

    // Remove bullets that are out of bounds
    if (bullet.position.x < 0 || bullet.position.x > 800 || bullet.position.y < 0 || bullet.position.y > 600) {
      bullets = bullets.filter(b => b.id !== bullet.id);
    }
  });

  // Send updated game state to all clients
  io.emit('gameState', { players, bullets, grenades });
}, 1000 / 60); // 60 times per second

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});