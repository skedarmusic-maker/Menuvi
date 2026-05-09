import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import "./globals.css";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Menuvi - Cardápio Digital Premium',
  description: 'Sistema de pedidos via WhatsApp',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1', // v1.0.1 - cache bust
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
