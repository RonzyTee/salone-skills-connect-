// src/app/layout.tsx
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LoadingProvider } from '@/context/LoadingContext';
import { Toaster } from 'react-hot-toast';
import GlobalLoaderOverlay from '@/components/ui/GlobalLoaderOverlay'; // <-- Import the new client component

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Salone SkillsLink',
  description: 'Open Innovation Verification Protocol',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white`}>
        <AuthProvider>
          <LoadingProvider>
            
            <Toaster
              position="bottom-center"
              toastOptions={{
                style: {
                  background: '#262626',
                  color: '#fff',
                  fontSize: '15px',
                  padding: '14px',
                },
              }}
            />
            
            {children}

            {/* Render the GlobalLoaderOverlay here. 
                It's a Client Component, so it can use useLoading() internally. */}
            <GlobalLoaderOverlay /> 

          </LoadingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}