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
  
    // Inizializzazione scacchiera con pezzi corretti
    board = Chessboard('board', {
      position: 'start',
      draggable: true,
      pieceTheme: 'https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/img/chesspieces/wikipedia/{piece}.png',
      onDrop: (source, target) => {
        if (playerColor[0] !== game.turn()) return 'snapback';
  
        const move = game.move({
          from: source,
          to: target,
          promotion: 'q'
        });
        
        if (!move) return 'snapback';
  
        socket.emit('move', gameId, game.fen());
        updateBoardUI();
      }
    });
  
    function updateBoardUI() {
      // Aggiorna con orientamento corretto
      board.position(game.fen(), playerColor === 'black');
      
      document.getElementById('move-history').textContent = game.history().join(' ');
      
      let status = `Turno del ${game.turn() === 'w' ? 'bianco' : 'nero'}`;
      if (game.isCheckmate()) status = 'Scacco matto!';
      if (game.isDraw()) status = 'Patta!';
      if (game.isCheck()) status += ' - Scacco!';
      
      document.getElementById('game-status').textContent = status;
    }
  
    // UI Events
    document.getElementById('create-game').addEventListener('click', () => {
      socket.emit('createGame');
      this.disabled = true;
    });
  
    document.getElementById('join-game').addEventListener('click', () => {
      const id = document.getElementById('game-id').value.trim();
      if (!id) return alert('Inserisci un ID partita');
      socket.emit('joinGame', id);
      this.disabled = true;
    });
  
    // Socket Events
    socket.on('connect', () => {
      document.getElementById('game-status').textContent = 'Connesso al server';
    });
  
    socket.on('gameCreated', (id) => {
      gameId = id;
      playerColor = 'white';
      board.orientation('white');
      document.getElementById('game-id').value = id;
      document.getElementById('game-status').textContent = `Partita creata (ID: ${id})`;
    });
  
    socket.on('gameJoined', (gameId, color, fen) => {
        gameId = gameId;
        playerColor = color;
        game.load(fen);
        board.orientation(color);
        updateBoardUI();
      
        const msg = color === 'white'
          ? 'Sei il bianco! Attendi avversario...'
          : 'Sei il nero! Partita iniziata';
      
        document.getElementById('game-status').textContent = msg;
      });
      
    socket.on('moveMade', (fen) => {
      game.load(fen);
      updateBoardUI();
    });
  
    socket.on('error', (msg) => {
      alert(`Errore: ${msg}`);
      document.getElementById('join-game').disabled = false;
    });
  });