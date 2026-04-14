import Link from 'next/link';
import { UtensilsCrossed, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col">
      {/* Navbar simplificada */}
      <nav className="w-full border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <UtensilsCrossed className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">Menuvi</span>
          </div>
          <Link 
            href="/login"
            className="text-sm font-bold text-white bg-gray-800 hover:bg-gray-700 px-6 py-2.5 rounded-full transition-colors"
          >
            Acessar Painel
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center mt-20 mb-32 relative">
        {/* Efeito de luz no fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 font-bold text-sm mb-8 z-10">
          <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
          Sistema de Pedidos via WhatsApp
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight max-w-4xl z-10 leading-[1.1]">
          O fim do cardápio em PDF chegou.
        </h1>
        
        <p className="text-gray-400 text-lg md:text-xl mt-6 max-w-2xl z-10">
          Crie um cardápio digital premium em minutos, receba pedidos organizados direto no seu WhatsApp e aumente suas vendas. Sem taxas por pedido.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 z-10">
          <Link 
            href="/login"
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold px-8 py-4 rounded-xl hover:scale-105 transition-transform shadow-xl shadow-orange-500/20"
          >
            Criar meu cardápio grátis <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-gray-500 text-sm sm:hidden mt-2">Menos de 2 minutos para configurar.</p>
        </div>
      </div>
    </main>
  );
}
