1. The Data Architecture (4-Way Split)

Goal: Maximize performance and minimize payload size.

    course.meta.json: (Hot) ID, Title, Version, Published Status. Smallest file, read most often.

    course.structure.json: (Warm) Section/Lesson ordering and hierarchy. No content.

    lesson.{id}.json: (Cold) Actual editor content. Loaded lazily only when a user opens that specific lesson.

    Assets: (External) Images/Files live in S3/R2/Blob storage. Never inside the JSON.

2. The Asset Pipeline (Strict "No Base64" Rule)

Goal: Prevent JSON bloat and save bandwidth.

    Frontend (Next.js): When a user drops an image into the editor, do not save the base64 to state.

    Immediate Upload: Trigger an upload immediately (e.g., to an R2 Presigned URL).

    Replacement: Receive the public URL https://cdn.../img.webp and insert that into the Editor JSON.

    Save: The final JSON payload sent to the server contains only text and URLs.

3. Concurrency (Optimistic Locking)

Goal: Prevent users from overwriting each other without complex real-time sockets.

    Schema: Every lesson.{id}.json must have a "version": int field.

    Read: Client fetches lesson, stores version: 5 in state.

    Write (Next.js API Route):

        Client sends PUT with { data: ..., version: 5 }.

        Server reads current file.

        Check: if (payload.version !== current.version) return res.status(409).

        Success: If versions match, save file and increment to version: 6.

    UX: On 409 error, show a specific toast: "Newer version exists. Refresh required."

4. Caching Strategy (Next.js Headers)

Goal: ensuring users see updates immediately while caching heavy content.

    meta.json: Control Plane. Cache-Control: no-cache. Always revalidate via ETag to ensure the user sees the latest course version.

    structure.json: Short TTL (e.g., s-maxage=60).

    lesson.{id}.json: Data Plane. Can be cached longer, but rely on the version logic.

    Assets: Long cache (immutable). Cache-Control: public, max-age=31536000, immutable.

5. Maintenance (Garbage Collection)

Goal: Stop paying for storage of images users deleted from the text editor.

    The Problem: User uploads image -> saves -> deletes image from editor -> saves again. The image remains in storage.

    The Fix: A Cron Job (e.g., Vercel Cron).

        Scan all lesson.*.json files.

        Build a set of "Active URLs".

        List files in S3/R2 bucket.

        Delete any file in the bucket that is not in the "Active URLs" set (optionally with a 7-day safety buffer).