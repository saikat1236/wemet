const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname)));

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint for deployment platforms
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// User management
const waitingUsers = [];
const activeConnections = new Map(); // socketId -> { partnerId, username }

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle find match request
    socket.on('find-match', (userData) => {
        console.log('Find match request from:', socket.id, userData);

        // Store user data
        activeConnections.set(socket.id, {
            username: userData.username || 'Anonymous',
            isGuest: userData.isGuest || false,
            partnerId: null
        });

        // Try to match with waiting user
        if (waitingUsers.length > 0) {
            const partner = waitingUsers.shift();
            
            // Check if partner is still connected
            const partnerSocket = io.sockets.sockets.get(partner.socketId);
            if (!partnerSocket) {
                // Partner disconnected, try next
                socket.emit('find-match', userData);
                return;
            }

            // Create match
            const user1 = activeConnections.get(socket.id);
            const user2 = activeConnections.get(partner.socketId);

            user1.partnerId = partner.socketId;
            user2.partnerId = socket.id;

            // Notify both users
            socket.emit('matched', {
                partnerId: partner.socketId,
                partnerName: user2.username,
                initiator: true
            });

            partnerSocket.emit('matched', {
                partnerId: socket.id,
                partnerName: user1.username,
                initiator: false
            });

            console.log('Matched:', socket.id, 'with', partner.socketId);
        } else {
            // Add to waiting queue
            waitingUsers.push({
                socketId: socket.id,
                username: userData.username,
                timestamp: Date.now()
            });
            socket.emit('waiting');
            console.log('User waiting:', socket.id);
        }
    });

    // WebRTC signaling - offer
    socket.on('offer', (data) => {
        console.log('Relaying offer from', socket.id, 'to', data.to);
        io.to(data.to).emit('offer', {
            from: socket.id,
            offer: data.offer
        });
    });

    // WebRTC signaling - answer
    socket.on('answer', (data) => {
        console.log('Relaying answer from', socket.id, 'to', data.to);
        io.to(data.to).emit('answer', {
            from: socket.id,
            answer: data.answer
        });
    });

    // WebRTC signaling - ICE candidate
    socket.on('ice-candidate', (data) => {
        io.to(data.to).emit('ice-candidate', {
            from: socket.id,
            candidate: data.candidate
        });
    });

    // Chat message
    socket.on('chat-message', (data) => {
        console.log('Chat message from', socket.id, 'to', data.to);
        io.to(data.to).emit('chat-message', {
            from: socket.id,
            message: data.message
        });
    });

    // Stop matching
    socket.on('stop-matching', () => {
        handleUserLeave(socket.id);
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        handleUserLeave(socket.id);
        activeConnections.delete(socket.id);
    });
});

// Helper function to handle user leaving
function handleUserLeave(socketId) {
    // Remove from waiting queue
    const waitingIndex = waitingUsers.findIndex(u => u.socketId === socketId);
    if (waitingIndex !== -1) {
        waitingUsers.splice(waitingIndex, 1);
        console.log('Removed from waiting queue:', socketId);
    }

    // Notify partner if in active connection
    const userData = activeConnections.get(socketId);
    if (userData && userData.partnerId) {
        const partnerSocket = io.sockets.sockets.get(userData.partnerId);
        if (partnerSocket) {
            partnerSocket.emit('partner-disconnected');
            
            // Clear partner's connection
            const partnerData = activeConnections.get(userData.partnerId);
            if (partnerData) {
                partnerData.partnerId = null;
            }
        }
        userData.partnerId = null;
    }
}

// Clean up stale waiting users periodically (every 30 seconds)
setInterval(() => {
    const now = Date.now();
    const timeout = 60000; // 60 seconds

    for (let i = waitingUsers.length - 1; i >= 0; i--) {
        if (now - waitingUsers[i].timestamp > timeout) {
            const user = waitingUsers.splice(i, 1)[0];
            console.log('Removed stale waiting user:', user.socketId);
        }
    }
}, 30000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Signaling server ready for WebRTC connections');
});
