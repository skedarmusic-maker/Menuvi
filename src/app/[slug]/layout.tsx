import { ReactNode } from 'react';

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      {/* Container mobile-first (max largura em desktops) */}
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl relative pb-24">
        {children}
      </div>
    </div>
  );
}
