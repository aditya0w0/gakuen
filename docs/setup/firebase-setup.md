# Gakuen Firebase Setup Guide

## Quick Start

### 1. Create Firebase Project (2 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" or "Create a project"
3. Enter project name: `gakuen-platform` (or your choice)
4. Disable Google Analytics (optional for now)
5. Click "Create Project"

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication** → **Get Started**
2. Click **Email/Password** → Enable → Save

### 3. Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Choose **Start in test mode** → Next
3. Select your region → Enable

### 4. Get Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps" → Click Web icon (</> )
3. Register app: `gakuen-web`
4. Copy the `firebaseConfig` object

### 5. Configure Environment

Create `.env.local` in project root:

```bash
# Copy from .env.local.example
cp .env.local.example .env.local
```

Paste your Firebase config values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gakuen-platform.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gakuen-platform
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gakuen-platform.appspot.com  
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Enable Firebase
NEXT_PUBLIC_USE_FIREBASE=true
```

### 6. Set Firestore Security Rules

In Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Progress collection  
    match /progress/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

Click **Publish**.

## Testing

### Test Without Firebase

```env
NEXT_PUBLIC_USE_FIREBASE=false
```

App will use local storage only (demo accounts work).

### Test With Firebase

```env
 NEXT_PUBLIC_USE_FIREBASE=true
```

1. Login with demo account: `student@gakuen.edu` / `student123`
2. This will create user in Firebase (first time)
3. Progress syncs to Firebase every 30 seconds
4. Check Firebase Console to see data

## Hybrid Storage Behavior

| Action | Local Storage | Firebase | Notes |
|--------|--------------|----------|-------|
| Login | Cache user | Authenticate | Immediate |
| Complete Lesson | Update immediately | Sync after 30s | Debounced |
| Logout | Clear cache | Sign out | Sync pending first |
| Offline | Works | Queued | Syncs when online |

## Development Tips

- Keep Firebase **disabled** during development (`USE_FIREBASE=false`)
- Enable for production deployment
- Monitor Firebase usage in Console → Usage tab
- Free tier: 50K reads/day, 20K writes/day

## Troubleshooting

**Error: Firebase not initialized**
- Check `.env.local` exists and has correct values
- Restart dev server after adding env vars

**Error: Permission denied**
- Check Firestore rules are published
- Ensure user is authenticated

**Data not syncing**
- Check browser console for errors
- Verify `NEXT_PUBLIC_USE_FIREBASE=true`
- Check Firebase Console for data
