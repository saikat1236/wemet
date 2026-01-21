import React from 'react';
import { Users, Shield, Zap, Globe } from 'lucide-react';

const GenderSelect = ({ label, value, onChange }) => {
  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="gender-options" style={{ display: 'flex', gap: '10px' }}>
        {['Any', 'Male', 'Female'].map((option) => (
          <button
            key={option}
            className={`nav-btn ${value === option ? 'primary' : ''}`}
            onClick={() => onChange(option)}
            style={{ flex: 1, padding: '0.5rem' }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

const LandingPage = ({ onStart, onGuestStart }) => {
  const [myGender, setMyGender] = React.useState('Any');
  const [lookingFor, setLookingFor] = React.useState('Any');

  const handleStart = () => {
    onStart({ myGender, lookingFor });
  };

  const handleGuestStart = () => {
    onGuestStart({ myGender, lookingFor });
  };

  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="logo">
          <div className="logo-icon" style={{ 
            width: '32px', height: '32px', 
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: '50%' 
          }}></div>
          <span>WeMet</span>
        </div>
        <nav className="landing-nav">
          <button className="nav-btn">Login</button>
          <button className="nav-btn primary">Sign Up</button>
        </nav>
      </header>

      <main className="landing-main">
        <div className="hero-content floating">
          <h1 className="hero-title">
            Connect with <span className="gradient-text">Strangers</span><br />
            Around the World
          </h1>
          <p className="hero-subtitle">
            Experience the next generation of random video chat.<br />
            Fast, secure, and beautifully designed.
          </p>

          <div className="gender-filters" style={{ 
            maxWidth: '400px', margin: '0 auto 2rem', 
            background: 'rgba(30, 36, 66, 0.7)', padding: '1.5rem', 
            borderRadius: '16px', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <GenderSelect 
              label="I am a:" 
              value={myGender} 
              onChange={setMyGender} 
            />
            <div style={{ height: '1rem' }}></div>
            <GenderSelect 
              label="Looking for:" 
              value={lookingFor} 
              onChange={setLookingFor} 
            />
          </div>

          <div className="cta-buttons">
            <button className="cta-btn primary pulse-glow" onClick={handleGuestStart}>
              Start as Guest
            </button>
            <button className="cta-btn secondary" onClick={handleStart}>
              Login to Start
            </button>
          </div>
        </div>

        <div className="features-grid">
          <div className="feature-card stagger-item shimmer" style={{ backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="feature-icon">
              <Users size={32} />
            </div>
            <h3>Make New Friends</h3>
            <p>Instantly meet and chat with people from diverse backgrounds.</p>
          </div>
          <div className="feature-card stagger-item shimmer" style={{ backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="feature-icon">
              <Shield size={32} />
            </div>
            <h3>Secured Environment</h3>
            <p>Your privacy is our priority. Advanced encryption for safety.</p>
          </div>
          <div className="feature-card stagger-item shimmer" style={{ backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="feature-icon">
              <Zap size={32} />
            </div>
            <h3>Fast Connections</h3>
            <p>Low-latency video calls powered by our global network.</p>
          </div>
          <div className="feature-card stagger-item shimmer" style={{ backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="feature-icon">
              <Globe size={32} />
            </div>
            <h3>Global Reach</h3>
            <p>Break geographical boundaries. Connect across continents.</p>
          </div>
        </div>

        {/* Demo Section */}
        <div className="demo-section" style={{ marginTop: '5rem' }}>
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem' }}>
            How <span className="gradient-text">WeMet</span> Works
          </h2>
          <div className="demo-grid" style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '2rem', padding: '0 1rem' 
          }}>
            <div className="feature-card stagger-item">
              <div className="demo-video-container" style={{ 
                width: '100%', height: '200px', backgroundColor: 'rgba(0,0,0,0.3)', 
                borderRadius: '12px', marginBottom: '1.5rem', overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)'
               }}>
                <video autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
                  <source src="https://static.videezy.com/system/resources/previews/000/019/331/original/laptop_work.mp4" type="video/mp4" />
                </video>
              </div>
              <h3>1. Start Chatting</h3>
              <p>Just click "Start as Guest" to begin your journey instantly.</p>
            </div>
            
            <div className="feature-card stagger-item">
              <div className="demo-video-container" style={{ 
                width: '100%', height: '200px', backgroundColor: 'rgba(0,0,0,0.3)', 
                borderRadius: '12px', marginBottom: '1.5rem', overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)'
               }}>
                <video autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
                  <source src="https://static.videezy.com/system/resources/previews/000/041/476/original/Friends-on-video-call-laptop.mp4" type="video/mp4" />
                </video>
              </div>
              <h3>2. Get Matched</h3>
              <p>Our intelligent system pairs you with someone globally in seconds.</p>
            </div>
            
            <div className="feature-card stagger-item">
              <div className="demo-video-container" style={{ 
                width: '100%', height: '200px', backgroundColor: 'rgba(0,0,0,0.3)', 
                borderRadius: '12px', marginBottom: '1.5rem', overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)'
               }}>
                <video autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
                  <source src="https://static.videezy.com/system/resources/previews/000/019/335/original/active_conversation.mp4" type="video/mp4" />
                </video>
              </div>
              <h3>3. Connect & Enjoy</h3>
              <p>Engage in real-time video and text chat with premium features.</p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Video Background */}
      <div className="video-background">
        <video autoPlay muted loop playsInline>
            <source src="https://cdn.coverr.co/videos/coverr-abstract-purple-particles-5367/1080p.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
};

export default LandingPage;
