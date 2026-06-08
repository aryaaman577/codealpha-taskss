import './globals.css';
import type { Metadata } from 'next';
import Providers from '@/components/providers';

const inter = {
  variable: 'font-inter',
  className: 'font-inter',
};

const sora = {
  variable: 'font-sora',
};

const jetbrainsMono = {
  variable: 'font-jetbrains',
};

const instrumentSerif = {
  variable: 'font-instrument',
};

export const metadata: Metadata = {
  title: 'SyncSpace - Premium Unified Workspace',
  description: 'The premium unified workspace for meetings, chat, whiteboard, and collaboration. One calm space for your entire team.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${sora.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable}`}
    >
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
