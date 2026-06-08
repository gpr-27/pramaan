import React from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

// Dedicated, themed login / sign-up pages backed by Clerk. Mounted only when
// auth is enabled (see main.jsx). Guests can always skip back to the app.
//
// Clerk uses path routing here, so these routes are registered as `/login/*`
// and `/sign-up/*` to let Clerk own its internal sub-steps (factor-one, etc.).
const appearance = {
  variables: {
    colorPrimary: '#d8381a',
    colorText: '#1b1714',
    colorBackground: '#fffdf9',
    borderRadius: '2px',
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
  },
  elements: {
    card: 'shadow-none border border-line',
    headerTitle: 'font-display',
  },
};

export default function AuthPage({ mode }) {
  const isSignIn = mode === 'signIn';

  return (
    <div className="relative z-10 min-h-screen">
      <header className="border-b-2 border-ink">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-[2px] bg-accent font-display text-lg font-bold text-white">N</span>
            <span className="font-display text-xl font-semibold tracking-tight text-ink">ET Nucleus</span>
          </Link>
          <Link to="/" className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-soft transition-colors hover:text-accent">
            Continue as guest →
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col items-center px-4 py-10 sm:px-6 sm:py-16">
        <p className="kicker mb-3">{isSignIn ? 'Welcome back' : 'Create your edition'}</p>
        <h1 className="mb-8 max-w-2xl text-center font-display text-[clamp(1.8rem,6vw,2.6rem)] font-semibold leading-tight tracking-tight text-ink">
          {isSignIn ? 'Sign in to ET Nucleus' : 'Join ET Nucleus'}
        </h1>

        {isSignIn ? (
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/"
            appearance={appearance}
          />
        ) : (
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/login"
            fallbackRedirectUrl="/"
            appearance={appearance}
          />
        )}
      </main>
    </div>
  );
}
