# Fix Firebase Permissions - Auto-Registration

## The Problem

You're seeing: `FirebaseError: Missing or insufficient permissions`

**Root Cause:** Your Firestore security rules are blocking user document creation.

---

## ✅ Good News!

The auto-registration code **already exists** in [`lib/firebase/auth.ts`](file:///c:/Users/Xiao%20Fan/Coding/ELearn/gakuen/lib/firebase/auth.ts)!

When you sign in with Google (lines 63-83), it:
1. Checks if your user document exists
2. If not, creates it automatically
3. Saves to Firestore with `createUserProfile()`

**The issue:** Firestore rules are rejecting the write.

---

## 🔧 Solution: Update Firestore Rules

### Step 1: Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules** tab

### Step 2: Replace Rules

Copy this and paste into the rules editor:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - allow users to create and manage their own document
    match /users/{userId} {
      // Anyone authenticated can read their own user document
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Users can create their own document on first sign-in
      allow create: if request.auth != null && request.auth.uid == userId;
      
      // Users can update their own document
      allow update: if request.auth != null && request.auth.uid == userId;
    }
    
    // Courses collection - read for all, write for authenticated users
    match /courses/{courseId} {
      allow read: if true;  // Anyone can read courses
      allow write: if request.auth != null;  // Only authenticated users can write
      
      // Course metadata subcollection
      match /metadata/{document=**} {
        allow read: if true;
        allow write: if request.auth != null;
      }
    }
    
    // User progress tracking
    match /progress/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Step 3: Publish Rules
1. Click **"Publish"** button
2. Wait for confirmation

---

## 🧪 Test It

1. **Sign Out** if currently logged in
2. Click **"Sign In with Google"**
3. Select your Google account
4. ✅ Should work without errors!
5. Check Firestore → `users` collection → Your document should appear

---

## What This Does

- ✅ Allows users to **create** their own document on first sign-in
- ✅ Users can **read/update** only their own data
- ✅ Courses are publicly readable (for browsing)
- ✅ Only authenticated users can modify courses
- ✅ Secure - users can't access other users' data

---

## If Still Having Issues

### Check Console Errors
Open browser console (F12) and look for specific error messages.

### Verify Firebase is Enabled
Check your `.env.local` has all Firebase credentials:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# etc.
```

### Check Auth is Working
The error happens AFTER successful Google sign-in. If Google auth fails, that's a different issue (likely API key problem).

### Force Refresh
After updating rules, hard refresh the app (Ctrl+Shift+R) and try again.

---

## Security Notes

These rules are **development-ready but production-cautious**:
- Users can only access their own data
- Course writes require authentication
- No anonymous writes allowed
- Read access is appropriately scoped

For production, you might want to:
- Add admin role checks for course creation
- Add validation rules for required fields
- Add rate limiting for writes
