import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import "./globals.css";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Menuvi - Cardápio Digital Premium",
  description: "Crie seu cardápio digital e receba pedidos pelo WhatsApp",
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
