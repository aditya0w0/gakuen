// Test Content Moderation with Google Cloud Vision Safe Search
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { ImageAnnotatorClient } = require('@google-cloud/vision');
const sharp = require('sharp');

async function testContentModeration() {
    console.log('🔍 Testing Content Moderation...\n');

    // Check credentials
    console.log('1️⃣ Checking credentials:');
    const projectId = process.env.VISION_PROJECT_ID;
    const clientEmail = process.env.VISION_CLIENT_EMAIL;
    const privateKey = process.env.VISION_PRIVATE_KEY;

    console.log(`   Project ID: ${projectId ? '✅ Found (' + projectId + ')' : '❌ MISSING'}`);
    console.log(`   Client Email: ${clientEmail ? '✅ Found' : '❌ MISSING'}`);
    console.log(`   Private Key: ${privateKey ? '✅ Found' : '❌ MISSING'}`);

    if (!projectId || !clientEmail || !privateKey) {
        console.error('\n❌ Missing Vision API credentials');
        return;
    }

    // Create Vision client
    console.log('\n2️⃣ Creating Vision API client...');
    const client = new ImageAnnotatorClient({
        projectId,
        credentials: {
            client_email: clientEmail,
            private_key: privateKey.replace(/\\n/g, '\n'),
        }
    });
    console.log('   ✅ Client created');

    // Create a safe test image (green square)
    console.log('\n3️⃣ Creating safe test image...');
    const safeImage = await sharp({
        create: {
            width: 100,
            height: 100,
            channels: 3,
            background: { r: 0, g: 255, b: 0 } // Green
        }
    }).png().toBuffer();
    console.log(`   ✅ Created test image: ${safeImage.length} bytes`);

    // Test Safe Search Detection
    console.log('\n4️⃣ Running Safe Search detection...');
    try {
        const [result] = await client.safeSearchDetection({
            image: { content: safeImage.toString('base64') }
        });

        const safeSearch = result.safeSearchAnnotation;

        if (safeSearch) {
            console.log('   ✅ Safe Search API working!');
            console.log('\n📊 Detection Results:');
            console.log(`   Adult:    ${safeSearch.adult}`);
            console.log(`   Violence: ${safeSearch.violence}`);
            console.log(`   Racy:     ${safeSearch.racy}`);
            console.log(`   Medical:  ${safeSearch.medical}`);
            console.log(`   Spoof:    ${safeSearch.spoof}`);

            // Check if safe
            const blockedLevels = ['LIKELY', 'VERY_LIKELY'];
            const isBlocked =
                blockedLevels.includes(safeSearch.adult) ||
                blockedLevels.includes(safeSearch.violence) ||
                safeSearch.racy === 'VERY_LIKELY';

            console.log(`\n   Result: ${isBlocked ? '🚫 WOULD BE BLOCKED' : '✅ SAFE TO UPLOAD'}`);
        } else {
            console.log('   ⚠️ No safe search results returned');
        }
    } catch (error) {
        console.error('   ❌ Safe Search API error:', error.message);
        if (error.message.includes('has not been used') || error.message.includes('disabled')) {
            console.log('\n⚠️ You need to enable the Cloud Vision API:');
            console.log('   https://console.cloud.google.com/apis/library/vision.googleapis.com');
        }
        return;
    }

    console.log('\n✅ Content moderation is working correctly!');
}

testContentModeration().catch(console.error);
