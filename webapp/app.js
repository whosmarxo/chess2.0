const express = require('express');
const socketio = require('socket.io');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

const PORT = process.env.PORT || 3000;

// Middleware per i file statici
app.use(express.static(path.join(__dirname, 'public')));

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const io = socketio(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const games = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('createGame', () => {
    const gameId = generateId();
    games[gameId] = {
      chess: new Chess(),
      players: [socket.id],
      spectators: []
    };
    socket.join(gameId);
    socket.emit('gameCreated', gameId);
    console.log(`Game created: ${gameId}`);
  });

  socket.on('joinGame', (gameId) => {
    if (!games[gameId]) return socket.emit('error', 'Game not found');
    
    const game = games[gameId];
    if (game.players.length < 2) {
      game.players.push(socket.id);
      const color = game.players.length === 1 ? 'white' : 'black';
      socket.join(gameId);
      socket.emit('gameJoined', gameId, color, game.chess.fen());
      if (game.players.length === 2) {
        io.to(gameId).emit('gameReady', game.chess.fen());
      }
    } else {
      socket.emit('error', 'Game is full');
    }
  });

  socket.on('move', (gameId, move) => {
    try {
      const game = games[gameId];
      const result = game.chess.move(move);
      if (result) {
        io.to(gameId).emit('moveMade', game.chess.fen());
      }
    } catch (e) {
      socket.emit('error', e.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

function generateId() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}