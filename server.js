const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const cursors = {};

io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('cursor-move', (data) => {
    cursors[socket.id] = {
      x: data.x,
      y: data.y,
      name: data.name || 'Anonymous'
    };
    socket.broadcast.emit('cursors-update', cursors);
  });

  socket.on('drawing-start', (data) => {
    socket.broadcast.emit('drawing-start', { ...data, id: socket.id });
  });

  socket.on('drawing', (data) => {
    socket.broadcast.emit('drawing', { ...data, id: socket.id });
  });

  socket.on('drawing-end', () => {
    socket.broadcast.emit('drawing-end', { id: socket.id });
  });

  socket.on('disconnect', () => {
    delete cursors[socket.id];
    io.emit('cursors-update', cursors);
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});