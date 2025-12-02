# 🔥 Firebase Setup Instructions for SoundtrackGen

## Step-by-Step Firebase Console Setup (20 minutes)

### **STEP 1: Create Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Project name: `soundtrackgen-2025`
4. Click **"Continue"**
5. **Disable** Google Analytics (optional, can enable later)
6. Click **"Create project"**
7. Wait for project creation (30 seconds)
8. Click **"Continue"**

---

### **STEP 2: Enable Authentication**

1. In Firebase Console, click **"Authentication"** in left sidebar
2. Click **"Get started"** (if first time)
3. Click **"Sign-in method"** tab
4. Enable **"Email/Password"**:
   - Click on "Email/Password"
   - Toggle **"Enable"** to ON
   - Click **"Save"**
5. Enable **"Google"** (optional but recommended):
   - Click on "Google"
   - Toggle **"Enable"** to ON
   - Set support email
   - Click **"Save"**

---

### **STEP 3: Create Firestore Database**

1. Click **"Firestore Database"** in left sidebar
2. Click **"Create database"**
3. Select **"Start in production mode"** (we'll add rules)
4. Choose location (select closest to your users, e.g., `us-central1`)
5. Click **"Enable"**
6. Wait for database creation (30 seconds)

---

### **STEP 4: Get Firebase Config**

1. Click **⚙️ Settings** (gear icon) next to "Project Overview"
2. Scroll down to **"Your apps"** section
3. Click **"</>"** (Web icon) to add a web app
4. App nickname: `SoundtrackGen Web`
5. **DO NOT** check "Also set up Firebase Hosting"
6. Click **"Register app"**
7. **COPY** the `firebaseConfig` object that appears
8. It looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "soundtrackgen-2025.firebaseapp.com",
     projectId: "soundtrackgen-2025",
     storageBucket: "soundtrackgen-2025.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

---

### **STEP 5: Add Config to index.html**

1. Open `index.html` in your editor
2. Find the Firebase config section (around line 65)
3. **REPLACE** the placeholder config with your actual config:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_ACTUAL_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```
4. Save the file

---

### **STEP 6: Set Firestore Security Rules**

1. In Firebase Console, click **"Firestore Database"**
2. Click **"Rules"** tab
3. **REPLACE** the default rules with the content from `firestore.rules`:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid}/moments/{momentId} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
       match /users/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```
4. Click **"Publish"**

---

### **STEP 7: Test Authentication (Optional)**

1. Open `index.html` in browser
2. Click **"Sign Up"**
3. Create a test account
4. Check Firebase Console → Authentication → Users
5. You should see your new user!

---

## 🚀 Firebase Hosting Deployment (Bonus - 5 minutes)

### **Install Firebase CLI**

```bash
npm install -g firebase-tools
```

### **Login to Firebase**

```bash
firebase login
```

### **Initialize Hosting**

```bash
firebase init hosting
```

**Answer prompts:**
- Use existing project? **Yes**
- Select project: **soundtrackgen-2025**
- Public directory: **.** (current directory)
- Single-page app? **Yes**
- Overwrite index.html? **No** (we already have it)

### **Deploy**

```bash
firebase deploy --only hosting
```

Your app will be live at: `https://soundtrackgen-2025.web.app`

---

## ✅ Testing Checklist

After setup, test these scenarios:

- [ ] **Sign Up**: Create new account → Check Firestore `users/{uid}` doc created
- [ ] **Login**: Sign in → Check auth state persists
- [ ] **Create Moment**: Generate playlist → Check `users/{uid}/moments/{momentId}` created
- [ ] **Offline**: Disable internet → Create moment → Check localStorage backup
- [ ] **Reconnect**: Enable internet → Check moments sync to Firestore
- [ ] **Multi-device**: Login on phone → See same moments (after sync)
- [ ] **Console**: Check browser console → No Firebase errors

---

## 🔧 Troubleshooting

### **Error: "Firebase not initialized"**
- Check that Firebase config is correct in `index.html`
- Verify Firebase SDK loaded (check Network tab)

### **Error: "Permission denied"**
- Check Firestore rules are published
- Verify user is authenticated (`AuthService.isAuthenticated === true`)

### **Error: "Collection not found"**
- This is normal - Firestore creates collections on first write
- Create a moment to initialize the collection

### **Moments not syncing**
- Check browser console for errors
- Verify user is authenticated
- Check Firestore rules allow write access

---

## 📊 Firestore Data Structure

After using the app, your Firestore will look like:

```
users/
  └── {userId}/
      ├── email: "user@example.com"
      ├── displayName: "John Doe"
      ├── spotifyConnected: false
      ├── createdAt: Timestamp
      ├── totalMoments: 5
      └── moments/
          ├── {momentId1}/
          │   ├── mood: "happy"
          │   ├── weather: {...}
          │   ├── location: "New York, NY"
          │   ├── time: "afternoon"
          │   ├── tracks: [...]
          │   └── createdAt: Timestamp
          └── {momentId2}/
              └── ...
```

---

## 🎯 Success Criteria

✅ Firebase project created: `soundtrackgen-2025`  
✅ Authentication enabled: Email/Password  
✅ Firestore database created: Production mode  
✅ Security rules published  
✅ Config added to `index.html`  
✅ Test signup works  
✅ Test moment creation works  
✅ Offline fallback works  
✅ Console: 0 Firebase errors  

---

## 📝 Next Steps

1. **Enable Google Sign-In** (optional)
2. **Set up custom domain** (optional)
3. **Configure Firebase Analytics** (optional)
4. **Set up Cloud Functions** for Spotify API (future)

---

**Need help?** Check [Firebase Documentation](https://firebase.google.com/docs)

