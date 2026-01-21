// Signaling Client - Handles WebSocket communication with the server
class SignalingClient {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.userId = null;
        this.partnerId = null;
        this.messageHandlers = {};
    }

    connect(serverUrl = 'http://localhost:3000') {
        return new Promise((resolve, reject) => {
            try {
                this.socket = io(serverUrl);

                this.socket.on('connect', () => {
                    console.log('Connected to signaling server');
                    this.connected = true;
                    this.userId = this.socket.id;
                    resolve();
                });

                this.socket.on('disconnect', () => {
                    console.log('Disconnected from signaling server');
                    this.connected = false;
                    this.emit('disconnected');
                });

                this.socket.on('error', (error) => {
                    console.error('Socket error:', error);
                    reject(error);
                });

                // WebRTC signaling messages
                this.socket.on('offer', (data) => {
                    this.emit('offer', data);
                });

                this.socket.on('answer', (data) => {
                    this.emit('answer', data);
                });

                this.socket.on('ice-candidate', (data) => {
                    this.emit('ice-candidate', data);
                });

                // Matching events
                this.socket.on('matched', (data) => {
                    this.partnerId = data.partnerId;
                    this.emit('matched', data);
                });

                this.socket.on('partner-disconnected', () => {
                    this.partnerId = null;
                    this.emit('partner-disconnected');
                });

                this.socket.on('waiting', () => {
                    this.emit('waiting');
                });

                // Chat messages
                this.socket.on('chat-message', (data) => {
                    this.emit('chat-message', data);
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    // Register event handlers
    on(event, handler) {
        if (!this.messageHandlers[event]) {
            this.messageHandlers[event] = [];
        }
        this.messageHandlers[event].push(handler);
    }

    // Emit events to registered handlers
    emit(event, data) {
        if (this.messageHandlers[event]) {
            this.messageHandlers[event].forEach(handler => handler(data));
        }
    }

    // Request to find a match
    findMatch(userData) {
        if (this.socket && this.connected) {
            this.socket.emit('find-match', userData);
        }
    }

    // Send WebRTC offer
    sendOffer(offer) {
        if (this.socket && this.connected && this.partnerId) {
            this.socket.emit('offer', {
                to: this.partnerId,
                offer: offer
            });
        }
    }

    // Send WebRTC answer
    sendAnswer(answer) {
        if (this.socket && this.connected && this.partnerId) {
            this.socket.emit('answer', {
                to: this.partnerId,
                answer: answer
            });
        }
    }

    // Send ICE candidate
    sendIceCandidate(candidate) {
        if (this.socket && this.connected && this.partnerId) {
            this.socket.emit('ice-candidate', {
                to: this.partnerId,
                candidate: candidate
            });
        }
    }

    // Send chat message
    sendChatMessage(message) {
        if (this.socket && this.connected && this.partnerId) {
            this.socket.emit('chat-message', {
                to: this.partnerId,
                message: message
            });
            return true;
        }
        return false;
    }

    // Stop matching/disconnect from partner
    stopMatching() {
        if (this.socket && this.connected) {
            this.socket.emit('stop-matching');
            this.partnerId = null;
        }
    }

    // Disconnect from server
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
            this.userId = null;
            this.partnerId = null;
        }
    }
}

// Create global instance
const signalingClient = new SignalingClient();
