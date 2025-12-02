# 🎵 Personal Soundtrack Generator

A beautiful, AI-powered web application that generates personalized Spotify playlists based on your mood, weather, location, and time of day. Built with AngularJS and Tailwind CSS v4, featuring cutting-edge animations and a modern, accessible UI.

## ✨ Features

- **Mood-Based Playlist Generation**: Capture your emotions with 6 different mood options (Happy, Chill, Focus, Energetic, Nostalgic, Neutral)
- **Context-Aware**: Automatically detects weather and location to enhance playlist generation
- **Spotify Integration**: Seamless OAuth connection to sync playlists directly to your Spotify account
- **Timeline Visualization**: Interactive timeline showing your emotional journey
- **Dark Mode**: Beautiful dark/light theme with smooth transitions
- **Responsive Design**: Fully responsive, mobile-first design
- **Advanced Animations**: Scroll-driven animations, micro-interactions, and smooth transitions
- **Accessibility**: WCAG 2.2 AA compliant with keyboard navigation and screen reader support

## 🚀 Quick Start

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Optional: Node.js and npm (for local development server)

### Installation

1. **Clone or download this repository**

2. **Open the project**

   ```bash
   cd Spotify
   ```

3. **Option A: Use a local development server**

   ```bash
   # Install dependencies (optional)
   npm install
   
   # Start development server
   npm run dev
   ```

   Or use any static file server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (http-server)
   npx http-server -p 8000
   ```

4. **Option B: Open directly in browser**

   Simply open `index.html` in your web browser (some features may be limited due to CORS)

5. **Access the application**

   Navigate to `http://localhost:8000` (or your chosen port)

## 📁 Project Structure

```
Spotify/
├── index.html          # Main HTML file with AngularJS app
├── app.js              # AngularJS application logic (routes, controllers, services)
├── styles.css          # Custom Tailwind CSS styles and animations
├── tailwind.config.js  # Tailwind CSS configuration
├── package.json        # Node.js dependencies
├── manifest.json       # PWA manifest
├── README.md           # This file
└── views/              # AngularJS view templates
    ├── header.html
    ├── footer.html
    ├── home.html
    ├── login.html
    ├── signup.html
    ├── spotify-connect.html
    ├── dashboard.html
    ├── moment-detail.html
    └── profile.html
```

## 🎨 Design System

### Color Palette

- **Primary (Spotify Green)**: `#1DB954`
- **Mood Gradients**:
  - Happy: `#FFD700 → #FFA500`
  - Chill: `#667EEA → #764BA2`
  - Focus: `#4ECDC4 → #44A08D`
  - Energetic: `#FF6B6B → #FF8E53`
  - Nostalgic: `#A8E6CF → #88D8A3`
  - Neutral: `#2C3E50 → #34495E`
- **Backgrounds**:
  - Dark: `#0F0F23`
  - Light: `#FAFAFA`

### Typography

- Headings: Bold, large scale
- Body: System font stack for optimal performance

## 🔧 Configuration

### Spotify OAuth Setup

To enable real Spotify integration, you'll need to:

1. **Create a Spotify App**
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app
   - Note your Client ID and Client Secret

2. **Update OAuth Endpoints**
   - Modify `SpotifyService.connect()` in `app.js`
   - Replace mock OAuth with real Spotify OAuth flow
   - Update redirect URI in Spotify app settings

3. **Backend API (Optional)**
   - For production, implement a backend server to handle OAuth securely
   - Store Client Secret server-side only

### Firebase Integration (Optional)

For production deployment with real authentication:

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Enable Authentication (Email/Password)

2. **Add Firebase Config**
   ```javascript
   // In app.js, replace AuthService with Firebase Auth
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     // ... other config
   };
   ```

## 🎯 Usage

1. **Sign Up / Login**: Create an account or sign in
2. **Connect Spotify**: Link your Spotify account (OAuth flow)
3. **Create a Moment**: 
   - Select your current mood
   - Adjust location and time of day
   - Weather is auto-detected
   - Click "Generate Soundtrack"
4. **View Playlist**: See your generated playlist with tracks
5. **Play on Spotify**: Open the playlist in Spotify
6. **View Timeline**: See all your moments in the dashboard timeline

## 🛠️ Technologies Used

- **AngularJS 1.8.3**: Frontend framework
- **Tailwind CSS v4**: Utility-first CSS framework
- **Angular Route**: Client-side routing
- **Angular Animate**: Animation support
- **LocalStorage**: Client-side data persistence
- **Web APIs**: Geolocation, Intersection Observer

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## ♿ Accessibility Features

- Semantic HTML5 elements
- ARIA labels and roles
- Keyboard navigation support
- Focus visible indicators
- Screen reader friendly
- Reduced motion support
- High contrast mode support

## 🎨 Advanced Features

- **View Transitions API**: Smooth page transitions
- **Scroll-driven Animations**: Elements animate on scroll
- **Container Queries**: Responsive components
- **Glassmorphism**: Modern glass effect UI
- **Particle System**: Animated background particles
- **3D Card Effects**: Hover transformations
- **Magnetic Cursor**: Interactive elements follow cursor
- **Vinyl Loading Spinner**: Custom loading animation

## 🚀 Performance

- Lazy loading for images
- Optimized animations (GPU-accelerated)
- Minimal JavaScript bundle
- CDN-hosted dependencies
- LocalStorage for caching

## 📝 License

MIT License - feel free to use this project for your portfolio or learning purposes.

## 🤝 Contributing

This is a portfolio project. Feel free to fork and modify for your own use!

## 📧 Support

For questions or issues, please open an issue on the repository.

---

**Built with ❤️ using AngularJS and Tailwind CSS v4**

