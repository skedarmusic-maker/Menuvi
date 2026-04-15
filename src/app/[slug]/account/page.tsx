'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { ShoppingBag, MapPin, User, LogOut, ChevronLeft, Clock, RotateCcw, CheckCircle2, ChevronRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import Image from 'next/image';

export default function CustomerAccountPage() {
  const { slug } = useParams();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const { addToCart } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [restaurant, setRestaurant] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${slug}/login`);
        return;
      }
      setUser(user);

      // Buscar Restaurante
      const { data: rest } = await supabase.from('restaurants').select('*').eq('slug', slug).single();
      setRestaurant(rest);

      // Buscar Perfil
      const { data: prof } = await supabase.from('customer_profiles').select('*').eq('id', user.id).single();
      setProfile(prof);

      // Buscar Pedidos
      const { data: ords } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      setOrders(ords || []);
      
      setLoading(false);
    }
    loadData();
  }, [supabase, slug, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${slug}`);
  };

  const repeatOrder = (order: any) => {
    order.order_items.forEach((item: any) => {
      addToCart({
        id: item.product_id || Math.random().toString(),
        name: item.products?.name || 'Produto',
        price: item.unit_price,
        quantity: item.quantity,
        observations: item.observations,
        image_url: item.products?.image_url
      });
    });
    router.push(`/${slug}`); // Volta para o cardápio com itens na sacola
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><ShoppingBag className="w-8 h-8 animate-bounce text-orange-500" /></div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-6 sticky top-0 z-10 flex items-center justify-between">
        <Link href={`/${slug}`} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </Link>
        <h1 className="text-xl font-black text-gray-900">Minha Conta</h1>
        <button onClick={handleLogout} className="p-2 hover:bg-red-50 rounded-full text-red-500 transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-md mx-auto p-6 space-y-8">
        {/* Boas vindas */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center text-white text-2xl font-black">
            {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Olá, {profile?.full_name?.split(' ')[0] || 'Cliente'}!</h2>
            <p className="text-gray-500 text-sm">{user.email}</p>
          </div>
        </div>

        {/* Endereço Salvo */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
             <h3 className="font-bold text-gray-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-500" /> Endereço Favorito</h3>
             <Link href={`/${slug}/account/edit`} className="text-xs font-bold text-orange-500">Editar</Link>
          </div>
          {profile?.address_street ? (
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-gray-700 font-medium">{profile.address_street}, {profile.address_number}</p>
              <p className="text-gray-500 text-xs mt-1">{profile.neighborhood} - {profile.cep}</p>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-100 p-5 rounded-3xl text-center">
              <p className="text-orange-700 text-sm font-medium">Nenhum endereço salvo ainda.</p>
              <Link href={`/${slug}/account/edit`} className="inline-block mt-2 text-xs font-black uppercase text-orange-600">Configurar agora</Link>
            </div>
          )}
        </section>

        {/* Histórico de Pedidos */}
        <section className="space-y-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" /> Meus Pedidos</h3>
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Você ainda não fez nenhum pedido.</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pedido #{order.id.slice(0, 4)}</span>
                        <div className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          order.status === 'finished' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                        }`}>
                          {order.status === 'finished' ? 'CONCLUÍDO' : 'EM ANDAMENTO'}
                        </div>
                      </div>
                      <p className="font-bold text-gray-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')} às {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button 
                      onClick={() => repeatOrder(order)}
                      className="flex items-center gap-1.5 bg-orange-500 text-white px-4 py-2 rounded-2xl text-xs font-black shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                    >
                      <RotateCcw className="w-3 h-3" /> Repetir
                    </button>
                  </div>
                  
                  {/* Mini lista de itens */}
                  <div className="bg-gray-50/50 px-5 py-3 border-t border-gray-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Itens:</p>
                    <div className="flex flex-wrap gap-2">
                       {order.order_items.map((it: any) => (
                         <span key={it.id} className="text-[10px] bg-white border border-gray-100 px-2 py-1 rounded-lg text-gray-600 font-medium">
                           {it.quantity}x {it.products?.name || 'Item'}
                         </span>
                       ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
