import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Analyze from './pages/Analyze.jsx';
import Report from './pages/Report.jsx';
import NucleusHome from './pages/NucleusHome.jsx';
import NucleusDashboard from './pages/NucleusDashboard.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* ET Nucleus Routes */}
        <Route path="/" element={<NucleusHome />} />
        <Route path="/nucleus" element={<NucleusHome />} />
        <Route path="/nucleus/dashboard" element={<NucleusDashboard />} />

        {/* Old Pramaan Routes */}
        <Route path="/pramaan" element={<Home />} />
        <Route path="/analyze/:jobId" element={<Analyze />} />
        <Route path="/report/:reportId" element={<Report />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
