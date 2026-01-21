import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Mic, MicOff, Video, VideoOff, Send, X, LogOut, SkipForward, PlaySquare, StopCircle, MessageSquare, Monitor, Circle } from 'lucide-react';

const ChatRoom = ({ user, matchPreferences, onLogout, coins, setCoins, onOpenWallet, onOpenProfile }) => {
  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  
  const [isMatching, setIsMatching] = useState(false);
  const [isInChat, setIsInChat] = useState(false);
  const [status, setStatus] = useState('Click "Start" to begin');
  const [partnerName, setPartnerName] = useState(null);
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Initialize Socket and WebRTC
  useEffect(() => {
    const newSocket = io('/', {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Socket Event Listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('matched', async (data) => {
      console.log('Matched:', data);
      setIsMatching(false);
      setIsInChat(true);
      setPartnerName(data.partnerName || 'Stranger');
      setStatus('Connected!');

      // Save to history
      const newMatch = {
        name: data.partnerName || 'Stranger',
        timestamp: new Date().toISOString(),
        id: data.partnerId
      };
      
      const history = JSON.parse(localStorage.getItem('wemet_history') || '[]');
      // Keep last 10 matches
      const updatedHistory = [newMatch, ...history].slice(0, 10);
      localStorage.setItem('wemet_history', JSON.stringify(updatedHistory));
      
      if (data.initiator) {
        createOffer(data.partnerId);
      }
    });

    socket.on('offer', async (data) => {
      handleOffer(data.offer, data.from);
    });

    socket.on('answer', async (data) => {
      handleAnswer(data.answer);
    });

    socket.on('ice-candidate', async (data) => {
      handleIceCandidate(data.candidate);
    });

    socket.on('partner-disconnected', () => {
      handlePartnerDisconnect();
    });

    socket.on('chat-message', (data) => {
      setMessages(prev => [...prev, { sender: 'Stranger', text: data.message, isSent: false }]);
    });

    return () => {
      socket.off('matched');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('partner-disconnected');
      socket.off('chat-message');
    };
  }, [socket, peerConnection]); // Re-run if socket or PC changes

  // Initialize Local Stream
  useEffect(() => {
    const startLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing media:', err);
        setStatus('Error: Could not access camera/microphone');
      }
    };

    startLocalStream();
  }, []);

  // WebRTC Functions
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', { candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    setPeerConnection(pc);
    return pc;
  };

  const createOffer = async (partnerId) => {
    const pc = createPeerConnection();
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', { offer });
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  };

  const handleOffer = async (offer, partnerId) => {
    const pc = createPeerConnection();
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { answer });
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  };

  const handleAnswer = async (answer) => {
    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    }
  };

  const handleIceCandidate = async (candidate) => {
    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error handling ICE candidate:', err);
      }
    }
  };

  const handlePartnerDisconnect = () => {
    setIsInChat(false);
    setPartnerName(null);
    setRemoteStream(null);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    setStatus('Partner disconnected. Click "Next" to find someone new.');
    setMessages(prev => [...prev, { sender: 'System', text: 'Partner has disconnected', isSystem: true }]);
  };

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Screen Sharing Logic
  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];

      if (peerConnection) {
        const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      screenTrack.onended = () => {
        stopScreenShare();
      };

      setIsScreenSharing(true);
    } catch (err) {
      console.error('Error sharing screen:', err);
    }
  };

  const stopScreenShare = async () => {
    if (localStream && peerConnection) {
      const videoTrack = localStream.getVideoTracks()[0];
      const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
      if (sender) {
        sender.replaceTrack(videoTrack);
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
    }
    setIsScreenSharing(false);
  };

  // Recording Logic
  const startRecording = () => {
    if (!remoteStream) return;
    
    const mediaRecorder = new MediaRecorder(remoteStream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wemet-recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Actions
  const startMatching = () => {
    if (isMatching || isInChat) return;
    setIsMatching(true);
    setStatus('Looking for someone...');
    socket.emit('find-match', { 
      username: user.username, 
      isGuest: user.isGuest,
      ...matchPreferences // Send gender preferences
    });
  };

  const stopChat = () => {
    setIsMatching(false);
    setIsInChat(false);
    setPartnerName(null);
    setRemoteStream(null);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    socket.emit('stop-matching');
    setStatus('Click "Start" to begin');
    setMessages([]);
  };

  const findNext = () => {
    stopChat();
    setTimeout(startMatching, 500);
  };

  const sendMessage = () => {
    if (!inputText.trim() || !isInChat) return;
    socket.emit('chat-message', { message: inputText });
    setMessages(prev => [...prev, { sender: 'You', text: inputText, isSent: true }]);
    setInputText('');
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-container">
      <header className="chat-header">
        <div className="logo">
          <div className="logo-icon" style={{ 
            width: '32px', height: '32px', 
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: '50%' 
          }}></div>
          <span>WeMet</span>
        </div>
        <div className="user-info">
          <div className="coin-balance" onClick={onOpenWallet} style={{cursor: 'pointer'}}>
            <span style={{color: '#FFD700'}}>●</span>
            <span id="coin-count">{coins}</span>
            <button className="add-coins-btn">+</button>
          </div>
          
          <div className="user-profile-trigger" onClick={onOpenProfile} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px', transition: 'background 0.2s' }}>
            <span style={{ fontSize: '1.2rem' }}>{user?.avatar || '😊'}</span>
            <span className="username">{user?.username}</span>
          </div>

          <button className="icon-btn" onClick={onLogout} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="chat-main">
        <div className="video-section">
          <div className="video-grid">
            <div className="video-container remote-video-container">
              <video ref={remoteVideoRef} autoPlay playsInline />
              {!isInChat && (
                <div className="video-overlay">
                  <div className="status-message">
                    {isMatching && <div className="spinner"></div>}
                    <p id="status-text">{status}</p>
                  </div>
                </div>
              )}
              {partnerName && <div className="partner-info">{partnerName}</div>}
            </div>
            
            <div className="video-container local-video-container">
              <video ref={localVideoRef} autoPlay playsInline muted />
              <div className="video-label">You</div>
            </div>
          </div>

          <div className="controls">
            <button className="control-btn" onClick={toggleVideo}>
              {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            <button className="control-btn" onClick={toggleAudio}>
              {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            </button>

            {isInChat && (
              <>
                <button 
                  className={`control-btn ${isScreenSharing ? 'active' : ''}`} 
                  onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                  title="Share Screen"
                >
                  <Monitor size={20} color={isScreenSharing ? '#667eea' : 'currentColor'} />
                </button>
                <button 
                  className={`control-btn ${isRecording ? 'danger' : ''}`} 
                  onClick={isRecording ? stopRecording : startRecording}
                  title="Record Chat"
                >
                  <Circle size={20} fill={isRecording ? 'currentColor' : 'none'} />
                </button>
              </>
            )}
            
            {!isInChat && !isMatching && (
              <button className="control-btn primary" onClick={startMatching}>
                <PlaySquare size={20} /> Start
              </button>
            )}
            
            {(isInChat || isMatching) && (
              <>
                <button className="control-btn accent" onClick={findNext}>
                  <SkipForward size={20} /> Next
                </button>
                <button className="control-btn danger" onClick={stopChat}>
                  <StopCircle size={20} /> Stop
                </button>
              </>
            )}
            
            <button className="control-btn" onClick={() => setIsChatOpen(!isChatOpen)}>
              <MessageSquare size={20} />
            </button>
          </div>
        </div>

        <div className={`chat-sidebar ${isChatOpen ? 'active' : ''}`}>
          <div className="chat-header-bar">
            <h3>Chat</h3>
            <button className="icon-btn" onClick={() => setIsChatOpen(false)}>
              <X size={20} />
            </button>
          </div>
          
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.isSent ? 'sent' : 'received'} ${msg.isSystem ? 'system' : ''}`}>
                {!msg.isSystem && <div className="message-sender">{msg.sender}</div>}
                <div className="message-text">{msg.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chat-input-container">
            <input 
              type="text" 
              placeholder="Type a message..." 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              disabled={!isInChat}
            />
            <button className="send-btn" onClick={sendMessage} disabled={!isInChat}>
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
