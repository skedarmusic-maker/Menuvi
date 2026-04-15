'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { Shield, LayoutDashboard, Store, LogOut } from 'lucide-react';

const navItems = [
  { href: '/superadmin', label: 'Monitor', icon: LayoutDashboard },
  { href: '/superadmin/stores', label: 'Lojas', icon: Store },
];

export default function SuperAdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 flex-col z-40">
        <div className="px-6 py-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="text-white w-5 h-5" />
            </div>
            <div>
              <p className="text-white font-black text-sm leading-tight">Master Admin</p>
              <p className="text-gray-500 text-xs">Visão Macro</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] bg-gray-900/90 backdrop-blur-xl border border-gray-800 rounded-2xl flex items-center justify-around px-2 py-3 z-50 shadow-2xl">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 transition-all ${
                isActive ? 'text-indigo-500' : 'text-gray-500'
              }`}
            >
              <div className={`p-2 rounded-xl ${isActive ? 'bg-indigo-500/10' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 text-gray-500"
        >
          <div className="p-2">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Sair</span>
        </button>
      </nav>
    </>
  );
}
