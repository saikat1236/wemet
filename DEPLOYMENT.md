# 🚀 Deployment Guide - VideoChat App

## Quick Deployment Options

### Option 1: Deploy to Render (Recommended - Free Tier)

Render is perfect for this application as it supports Node.js, WebSockets, and has a generous free tier.

#### Steps:

1. **Create a GitHub Repository**
   ```bash
   # Create a new repository on GitHub, then:
   git remote add origin https://github.com/YOUR_USERNAME/video-chat-app.git
   git branch -M main
   git push -u origin main
   ```

2. **Deploy on Render**
   - Go to [render.com](https://render.com) and sign up/login
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select your `video-chat-app` repository
   - Render will auto-detect the `render.yaml` configuration
   - Click "Create Web Service"
   - Wait 3-5 minutes for deployment

3. **Access Your App**
   - Your app will be available at: `https://your-app-name.onrender.com`
   - Free tier apps may spin down after inactivity (takes ~30s to wake up)

#### Render Configuration (Already Set Up)

The `render.yaml` file includes:
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/health` endpoint
- Environment: Node.js with production settings

---

### Option 2: Deploy to Railway

Railway offers excellent WebSocket support and easy deployment.

#### Steps:

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy**
   ```bash
   railway login
   railway init
   railway up
   ```

3. **Get Your URL**
   ```bash
   railway domain
   ```

---

### Option 3: Deploy to Heroku

Heroku is a classic choice with good documentation.

#### Steps:

1. **Install Heroku CLI**
   ```bash
   brew tap heroku/brew && brew install heroku
   ```

2. **Login and Create App**
   ```bash
   heroku login
   heroku create your-app-name
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

4. **Open Your App**
   ```bash
   heroku open
   ```

---

### Option 4: Deploy to DigitalOcean App Platform

DigitalOcean offers $200 in credits for new users.

#### Steps:

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Connect your GitHub repository
4. Select the repository and branch
5. DigitalOcean will auto-detect Node.js
6. Click "Next" through the configuration
7. Launch the app

---

## Environment Variables

For production deployment, you may want to set:

```bash
NODE_ENV=production
PORT=3000  # Usually auto-set by hosting platform
```

## Post-Deployment Checklist

- [ ] Test video/audio permissions on deployed site
- [ ] Verify WebSocket connections work
- [ ] Test matching system with multiple users
- [ ] Check text chat functionality
- [ ] Verify responsive design on mobile
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Check HTTPS is enabled (required for WebRTC)

## Troubleshooting

### WebRTC Not Working

**Issue**: Camera/microphone permissions denied
**Solution**: Ensure your site is served over HTTPS (all hosting platforms provide this)

**Issue**: Can't connect to peer
**Solution**: Check that Socket.IO is properly connected. Open browser console and look for connection messages.

### Videos Not Loading

**Issue**: Background or demo videos not playing
**Solution**: Some CDN videos may have CORS restrictions. You can:
1. Host videos locally in a `/public/videos` folder
2. Use different video CDN sources
3. Generate custom videos using the `generate_image` tool

### Server Errors

**Issue**: Port already in use
**Solution**: The hosting platform manages ports automatically. This shouldn't happen in production.

**Issue**: Socket.IO connection failed
**Solution**: Ensure CORS is properly configured in `server.js`

## Performance Optimization

For production, consider:

1. **Enable Compression**
   ```bash
   npm install compression
   ```
   Add to `server.js`:
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

2. **Add Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```

3. **Use CDN for Static Assets**
   - Host videos on a CDN
   - Use image optimization

## Monitoring

Most platforms provide built-in monitoring:

- **Render**: Check the "Logs" tab for real-time logs
- **Railway**: Use `railway logs` command
- **Heroku**: Use `heroku logs --tail`

## Scaling

For high traffic:

1. **Upgrade to paid tier** for better performance
2. **Use TURN servers** for better WebRTC connectivity
3. **Implement connection pooling**
4. **Add Redis** for session management
5. **Use load balancing** for multiple instances

---

## 🎉 You're Done!

Your video chat app is now live and accessible worldwide!

**Next Steps:**
- Share the URL with friends to test
- Monitor usage and performance
- Collect feedback and iterate
- Consider adding features like:
  - User profiles
  - Friend lists
  - Chat history
  - Video recording
  - Screen sharing

**Need Help?**
- Check the logs on your hosting platform
- Review the README.md for configuration options
- Open an issue on GitHub
