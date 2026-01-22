// Analyze a course JSON blob to find what's taking up space
// Usage: node scripts/analyze-blob-size.js <course.json>

const fs = require('fs');

const inputFile = process.argv[2];

if (!inputFile) {
    console.log('Usage: node scripts/analyze-blob-size.js <course.json>');
    process.exit(1);
}

try {
    const raw = fs.readFileSync(inputFile, 'utf-8');
    const blob = JSON.parse(raw);

    console.log('📊 Blob Size Analysis\n');
    console.log('Total size:', (raw.length / 1024).toFixed(1), 'KB');
    console.log('Schema version:', blob.v);
    console.log('');

    // Lessons analysis
    const lessons = blob.lessons || {};
    const lessonIds = Object.keys(lessons);
    console.log('📚 Lessons:', lessonIds.length);

    let totalTiptapSize = 0;
    let totalBlockRefs = 0;

    for (const id of lessonIds) {
        const lesson = lessons[id];
        const hasJ = !!lesson.j; // tiptapJson
        const blockCount = (lesson.b || []).length;

        if (hasJ) {
            const jSize = JSON.stringify(lesson.j).length;
            totalTiptapSize += jSize;
            console.log(`  ${id}: ${lesson.t?.slice(0, 30)}... [tiptapJson: ${(jSize / 1024).toFixed(1)}KB, blocks: ${blockCount}]`);
        } else {
            console.log(`  ${id}: ${lesson.t?.slice(0, 30)}... [legacy blocks: ${blockCount}]`);
        }
        totalBlockRefs += blockCount;
    }

    console.log('');
    console.log('📦 Blocks:', Object.keys(blob.blocks || {}).length);
    console.log('');

    // Size breakdown
    const blocksJson = JSON.stringify(blob.blocks || {});
    const lessonsJson = JSON.stringify(blob.lessons || {});

    console.log('📐 Size Breakdown:');
    console.log('  Lessons (with tiptapJson):', (lessonsJson.length / 1024).toFixed(1), 'KB');
    console.log('  Blocks:', (blocksJson.length / 1024).toFixed(1), 'KB');
    console.log('  tiptapJson total:', (totalTiptapSize / 1024).toFixed(1), 'KB');

    if (totalTiptapSize > 0 && Object.keys(blob.blocks || {}).length > 0) {
        console.log('\n⚠️  WARNING: Both tiptapJson AND blocks are stored!');
        console.log('   This is redundant. blocks should be empty when tiptapJson exists.');
    }

} catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
}
