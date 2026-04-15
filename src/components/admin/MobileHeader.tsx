'use client';

import { ExternalLink, Share2 } from 'lucide-react';

export default function MobileHeader({ restaurant }: { restaurant: any }) {
  const shareLink = `${window.location.origin}/${restaurant.slug}`;

  const handleShare = async () => {
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

  return (
    <header className="lg:hidden bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex flex-col">
        <h1 className="text-white font-black text-lg leading-tight truncate max-w-[150px]">
          {restaurant.name}
        </h1>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${restaurant.is_open ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">
            {restaurant.is_open ? 'Aberta' : 'Fechada'}
          </span>
        </div>
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
