
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  }
});

// Store active rooms and their data
const rooms = new Map();
const roomUsers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected');

  // Handle room joining
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    
    // Create room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { 
        strokes: [],
        currentState: null // Add this to store canvas state
      });
    }

    // Update user count
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Set());
    }
    roomUsers.get(roomId).add(socket.id);
    
    // Send current room data to the joining user
    socket.emit('room-data', rooms.get(roomId));
    io.to(roomId).emit('user-joined', roomUsers.get(roomId).size);
  });


  socket.on('canvas-undo', ({ roomId, lastState, currentState, undoStack, redoStack }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.currentState = lastState;
      room.undoStack = undoStack;
      room.redoStack = redoStack;
      
      // Broadcast the undo update to all users in the room
      io.to(roomId).emit('canvas-undo-update', {
        lastState,
        undoStack,
        redoStack
      });
    }
  });

  socket.on('canvas-redo', ({ roomId, nextState, undoStack, redoStack }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.currentState = nextState;
      room.undoStack = undoStack;
      room.redoStack = redoStack;
      
      // Broadcast the redo update to all users in the room
      io.to(roomId).emit('canvas-redo-update', {
        nextState,
        undoStack,
        redoStack
      });
    }
  });


  // Add canvas state sync
  socket.on('canvas-state', ({ roomId, dataUrl }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.currentState = dataUrl;
      socket.to(roomId).emit('canvas-state-update', dataUrl);
    }
  });

  socket.on('drawing', (data) => {
    const { roomId, ...drawingData } = data;
    const room = rooms.get(roomId);
    if (room) {
      room.strokes.push({ type: 'draw', ...drawingData });
      socket.to(roomId).emit('drawing', drawingData);
    }
  });



  socket.on('drawing-end', (roomId) => {
    socket.to(roomId).emit('drawing-end');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  socket.on('disconnecting', () => {
    socket.rooms.forEach(roomId => {
      if (roomUsers.has(roomId)) {
        roomUsers.get(roomId).delete(socket.id);
        io.to(roomId).emit('user-left', roomUsers.get(roomId).size);
        
        if (roomUsers.get(roomId).size === 0) {
          roomUsers.delete(roomId);
          rooms.delete(roomId);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
