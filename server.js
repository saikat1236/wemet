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
// Serve static files from React app
app.use(express.static(path.join(__dirname, 'client/dist')));

// Health check
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
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
            partnerId: null,
            coins: 100,
            myGender: userData.myGender || 'Any',
            lookingFor: userData.lookingFor || 'Any',
            avatar: userData.avatar || '😊',
            bio: userData.bio || '',
            weMetId: userData.weMetId || null
        });

        // Send initial balance
        socket.emit('balance-updated', { balance: 100 });

        // Try to match with waiting user
        let matchFound = false;
        
        // Filter waiting users based on preferences
        const potentialMatches = waitingUsers.filter(user => {
            // Check if I match their preference
            const theyWantMe = user.lookingFor === 'Any' || user.lookingFor === userData.myGender;
            // Check if they match my preference
            const iWantThem = userData.lookingFor === 'Any' || userData.lookingFor === user.myGender;
            
            return theyWantMe && iWantThem;
        });

        if (potentialMatches.length > 0) {
            // Pick random match from filtered list
            const partner = potentialMatches[Math.floor(Math.random() * potentialMatches.length)];
            const partnerSocket = io.sockets.sockets.get(partner.socketId);

            if (partnerSocket) {
                matchFound = true;
                
                // Remove partner from waiting list
                const partnerIndex = waitingUsers.findIndex(u => u.socketId === partner.socketId);
                if (partnerIndex !== -1) {
                    waitingUsers.splice(partnerIndex, 1);
                }

                // Update connection status
                const myData = activeConnections.get(socket.id);
                const partnerData = activeConnections.get(partner.socketId);

                myData.partnerId = partner.socketId;
                partnerData.partnerId = socket.id;

                // Notify both users
                socket.emit('matched', { 
                    partnerId: partner.socketId, 
                    initiator: true,
                    partnerName: partnerData.username,
                    partnerAvatar: partnerData.avatar,
                    partnerBio: partnerData.bio,
                    partnerWeMetId: partnerData.weMetId
                });
                partnerSocket.emit('matched', { 
                    partnerId: socket.id, 
                    initiator: false,
                    partnerName: myData.username,
                    partnerAvatar: myData.avatar,
                    partnerBio: myData.bio,
                    partnerWeMetId: myData.weMetId
                });
                console.log('Matched:', socket.id, 'with', partner.socketId);
            }
        }

        if (!matchFound) {
            // Add to waiting queue
            waitingUsers.push({
                socketId: socket.id,
                username: userData.username || 'Anonymous',
                timestamp: Date.now(),
                myGender: userData.myGender || 'Any',
                lookingFor: userData.lookingFor || 'Any',
                avatar: userData.avatar || '😊',
                bio: userData.bio || '',
                weMetId: userData.weMetId || null
            });
            socket.emit('waiting');
            console.log('User waiting:', socket.id);
        }
    });

    // WebRTC signaling - offer
    socket.on('offer', (data) => {
        const userData = activeConnections.get(socket.id);
        if (userData && userData.partnerId) {
            console.log('Relaying offer from', socket.id, 'to', userData.partnerId);
            io.to(userData.partnerId).emit('offer', {
                offer: data.offer,
                from: socket.id
            });
        }
    });

    // WebRTC signaling - answer
    socket.on('answer', (data) => {
        const userData = activeConnections.get(socket.id);
        if (userData && userData.partnerId) {
            console.log('Relaying answer from', socket.id, 'to', userData.partnerId);
            io.to(userData.partnerId).emit('answer', {
                answer: data.answer,
                from: socket.id
            });
        }
    });

    // WebRTC signaling - ICE candidate
    socket.on('ice-candidate', (data) => {
        const userData = activeConnections.get(socket.id);
        if (userData && userData.partnerId) {
            io.to(userData.partnerId).emit('ice-candidate', {
                candidate: data.candidate,
                from: socket.id
            });
        }
    });

    // Chat message
    socket.on('chat-message', (data) => {
        const userData = activeConnections.get(socket.id);
        if (userData && userData.partnerId) {
            console.log('Chat message from', socket.id, 'to', userData.partnerId);
            io.to(userData.partnerId).emit('chat-message', {
                message: data.message,
                from: socket.id
            });
        }
    });

    // Coin System
    socket.on('get-balance', () => {
        const user = activeConnections.get(socket.id);
        if (user) {
            socket.emit('balance-updated', { balance: user.coins });
        }
    });

    socket.on('update-balance', (data) => {
        // In a real app, validate this server-side!
        const user = activeConnections.get(socket.id);
        if (user) {
            user.coins = (user.coins || 0) + data.amount;
            socket.emit('balance-updated', { balance: user.coins });
        }
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
