// Script to download and decompress a Telegram course blob
// Usage: node scripts/decompress-blob.js <tg_file_id>

const { gunzipSync } = require('zlib');
const fs = require('fs');

// You'll need to get the blob from Telegram manually or via the API
// For now, this script just decompresses a local .json.gz file

const inputFile = process.argv[2];

if (!inputFile) {
    console.log('Usage: node scripts/decompress-blob.js <file.json.gz>');
    console.log('\nTo get file from Telegram:');
    console.log('1. Use the Telegram Bot API getFile endpoint');
    console.log('2. Download the file');
    console.log('3. Pass the path to this script');
    process.exit(1);
}

try {
    const compressed = fs.readFileSync(inputFile);
    const decompressed = gunzipSync(compressed);

    const outputFile = inputFile.replace('.gz', '');
    fs.writeFileSync(outputFile, decompressed);

    const sizeKB = (decompressed.length / 1024).toFixed(1);
    console.log(`✅ Decompressed: ${outputFile}`);
    console.log(`📦 Size: ${sizeKB} KB`);

    // Quick stats without parsing the whole thing
    const preview = decompressed.toString('utf-8').slice(0, 500);
    console.log(`\n📝 Preview (first 500 chars):\n${preview}...`);

} catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
}
