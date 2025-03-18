
import express from 'express';
import https from 'https';
import { Server } from 'socket.io';
import crypto from 'crypto'
const app = express();

const options = {
  secureOptions: crypto.constants.SSL_OP_NO_SSLv3, // Disable SSLv3 (for security reasons)
  ciphers: 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384', // Define supported ciphers
  honorCipherOrder: true, // Make sure the server respects the cipher order
};

const server = https.createServer(options, app);

  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "https://codeera.onrender.com"], // Your client URL
      methods: ["GET", "POST"],
      credentials: true
    },
  });

  

  const rooms = new Map();

  io.on("connection", (socket) => {
    console.log("A user connected");

    // Handle document collaboration
    socket.on("join-room", ({ roomId, username }) => {
      console.log(`${username} joined room ${roomId}`);
      socket.join(roomId);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, { content: "", users: new Set() });
      }

      const room = rooms.get(roomId);
      room.users.add(username);

      socket.emit("load-document", room.content);

      io.to(roomId).emit("user-count", room.users.size);
    });

    socket.on("send-changes", ({ delta, roomId }) => {
      const room = rooms.get(roomId);
      if (room) {
        room.content = delta;
        socket.broadcast.to(roomId).emit("receive-changes", delta);
      }
    });

    socket.on("draw", ({ drawLine, roomId }) => {
      socket.broadcast.to(roomId).emit("receive-drawing", drawLine);
    });



    socket.on("disconnect", () => {
      console.log("A user disconnected");

      // Clean up document rooms
      rooms.forEach((room, roomId) => {
        if (room.users.size === 0) {
          rooms.delete(roomId);
        }
      });


    });
  });



server.listen(5000, () => {
  console.log("Server running on https://localhost:5000");
});


