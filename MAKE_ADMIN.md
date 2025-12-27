# Make Yourself Admin

## Quick Fix - Via Firebase Console

1. **Open Firebase Console**
   - Go to https://console.firebase.google.com/
   - Select your project
   - Navigate to **Firestore Database**

2. **Find Your User**
   - Click `users` collection
   - Find your document (your UID)

3. **Edit Role**
   - Click on your user document
   - Find the `role` field
   - Change value from `"user"` to `"admin"`
   - Save

4. **Refresh App**
   - Hard refresh browser (Ctrl+Shift+R)
   - Sign out and sign back in
   - You should now have admin access

---

## Why This Happens

In [`lib/firebase/auth.ts`](file:///c:/Users/Xiao%20Fan/Coding/ELearn/gakuen/lib/firebase/auth.ts#L72):
```typescript
role: "user",  // Line 72 - All new users default to "user" role
```

This is by design for security - we don't want anyone who signs in to automatically become an admin.

---

## Alternative: Update Code for First User

If you want the FIRST user to auto-become admin, modify `signInWithGoogle()`:

```typescript
// If new user, create profile
if (!profile) {
    // Check if this is the first user (make them admin)
    const usersCount = await getUsersCount(); // You'd need to implement this
    
    const newUser: User = {
        id: credential.user.uid,
        email: credential.user.email || "",
        name: credential.user.displayName || "User",
        role: usersCount === 0 ? "admin" : "user", // First user = admin
        avatar: credential.user.photoURL || undefined,
        enrolledCourses: [],
        completedLessons: [],
        createdAt: new Date().toISOString(),
    };
    
    await createUserProfile(newUser);
    profile = newUser;
}
```

But the **Firebase Console method is faster** for now!
