import type { Metadata, Viewport } from "next";
import { Inter } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import "./globals.css";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Menuvi - Cardápio Digital Premium',
  description: 'Sistema de pedidos via WhatsApp - v1.0.2',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__NEXT_PUBLIC_SUPABASE_URL = ${JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL)};
              window.__NEXT_PUBLIC_SUPABASE_ANON_KEY = ${JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)};
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
