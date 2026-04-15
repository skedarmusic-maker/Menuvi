'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { Clock, User, MapPin, Package, Truck, CheckCircle, XCircle, ChevronDown, MessageCircle, Paperclip, Eye, Upload, Loader2, FileText } from 'lucide-react';
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
}

const NEXT_STATUS: Record<string, OrderStatus> = {
  new: 'accepted',
  accepted: 'delivering',
  delivering: 'finished',
};

export default function OrdersKanban({ initialOrders }: { initialOrders: Order[] }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

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
        .from('images')
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
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

  const byStatus = (status: OrderStatus) => orders.filter((o) => o.status === status);

  return (
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
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order, isExpanded, onToggle, onTogglePix, onAdvance, onCancel, onUploadReceipt }: {
  order: Order;
  isExpanded: boolean;
  onToggle: () => void;
  onTogglePix: () => void;
  onAdvance: () => void;
  onCancel: () => void;
  onUploadReceipt: (file: File) => void;
}) {
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
            <p className="text-white font-bold text-sm truncate">{order.customer_name}</p>
            <p className="text-orange-400 font-black mt-1">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
            </p>
          </div>
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
