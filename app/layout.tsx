import type { Metadata, Viewport } from 'next'
import './globals.css'
import ScrollObserver from '@/components/ScrollObserver'
import QueryProvider from '@/providers/QueryProvider'
import { Toaster } from 'react-hot-toast'

export const viewport: Viewport = {
  themeColor: '#060611',
}

export const metadata: Metadata = {
  title: 'VOTEX — Next-Gen Election Platform',
  description: 'Enterprise-grade election management platform. Secure, transparent, scalable — from college polls to national elections.',
  manifest: '/manifest.json',
  appleWebApp: {
    title: 'VOTEX',
    statusBarStyle: 'black-translucent',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
        <QueryProvider>
          <ScrollObserver />
          <div className="grid-bg" />
          <div className="noise" />
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#0e0e24',
                color: '#e2e8f0',
                border: '1px solid rgba(0,212,255,0.2)',
                borderRadius: '10px',
                fontSize: '13px',
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  )
}