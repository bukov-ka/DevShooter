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

const generateRandomName = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length: 5 }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Initialize the new player with a random type and name
  players[socket.id] = {
    x: Math.random() * 800,
    y: Math.random() * 600,
    health: 100,
    type: playerTypes[Math.floor(Math.random() * playerTypes.length)],
    name: generateRandomName(),
    kills: 0,
    deaths: 0,
    bulletsFired: 0,
    isDead: false
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
    if (players[socket.id]) {
      players[socket.id].x = position.x;
      players[socket.id].y = position.y;
      socket.broadcast.emit('playerMoved', { id: socket.id, ...position });
    }
  });

  socket.on('bulletFired', (bulletData) => {
    console.log('Bullet fired:', bulletData);
    const newBullet = { ...bulletData, id: Date.now().toString() };
    bullets.push(newBullet);
    io.emit('bulletFired', newBullet);
    
    // Increment bulletsFired count
    if (players[socket.id]) {
      players[socket.id].bulletsFired++;
    }
  });

  socket.on('playerRespawn', () => {
    if (players[socket.id]) {
      players[socket.id].health = 100;
      players[socket.id].x = Math.random() * 800;
      players[socket.id].y = Math.random() * 600;
      players[socket.id].isDead = false;  // Reset death state
      console.log(`[Death Debug] Player respawned. ID: ${socket.id}, Health: ${players[socket.id].health}`);
      io.emit('playerRespawned', { id: socket.id, ...players[socket.id] });
    }
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

    // Check for collisions with players
    Object.entries(players).forEach(([playerId, player]) => {
      if (playerId !== bullet.playerId && !player.isDead) {  // Check if player is not dead
        const dx = player.x - bullet.position.x;
        const dy = player.y - bullet.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 25) { // Assuming player radius is 25
          console.log(`[Death Debug] Bullet hit player. PlayerID: ${playerId}, BulletID: ${bullet.id}`);
          
          // Directly handle player hit
          const damage = 34; // 34% damage per bullet
          const hitPlayer = players[playerId];
          if (hitPlayer) {
            const oldHealth = hitPlayer.health;
            hitPlayer.health = Math.max(0, hitPlayer.health - damage);
            console.log(`[Death Debug] Player health updated. ID: ${playerId}, Old Health: ${oldHealth}, New Health: ${hitPlayer.health}, Damage: ${damage}`);
            io.emit('playerUpdated', { id: playerId, health: hitPlayer.health });

            if (hitPlayer.health <= 0 && !hitPlayer.isDead) {  // Check if player wasn't already dead
              console.log(`[Death Debug] Player died. ID: ${playerId}`);
              hitPlayer.isDead = true;  // Set death state
              if (players[bullet.playerId]) {
                players[bullet.playerId].kills++;
                console.log(`[Death Debug] Killer's kills increased. ID: ${bullet.playerId}, Kills: ${players[bullet.playerId].kills}`);
              }
              hitPlayer.deaths++;
              console.log(`[Death Debug] Emitting playerKilled event. KilledID: ${playerId}, KillerID: ${bullet.playerId}`);
              io.emit('playerKilled', { killedId: playerId, killerId: bullet.playerId });
            }
          } else {
            console.log(`[Death Debug] Error: Player not found for hit. ID: ${playerId}`);
          }

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