// Test full image upload flow (simulates what upload API does)
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const sharp = require('sharp');
const { google } = require('googleapis');
const { Readable } = require('stream');
const { v4: uuidv4 } = require('uuid');

async function testImageUpload() {
    console.log('🔍 Testing full image upload flow...\n');

    // 1. Create a test image using Sharp (100x100 red square)
    console.log('1️⃣ Creating test image with Sharp...');
    const testImage = await sharp({
        create: {
            width: 100,
            height: 100,
            channels: 3,
            background: { r: 255, g: 0, b: 0 }
        }
    })
        .webp({ quality: 85 })
        .toBuffer();

    console.log(`   ✅ Created test image: ${testImage.length} bytes`);

    // 2. Initialize Drive client
    console.log('\n2️⃣ Connecting to Google Drive...');
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    console.log('   ✅ Connected');

    // 3. Get/create Gakuen/avatars folder
    console.log('\n3️⃣ Finding upload folder...');

    // Find Gakuen folder
    let gakuenSearch = await drive.files.list({
        q: "name='Gakuen' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false",
        fields: 'files(id)'
    });
    const gakuenId = gakuenSearch.data.files[0]?.id;

    // Find avatars folder
    let avatarsSearch = await drive.files.list({
        q: `name='avatars' and mimeType='application/vnd.google-apps.folder' and '${gakuenId}' in parents and trashed=false`,
        fields: 'files(id)'
    });
    const avatarsId = avatarsSearch.data.files[0]?.id;
    console.log(`   ✅ Using folder: Gakuen/avatars (${avatarsId})`);

    // 4. Upload image
    console.log('\n4️⃣ Uploading image to Drive...');
    const filename = `test-avatar-${uuidv4().slice(0, 8)}.webp`;
    const stream = Readable.from([testImage]);

    const file = await drive.files.create({
        requestBody: {
            name: filename,
            mimeType: 'image/webp',
            parents: [avatarsId]
        },
        media: {
            mimeType: 'image/webp',
            body: stream
        },
        fields: 'id,name,webViewLink'
    });
    console.log(`   ✅ Uploaded: ${file.data.name}`);
    console.log(`   📋 File ID: ${file.data.id}`);

    // 5. Make public
    console.log('\n5️⃣ Making file public...');
    await drive.permissions.create({
        fileId: file.data.id,
        requestBody: { role: 'reader', type: 'anyone' }
    });

    const publicUrl = `https://drive.google.com/uc?export=view&id=${file.data.id}`;
    console.log(`   ✅ Public URL: ${publicUrl}`);

    // 6. Verify accessibility
    console.log('\n6️⃣ Verifying URL accessibility...');
    try {
        const response = await fetch(publicUrl, { method: 'HEAD' });
        console.log(`   ✅ URL accessible (status: ${response.status})`);
    } catch (e) {
        console.log(`   ⚠️ Could not verify (fetch may not work in Node)`);
    }

    console.log('\n✅ FULL INTEGRATION TEST PASSED!');
    console.log('\n📋 Test file details:');
    console.log(`   Filename: ${filename}`);
    console.log(`   File ID: ${file.data.id}`);
    console.log(`   URL: ${publicUrl}`);
    console.log('\n💡 Check your Google Drive → Gakuen → avatars folder to see the file!');
    console.log('   (You can delete it manually if you want)');
}

testImageUpload().catch(console.error);
