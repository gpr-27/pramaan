import React from 'react';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import config from '../config';

// Guarded Clerk auth UI.
//
// When no VITE_CLERK_PUBLISHABLE_KEY is configured, <ClerkProvider> is NOT mounted
// (see main.jsx), so the Clerk components have no provider — this component returns
// null and the app renders normally. Once a key is set, the buttons light up and
// link to the dedicated /login and /sign-up pages.
export default function ClerkAuthButtons() {
  if (!config.isAuthEnabled) return null;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <SignedOut>
        <Link
          to="/login"
          className="whitespace-nowrap rounded-[2px] border border-line-strong px-2.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper sm:px-3.5 sm:text-sm"
        >
          Sign in
        </Link>
        <Link
          to="/sign-up"
          className="whitespace-nowrap rounded-[2px] bg-accent px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-ink sm:px-3.5 sm:text-sm"
        >
          Sign up
        </Link>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  );
}
