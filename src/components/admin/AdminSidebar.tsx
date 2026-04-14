'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Settings,
  BarChart3,
  LogOut,
  ExternalLink,
  Power,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Pedidos', icon: LayoutDashboard },
  { href: '/admin/menu', label: 'Cardápio', icon: UtensilsCrossed },
  { href: '/admin/analytics', label: 'Relatórios', icon: BarChart3 },
  { href: '/admin/settings', label: 'Configurações', icon: Settings },
];

export default function AdminSidebar({ restaurant }: { restaurant: any }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <UtensilsCrossed className="text-white w-5 h-5" />
          </div>
          <div>
            <p className="text-white font-black text-sm leading-tight">{restaurant.name}</p>
            <p className="text-gray-500 text-xs">Painel ADM</p>
          </div>
        </div>
      </div>

      {/* Status Aberto/Fechado */}
      <div className="px-4 py-4 border-b border-gray-800">
        <StoreToggle restaurant={restaurant} />
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Rodapé */}
      <div className="px-3 py-4 border-t border-gray-800 space-y-1">
        <a
          href={`/${restaurant.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-all"
        >
          <ExternalLink className="w-5 h-5" />
          Ver Cardápio
        </a>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </aside>
  );
}

// Sub-componente para toggle de status da loja
function StoreToggle({ restaurant }: { restaurant: any }) {
  const handleToggle = async () => {
    await supabase
      .from('restaurants')
      .update({ is_open: !restaurant.is_open })
      .eq('id', restaurant.id);
    window.location.reload();
  };

  return (
    <button
      onClick={handleToggle}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
        restaurant.is_open
          ? 'bg-green-500/10 border-green-500/20 text-green-400'
          : 'bg-red-500/10 border-red-500/20 text-red-400'
      }`}
    >
      <div className="flex items-center gap-2">
        <Power className="w-4 h-4" />
        <span>{restaurant.is_open ? 'Loja Aberta' : 'Loja Fechada'}</span>
      </div>
      <div className={`w-8 h-4 rounded-full transition-colors relative ${restaurant.is_open ? 'bg-green-500' : 'bg-gray-600'}`}>
        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${restaurant.is_open ? 'left-4' : 'left-0.5'}`} />
      </div>
    </button>
  );
}
