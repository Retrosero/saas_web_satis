import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { router } from './router';
import { queryClient } from './lib/query-client';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { fontSize: '14px', borderRadius: '15px', padding: '12px 16px' },
          success: { iconTheme: { primary: '#0D9488', secondary: '#fff' } },
          error: { iconTheme: { primary: '#BA1A1A', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  );
}
