// Debug Firebase Admin SDK Configuration
require('dotenv').config({ path: '.env.local' }); // Try .env.local first
require('dotenv').config({ path: '.env' });       // Fallback to .env

const admin = require('firebase-admin');

async function debugAdmin() {
    console.log('🔍 Debugging Firebase Admin SDK...\n');

    // 1. Check Env Vars
    console.log('1️⃣ Checking Environment Variables:');
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    console.log(`   Project ID: ${projectId ? '✅ Found (' + projectId + ')' : '❌ MISSING'}`);
    console.log(`   Client Email: ${clientEmail ? '✅ Found (' + clientEmail + ')' : '❌ MISSING'}`);
    console.log(`   Private Key: ${privateKey ? '✅ Found (' + privateKey.length + ' chars)' : '❌ MISSING'}`);

    if (privateKey) {
        const hasBegin = privateKey.includes('-----BEGIN PRIVATE KEY-----');
        const hasEnd = privateKey.includes('-----END PRIVATE KEY-----');
        const hasNewlines = privateKey.includes('\n');
        console.log(`   Key Format: Begin=${hasBegin}, End=${hasEnd}, Newlines=${hasNewlines}`);

        if (!hasNewlines) {
            console.log('   ⚠️ WARNING: Private key might be missing newlines. Attempting fix...');
        }
    }

    if (!projectId || !clientEmail || !privateKey) {
        console.error('\n❌ Missing required environment variables. Aborting.');
        return;
    }

    // 2. Initialize App
    console.log('\n2️⃣ Initializing Admin SDK...');
    try {
        if (admin.apps.length === 0) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey: privateKey.replace(/\\n/g, '\n'), // Fix escaped newlines
                }),
            });
        }
        console.log('   ✅ Initialization successful');
    } catch (error) {
        console.error('   ❌ Initialization failed:', error.message);
        return;
    }

    // 3. Test Auth (List Users)
    console.log('\n3️⃣ Testing Auth (List Users)...');
    try {
        const listUsersResult = await admin.auth().listUsers(5);
        console.log(`   ✅ Successfully listed ${listUsersResult.users.length} users`);
        listUsersResult.users.forEach(user => {
            console.log(`      - ${user.email} (${user.providerData.map(p => p.providerId).join(', ')})`);
        });
    } catch (error) {
        console.error('   ❌ Failed to list users:', error.message);
        if (error.code === 'auth/insufficient-permission') {
            console.log('   💡 TIP: Service account might be missing "Firebase Authentication Admin" role.');
        }
    }

    // 4. Test Firestore (Read)
    console.log('\n4️⃣ Testing Firestore (Read Users)...');
    try {
        const db = admin.firestore();
        const usersSnap = await db.collection('users').limit(5).get();
        console.log(`   ✅ Successfully read ${usersSnap.size} documents from 'users' collection`);
    } catch (error) {
        console.error('   ❌ Failed to read Firestore:', error.message);
    }
}

debugAdmin().catch(console.error);
