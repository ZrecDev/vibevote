import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/service-worker-register';

export const metadata: Metadata = {
  title: {
    default: 'VibeVote — decide together',
    template: '%s · VibeVote',
  },
  description: 'Private group decisions, without the group chat spiral.',
  applicationName: 'VibeVote',
  icons: {
    icon: '/icons/vibevote.svg',
    shortcut: '/icons/vibevote.svg',
    apple: '/icons/vibevote.svg',
  },
  appleWebApp: { capable: true, title: 'VibeVote', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f0' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0f12' },
  ],
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
