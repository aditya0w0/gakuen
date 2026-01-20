/**
 * Course Metadata API
 * 
 * Returns lightweight course metadata for cache validation.
 * Does NOT include full lesson content.
 * 
 * Used by client to check version before downloading full blob.
 */

import { NextRequest, NextResponse } from 'next/server';
import { initAdmin } from '@/lib/auth/firebase-admin';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const admin = initAdmin();
        const db = admin.firestore();

        const docSnap = await db.collection('courses').doc(id).get();

        if (!docSnap.exists) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            );
        }

        const data = docSnap.data()!;

        // Return minimal metadata for cache validation
        const metadata = {
            id,
            meta: data.meta || {
                title: data.title,
                description: data.description,
                thumbnail: data.thumbnail,
                instructor: data.instructor,
                category: data.category,
                level: data.level,
                duration: data.duration,
            },
            sections: data.sections || [],
            published: data.published ? {
                version: data.published.version,
                hash: data.published.hash,
                lessonCount: data.published.lessonCount,
                blockCount: data.published.blockCount,
                publishedAt: data.published.publishedAt,
            } : null,
            draft_snapshot: data.draft_snapshot ? {
                version: data.draft_snapshot.version,
                savedAt: data.draft_snapshot.savedAt,
                dirty: data.draft_snapshot.dirty,
            } : null,
            status: data.status || (data.isPublished ? 'published' : 'draft'),
            structure_version: data.structure_version || 0,
        };

        return NextResponse.json(metadata, {
            headers: {
                'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
            },
        });
    } catch (error) {
        console.error('Course metadata API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
