import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { cn } from '@/src/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AgentOS - Multi-Agent Operating System',
  description: 'A modern operating system designed for AI agents - enabling seamless collaboration between specialized AI agents for complex task execution.',
  keywords: 'AI, agents, multi-agent system, collaboration, automation, development',
  authors: [{ name: 'AgentOS Team' }],
  creator: 'AgentOS',
  publisher: 'AgentOS',
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={cn(
        inter.className,
        'h-full bg-gray-50 text-gray-900 antialiased'
      )}>
        <div className="min-h-full">
          {children}
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#f9fafb',
            },
          }}
        />
      </body>
    </html>
  );
}