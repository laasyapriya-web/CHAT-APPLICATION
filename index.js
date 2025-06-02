const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users
const users = {};

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Handle new user joining
    socket.on('join', (userData) => {
        users[socket.id] = {
            id: userData.userId,
            username: userData.username,
            socketId: socket.id
        };
        console.log(`${userData.username} joined the chat`);
        socket.broadcast.emit('user-connected', {
            userId: userData.userId,
            username: userData.username
        });
    });

    // Handle incoming messages
    socket.on('message', (messageData) => {
        console.log('Message received:', messageData);
        // Broadcast to all clients except sender
        socket.broadcast.emit('message', {
            ...messageData,
            timestamp: new Date().toISOString()
        });
    });

    // Handle typing indicator
    socket.on('typing', (userData) => {
        socket.broadcast.emit('typing', {
            userId: userData.userId,
            username: userData.username
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const user = users[socket.id];
        if (user) {
            console.log(`${user.username} disconnected`);
            delete users[socket.id];
            io.emit('user-disconnected', {
                userId: user.id,
                username: user.username
            });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`ChatterBox server running on port ${PORT}`);
});
