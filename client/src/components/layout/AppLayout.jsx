import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-neo-cream text-black flex flex-col font-sans selection:bg-neo-yellow selection:text-black">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="bg-neo-cream border-t-3 border-black py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-gray-700">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black inline-block animate-pulse"></span>
            <span>MeetingOS — Evidence-First Meeting Intelligence Engine</span>
          </div>
          <div className="flex items-center gap-4 text-black">
            <span className="font-mono bg-white px-2 py-0.5 border border-black rounded shadow-neo-xs">
              Evidence &gt; Confidence
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
