// src/components/ui/GlobalLoaderOverlay.tsx
'use client'; // This directive makes it a Client Component

import React from 'react';
import { useLoading } from '@/context/LoadingContext'; // Import your custom loading hook
import Loader from './loader'; // Assuming your generic Loader component is here

const GlobalLoaderOverlay = () => {
  const { isLoading } = useLoading();

  if (!isLoading) {
    return null; // Don't render anything if not loading
  }

  // Render a full-screen overlay loader when isLoading is true
  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[9999]">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
      <p className="text-white text-lg">Loading...</p>
      {/* You can use your existing Loader component here if it's full-screen */}
      {/* <Loader /> */} 
    </div>
  );
};

export default GlobalLoaderOverlay;