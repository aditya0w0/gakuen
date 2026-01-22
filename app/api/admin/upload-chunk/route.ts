/**
 * Chunked Upload API
 *
 * Handles multi-part uploads for large course payloads.
 * Stores chunks in memory temporarily, then processes when complete.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { initAdmin } from '@/lib/auth/firebase-admin';
import {
  uploadCourseBlob,
  isTelegramEnabled,
  getBlobStats,
} from '@/lib/storage/telegram-storage';
import { courseToBlob } from '@/lib/storage/course-converter';
import { gunzipSync } from 'zlib';

// In-memory storage for pending uploads (cleared after 5 minutes)
const pendingUploads = new Map<
  string,
  {
    courseId: string;
    operation: 'checkpoint' | 'publish';
    totalChunks: number;
    chunks: Map<number, Buffer>;
    createdAt: number;
  }
>();

// Cleanup old uploads every minute
setInterval(() => {
  const now = Date.now();
  const TIMEOUT = 5 * 60 * 1000; // 5 minutes
  for (const [uploadId, upload] of pendingUploads) {
    if (now - upload.createdAt > TIMEOUT) {
      pendingUploads.delete(uploadId);
      console.log(`🗑️ [Chunked] Cleaned up stale upload: ${uploadId}`);
    }
  }
}, 60 * 1000);

export async function POST(request: NextRequest) {
  // Auth check
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }
  if (authResult.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'init':
        return handleInit(searchParams);
      case 'chunk':
        return await handleChunk(request, searchParams);
      case 'complete':
        return await handleComplete(searchParams);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Chunked] Error:', error);
    return NextResponse.json(
      {
        error: 'Chunked upload failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function handleInit(params: URLSearchParams): NextResponse {
  const courseId = params.get('courseId');
  const totalChunks = parseInt(params.get('totalChunks') || '0');
  const operation = params.get('operation') as 'checkpoint' | 'publish';

  if (!courseId || !totalChunks || !operation) {
    return NextResponse.json(
      { error: 'Missing courseId, totalChunks, or operation' },
      { status: 400 }
    );
  }

  const uploadId = `${courseId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  pendingUploads.set(uploadId, {
    courseId,
    operation,
    totalChunks,
    chunks: new Map(),
    createdAt: Date.now(),
  });

  console.log(
    `📤 [Chunked] Init: ${uploadId} (${totalChunks} chunks, ${operation})`
  );

  return NextResponse.json({ uploadId });
}

async function handleChunk(
  request: NextRequest,
  params: URLSearchParams
): Promise<NextResponse> {
  const uploadId = params.get('uploadId');
  const chunkIndex = parseInt(params.get('chunkIndex') || '-1');

  if (!uploadId || chunkIndex < 0) {
    return NextResponse.json(
      { error: 'Missing uploadId or chunkIndex' },
      { status: 400 }
    );
  }

  const upload = pendingUploads.get(uploadId);
  if (!upload) {
    return NextResponse.json(
      { error: 'Upload not found or expired' },
      { status: 404 }
    );
  }

  const arrayBuffer = await request.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  upload.chunks.set(chunkIndex, buffer);

  console.log(
    `📤 [Chunked] Chunk ${chunkIndex + 1}/${upload.totalChunks} received (${(buffer.length / 1024).toFixed(1)}KB)`
  );

  return NextResponse.json({
    success: true,
    chunksReceived: upload.chunks.size,
    totalChunks: upload.totalChunks,
  });
}

async function handleComplete(params: URLSearchParams): Promise<NextResponse> {
  const uploadId = params.get('uploadId');

  if (!uploadId) {
    return NextResponse.json({ error: 'Missing uploadId' }, { status: 400 });
  }

  const upload = pendingUploads.get(uploadId);
  if (!upload) {
    return NextResponse.json(
      { error: 'Upload not found or expired' },
      { status: 404 }
    );
  }

  // Verify all chunks received
  if (upload.chunks.size !== upload.totalChunks) {
    return NextResponse.json(
      {
        error: `Missing chunks: got ${upload.chunks.size}/${upload.totalChunks}`,
      },
      { status: 400 }
    );
  }

  // Reassemble chunks in order
  const sortedChunks: Buffer[] = [];
  for (let i = 0; i < upload.totalChunks; i++) {
    const chunk = upload.chunks.get(i);
    if (!chunk) {
      return NextResponse.json(
        { error: `Missing chunk ${i}` },
        { status: 400 }
      );
    }
    sortedChunks.push(chunk);
  }

  const combined = Buffer.concat(sortedChunks);
  console.log(
    `📤 [Chunked] Reassembled ${(combined.length / 1024).toFixed(1)}KB`
  );

  // Decompress
  let jsonData: string;
  try {
    const decompressed = gunzipSync(combined);
    jsonData = decompressed.toString('utf-8');
    console.log(
      `📤 [Chunked] Decompressed to ${(decompressed.length / 1024).toFixed(1)}KB`
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to decompress data' },
      { status: 400 }
    );
  }

  // Parse course
  let course: any;
  try {
    course = JSON.parse(jsonData);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Clean up
  pendingUploads.delete(uploadId);

  // Process based on operation
  if (upload.operation === 'checkpoint') {
    return await processCheckpoint(upload.courseId, course);
  } else {
    return await processPublish(upload.courseId, course);
  }
}

async function processCheckpoint(
  courseId: string,
  course: any
): Promise<NextResponse> {
  if (!isTelegramEnabled()) {
    return NextResponse.json(
      { error: 'Telegram not configured' },
      { status: 500 }
    );
  }

  const { blob, meta, sections } = courseToBlob(course);
  const stats = getBlobStats(blob);

  console.log(
    `⏱️ [Checkpoint] ${courseId}: ${stats.lessonCount} lessons, ${(stats.sizeBytes / 1024).toFixed(1)}KB`
  );

  // Upload to Telegram
  const { file_id, hash } = await uploadCourseBlob(courseId, blob);
  console.log(
    `✅ [Telegram] ${courseId} uploaded → ${file_id.substring(0, 20)}...`
  );

  // Try Firestore update (non-blocking)
  let firestoreUpdated = false;
  let draftVersion = 1;

  try {
    const admin = initAdmin();
    const db = admin.firestore();
    const docRef = db.collection('courses').doc(courseId);

    const existingDoc = await docRef.get();
    const existingData = existingDoc.exists ? existingDoc.data() : {};
    draftVersion = (existingData?.draft_snapshot?.version || 0) + 1;

    await docRef.set(
      {
        meta,
        sections,
        draft_snapshot: {
          tg_file_id: file_id,
          version: draftVersion,
          hash,
          lessonCount: stats.lessonCount,
          blockCount: stats.blockCount,
          savedAt: new Date().toISOString(),
          dirty: false,
        },
        published: existingData?.published || null,
        status: existingData?.published ? 'published' : 'draft',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    firestoreUpdated = true;
    console.log(`✅ [Firestore] ${courseId} → draft v${draftVersion}`);
  } catch (error: any) {
    console.warn(`⚠️ [Firestore] Error:`, error?.message);
  }

  return NextResponse.json({
    success: true,
    courseId,
    draft_version: draftVersion,
    lessonCount: stats.lessonCount,
    tg_file_id: file_id,
    firestore_updated: firestoreUpdated,
  });
}

async function processPublish(
  courseId: string,
  course: any
): Promise<NextResponse> {
  if (!isTelegramEnabled()) {
    return NextResponse.json(
      { error: 'Telegram not configured' },
      { status: 500 }
    );
  }

  const { blob, meta, sections } = courseToBlob(course);
  const stats = getBlobStats(blob);

  console.log(
    `📤 [Publish] ${courseId}: ${stats.lessonCount} lessons, ${(stats.sizeBytes / 1024).toFixed(1)}KB`
  );

  // Upload to Telegram
  const { file_id, hash } = await uploadCourseBlob(courseId, blob);
  console.log(`✅ [Telegram] ${courseId} published`);

  // Update Firestore
  let version = 1;
  try {
    const admin = initAdmin();
    const db = admin.firestore();
    const docRef = db.collection('courses').doc(courseId);

    const existingDoc = await docRef.get();
    const existingData = existingDoc.exists ? existingDoc.data() : {};
    version = (existingData?.published?.version || 0) + 1;

    await docRef.set(
      {
        meta,
        sections,
        published: {
          tg_file_id: file_id,
          version,
          hash,
          lessonCount: stats.lessonCount,
          blockCount: stats.blockCount,
          publishedAt: new Date().toISOString(),
        },
        draft_snapshot: existingData?.draft_snapshot || null,
        status: 'published',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log(`✅ [Firestore] ${courseId} published v${version}`);
  } catch (error: any) {
    console.warn(`⚠️ [Firestore] Error:`, error?.message);
  }

  return NextResponse.json({
    success: true,
    courseId,
    version,
    lessonCount: stats.lessonCount,
    tg_file_id: file_id,
  });
}
