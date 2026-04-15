'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Share2, Power, RefreshCw } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';

export default function MobileHeader({ restaurant }: { restaurant: any }) {
  const [shareLink, setShareLink] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    setShareLink(`${window.location.origin}/${restaurant.slug}`);
  }, [restaurant.slug]);

  const handleShare = async () => {
    if (!shareLink) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: restaurant.name,
          text: `Confira nosso cardápio digital: ${restaurant.name}`,
          url: shareLink,
        });
      } catch (err) {
        console.log('Erro ao compartilhar', err);
      }
    } else {
      // Fallback para copiar link
      navigator.clipboard.writeText(shareLink);
      alert('Link copiado para a área de transferência!');
    }
  };

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      await supabase
        .from('restaurants')
        .update({ is_open: !restaurant.is_open })
        .eq('id', restaurant.id);
      
      router.refresh();
      window.location.reload();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <header className="lg:hidden bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex flex-col">
        <h1 className="text-white font-black text-lg leading-tight truncate max-w-[150px]">
          {restaurant.name}
        </h1>
        <button 
          onClick={handleToggle}
          disabled={isUpdating}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all active:scale-95 ${
            restaurant.is_open 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {isUpdating ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <Power className="w-3 h-3" />
          )}
          <span className="text-[10px] uppercase font-black tracking-widest">
            {restaurant.is_open ? 'Aberta' : 'Fechada'}
          </span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <a 
          href={`/${restaurant.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-gray-700"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Cardápio
        </a>
        <button 
          onClick={handleShare}
          className="bg-orange-500 hover:bg-orange-400 text-white p-2.5 rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95"
          title="Compartilhar Link"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
