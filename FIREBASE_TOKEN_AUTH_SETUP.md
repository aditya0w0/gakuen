# Firebase Token-Based Authentication Setup

## ✅ What's Implemented

You now have **secure Firebase token-based authentication**:

- ✅ **httpOnly cookies** - Can't be accessed/modified by JavaScript
- ✅ **Server-side validation** - Firebase Admin SDK verifies tokens
- ✅ **Custom claims** - Role stored in token (can't be forged)
- ✅ **Auto-expiring tokens** - Tokens refresh automatically

---

## 🔧 Setup Steps

### 1. Get Firebase Admin Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. **Project Settings** → **Service Accounts** tab
4. Click **"Generate new private key"**
5. Download the JSON file

### 2. Add Environment Variables

Open your `.env.local` and add:

```bash
# Firebase Admin SDK (copy from downloaded JSON)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com  
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
```

**Important:** Keep the quotes around `FIREBASE_ADMIN_PRIVATE_KEY` and the `\n` characters!

### 3. Make Yourself Admin

Run this script with your email:

```bash
npx tsx scripts/set-admin.ts your-email@example.com
```

This sets the `role: 'admin'` custom claim in Firebase.

### 4. Sign Out and Sign In

The admin role is stored in the Firebase token. You must:
1. Sign out completely
2. Sign back in
3. New token will include `role: 'admin'`

---

## 🧪 Testing

1. **Sign in** with your Google account
2. **Check DevTools** → Application → Cookies
   - Should see `firebase-token` cookie
   - `HttpOnly` = ✅ (greyed out, can't access via JS)
3. **Access `/courses`** - Should work if you're admin
4. **Try to modify cookie** - Should fail and redirect

---

## 🔐 Security Features

### httpOnly Cookie
- ✅ JavaScript cannot read it (`document.cookie` won't show it)
- ✅ XSS attacks can't steal the token
- ✅ Can only be sent to server

### Server-Side Validation
- ✅ Middleware validates token before allowing access
- ✅ Firebase Admin SDK verifies signature
- ✅ Can't be forged (cryptographically signed)

### Custom Claims
- ✅ Role stored in token itself (not in localStorage)
- ✅ Can't be modified client-side
- ✅ Must use Firebase Admin SDK to change

---

## 🔄 How It Works

1. **Login:**
   - User signs in with Google
   - Firebase returns ID token (JWT)
   - Client sends token to `/api/auth/set-token`
   - Server validates + sets httpOnly cookie

2. **Every Request:**
   - Browser automatically sends cookie
   - Middleware reads cookie
   - Validates token with Firebase Admin SDK
   - Checks if `role === 'admin'`
   - Grants/denies access

3. **Logout:**
   - Client calls `/api/auth/clear-token`
   - Server clears httpOnly cookie
   - User is logged out

---

## 🛠️ Admin Management

### Set Admin Role
```bash
npx tsx scripts/set-admin.ts user@example.com
```

### Remove Admin Role
```bash
npx tsx scripts/set-admin.ts user@example.com --role=user
```

### Check User Claims
Go to Firebase Console → Authentication → Users → Click user → Custom claims

---

## 🚨 Troubleshooting

### "Module not found: firebase-admin"
```bash
npm install firebase-admin
```

### "Invalid credentials"
- Check `.env.local` has all three Admin SDK variables
- Make sure private key has `\n` characters
- Private key should be wrapped in quotes

### "Permission denied"
- Make sure you ran `set-admin.ts` script
- Sign out and sign back in (token needs refresh)

### Middleware not working
- Check server console for token validation logs
- Make sure cookie is being set (check DevTools → Application → Cookies)

---

## 📝 Notes

- Tokens auto-expire after 1 hour (Firebase handles refresh)
- Users must sign out/in after role changes
- httpOnly cookies are the **gold standard** for auth security
