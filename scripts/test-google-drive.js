// Test Google Drive API with refresh token
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { google } = require('googleapis');

const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

async function testGoogleDrive() {
    console.log('🔍 Testing Google Drive API...\n');

    // 1. Check credentials
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    console.log('1️⃣ Checking credentials:');
    console.log(`   Client ID: ${clientId ? '✅ Found' : '❌ MISSING'}`);
    console.log(`   Client Secret: ${clientSecret ? '✅ Found' : '❌ MISSING'}`);
    console.log(`   Refresh Token: ✅ Provided (${REFRESH_TOKEN.length} chars)`);

    if (!clientId || !clientSecret) {
        console.error('\n❌ Missing Google OAuth credentials in .env');
        return;
    }

    // 2. Create OAuth2 client
    console.log('\n2️⃣ Creating OAuth2 client...');
    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        process.env.GOOGLE_REDIRECT_URI || 'https://gakuen-six.vercel.app/api/auth/callback/google'
    );

    oauth2Client.setCredentials({
        refresh_token: REFRESH_TOKEN
    });

    // 3. Test Drive API
    console.log('\n3️⃣ Testing Drive API connection...');
    try {
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // Get drive info (about)
        const about = await drive.about.get({
            fields: 'user,storageQuota'
        });

        console.log('   ✅ Successfully connected to Google Drive!');
        console.log(`   Account: ${about.data.user.emailAddress}`);
        console.log(`   Display Name: ${about.data.user.displayName}`);

        if (about.data.storageQuota) {
            const usedGB = (parseInt(about.data.storageQuota.usage) / 1e9).toFixed(2);
            const limitGB = (parseInt(about.data.storageQuota.limit) / 1e9).toFixed(2);
            console.log(`   Storage: ${usedGB} GB / ${limitGB} GB used`);
        }
    } catch (error) {
        console.error('   ❌ Failed to connect:', error.message);
        if (error.response?.data) {
            console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
        }
        return;
    }

    // 4. Test file upload (create a small test file)
    console.log('\n4️⃣ Testing file upload...');
    try {
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        const { Readable } = require('stream');

        const testContent = 'Hello from Gakuen! Test file created at ' + new Date().toISOString();
        const stream = Readable.from([testContent]);

        const file = await drive.files.create({
            requestBody: {
                name: 'gakuen-test-' + Date.now() + '.txt',
                mimeType: 'text/plain'
            },
            media: {
                mimeType: 'text/plain',
                body: stream
            },
            fields: 'id,name,webViewLink'
        });

        console.log('   ✅ File uploaded successfully!');
        console.log(`   File ID: ${file.data.id}`);
        console.log(`   File Name: ${file.data.name}`);

        // Clean up - delete the test file
        console.log('\n5️⃣ Cleaning up test file...');
        await drive.files.delete({ fileId: file.data.id });
        console.log('   ✅ Test file deleted');
    } catch (error) {
        console.error('   ❌ Upload test failed:', error.message);
    }

    console.log('\n✅ Google Drive API is working correctly!');
    console.log('\n📋 Add this to your .env and Vercel:');
    console.log(`GOOGLE_REFRESH_TOKEN=${REFRESH_TOKEN}`);
}

testGoogleDrive().catch(console.error);
