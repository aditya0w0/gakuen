/**
 * Chunked Upload System
 *
 * Splits large payloads into chunks under 3MB to avoid Vercel's 4.5MB limit.
 * Uses a simple multi-part upload protocol:
 *
 * 1. POST /api/admin/upload-chunk?action=init&courseId=xxx&totalChunks=N
 *    Returns: { uploadId }
 *
 * 2. POST /api/admin/upload-chunk?action=chunk&uploadId=xxx&chunkIndex=0
 *    Body: chunk data (gzip compressed)
 *
 * 3. POST /api/admin/upload-chunk?action=complete&uploadId=xxx&operation=checkpoint|publish
 *    Reassembles and processes
 */

// Max chunk size: 3MB (under Vercel's 4.5MB limit with headers overhead)
const MAX_CHUNK_SIZE = 3 * 1024 * 1024;

/**
 * Compress string data using browser's CompressionStream
 */
async function compressString(data: string): Promise<Uint8Array> {
  if (typeof CompressionStream === 'undefined') {
    // Fallback: no compression
    return new TextEncoder().encode(data);
  }

  const encoder = new TextEncoder();
  const inputBytes = encoder.encode(data);

  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(inputBytes);
  writer.close();

  const chunks: Uint8Array[] = [];
  const reader = cs.readable.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

/**
 * Split data into chunks for upload
 */
function splitIntoChunks(data: Uint8Array): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < data.length; i += MAX_CHUNK_SIZE) {
    chunks.push(data.slice(i, i + MAX_CHUNK_SIZE));
  }
  return chunks;
}

/**
 * Upload course data in chunks
 * Returns true if successful
 */
export async function uploadCourseChunked(
  courseId: string,
  course: any,
  operation: 'checkpoint' | 'publish'
): Promise<{ success: boolean; error?: string; result?: any }> {
  try {
    const jsonData = JSON.stringify(course);
    const originalSize = jsonData.length;

    // Try compression first
    const compressed = await compressString(jsonData);
    const compressedSize = compressed.length;

    console.log(
      `📦 [Chunked] ${courseId}: ${(originalSize / 1024).toFixed(0)}KB → ${(compressedSize / 1024).toFixed(0)}KB compressed`
    );

    // If small enough, use direct upload (faster)
    if (compressedSize < MAX_CHUNK_SIZE) {
      console.log(`📤 [Chunked] Small payload, using direct upload`);
      return await directUpload(courseId, compressed, operation);
    }

    // Split into chunks
    const chunks = splitIntoChunks(compressed);
    console.log(`📤 [Chunked] Splitting into ${chunks.length} chunks`);

    // Step 1: Initialize upload
    const initRes = await fetch(
      `/api/admin/upload-chunk?action=init&courseId=${courseId}&totalChunks=${chunks.length}&operation=${operation}`,
      { method: 'POST' }
    );

    if (!initRes.ok) {
      const text = await initRes.text();
      return { success: false, error: `Init failed: ${text}` };
    }

    const { uploadId } = await initRes.json();
    console.log(`📤 [Chunked] Upload ID: ${uploadId}`);

    // Step 2: Upload each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunkRes = await fetch(
        `/api/admin/upload-chunk?action=chunk&uploadId=${uploadId}&chunkIndex=${i}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: chunks[i].buffer.slice(
            chunks[i].byteOffset,
            chunks[i].byteOffset + chunks[i].byteLength
          ) as ArrayBuffer,
        }
      );

      if (!chunkRes.ok) {
        const text = await chunkRes.text();
        return { success: false, error: `Chunk ${i} failed: ${text}` };
      }

      console.log(`📤 [Chunked] Chunk ${i + 1}/${chunks.length} uploaded`);
    }

    // Step 3: Complete upload
    const completeRes = await fetch(
      `/api/admin/upload-chunk?action=complete&uploadId=${uploadId}`,
      { method: 'POST' }
    );

    if (!completeRes.ok) {
      const text = await completeRes.text();
      return { success: false, error: `Complete failed: ${text}` };
    }

    const result = await completeRes.json();
    console.log(`✅ [Chunked] Upload complete`);

    return { success: true, result };
  } catch (error) {
    console.error('[Chunked] Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Direct upload for small payloads
 */
async function directUpload(
  courseId: string,
  compressed: Uint8Array,
  operation: 'checkpoint' | 'publish'
): Promise<{ success: boolean; error?: string; result?: any }> {
  const endpoint =
    operation === 'checkpoint'
      ? `/api/admin/checkpoint?courseId=${courseId}`
      : `/api/courses/${courseId}/publish`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/gzip',
      'Content-Encoding': 'gzip',
    },
    body: compressed.buffer.slice(
      compressed.byteOffset,
      compressed.byteOffset + compressed.byteLength
    ) as ArrayBuffer,
  });

  if (!response.ok) {
    const text = await response.text();
    return { success: false, error: `${response.status}: ${text}` };
  }

  const result = await response.json();
  return { success: true, result };
}
