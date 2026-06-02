import React, { createContext, useContext, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import config from '../config';

// ─────────────────────────────────────────────────────────────────────────────
// Identity layer — "continuous guest" on top of Clerk login.
//
// Every visitor has a stable identity:
//   • Guest  → a persistent id in localStorage ('et_nucleus_guest_id'). The app
//              works fully without signing in, and the same guest persists across
//              reloads/sessions ("continuous guest").
//   • Signed in (Clerk) → the Clerk user id, so their edition follows the account.
//
// useIdentity() returns the SAME shape whether Clerk is enabled or not, so pages
// never branch on auth. When Clerk is disabled (no publishable key), only the
// guest path is used and no Clerk hook is ever called.
// ─────────────────────────────────────────────────────────────────────────────

const GUEST_ID_KEY = 'et_nucleus_guest_id';
const GUEST_NAME_KEY = 'et_nucleus_user_name';
const LEGACY_ID_KEY = 'et_nucleus_user_id'; // pre-guest-feature key — adopt it so existing data isn't lost

export function getOrCreateGuestId() {
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    const legacy = localStorage.getItem(LEGACY_ID_KEY);
    id = legacy || `guest_${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now()}`;
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

const IdentityContext = createContext(null);

export function useIdentity() {
  return useContext(IdentityContext);
}

// Guest-only provider (used when Clerk is disabled). No Clerk hook is called.
function GuestIdentityProvider({ children }) {
  const guestId = useMemo(() => getOrCreateGuestId(), []);
  const value = useMemo(() => ({
    ready: true,
    authEnabled: false,
    isSignedIn: false,
    isGuest: true,
    mode: 'guest',
    userId: guestId,
    guestId,
    displayName: localStorage.getItem(GUEST_NAME_KEY) || '',
  }), [guestId]);
  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

// Clerk-backed provider (rendered ONLY inside <ClerkProvider>, so useUser is safe).
function ClerkIdentityProvider({ children }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const guestId = useMemo(() => getOrCreateGuestId(), []);

  const value = useMemo(() => {
    if (isSignedIn && user) {
      const displayName =
        user.firstName ||
        user.fullName ||
        user.username ||
        user.primaryEmailAddress?.emailAddress?.split('@')[0] ||
        'Reader';
      return {
        ready: isLoaded,
        authEnabled: true,
        isSignedIn: true,
        isGuest: false,
        mode: 'user',
        userId: `clerk_${user.id}`,
        guestId,
        displayName,
      };
    }
    return {
      ready: isLoaded,
      authEnabled: true,
      isSignedIn: false,
      isGuest: true,
      mode: 'guest',
      userId: guestId,
      guestId,
      displayName: localStorage.getItem(GUEST_NAME_KEY) || '',
    };
  }, [isLoaded, isSignedIn, user, guestId]);

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export default function IdentityProvider({ children }) {
  return config.isAuthEnabled
    ? <ClerkIdentityProvider>{children}</ClerkIdentityProvider>
    : <GuestIdentityProvider>{children}</GuestIdentityProvider>;
}
