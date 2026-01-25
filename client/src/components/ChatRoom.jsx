import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Mic, MicOff, Video, VideoOff, Send, X, LogOut, SkipForward, PlaySquare, StopCircle, MessageSquare, Monitor, Circle, Heart, Clock, Shield } from 'lucide-react';

const ChatRoom = ({ user, matchPreferences, onLogout, coins, setCoins, onOpenWallet, onOpenProfile }) => {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const localStreamRef = useRef(null);
  const [remoteStream, setRemoteStream] = useState(null);
  
  const [isMatching, setIsMatching] = useState(false);
  const [isInChat, setIsInChat] = useState(false);
  const [status, setStatus] = useState('Click "Start" to begin');
  const [partner, setPartner] = useState(null); 
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('chat'); 

  const [messages, setMessages] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showLowBalanceWarning, setShowLowBalanceWarning] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const messagesEndRef = useRef(null);
  const pcRef = useRef(null);
  const coinIntervalRef = useRef(null);

  // Coin consumption logic
  useEffect(() => {
    if (isInChat && coins > 0) {
      coinIntervalRef.current = setInterval(() => {
        setCoins(prev => {
          const next = prev - 1;
          if (next <= 0) {
            clearInterval(coinIntervalRef.current);
            stopChat();
            alert("Your coins have run out! Please get more coins to continue chatting.");
            onOpenWallet();
            return 0;
          }
          if (next <= 10) {
            setShowLowBalanceWarning(true);
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(coinIntervalRef.current);
      setShowLowBalanceWarning(false);
    }

    return () => clearInterval(coinIntervalRef.current);
  }, [isInChat]);

  // Initialize Socket once
  useEffect(() => {
    const socketUrl = window.location.hostname === 'localhost' ? '/' : window.location.origin;
    const newSocket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5
    });
    
    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('matched', async (data) => {
      console.log('Matched event received');
      setIsMatching(false);
      setIsInChat(true);
      
      const partnerProfile = {
        name: data.partnerName || 'Stranger',
        avatar: data.partnerAvatar || '😊',
        bio: data.partnerBio || '',
        weMetId: data.partnerWeMetId
      };
      setPartner(partnerProfile);
      setStatus('Connected!');

      // Sync favorites
      const favorites = JSON.parse(localStorage.getItem('wemet_favorites') || '[]');
      setIsFavorite(favorites.some(f => f.weMetId === data.partnerWeMetId));

      // Sync history
      const history = JSON.parse(localStorage.getItem('wemet_history') || '[]');
      const updatedHistory = [
        { ...partnerProfile, timestamp: new Date().toISOString() },
        ...history.filter(h => h.weMetId !== data.partnerWeMetId)
      ].slice(0, 10);
      localStorage.setItem('wemet_history', JSON.stringify(updatedHistory));

      if (data.initiator) {
        createOffer();
      }
    });

    newSocket.on('offer', (data) => handleOffer(data.offer));
    newSocket.on('answer', (data) => handleAnswer(data.answer));
    newSocket.on('ice-candidate', (data) => handleIceCandidate(data.candidate));
    newSocket.on('partner-disconnected', () => handlePartnerDisconnect());
    newSocket.on('chat-message', (data) => {
      setMessages(prev => [...prev, { sender: 'Stranger', text: data.message, isSent: false }]);
    });

    return () => {
      console.log('Cleaning up ChatRoom component');
      if (newSocket) newSocket.disconnect();
      if (pcRef.current) pcRef.current.close();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Initialize Local Stream once
  useEffect(() => {
    const startLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
          audio: true 
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Media error:', err);
        setStatus(`Camera error: ${err.message}`);
      }
    };
    startLocalStream();
  }, []);

  // WebRTC Functions
  const createPeerConnection = () => {
    if (pcRef.current) pcRef.current.close();

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', { candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    pcRef.current = pc;
    return pc;
  };

  const createOffer = async () => {
    const pc = createPeerConnection();
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit('offer', { offer });
    } catch (err) {
      console.error('Offer error:', err);
    }
  };

  const handleOffer = async (offer) => {
    const pc = createPeerConnection();
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current.emit('answer', { answer });
    } catch (err) {
      console.error('Handle offer error:', err);
    }
  };

  const handleAnswer = async (answer) => {
    if (pcRef.current) {
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('Handle answer error:', err);
      }
    }
  };

  const handleIceCandidate = async (candidate) => {
    if (pcRef.current) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Add ICE candidate error:', err);
      }
    }
  };

  const handlePartnerDisconnect = () => {
    setIsInChat(false);
    setPartner(null);
    setRemoteStream(null);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setStatus('Partner left. Click "Next" to find someone new.');
    setMessages(prev => [...prev, { sender: 'System', text: 'Partner disconnected', isSystem: true }]);
  };

  const toggleFavorite = () => {
    if (!partner || !partner.weMetId) return;
    const favorites = JSON.parse(localStorage.getItem('wemet_favorites') || '[]');
    let updated;
    if (isFavorite) {
      updated = favorites.filter(f => f.weMetId !== partner.weMetId);
    } else {
      updated = [partner, ...favorites];
    }
    localStorage.setItem('wemet_favorites', JSON.stringify(updated));
    setIsFavorite(!isFavorite);
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

      if (pcRef.current) {
        const sender = pcRef.current.getSenders().find(s => s.track.kind === 'video');
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
    if (localStream && pcRef.current) {
      const videoTrack = localStream.getVideoTracks()[0];
      const sender = pcRef.current.getSenders().find(s => s.track.kind === 'video');
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

  const handleReport = () => {
    if (!partner) return;
    socket.emit('report-user', { targetId: partner.weMetId, reason: 'unspecified' });
    alert('User reported. Our moderation team will review the session.');
    findNext();
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
    setPartner(null);
    setRemoteStream(null);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
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
            width: '24px', height: '24px', 
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: '50%' 
          }}></div>
          <span style={{ fontSize: '1.2rem' }}>WeMet</span>
        </div>
        <div className="user-info">
          <div className="coin-balance" onClick={onOpenWallet} style={{
            cursor: 'pointer',
            border: showLowBalanceWarning ? '2px solid #ff4b2b' : '1px solid var(--border-color)',
            animation: showLowBalanceWarning ? 'pulse-red 1s infinite' : 'none'
          }}>
            <span style={{color: '#FFD700'}}>●</span>
            <span id="coin-count" style={{ color: showLowBalanceWarning ? '#ff4b2b' : 'inherit' }}>{coins}</span>
            <button className="add-coins-btn">+</button>
          </div>
          
          <div className="user-profile-trigger" onClick={onOpenProfile}>
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
              {partner && (
                <div className="partner-info">
                  <span style={{ fontSize: '1.5rem' }}>{partner.avatar}</span>
                  <div>
                    <div style={{ fontWeight: '700' }}>{partner.name}</div>
                    {partner.bio && <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{partner.bio}</div>}
                  </div>
                  <button 
                    onClick={toggleFavorite} 
                    className="fav-btn"
                  >
                    <Heart size={20} fill={isFavorite ? '#ff4b2b' : 'none'} color={isFavorite ? '#ff4b2b' : 'white'} />
                  </button>
                </div>
              )}
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
                <button className="control-btn" onClick={handleReport} title="Report User">
                  <Shield size={20} />
                </button>
              </>
            )}
            
            {!isInChat && !isMatching && (
              <button className="control-btn primary" onClick={startMatching}>
                <PlaySquare size={20} /> <span>Start</span>
              </button>
            )}
            
            {(isInChat || isMatching) && (
              <>
                <button className="control-btn accent" onClick={findNext}>
                  <SkipForward size={20} /> <span>Next</span>
                </button>
                <button className="control-btn danger" onClick={stopChat}>
                  <StopCircle size={20} /> <span>Stop</span>
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
            <div style={{ display: 'flex', gap: '15px' }}>
              <h3 
                onClick={() => setSidebarTab('chat')} 
                style={{ cursor: 'pointer', opacity: sidebarTab === 'chat' ? 1 : 0.5, borderBottom: sidebarTab === 'chat' ? '2px solid #667eea' : 'none', paddingBottom: '4px' }}
              >
                Chat
              </h3>
              <h3 
                onClick={() => setSidebarTab('history')} 
                style={{ cursor: 'pointer', opacity: sidebarTab === 'history' ? 1 : 0.5, borderBottom: sidebarTab === 'history' ? '2px solid #667eea' : 'none', paddingBottom: '4px' }}
              >
                History
              </h3>
            </div>
            <button className="icon-btn" onClick={() => setIsChatOpen(false)}>
              <X size={20} />
            </button>
          </div>
          
          {sidebarTab === 'chat' ? (
            <>
              <div className="chat-messages">
                {messages.length === 0 && (
                  <div className="chat-info">Stranger is waiting for a message...</div>
                )}
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
            </>
          ) : (
            <div className="chat-messages" style={{ gap: '15px' }}>
              <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#ff4b2b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Heart size={14} fill="#ff4b2b" /> Favorites
              </div>
              {JSON.parse(localStorage.getItem('wemet_favorites') || '[]').map((fav, i) => (
                <div key={i} className="message received" style={{ maxWidth: '100%', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.2rem' }}>{fav.avatar}</span>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{fav.name}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{fav.bio}</div>
                  </div>
                </div>
              ))}
              
              <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#667eea', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '10px' }}>
                <Clock size={14} /> Recent Matches
              </div>
              {JSON.parse(localStorage.getItem('wemet_history') || '[]').map((match, i) => (
                <div key={i} className="message received" style={{ maxWidth: '100%', display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '1.2rem' }}>{match.avatar}</span>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{match.name}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{new Date(match.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              ))}
              {JSON.parse(localStorage.getItem('wemet_history') || '[]').length === 0 && (
                <div className="chat-info">No recent matches yet</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
