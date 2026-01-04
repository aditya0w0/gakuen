// Test Google Drive folder creation
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { google } = require('googleapis');
const { Readable } = require('stream');

const ROOT_FOLDER = 'Gakuen';
const folderCache = {};

async function getOrCreateFolder(drive, name, parentId) {
    const cacheKey = parentId ? `${parentId}/${name}` : name;
    if (folderCache[cacheKey]) return folderCache[cacheKey];

    const query = parentId
        ? `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
        : `name='${name}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`;

    const search = await drive.files.list({ q: query, fields: 'files(id, name)', spaces: 'drive' });

    if (search.data.files?.length > 0) {
        console.log(`   📁 Found existing folder: ${name}`);
        folderCache[cacheKey] = search.data.files[0].id;
        return search.data.files[0].id;
    }

    const folder = await drive.files.create({
        requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: parentId ? [parentId] : undefined },
        fields: 'id'
    });

    console.log(`   📁 Created new folder: ${name}`);
    folderCache[cacheKey] = folder.data.id;
    return folder.data.id;
}

async function testFolderStructure() {
    console.log('🔍 Testing Google Drive folder structure...\n');

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    console.log('1️⃣ Creating folder structure:');
    const rootId = await getOrCreateFolder(drive, ROOT_FOLDER);
    const avatarsId = await getOrCreateFolder(drive, 'avatars', rootId);
    const coursesId = await getOrCreateFolder(drive, 'courses', rootId);
    const lessonsId = await getOrCreateFolder(drive, 'lessons', rootId);
    const cmsId = await getOrCreateFolder(drive, 'cms', rootId);

    console.log('\n2️⃣ Testing file upload to avatars folder:');
    const testContent = Buffer.from('test image content');
    const stream = Readable.from([testContent]);

    const file = await drive.files.create({
        requestBody: { name: 'test-avatar.txt', parents: [avatarsId] },
        media: { body: stream },
        fields: 'id,name,parents'
    });
    console.log(`   ✅ Uploaded test file: ${file.data.name} (ID: ${file.data.id})`);

    // Clean up
    await drive.files.delete({ fileId: file.data.id });
    console.log('   🗑️ Cleaned up test file');

    console.log('\n✅ Folder structure ready:');
    console.log(`   Gakuen/`);
    console.log(`   ├── avatars/`);
    console.log(`   ├── courses/`);
    console.log(`   ├── lessons/`);
    console.log(`   └── cms/`);
}

testFolderStructure().catch(console.error);
