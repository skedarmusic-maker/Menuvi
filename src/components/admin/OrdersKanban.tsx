'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { Clock, User, MapPin, Package, Truck, CheckCircle, XCircle, ChevronDown, MessageCircle, Paperclip, Eye, Upload, Loader2, FileText, Volume2, VolumeX, Printer } from 'lucide-react';
import { useEffect, useRef } from 'react';
import Image from 'next/image';

const STATUS_CONFIG = {
  new: { label: 'Novos', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400' },
  accepted: { label: 'Em Preparo', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', dot: 'bg-orange-400' },
  delivering: { label: 'Saiu p/ Entrega', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', dot: 'bg-purple-400' },
  finished: { label: 'Finalizado', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', dot: 'bg-green-400' },
  canceled: { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', dot: 'bg-red-400' },
} as const;

type OrderStatus = keyof typeof STATUS_CONFIG;

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  observations?: string;
  products: { name: string } | null;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  payment_method: string;
  status: OrderStatus;
  created_at: string;
  pix_confirmed: boolean;
  pix_receipt_url: string | null;
  order_items: OrderItem[];
  driver_id: string | null;
  customer_id: string | null;
}

const NEXT_STATUS: Record<string, OrderStatus> = {
  new: 'accepted',
  accepted: 'delivering',
  delivering: 'finished',
};

export default function OrdersKanban({ initialOrders }: { initialOrders: Order[] }) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Busca entregadores
  useEffect(() => {
     async function loadDrivers() {
        const { data } = await supabase.from('drivers').select('*').eq('is_active', true);
        setDrivers(data || []);
     }
     loadDrivers();
  }, [supabase]);

  // Monitoramento em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          console.log('🔔 Novo pedido recebido via Realtime:', payload.new);
          
          // Busca os itens do pedido que acabou de chegar
          const { data: newOrderData } = await supabase
            .from('orders')
            .select('*, order_items(*, products(name))')
            .eq('id', payload.new.id)
            .single();

          if (newOrderData) {
            setOrders((prev) => [newOrderData as Order, ...prev]);
            
            // Tocar som se habilitado
            if (soundEnabled && audioRef.current) {
               audioRef.current.play().catch(e => console.log('Erro ao tocar som:', e));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          setOrders((prev) => 
            prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, soundEnabled]);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Lógica de Fidelidade: Se o pedido for finalizado e tiver cliente, adiciona ponto
      if (newStatus === 'finished') {
        const order = orders.find(o => o.id === orderId);
        if (order?.customer_id) {
          console.log('🎁 Adicionando ponto de fidelidade ao cliente:', order.customer_id);
          await supabase.rpc('increment_loyalty_points', { customer_uuid: order.customer_id });
        }
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      
      router.refresh();
    } catch (err: any) {
      alert('❌ Erro ao atualizar pedido: ' + (err.message || 'Erro desconhecido'));
      console.error(err);
    }
  };

  const togglePix = async (orderId: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ pix_confirmed: !current })
        .eq('id', orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, pix_confirmed: !current } : o))
      );

      router.refresh();
    } catch (err: any) {
      alert('Erro ao confirmar PIX: ' + err.message);
    }
  };

  const handleReceiptUpload = async (orderId: string, file: File) => {
    try {
      const ext = file.name.split('.').pop();
      const path = `receipts/${orderId}-${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('menuvi-public')
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('menuvi-public')
        .getPublicUrl(path);

      const { error: updateError } = await supabase
        .from('orders')
        .update({ pix_receipt_url: publicUrl })
        .eq('id', orderId);

      if (updateError) throw updateError;

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, pix_receipt_url: publicUrl } : o));
    } catch (err: any) {
      alert('Erro ao subir comprovante: ' + err.message);
    }
  };

  const assignDriver = async (orderId: string, driverId: string) => {
    const { error } = await supabase.from('orders').update({ driver_id: driverId }).eq('id', orderId);
    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, driver_id: driverId } : o));
    }
  };

  const byStatus = (status: OrderStatus) => orders.filter((o) => o.status === status);

  return (
    <div className="space-y-6">
      {/* Som e Controles */}
      <div className="flex items-center justify-end">
        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all ${
            soundEnabled ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-gray-800 text-gray-400'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          {soundEnabled ? 'SOM ATIVADO' : 'SOM DESATIVADO'}
        </button>
        <audio ref={audioRef} src="/notification.mp3" preload="auto" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {(['new', 'accepted', 'delivering', 'finished'] as OrderStatus[]).map((status) => {
        const config = STATUS_CONFIG[status];
        const statusOrders = byStatus(status);
        return (
          <div key={status} className="flex flex-col gap-3">
            {/* Coluna Header */}
            <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${config.bg}`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                <span className={`text-sm font-bold ${config.color}`}>{config.label}</span>
              </div>
              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                {statusOrders.length}
              </span>
            </div>

            {/* Cards de Pedidos */}
            <div className="space-y-3">
              {statusOrders.length === 0 && (
                <div className="text-center py-8 text-gray-700 text-sm">
                  Nenhum pedido
                </div>
              )}
              {statusOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isExpanded={expandedId === order.id}
                  onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  onTogglePix={() => togglePix(order.id, order.pix_confirmed)}
                  onAdvance={() => NEXT_STATUS[order.status] && updateStatus(order.id, NEXT_STATUS[order.status])}
                  onCancel={() => updateStatus(order.id, 'canceled')}
                  onUploadReceipt={(file) => handleReceiptUpload(order.id, file)}
                  drivers={drivers}
                  onAssignDriver={(driverId) => assignDriver(order.id, driverId)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order, isExpanded, onToggle, onTogglePix, onAdvance, onCancel, onUploadReceipt, drivers, onAssignDriver }: {
  order: Order;
  isExpanded: boolean;
  onToggle: () => void;
  onTogglePix: () => void;
  onAdvance: () => void;
  onCancel: () => void;
  onUploadReceipt: (file: File) => void;
  drivers: any[];
  onAssignDriver: (driverId: string) => void;
}) {
  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Pedido #${order.id.slice(0, 6)}</title>
            <style>
              @page { margin: 0; }
              body { 
                font-family: 'Courier New', Courier, sans-serif; 
                width: 80mm; 
                padding: 5mm; 
                margin: 0;
                font-size: 13px;
                line-height: 1.2;
              }
              .text-center { text-align: center; }
              .font-bold { font-weight: bold; }
              .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
              .item { display: flex; justify-content: space-between; margin-bottom: 4px; }
              .obs { font-size: 11px; font-style: italic; margin-left: 10px; margin-bottom: 6px; }
              .total { font-size: 18px; margin-top: 12px; }
            </style>
          </head>
          <body>
            <div class="text-center font-bold" style="font-size: 20px;">MENÚVI - PEDIDO</div>
            <div class="text-center font-bold">#${order.id.slice(0, 6)}</div>
            <div class="divider"></div>
            <p><b>Data:</b> ${new Date(order.created_at).toLocaleString('pt-BR')}</p>
            <p><b>Cliente:</b> ${order.customer_name}</p>
            <p><b>Tel:</b> ${order.customer_phone}</p>
            <p><b>Endereço:</b><br/> ${order.customer_address}</p>
            <p><b>Pagamento:</b> ${order.payment_method.toUpperCase()}</p>
            <div class="divider"></div>
            <div class="font-bold">ITENS:</div>
            ${order.order_items.map(it => `
              <div class="item">
                <span class="font-bold">${it.quantity}x ${it.products?.name}</span>
                <span>R$ ${(it.unit_price * it.quantity).toFixed(2)}</span>
              </div>
              ${it.observations ? `<div class="obs">↳ OBS: ${it.observations}</div>` : ''}
            `).join('')}
            <div class="divider"></div>
            <div class="item font-bold total">
              <span>TOTAL:</span>
              <span>R$ ${Number(order.total_amount).toFixed(2)}</span>
            </div>
            <div class="divider"></div>
            <div class="text-center" style="margin-top: 30px; font-size: 10px;">
              Gerado por Menúvi Digital<br/>
              Obrigado pela preferência!
            </div>
            <script>
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            </script>
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  const config = STATUS_CONFIG[order.status];
  const canAdvance = !!NEXT_STATUS[order.status];
  const timeAgo = getTimeAgo(order.created_at);

  const NEXT_LABEL: Record<string, string> = {
    new: '✅ Aceitar',
    accepted: '🛵 Enviar p/ Entrega',
    delivering: '🎉 Finalizar',
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-all">
      {/* Header do Card */}
      <button onClick={onToggle} className="w-full p-4 text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-500 text-xs font-mono">#{order.id.slice(0, 6)}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${config.bg} ${config.color}`}>
                {order.payment_method.toUpperCase()}
              </span>
              {order.payment_method === 'pix' && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${order.pix_confirmed ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse'}`}>
                  {order.pix_confirmed ? 'PIX RECEBIDO' : 'AGUARDANDO PIX'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
               <p className="text-white font-bold text-sm truncate">{order.customer_name}</p>
               <button 
                 onClick={(e) => { e.stopPropagation(); handlePrint(); }}
                 className="p-1 px-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-all flex items-center gap-1"
               >
                 <Printer className="w-3 h-3" />
                 <span className="text-[10px] font-bold">IMPRIMIR</span>
               </button>
            </div>
            <p className="text-orange-400 font-black mt-1">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
            </p>
          </div>
          <div id={`print-ticket-${order.id}`} className="hidden"></div>
          <div className="flex items-center gap-1 text-gray-600 shrink-0">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">{timeAgo}</span>
            <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      {/* Conteúdo expandido */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-800 pt-4 space-y-4">
          {/* Itens */}
          <div className="space-y-1.5">
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-400">
                  {item.quantity}x {item.products?.name || 'Item'}
                  {item.observations && (
                    <span className="text-gray-600 block text-xs italic pl-2">↳ {item.observations}</span>
                  )}
                </span>
                <span className="text-gray-300 font-medium shrink-0">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          {/* Info do cliente */}
          <div className="space-y-2 border-t border-gray-800 pt-3">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
              <span className="text-gray-400 text-xs leading-relaxed">{order.customer_address}</span>
            </div>
            <a
              href={`https://wa.me/55${order.customer_phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-green-400 hover:text-green-300 text-xs font-bold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              {order.customer_phone}
            </a>
          </div>

          {/* Seleção de Entregador */}
          <div className="pt-2 border-t border-gray-800">
             <label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-1.5 mb-2">
                <Truck className="w-3 h-3" /> Entregador
             </label>
             <select 
               value={order.driver_id || ''} 
               onChange={(e) => onAssignDriver(e.target.value)}
               className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-orange-500/20"
             >
                <option value="">Aguardando Motoboy...</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
             </select>
          </div>

          {/* Seção de Comprovante PIX */}
          {order.payment_method === 'pix' && (
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-1.5">
                  <Paperclip className="w-3 h-3" /> Comprovante de Pagamento
                </span>
                {order.pix_receipt_url && (
                  <a href={order.pix_receipt_url} target="_blank" className="text-blue-400 hover:text-blue-300 text-[10px] font-bold flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Ver agora
                  </a>
                )}
              </div>
              
              {order.pix_receipt_url ? (
                <div className="relative h-20 w-full rounded-lg overflow-hidden group">
                  <Image src={order.pix_receipt_url} alt="Comprovante" fill className="object-cover opacity-60" />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUploadReceipt(e.target.files[0])} />
                    <span className="text-[10px] font-bold text-white uppercase">Trocar Arquivo</span>
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-lg py-4 cursor-pointer hover:border-blue-500/50 transition-all group">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUploadReceipt(e.target.files[0])} />
                  <Upload className="w-5 h-5 text-gray-600 mb-1 group-hover:text-blue-400 transition-colors" />
                  <span className="text-[10px] font-bold text-gray-500 group-hover:text-blue-400">Anexar Comprovante</span>
                </label>
              )}
            </div>
          )}

          {/* Ações */}
          {order.status !== 'finished' && order.status !== 'canceled' && (
            <div className="flex flex-col gap-2 pt-1">
              {order.payment_method === 'pix' && order.status === 'new' && (
                <button
                  onClick={onTogglePix}
                  className={`w-full text-xs font-bold py-2.5 rounded-xl transition-all border ${order.pix_confirmed ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/20'}`}
                >
                  {order.pix_confirmed ? '✓ PIX Confirmado' : '💰 Confirmar Recebimento PIX'}
                </button>
              )}

              <div className="flex gap-2">
                {canAdvance && (
                  <button
                    onClick={onAdvance}
                    disabled={order.payment_method === 'pix' && !order.pix_confirmed && order.status === 'new'}
                    className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-30 disabled:bg-gray-800 disabled:text-gray-600 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
                  >
                    {order.payment_method === 'pix' && !order.pix_confirmed && order.status === 'new' ? 'Aguardando Pagamento...' : NEXT_LABEL[order.status]}
                  </button>
                )}
                <button
                  onClick={onCancel}
                  className="px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl transition-colors border border-red-500/20"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  return `${Math.floor(mins / 60)}h`;
}
