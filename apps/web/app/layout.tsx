import type { Metadata } from 'next';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/service-worker-register';

export const metadata: Metadata = {
  title: 'VibeVote',
  description: 'A fair group decision, in minutes.',
  applicationName: 'VibeVote',
  appleWebApp: { capable: true, title: 'VibeVote', statusBarStyle: 'default' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
