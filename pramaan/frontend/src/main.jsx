import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import config from './config';
import IdentityProvider from './lib/identity.jsx';
import NucleusHome from './pages/NucleusHome.jsx';
import NucleusDashboard from './pages/NucleusDashboard.jsx';
import './index.css';

const router = (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<NucleusHome />} />
      <Route path="/nucleus" element={<NucleusHome />} />
      <Route path="/nucleus/dashboard" element={<NucleusDashboard />} />
    </Routes>
  </BrowserRouter>
);

// Mount Clerk only when a publishable key is configured (guarded). Without a key
// the app boots normally with auth disabled. The key comes from the centralized
// config layer (the only module that reads import.meta.env).
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {config.isAuthEnabled ? (
      <ClerkProvider publishableKey={config.clerkPublishableKey} afterSignOutUrl="/">
        <IdentityProvider>{router}</IdentityProvider>
      </ClerkProvider>
    ) : (
      <IdentityProvider>{router}</IdentityProvider>
    )}
  </React.StrictMode>
);
