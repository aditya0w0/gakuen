/**
 * Publish Course API (Firestore-Resilient)
 *
 * Promotes draft snapshot to published state.
 * Only admins can publish.
 * Works with both Firestore and local registry courses.
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
import { getCourse } from '@/lib/storage/course-storage';
import {
  invalidatePointerCache,
  updatePointerCache,
} from '@/lib/cache/pointer-cache';
import {
  getFromLocalRegistry,
  markAsSynced,
  addToLocalRegistry,
} from '@/lib/cache/local-registry';
import { gunzipSync } from 'zlib';

/**
 * Parse request body, handling both gzip and plain JSON
 */
async function parseRequestBody(request: NextRequest): Promise<any> {
  const contentType = request.headers.get('content-type') || '';
  const contentEncoding = request.headers.get('content-encoding') || '';

  // Handle gzip compressed body
  if (contentType === 'application/gzip' || contentEncoding === 'gzip') {
    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(
      `📦 [Publish] Received compressed payload: ${(buffer.length / 1024).toFixed(1)}KB`
    );

    try {
      const decompressed = gunzipSync(buffer);
      console.log(
        `📦 [Publish] Decompressed to: ${(decompressed.length / 1024).toFixed(1)}KB`
      );
      return JSON.parse(decompressed.toString('utf-8'));
    } catch (error) {
      console.error('Decompression failed:', error);
      throw new Error('Failed to decompress gzip payload');
    }
  }

  // Plain JSON
  return request.json();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const user = authResult.user;

    const { id } = await params;

    // Get course from request body (preferred - has latest editor content)
    // Fallback to getCourse for backward compatibility
    // Supports both gzip compressed and plain JSON
    let course: any;
    try {
      const body = await parseRequestBody(request);
      // Body can be the course directly (from chunked upload) or wrapped in { course }
      if (body.lessons) {
        course = body;
        console.log(
          `📄 [Publish] Using course from request body (${course.lessons?.length} lessons)`
        );
      } else if (body.course && body.course.lessons) {
        course = body.course;
        console.log(
          `📄 [Publish] Using wrapped course from request body (${course.lessons?.length} lessons)`
        );
      }
    } catch {
      // No body or invalid JSON - use fallback
    }

    // Fallback to storage if no body
    if (!course) {
      course = await getCourse(id);
    }

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Convert to blob format
    const { blob, meta, sections } = courseToBlob(course);
    const stats = getBlobStats(blob);

    console.log(
      `📤 [Publish] ${id} (${stats.lessonCount} lessons, ${(stats.sizeBytes / 1024).toFixed(1)}KB)`
    );

    // Upload to Telegram
    if (!isTelegramEnabled()) {
      return NextResponse.json(
        { error: 'Telegram storage not configured' },
        { status: 500 }
      );
    }

    const { file_id, hash } = await uploadCourseBlob(id, blob);
    console.log(`✅ [Telegram] Published ${id} uploaded`);

    // Try to update Firestore (with timeout, non-blocking)
    let firestoreUpdated = false;
    let version = 1;

    const firestoreTimeout = new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), 5000)
    );

    const firestoreUpdate = async () => {
      const admin = initAdmin();
      const db = admin.firestore();
      const docRef = db.collection('courses').doc(id);

      // Get current version
      const docSnap = await docRef.get();
      const currentData = docSnap.data() || {};
      const currentVersion = currentData?.published?.version || 0;
      version = currentVersion + 1;

      // Use set with merge in case doc doesn't exist (local registry course)
      await docRef.set(
        {
          meta,
          sections,
          published: {
            tg_file_id: file_id,
            version: version,
            hash,
            lessonCount: stats.lessonCount,
            blockCount: stats.blockCount,
            publishedAt: new Date().toISOString(),
            publishedBy: user.id,
          },
          draft_snapshot: {
            tg_file_id: file_id,
            version: version,
            hash,
            dirty: false,
          },
          status: 'published',
          isPublished: true,
          updatedAt: new Date().toISOString(),
          createdAt:
            currentData?.createdAt ||
            course.createdAt ||
            new Date().toISOString(),
        },
        { merge: true }
      );

      firestoreUpdated = true;
    };

    try {
      await Promise.race([firestoreUpdate(), firestoreTimeout]);
      console.log(`✅ [Firestore] ${id} published as version ${version}`);
    } catch (firestoreError: any) {
      if (firestoreError?.message === 'Firestore timeout') {
        console.warn(`⚠️ [Firestore] Timeout - published to Telegram only`);
      } else if (
        firestoreError?.code === 8 ||
        firestoreError?.message?.includes('RESOURCE_EXHAUSTED')
      ) {
        console.warn(
          `⚠️ [Firestore] Quota exhausted - published to Telegram only`
        );
      } else {
        console.warn(`⚠️ [Firestore] Error:`, firestoreError?.message);
      }
      // Continue - Telegram succeeded
    }

    // Update pointer cache with new published version
    try {
      updatePointerCache(id, 'published', {
        tg_file_id: file_id,
        version: version,
        hash,
        meta: meta as any,
        sections: sections,
      });

      // Update local registry with the PUBLISHED file_id (very important!)
      // This ensures students can access the published content
      const localEntry = await getFromLocalRegistry(id);
      if (localEntry) {
        // Update the file_id to the new published version
        await addToLocalRegistry(id, file_id, meta as any, sections);
        await markAsSynced(id);
        console.log(`✅ [LocalRegistry] Updated ${id} with published file_id`);
      }
    } catch (cacheError) {
      console.warn('⚠️ [Cache] Could not update:', cacheError);
    }

    return NextResponse.json({
      success: true,
      version: version,
      hash,
      lessonCount: stats.lessonCount,
      blockCount: stats.blockCount,
      firestore_updated: firestoreUpdated,
    });
  } catch (error) {
    console.error('Publish API error:', error);
    return NextResponse.json(
      { error: 'Failed to publish course' },
      { status: 500 }
    );
  }
}
