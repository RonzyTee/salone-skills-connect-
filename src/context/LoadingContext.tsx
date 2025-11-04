'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of the context's value
interface LoadingContextType {
  isLoading: boolean;
  showLoader: () => void;
  hideLoader: () => void;
}

// Create the context with a default value of undefined
const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// Create the provider component
export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  const showLoader = () => setIsLoading(true);
  const hideLoader = () => setIsLoading(false);

  const value = {
    isLoading,
    showLoader,
    hideLoader,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

// Create the custom hook to use the context
export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    // This error is what you were seeing!
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}