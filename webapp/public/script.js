document.addEventListener('DOMContentLoaded', () => {
    if (typeof $ === 'undefined' || typeof Chessboard === 'undefined' || typeof Chess === 'undefined') {
      alert('Librerie mancanti! Ricarica la pagina.');
      return;
    }
  
    const socket = io();
    const game = new Chess();
    let board = null;
    let gameId = null;
    let playerColor = null;
  
    board = Chessboard('board', {
      position: 'start',
      draggable: true,
      pieceTheme: 'https://cdnjs.cloudflare.com/ajax/libs/chessboard-js/1.0.0/img/chesspieces/wikipedia/{piece}.png',
      onDrop: (source, target) => {
        if (playerColor[0] !== game.turn()) return 'snapback';
  
        const move = game.move({ from: source, to: target, promotion: 'q' });
        if (!move) return 'snapback';
  
        socket.emit('move', gameId, move);
        updateBoardUI();
      }
    });
  
    function updateBoardUI() {
      board.position(game.fen());
      document.getElementById('move-history').textContent = game.history().join(' ');
      let status = `Turno del ${game.turn() === 'w' ? 'bianco' : 'nero'}`;
      if (game.isCheckmate()) status = 'Scacco matto!';
      if (game.isDraw()) status = 'Patta!';
      document.getElementById('game-status').textContent = status;
    }
  
    document.getElementById('create-game').addEventListener('click', () => {
      socket.emit('createGame');
    });
  
    document.getElementById('join-game').addEventListener('click', () => {
      const id = document.getElementById('game-id').value.trim();
      if (id) socket.emit('joinGame', id);
    });
  
    socket.on('connect', () => {
      document.getElementById('game-status').textContent = 'Connesso al server';
    });
  
    socket.on('gameCreated', (id) => {
      gameId = id;
      playerColor = 'white';
      document.getElementById('game-id').value = id;
      document.getElementById('game-status').textContent = `Partita creata. ID: ${id}`;
    });
  
    socket.on('gameJoined', (id, color, fen) => {
      gameId = id;
      playerColor = color;
      game.load(fen);
      updateBoardUI();
      document.getElementById('game-status').textContent = `Unito come ${color}`;
    });
  
    socket.on('moveMade', (fen) => {
      game.load(fen);
      updateBoardUI();
    });
  
    socket.on('error', (msg) => {
      alert(`Errore: ${msg}`);
    });
  });
  