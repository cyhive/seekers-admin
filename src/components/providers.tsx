
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { ModalProvider } from '@/context/modal-context';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    
      <ModalProvider>
        {children}
      </ModalProvider>
    
  );
}
