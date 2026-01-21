// WebRTC Manager - Handles peer-to-peer video/audio connections
class WebRTCManager {
    constructor() {
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        };
        this.isVideoEnabled = true;
        this.isAudioEnabled = true;
        this.eventHandlers = {};
    }

    // Initialize local media stream
    async initializeLocalStream() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            // Display local video
            const localVideo = document.getElementById('local-video');
            if (localVideo) {
                localVideo.srcObject = this.localStream;
            }

            this.emit('local-stream-ready', this.localStream);
            return this.localStream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            this.emit('error', { type: 'media-access', error });
            throw error;
        }
    }

    // Create peer connection
    createPeerConnection() {
        try {
            this.peerConnection = new RTCPeerConnection(this.configuration);

            // Add local stream tracks to peer connection
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    this.peerConnection.addTrack(track, this.localStream);
                });
            }

            // Handle incoming tracks
            this.peerConnection.ontrack = (event) => {
                console.log('Received remote track');
                this.remoteStream = event.streams[0];
                const remoteVideo = document.getElementById('remote-video');
                if (remoteVideo) {
                    remoteVideo.srcObject = this.remoteStream;
                }
                this.emit('remote-stream-ready', this.remoteStream);
            };

            // Handle ICE candidates
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.emit('ice-candidate', event.candidate);
                }
            };

            // Handle connection state changes
            this.peerConnection.onconnectionstatechange = () => {
                console.log('Connection state:', this.peerConnection.connectionState);
                this.emit('connection-state-change', this.peerConnection.connectionState);

                if (this.peerConnection.connectionState === 'connected') {
                    this.emit('connected');
                } else if (this.peerConnection.connectionState === 'disconnected' || 
                           this.peerConnection.connectionState === 'failed') {
                    this.emit('disconnected');
                }
            };

            // Handle ICE connection state changes
            this.peerConnection.oniceconnectionstatechange = () => {
                console.log('ICE connection state:', this.peerConnection.iceConnectionState);
            };

            return this.peerConnection;
        } catch (error) {
            console.error('Error creating peer connection:', error);
            this.emit('error', { type: 'peer-connection', error });
            throw error;
        }
    }

    // Create and send offer
    async createOffer() {
        try {
            if (!this.peerConnection) {
                this.createPeerConnection();
            }

            const offer = await this.peerConnection.createOffer({
                offerToReceiveVideo: true,
                offerToReceiveAudio: true
            });

            await this.peerConnection.setLocalDescription(offer);
            return offer;
        } catch (error) {
            console.error('Error creating offer:', error);
            this.emit('error', { type: 'create-offer', error });
            throw error;
        }
    }

    // Handle incoming offer and create answer
    async handleOffer(offer) {
        try {
            if (!this.peerConnection) {
                this.createPeerConnection();
            }

            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            return answer;
        } catch (error) {
            console.error('Error handling offer:', error);
            this.emit('error', { type: 'handle-offer', error });
            throw error;
        }
    }

    // Handle incoming answer
    async handleAnswer(answer) {
        try {
            if (this.peerConnection) {
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            }
        } catch (error) {
            console.error('Error handling answer:', error);
            this.emit('error', { type: 'handle-answer', error });
            throw error;
        }
    }

    // Handle incoming ICE candidate
    async handleIceCandidate(candidate) {
        try {
            if (this.peerConnection) {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (error) {
            console.error('Error handling ICE candidate:', error);
        }
    }

    // Toggle video on/off
    toggleVideo() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                this.isVideoEnabled = videoTrack.enabled;
                this.emit('video-toggled', this.isVideoEnabled);
                return this.isVideoEnabled;
            }
        }
        return false;
    }

    // Toggle audio on/off
    toggleAudio() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                this.isAudioEnabled = audioTrack.enabled;
                this.emit('audio-toggled', this.isAudioEnabled);
                return this.isAudioEnabled;
            }
        }
        return false;
    }

    // Close peer connection
    closePeerConnection() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        // Clear remote video
        const remoteVideo = document.getElementById('remote-video');
        if (remoteVideo) {
            remoteVideo.srcObject = null;
        }
        this.remoteStream = null;
    }

    // Stop local stream
    stopLocalStream() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        // Clear local video
        const localVideo = document.getElementById('local-video');
        if (localVideo) {
            localVideo.srcObject = null;
        }
    }

    // Clean up all resources
    cleanup() {
        this.closePeerConnection();
        // Don't stop local stream on cleanup, keep camera running
    }

    // Register event handlers
    on(event, handler) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
    }

    // Emit events to registered handlers
    emit(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(handler => handler(data));
        }
    }
}

// Create global instance
const webrtcManager = new WebRTCManager();
