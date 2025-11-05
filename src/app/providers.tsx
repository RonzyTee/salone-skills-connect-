// src/app/providers.tsx
'use client';

// Import AuthProvider from its existing location
import { AuthProvider } from '@/context/AuthContext';
import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // Just return your AuthProvider here
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}