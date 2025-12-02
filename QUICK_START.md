# 🚀 Quick Start Guide - Firebase Integration

## ✅ Files Modified

1. **index.html** - Added Firebase SDK with config placeholder
2. **app.js** - Updated AuthService and MomentService with hybrid storage
3. **firebase.json** - Hosting configuration
4. **firestore.rules** - Security rules

## 🔧 Setup Steps (5 minutes)

### 1. Get Firebase Config

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project: `soundtrackgen-2025`
3. Enable Authentication (Email/Password)
4. Create Firestore Database (Production mode)
5. Get web app config from Settings ⚙️ → Your apps → Web

### 2. Update index.html

Replace the Firebase config in `index.html` (line ~65):

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Set Firestore Rules

1. Firebase Console → Firestore Database → Rules
2. Copy content from `firestore.rules`
3. Click "Publish"

### 4. Test

1. Open `index.html` in browser
2. Sign up with email/password
3. Create a moment (generate playlist)
4. Check Firebase Console → Firestore → `users/{uid}/moments`

## 🎯 How It Works

### Hybrid Storage Strategy

**SAVE:**
1. Try Firestore first
2. If fails → Save to localStorage
3. Always backup to localStorage

**LOAD:**
1. Load from Firestore
2. Merge with localStorage
3. Dedupe by ID
4. Return merged list

**OFFLINE:**
- Works with localStorage only
- Syncs to Firestore when online

## 📊 Data Structure

```
users/{uid}
  ├── email: string
  ├── displayName: string
  ├── spotifyConnected: boolean
  ├── createdAt: timestamp
  └── totalMoments: number

users/{uid}/moments/{momentId}
  ├── mood: string
  ├── weather: object
  ├── location: string
  ├── time: string
  ├── tracks: array
  └── createdAt: timestamp
```

## 🐛 Troubleshooting

**"Firebase not initialized"**
- Check config in index.html
- Check browser console for errors

**"Permission denied"**
- Check Firestore rules are published
- Verify user is authenticated

**Moments not saving**
- Check browser console
- Verify Firestore rules allow write

## 📝 Next Steps

- Deploy to Firebase Hosting: `firebase deploy`
- Enable Google Sign-In (optional)
- Add Cloud Functions for Spotify API

