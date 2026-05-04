'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { CheckCircle2, Clock, Package, Truck, Check, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

const STATUS_STEPS = [
  { id: 'new', label: 'Recebido', icon: Clock, color: 'text-blue-500' },
  { id: 'accepted', label: 'Aceito', icon: CheckCircle2, color: 'text-purple-500' },
  { id: 'preparing', label: 'Preparando', icon: Package, color: 'text-orange-500' },
  { id: 'delivering', label: 'Em Entrega', icon: Truck, color: 'text-yellow-500' },
  { id: 'finished', label: 'Entregue', icon: Check, color: 'text-green-500' },
];

export default function OrderStatusPage() {
  const { id } = useParams();
  const supabase = createSupabaseBrowserClient();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      const { data, error } = await supabase
        .from('orders')
        .select('*, restaurants(name, theme_color, logo_url)')
        .eq('id', id)
        .single();

      if (!error) {
        setOrder(data);
      }
      setLoading(false);
    }

    fetchOrder();

    // Inscrição Realtime para atualizações de status
    const channel = supabase
      .channel(`order-status-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        (payload) => {
          setOrder((current: any) => ({ ...current, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-white font-black text-2xl mb-4">Pedido não encontrado</h1>
        <Link href="/" className="text-orange-500 font-bold hover:underline">Voltar para o início</Link>
      </div>
    );
  }

  const currentStatusIndex = STATUS_STEPS.findIndex(s => s.id === order.status);
  const themeColor = order.restaurants?.theme_color || '#ef4444';

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Header */}
      <div className="bg-gray-900/50 border-b border-gray-800 p-6 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="font-black text-xl leading-none">{order.restaurants?.name}</h1>
              <p className="text-gray-500 text-xs mt-1 uppercase font-bold tracking-widest">Pedido #{order.id.slice(0, 4).toUpperCase()}</p>
            </div>
          </div>
          {order.restaurants?.logo_url && (
            <img src={order.restaurants.logo_url} alt="Logo" className="w-10 h-10 rounded-xl object-cover" />
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Status Visual */}
        <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[60px] rounded-full -mr-16 -mt-16"></div>
          
          <div className="relative z-10 space-y-8">
            <div className="flex flex-col items-center text-center">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mb-4 animate-pulse"
                style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
              >
                {(() => {
                  const Icon = STATUS_STEPS[currentStatusIndex]?.icon || Clock;
                  return <Icon className="w-10 h-10" />;
                })()}
              </div>
              <h2 className="text-2xl font-black">{STATUS_STEPS[currentStatusIndex]?.label}</h2>
              <p className="text-gray-400 text-sm mt-2">
                {order.status === 'new' && 'O restaurante recebeu seu pedido e logo irá confirmar.'}
                {order.status === 'accepted' && 'Pedido aceito! Logo entraremos em produção.'}
                {order.status === 'preparing' && 'Seu pedido está sendo preparado com muito carinho.'}
                {order.status === 'delivering' && 'O entregador já está a caminho do seu endereço.'}
                {order.status === 'finished' && 'Pedido entregue! Bom apetite! 🎉'}
                {order.status === 'canceled' && 'Este pedido foi cancelado pelo restaurante.'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="relative flex justify-between items-center mt-12 px-2">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-800 rounded-full z-0"></div>
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full z-0 transition-all duration-1000 ease-out"
                style={{ 
                  backgroundColor: themeColor,
                  width: `${(currentStatusIndex / (STATUS_STEPS.length - 1)) * 100}%` 
                }}
              ></div>

              {STATUS_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;

                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                        isCompleted ? 'scale-110 shadow-lg' : 'bg-gray-800 text-gray-600 scale-90'
                      }`}
                      style={{ 
                        backgroundColor: isCompleted ? themeColor : undefined,
                        color: isCompleted ? 'white' : undefined
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detalhes do Pedido */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 ml-2">Detalhes da Entrega</h3>
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-gray-800 p-3 rounded-2xl">
                <Truck className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Endereço</p>
                <p className="text-sm mt-1">{order.customer_address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 ml-2">Resumo do Pagamento</h3>
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-gray-800 p-2 rounded-xl">
                  <Clock className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-bold">
                    {order.payment_method === 'online_pix' ? 'PIX (PELO APP)' :
                     order.payment_method === 'online_credit_card' ? 'CARTÃO DE CRÉDITO (PELO APP)' :
                     order.payment_method === 'delivery_pix' ? 'PIX NA ENTREGA' :
                     order.payment_method === 'delivery_cash' ? 'DINHEIRO NA ENTREGA' :
                     order.payment_method === 'delivery_card' ? 'CARTÃO NA ENTREGA' :
                     order.payment_method.toUpperCase()}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase font-black">{order.payment_status === 'paid' ? 'Pago' : 'Pendente'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black" style={{ color: themeColor }}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-8">
          <Link 
            href="/"
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
          >
            Fazer outro pedido
          </Link>
        </div>
      </div>
    </div>
  );
}
