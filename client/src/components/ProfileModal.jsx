import React, { useState, useEffect } from 'react';
import { X, Save, User } from 'lucide-react';

const ProfileModal = ({ isOpen, onClose, user, onUpdateProfile }) => {
  if (!isOpen) return null;

  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '😊');

  const avatars = ['😊', '😎', '🤓', '🤖', '👽', '👻', '🐱', '🐶', '🦊', '🦁', '🐯', '🦄'];

  const handleSave = () => {
    onUpdateProfile({ username, bio, avatar });
    onClose();
  };

  return (
    <div className="modal active">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button className="close-modal" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="auth-form">
          <div className="form-group" style={{ alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ 
              width: '80px', height: '80px', 
              background: 'linear-gradient(135deg, #667eea, #764ba2)', 
              borderRadius: '50%', display: 'flex', 
              alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', marginBottom: '1rem',
              boxShadow: '0 0 20px rgba(102, 126, 234, 0.5)'
            }}>
              {avatar}
            </div>
            
            <div className="avatar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
              {avatars.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setAvatar(emoji)}
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: avatar === emoji ? '2px solid #667eea' : '1px solid transparent',
                    borderRadius: '8px', cursor: 'pointer',
                    fontSize: '1.2rem', padding: '4px'
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Display Name"
            />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <input 
              type="text" 
              value={bio} 
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short bio..."
              maxLength={50}
            />
          </div>

          <button className="submit-btn" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Save size={20} /> Save Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
