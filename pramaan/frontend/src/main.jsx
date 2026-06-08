import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import axios from 'axios';
import config from './config';
import IdentityProvider from './lib/identity.jsx';
import NucleusHome from './pages/NucleusHome.jsx';
import NucleusDashboard from './pages/NucleusDashboard.jsx';
import AuthPage from './pages/AuthPage.jsx';
import './index.css';

// Attach the Clerk session token to every API request so the backend can verify
// the signed-in user (and key their persona by the trusted Clerk id). No-op for
// guests and when Clerk is disabled — requests just go out unauthenticated.
axios.interceptors.request.use(async (cfg) => {
  try {
    const clerk = typeof window !== 'undefined' ? window.Clerk : undefined;
    if (clerk?.session) {
      const token = await clerk.session.getToken();
      if (token) {
        cfg.headers = cfg.headers || {};
        cfg.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    /* no session / Clerk not ready — proceed unauthenticated */
  }
  return cfg;
});

const authEnabled = config.isAuthEnabled;

const router = (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<NucleusHome />} />
      <Route path="/nucleus" element={<NucleusHome />} />
      <Route path="/nucleus/dashboard" element={<NucleusDashboard />} />
      {/* Dedicated login / sign-up pages (path routing → Clerk owns sub-steps).
          When auth is disabled, these redirect home so guests are never stuck. */}
      <Route
        path="/login/*"
        element={authEnabled ? <AuthPage mode="signIn" /> : <Navigate to="/" replace />}
      />
      <Route
        path="/sign-up/*"
        element={authEnabled ? <AuthPage mode="signUp" /> : <Navigate to="/" replace />}
      />
    </Routes>
  </BrowserRouter>
);

// Mount Clerk only when a publishable key is configured (guarded). Without a key
// the app boots normally with auth disabled. The key comes from the centralized
// config layer (the only module that reads import.meta.env).
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {authEnabled ? (
      <ClerkProvider publishableKey={config.clerkPublishableKey} afterSignOutUrl="/">
        <IdentityProvider>{router}</IdentityProvider>
      </ClerkProvider>
    ) : (
      <IdentityProvider>{router}</IdentityProvider>
    )}
  </React.StrictMode>
);
