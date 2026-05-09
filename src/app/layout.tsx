import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'cram',
  description: 'Blueprint-first SAA-C03 study coach'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
