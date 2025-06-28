'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';
import '@rainbow-me/rainbowkit/styles.css';
import { useState, useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-gradient-to-br from-warm-white to-lime-lush/10 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-teal-deep border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={{
            lightMode: lightTheme({
              accentColor: '#D0F66A',
              accentColorForeground: '#1E5287',
              borderRadius: 'medium',
              fontStack: 'system',
            }),
            darkMode: darkTheme({
              accentColor: '#D0F66A',
              accentColorForeground: '#1E5287',
              borderRadius: 'medium',
              fontStack: 'system',
            }),
          }}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}