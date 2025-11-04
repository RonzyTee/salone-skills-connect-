// src/components/ui/GlobalLoader.tsx
import React from 'react';

const GlobalLoader = () => (
  <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[9999]">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
    <p className="text-white text-lg">Loading Page...</p>
  </div>
);

export default GlobalLoader;