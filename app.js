// Main Application Logic
class VideoChat {
    constructor() {
        this.currentUser = null;
        this.isGuest = false;
        this.isInChat = false;
        this.isMatching = false;
        this.partnerName = null;
        
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        // Landing page buttons
        document.getElementById('guest-start-btn')?.addEventListener('click', () => this.startAsGuest());
        document.getElementById('signup-start-btn')?.addEventListener('click', () => this.showSignupModal());
        document.getElementById('login-btn')?.addEventListener('click', () => this.showLoginModal());
        document.getElementById('signup-btn')?.addEventListener('click', () => this.showSignupModal());

        // Modal controls
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.currentTarget.getAttribute('data-modal');
                this.hideModal(modalId);
            });
        });

        document.getElementById('switch-to-signup')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.hideModal('login-modal');
            this.showSignupModal();
        });

        document.getElementById('switch-to-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.hideModal('signup-modal');
            this.showLoginModal();
        });

        // Auth forms
        document.getElementById('login-form')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('signup-form')?.addEventListener('submit', (e) => this.handleSignup(e));

        // Chat controls
        document.getElementById('start-btn')?.addEventListener('click', () => this.startMatching());
        document.getElementById('next-btn')?.addEventListener('click', () => this.findNext());
        document.getElementById('stop-btn')?.addEventListener('click', () => this.stopChat());
        document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());

        // Video/Audio controls
        document.getElementById('toggle-video-btn')?.addEventListener('click', () => this.toggleVideo());
        document.getElementById('toggle-audio-btn')?.addEventListener('click', () => this.toggleAudio());

        // Chat controls
        document.getElementById('toggle-chat-btn')?.addEventListener('click', () => this.toggleChatSidebar());
        document.getElementById('close-chat-btn')?.addEventListener('click', () => this.toggleChatSidebar());
        document.getElementById('send-btn')?.addEventListener('click', () => this.sendMessage());
        document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Setup WebRTC event handlers
        this.setupWebRTCHandlers();
        
        // Setup signaling event handlers
        this.setupSignalingHandlers();
        
        // Add ripple effects to all buttons
        this.addRippleEffects();

        // Coin System Listeners
        document.getElementById('open-wallet-btn')?.addEventListener('click', () => {
            document.getElementById('wallet-modal').classList.add('active');
        });

        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amount = parseInt(e.target.dataset.amount);
                this.handleBuyCoins(amount);
            });
        });
    }
    
    addRippleEffects() {
        const buttons = document.querySelectorAll('.cta-btn, .control-btn, .nav-btn, .submit-btn, .send-btn, .icon-btn');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const ripple = document.createElement('span');
                ripple.classList.add('ripple-effect');
                
                const rect = button.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                
                button.appendChild(ripple);
                
                setTimeout(() => ripple.remove(), 600);
            });
        });
    }

    setupWebRTCHandlers() {
        webrtcManager.on('ice-candidate', (candidate) => {
            signalingClient.sendIceCandidate(candidate);
        });

        webrtcManager.on('connected', () => {
            this.updateStatus('Connected!');
            this.hideRemoteOverlay();
        });

        webrtcManager.on('disconnected', () => {
            this.updateStatus('Partner disconnected');
            this.showRemoteOverlay();
        });

        webrtcManager.on('error', (error) => {
            console.error('WebRTC error:', error);
            if (error.type === 'media-access') {
                alert('Unable to access camera/microphone. Please grant permissions and try again.');
            }
        });
    }

    setupSignalingHandlers() {
        signalingClient.on('matched', async (data) => {
            console.log('Matched with partner:', data.partnerId);
            this.partnerName = data.partnerName || 'Stranger';
            this.isMatching = false;
            this.isInChat = true;
            
            this.updateStatus('Connecting...');
            this.updatePartnerInfo(this.partnerName);
            
            // Create and send offer if we're the initiator
            if (data.initiator) {
                try {
                    const offer = await webrtcManager.createOffer();
                    signalingClient.sendOffer(offer);
                } catch (error) {
                    console.error('Error creating offer:', error);
                }
            }
        });

        signalingClient.on('offer', async (data) => {
            console.log('Received offer');
            try {
                const answer = await webrtcManager.handleOffer(data.offer);
                signalingClient.sendAnswer(answer);
            } catch (error) {
                console.error('Error handling offer:', error);
            }
        });

        signalingClient.on('answer', async (data) => {
            console.log('Received answer');
            try {
                await webrtcManager.handleAnswer(data.answer);
            } catch (error) {
                console.error('Error handling answer:', error);
            }
        });

        signalingClient.on('ice-candidate', async (data) => {
            try {
                await webrtcManager.handleIceCandidate(data.candidate);
            } catch (error) {
                console.error('Error handling ICE candidate:', error);
            }
        });

        signalingClient.on('waiting', () => {
            this.updateStatus('Looking for someone...');
        });

        signalingClient.on('partner-disconnected', () => {
            this.handlePartnerDisconnect();
        });

        signalingClient.on('chat-message', (data) => {
            this.displayMessage(data.message, false);
        });

        signalingClient.on('disconnected', () => {
            this.updateStatus('Disconnected from server');
        });

        // Coin System
        signalingClient.on('balance-updated', (data) => {
            this.updateBalanceDisplay(data.balance);
        });
    }

    // Authentication methods
    startAsGuest() {
        this.isGuest = true;
        this.currentUser = {
            username: 'Guest_' + Math.random().toString(36).substr(2, 6),
            isGuest: true
        };
        this.enterChatPage();
    }

    showLoginModal() {
        document.getElementById('login-modal')?.classList.add('active');
    }

    showSignupModal() {
        document.getElementById('signup-modal')?.classList.add('active');
    }

    hideModal(modalId) {
        document.getElementById(modalId)?.classList.remove('active');
    }

    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        // In a real app, this would authenticate with a backend
        // For demo purposes, we'll just create a user object
        this.currentUser = {
            username: email.split('@')[0],
            email: email,
            isGuest: false
        };

        this.hideModal('login-modal');
        this.enterChatPage();
    }

    handleSignup(e) {
        e.preventDefault();
        const username = document.getElementById('signup-username').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const ageConfirm = document.getElementById('age-confirm').checked;

        if (!ageConfirm) {
            alert('You must be 18 years or older to use this service.');
            return;
        }

        // In a real app, this would register with a backend
        this.currentUser = {
            username: username,
            email: email,
            isGuest: false
        };

        this.hideModal('signup-modal');
        this.enterChatPage();
    }

    logout() {
        if (this.isInChat || this.isMatching) {
            this.stopChat();
        }
        
        webrtcManager.stopLocalStream();
        signalingClient.disconnect();
        
        this.currentUser = null;
        this.isGuest = false;
        
        document.getElementById('chat-page')?.classList.remove('active');
        document.getElementById('landing-page')?.classList.add('active');
    }

    // Chat page methods
    async enterChatPage() {
        document.getElementById('landing-page')?.classList.remove('active');
        document.getElementById('chat-page')?.classList.add('active');
        
        // Update username display
        const usernameEl = document.getElementById('current-username');
        if (usernameEl) {
            usernameEl.textContent = this.currentUser.username;
        }

        // Initialize media and connect to signaling server
        try {
            await webrtcManager.initializeLocalStream();
            await signalingClient.connect();
            
            // Request initial balance
            signalingClient.socket.emit('get-balance');
            
            this.updateStatus('Click "Start" to begin');
        } catch (error) {
            console.error('Error initializing:', error);
            this.updateStatus('Error: Could not access camera/microphone');
        }
    }

    async startMatching() {
        if (this.isMatching || this.isInChat) return;

        this.isMatching = true;
        this.updateStatus('Looking for someone...');
        this.showRemoteOverlay();
        
        // Update UI
        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('next-btn').style.display = 'inline-flex';
        document.getElementById('stop-btn').style.display = 'inline-flex';

        // Request match from server
        signalingClient.findMatch({
            username: this.currentUser.username,
            isGuest: this.isGuest
        });
    }

    findNext() {
        if (!this.isMatching && this.isInChat) {
            // Clean up current connection
            webrtcManager.cleanup();
            this.clearChat();
            this.partnerName = null;
            
            // Find new match
            this.isInChat = false;
            this.isMatching = true;
            this.updateStatus('Looking for someone...');
            this.showRemoteOverlay();
            
            signalingClient.findMatch({
                username: this.currentUser.username,
                isGuest: this.isGuest
            });
        }
    }

    stopChat() {
        this.isMatching = false;
        this.isInChat = false;
        
        webrtcManager.cleanup();
        signalingClient.stopMatching();
        
        this.updateStatus('Click "Start" to begin');
        this.showRemoteOverlay();
        this.clearChat();
        this.partnerName = null;
        
        // Update UI
        document.getElementById('start-btn').style.display = 'inline-flex';
        document.getElementById('next-btn').style.display = 'none';
        document.getElementById('stop-btn').style.display = 'none';
    }

    handlePartnerDisconnect() {
        this.isInChat = false;
        webrtcManager.cleanup();
        this.updateStatus('Partner disconnected. Click "Next" to find someone new.');
        this.showRemoteOverlay();
        this.addSystemMessage('Partner has disconnected');
    }

    // UI update methods
    updateStatus(message) {
        const statusEl = document.getElementById('status-text');
        if (statusEl) {
            statusEl.textContent = message;
        }
    }

    updatePartnerInfo(name) {
        const partnerInfoEl = document.getElementById('partner-info');
        const partnerNameEl = document.getElementById('partner-name');
        if (partnerInfoEl && partnerNameEl) {
            partnerNameEl.textContent = name;
            partnerInfoEl.style.display = 'block';
        }
    }

    showRemoteOverlay() {
        const overlay = document.getElementById('remote-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
        const partnerInfo = document.getElementById('partner-info');
        if (partnerInfo) {
            partnerInfo.style.display = 'none';
        }
    }

    hideRemoteOverlay() {
        const overlay = document.getElementById('remote-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // Media controls
    toggleVideo() {
        const enabled = webrtcManager.toggleVideo();
        const btn = document.getElementById('toggle-video-btn');
        if (btn) {
            const iconOn = btn.querySelector('.icon-on');
            const iconOff = btn.querySelector('.icon-off');
            if (enabled) {
                iconOn.style.display = 'block';
                iconOff.style.display = 'none';
            } else {
                iconOn.style.display = 'none';
                iconOff.style.display = 'block';
            }
        }
    }

    toggleAudio() {
        const enabled = webrtcManager.toggleAudio();
        const btn = document.getElementById('toggle-audio-btn');
        if (btn) {
            const iconOn = btn.querySelector('.icon-on');
            const iconOff = btn.querySelector('.icon-off');
            if (enabled) {
                iconOn.style.display = 'block';
                iconOff.style.display = 'none';
            } else {
                iconOn.style.display = 'none';
                iconOff.style.display = 'block';
            }
        }
    }

    // Chat methods
    toggleChatSidebar() {
        const sidebar = document.getElementById('chat-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('active');
        }
    }

    sendMessage() {
        const input = document.getElementById('chat-input');
        if (!input || !input.value.trim()) return;

        const message = input.value.trim();
        
        // Filter profanity (basic implementation)
        const filtered = this.filterProfanity(message);
        
        if (signalingClient.sendChatMessage(filtered)) {
            this.displayMessage(filtered, true);
            input.value = '';
        } else {
            this.addSystemMessage('Not connected to anyone');
        }
    }

    displayMessage(text, isSent) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        // Remove info message if present
        const infoMsg = messagesContainer.querySelector('.chat-info');
        if (infoMsg) {
            infoMsg.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
        
        const senderDiv = document.createElement('div');
        senderDiv.className = 'message-sender';
        senderDiv.textContent = isSent ? 'You' : this.partnerName || 'Stranger';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.textContent = text;
        
        messageDiv.appendChild(senderDiv);
        messageDiv.appendChild(textDiv);
        messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    addSystemMessage(text) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-info';
        messageDiv.textContent = text;
        messagesContainer.appendChild(messageDiv);
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    clearChat() {
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '<div class="chat-info">Start chatting with your partner!</div>';
        }
    }

    filterProfanity(text) {
        // Basic profanity filter - in production, use a comprehensive library
        const badWords = ['badword1', 'badword2']; // Add actual words
        let filtered = text;
        badWords.forEach(word => {
            const regex = new RegExp(word, 'gi');
            filtered = filtered.replace(regex, '*'.repeat(word.length));
        });
        return filtered;
    }

    // Coin System Methods
    updateBalanceDisplay(balance) {
        const balanceEl = document.getElementById('coin-count');
        if (balanceEl) {
            // Animate update
            balanceEl.classList.add('coin-update');
            balanceEl.textContent = balance;
            setTimeout(() => balanceEl.classList.remove('coin-update'), 300);
        }
    }

    handleBuyCoins(amount) {
        // In a real app, this would integrate with a payment gateway
        // For demo, we just simulate a successful purchase
        
        // Show loading state
        const btn = document.querySelector(`.buy-btn[data-amount="${amount}"]`);
        const originalText = btn.textContent;
        btn.textContent = 'Processing...';
        btn.disabled = true;

        setTimeout(() => {
            // Simulate server request
            signalingClient.socket.emit('update-balance', { amount: amount });
            
            btn.textContent = 'Success!';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
                this.hideModal('wallet-modal');
                alert(`Successfully added ${amount} coins to your wallet!`);
            }, 1000);
        }, 1500);
    }
}

// Initialize app when script loads
const app = new VideoChat();
