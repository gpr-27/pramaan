// Resolve the authoritative user id for a request.
//
// When Clerk is configured AND the request carries a valid Clerk session, we
// trust the VERIFIED Clerk user id (prefixed `clerk_` to match the frontend's
// identity layer) over anything the client claims. Otherwise we fall back to the
// provided id (a guest id from the client). This keeps guests working while
// preventing a signed-in user's data from being keyed by a spoofable client id.
import { getAuth } from '@clerk/express';
import { isClerkConfigured } from '../config/index.js';

export function verifiedClerkUserId(req) {
  if (!isClerkConfigured) return null;
  try {
    const { userId } = getAuth(req);
    return userId ? `clerk_${userId}` : null;
  } catch {
    // clerkMiddleware not active for this request — treat as no session.
    return null;
  }
}

export function resolveUserId(req, fallback) {
  return verifiedClerkUserId(req) || fallback;
}

export default resolveUserId;
