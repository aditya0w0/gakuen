// Quick analysis of course JSON for base64 patterns
const fs = require('fs');

const inputFile = process.argv[2] || 'untitled-course-1768880419792.json';
const data = fs.readFileSync(inputFile, 'utf8');

console.log('File size:', (data.length / 1024 / 1024).toFixed(2), 'MB');

// Count data:image patterns
const dataImageMatches = data.match(/data:image/g);
console.log(
  'data:image patterns:',
  dataImageMatches ? dataImageMatches.length : 0
);

// Count customImage nodes
const customImageMatches = data.match(/customImage/g);
console.log(
  'customImage nodes:',
  customImageMatches ? customImageMatches.length : 0
);

// Check for /api/images/ references (already migrated)
const apiImagesMatches = data.match(/\/api\/images\//g);
console.log(
  '/api/images/ references:',
  apiImagesMatches ? apiImagesMatches.length : 0
);

// Check for dos: pattern images
const dosMatches = data.match(/dos:[a-z0-9]+\.jpeg/g);
console.log('dos: image references:', dosMatches ? dosMatches.length : 0);

// Find longest strings (likely base64)
const jsonParsed = JSON.parse(data);
function findLongStrings(obj, path = '', results = []) {
  if (!obj) return results;
  if (typeof obj === 'string' && obj.length > 5000) {
    results.push({ path, length: obj.length, preview: obj.substring(0, 100) });
  } else if (Array.isArray(obj)) {
    obj.forEach((item, i) => findLongStrings(item, `${path}[${i}]`, results));
  } else if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      findLongStrings(v, path ? `${path}.${k}` : k, results);
    }
  }
  return results;
}

const longStrings = findLongStrings(jsonParsed);
console.log('\nLong strings (>5KB):', longStrings.length);
longStrings.slice(0, 10).forEach((s) => {
  console.log(
    `  ${s.path}: ${(s.length / 1024).toFixed(1)}KB - ${s.preview.substring(0, 60)}...`
  );
});
