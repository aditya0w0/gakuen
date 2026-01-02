import { firebaseAuth } from "@/lib/firebase/auth";

/**
 * A wrapper around fetch that automatically handles 401 Unauthorized errors
 * by attempting to refresh the session cookie using the Firebase Client SDK.
 * 
 * Use this for all API calls that require authentication.
 */
export async function authenticatedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {

    // First attempt
    let response = await fetch(input, init);

    // If 401 Authorization error
    if (response.status === 401) {
        // Try to refresh the session
        const refreshed = await firebaseAuth.refreshSession();

        if (refreshed) {
            // Retry the original request
            response = await fetch(input, init);
        }
    }

    return response;
}
