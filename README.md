# WeMet - Connect with Strangers using Video Chat

A modern, feature-rich video chat application that connects strangers worldwide through WebRTC technology.

## ✨ Features

- 🎥 **Real-time Video Chat** - High-quality peer-to-peer video connections
- 💬 **Text Chat** - Integrated text messaging during video calls
- 🌍 **Global Matching** - Connect with people from around the world
- 🎨 **Modern UI** - Beautiful animations and smooth transitions
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🔒 **Secure** - WebRTC peer-to-peer encryption
- 👤 **Guest Mode** - Start chatting instantly without registration

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd wemet
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## 🎬 UI Enhancements

This application features advanced UI animations and effects:

### Animations
- **Floating Animation** - Hero content gently floats up and down
- **Pulse Glow** - CTA buttons pulse with a glowing effect
- **Stagger Animation** - Feature cards animate in sequence
- **Ripple Effect** - Click feedback on all buttons
- **Shimmer Effect** - Subtle shine effects on cards
- **Gradient Shift** - Animated gradient backgrounds

### Video Elements
- **Background Video** - Abstract particle animation on landing page
- **Demo Videos** - "How It Works" section with video demonstrations
- **Smooth Transitions** - Page and modal transitions with scale effects

## 🌐 Deployment

### Deploy to Render

1. Create a new account on [Render](https://render.com)

2. Click "New +" and select "Web Service"

3. Connect your GitHub repository

4. Render will automatically detect the `render.yaml` configuration

5. Click "Create Web Service"

6. Your app will be deployed at `https://your-app-name.onrender.com`

### Deploy to Railway

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Initialize and deploy:
```bash
railway init
railway up
```

### Deploy to Vercel (Static Frontend Only)

Note: Vercel doesn't support WebSocket servers on the free tier, so you'll need to deploy the backend separately.

```bash
npm install -g vercel
vercel
```

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Lucide React
- **Backend**: Node.js, Express
- **Real-time Communication**: Socket.IO
- **Video/Audio**: WebRTC
- **Styling**: Custom CSS with Glassmorphism

## 📁 Project Structure

```
wemet/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # React Components
│   │   ├── App.jsx         # Main App Component
│   │   └── main.jsx        # Entry Point
│   └── index.html          # HTML Template
├── server.js              # Express + Socket.IO server
├── package.json           # Root Dependencies
└── render.yaml            # Render deployment config
```

## 🎯 How It Works

1. **User connects** to the application
2. **Grants permissions** for camera and microphone
3. **Clicks "Start"** to begin matching
4. **Server matches** two users together
5. **WebRTC connection** is established via signaling server
6. **Peer-to-peer** video/audio streams are exchanged
7. **Users can chat** via text messages
8. **Click "Next"** to find a new partner

## 🔧 Configuration

### Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

### CORS Configuration

The server is configured to accept connections from any origin. For production, update the CORS settings in `server.js`:

```javascript
const io = socketIO(server, {
    cors: {
        origin: "https://your-domain.com",
        methods: ["GET", "POST"]
    }
});
```

## 🎨 Customization

### Colors

Edit the CSS variables in `styles.css`:

```css
:root {
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --bg-primary: #0a0e27;
    --text-primary: #ffffff;
}
```

### Animations

Adjust animation timing in `styles.css`:

```css
.floating {
    animation: floating 3s ease-in-out infinite;
}
```

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

**Enjoy connecting with people worldwide! 🌍✨**
