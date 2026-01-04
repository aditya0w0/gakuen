// Test script for base64 image conversion
// Run with: node scripts/test-base64-image.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function testBase64Flow() {
    console.log('🧪 Testing base64 image conversion flow...\n');

    // 1. Create a test image (100x100 red square)
    console.log('1️⃣ Creating test image...');
    const testBuffer = await sharp({
        create: {
            width: 100,
            height: 100,
            channels: 3,
            background: { r: 255, g: 0, b: 0 }
        }
    })
        .webp({ quality: 85 })
        .toBuffer();

    console.log(`   Original size: ${testBuffer.length} bytes`);

    // 2. Convert to base64 data URL
    console.log('2️⃣ Converting to base64...');
    const base64 = testBuffer.toString('base64');
    const dataUrl = `data:image/webp;base64,${base64}`;
    console.log(`   Base64 length: ${base64.length} chars`);
    console.log(`   Data URL preview: ${dataUrl.slice(0, 50)}...`);

    // 3. Convert back to buffer
    console.log('3️⃣ Converting back to buffer...');
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const recoveredBuffer = Buffer.from(base64Data, 'base64');
    console.log(`   Recovered size: ${recoveredBuffer.length} bytes`);

    // 4. Verify the image is valid
    console.log('4️⃣ Verifying recovered image...');
    const metadata = await sharp(recoveredBuffer).metadata();
    console.log(`   Format: ${metadata.format}`);
    console.log(`   Dimensions: ${metadata.width}x${metadata.height}`);

    // 5. Save for visual verification
    const outputPath = path.join(__dirname, 'test-output.webp');
    fs.writeFileSync(outputPath, recoveredBuffer);
    console.log(`   Saved to: ${outputPath}`);

    // 6. Check if sizes match
    const sizesMatch = testBuffer.length === recoveredBuffer.length;
    console.log(`\n✅ Test ${sizesMatch ? 'PASSED' : 'FAILED'}: Buffer sizes ${sizesMatch ? 'match' : 'do not match'}`);

    // Cleanup
    try {
        fs.unlinkSync(outputPath);
        console.log('🧹 Cleaned up test file');
    } catch (e) { }

    return sizesMatch;
}

testBase64Flow()
    .then(success => {
        console.log(success ? '\n🎉 Base64 flow works correctly!' : '\n❌ Test failed');
        process.exit(success ? 0 : 1);
    })
    .catch(err => {
        console.error('❌ Test error:', err);
        process.exit(1);
    });
