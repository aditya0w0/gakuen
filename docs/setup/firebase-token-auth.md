# Firebase Token-Based Authentication Setup

## Overview

This guide covers the implementation of secure Firebase token-based authentication with httpOnly cookies and server-side validation.

### Features Implemented

| Feature | Description |
|---------|-------------|
| httpOnly Cookies | Cannot be accessed or modified by JavaScript |
| Server-Side Validation | Firebase Admin SDK verifies all tokens |
| Custom Claims | User roles stored in token (cryptographically signed) |
| Auto-Expiring Tokens | Tokens refresh automatically via Firebase |

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant NextJS as Next.js Server
    participant Firebase as Firebase Auth
    
    User->>Browser: Click "Sign in with Google"
    Browser->>Firebase: OAuth flow
    Firebase-->>Browser: ID Token (JWT)
    Browser->>NextJS: POST /api/auth/set-token
    NextJS->>Firebase: Verify token (Admin SDK)
    Firebase-->>NextJS: Token valid + claims
    NextJS-->>Browser: Set-Cookie: firebase-token; HttpOnly
    
    Note over Browser,NextJS: Subsequent Requests
    
    Browser->>NextJS: Request (cookie auto-sent)
    NextJS->>NextJS: Middleware validates token
    NextJS-->>Browser: Protected resource
```

---

## Setup Instructions

### Step 1: Obtain Firebase Admin Credentials

1. Navigate to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** > **Service Accounts** tab
4. Click **Generate new private key**
5. Download and securely store the JSON file

### Step 2: Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Firebase Admin SDK (copy values from downloaded JSON)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com  
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
```

> **Important:** Preserve the quotes around `FIREBASE_ADMIN_PRIVATE_KEY` and maintain the `\n` characters.

### Step 3: Assign Admin Role

Execute the admin assignment script:

```bash
npx tsx scripts/set-admin.ts your-email@example.com
```

This sets the `role: 'admin'` custom claim in Firebase.

### Step 4: Refresh Authentication

The admin role is embedded in the Firebase token. To apply changes:

1. Sign out completely
2. Sign back in
3. The new token will include `role: 'admin'`

---

## Verification

### Testing Authentication

1. Sign in using your Google account
2. Open **DevTools** > **Application** > **Cookies**
   - Verify `firebase-token` cookie exists
   - Confirm `HttpOnly` flag is enabled (value will be greyed out)
3. Access a protected route (e.g., `/courses`)
4. Attempt to modify the cookie—access should be denied

---

## Security Architecture

```mermaid
flowchart TB
    subgraph Client ["Client (Browser)"]
        A[User Signs In]
        B[Receives ID Token]
    end
    
    subgraph Server ["Next.js Server"]
        C[/api/auth/set-token]
        D[Validate with Admin SDK]
        E[Set httpOnly Cookie]
        F[Middleware]
        G[Protected Routes]
    end
    
    subgraph Firebase ["Firebase"]
        H[Authentication]
        I[Admin SDK]
    end
    
    A --> H
    H --> B
    B --> C
    C --> D
    D --> I
    I --> D
    D --> E
    E --> F
    F --> G
    
    style E fill:#c8e6c9
    style F fill:#c8e6c9
```

### httpOnly Cookie Protection

| Protection | Description |
|------------|-------------|
| JavaScript Isolation | `document.cookie` will not expose the token |
| XSS Mitigation | Malicious scripts cannot steal the token |
| Server-Only Access | Token is only transmitted to the server |

### Server-Side Validation

| Feature | Description |
|---------|-------------|
| Middleware Validation | Token verified before granting access |
| Cryptographic Verification | Firebase Admin SDK validates token signature |
| Forgery Prevention | Tokens are cryptographically signed |

### Custom Claims

| Feature | Description |
|---------|-------------|
| Token-Embedded Roles | Role stored in token, not localStorage |
| Client Immutability | Cannot be modified client-side |
| Admin SDK Requirement | Only Firebase Admin SDK can modify claims |

---

## Request Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Login
    Login --> TokenReceived: OAuth Success
    TokenReceived --> CookieSet: POST /api/auth/set-token
    CookieSet --> Authenticated
    
    Authenticated --> RequestMade: User navigates
    RequestMade --> MiddlewareCheck: Cookie auto-sent
    MiddlewareCheck --> AccessGranted: Token valid
    MiddlewareCheck --> AccessDenied: Token invalid
    AccessGranted --> Authenticated
    AccessDenied --> Login
    
    Authenticated --> Logout: User signs out
    Logout --> CookieCleared: POST /api/auth/clear-token
    CookieCleared --> [*]
```

1. **Login:**
   - User authenticates with Google
   - Firebase returns ID token (JWT)
   - Client sends token to `/api/auth/set-token`
   - Server validates and sets httpOnly cookie

2. **Request Handling:**
   - Browser automatically includes cookie with requests
   - Middleware reads and validates cookie
   - Firebase Admin SDK verifies token
   - Role-based access control applied

3. **Logout:**
   - Client calls `/api/auth/clear-token`
   - Server clears httpOnly cookie
   - Session terminated

---

## Admin Management

### Assign Admin Role

```bash
npx tsx scripts/set-admin.ts user@example.com
```

### Remove Admin Role

```bash
npx tsx scripts/set-admin.ts user@example.com --role=user
```

### Verify User Claims

Navigate to **Firebase Console** > **Authentication** > **Users** > Select user > **Custom claims**

---

## Troubleshooting

### Error: "Module not found: firebase-admin"

**Solution:**

```bash
npm install firebase-admin
```

### Error: "Invalid credentials"

**Checklist:**

- Verify `.env.local` contains all three Admin SDK variables
- Confirm private key includes `\n` characters
- Ensure private key is wrapped in quotes

### Error: "Permission denied"

**Checklist:**

- Confirm `set-admin.ts` script was executed
- Sign out and sign back in to refresh token

### Middleware Not Functioning

**Checklist:**

- Review server console for token validation logs
- Verify cookie is set in **DevTools** > **Application** > **Cookies**

---

## Additional Notes

| Topic | Detail |
|-------|--------|
| Token Expiration | Tokens auto-expire after 1 hour; Firebase handles refresh |
| Role Changes | Users must sign out and back in after role modifications |
| Security Standard | httpOnly cookies represent the industry standard for authentication security |
