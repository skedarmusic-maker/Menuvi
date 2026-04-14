'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { X, Trash2, MapPin, Phone, User, CreditCard, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  store: any;
}

export default function CartSheet({ isOpen, onClose, store }: CartSheetProps) {
  const { cart, totalPrice, updateQuantity, removeFromCart, clearCart } = useCart();
  const [step, setStep] = useState<'items' | 'checkout'>('items');
  const [loading, setLoading] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'dinheiro'>('pix');

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (!customerName || !customerPhone || !customerAddress) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);

    try {
      // 1. Salvar no Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: store.id || '00000000-0000-0000-0000-000000000000', // GUID fake se for mock
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
          total_amount: totalPrice,
          payment_method: paymentMethod,
          status: 'new'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Salvar itens do pedido
      const itemsToInsert = cart.map(item => ({
        order_id: order.id,
        product_id: item.id.startsWith('p') ? null : item.id, // Se for mock 'p1', envia null
        quantity: item.quantity,
        unit_price: item.price,
        observations: item.observations
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      // 3. Gerar Mensagem WhatsApp
      const message = encodeURIComponent(
        `🍔 *NOVO PEDIDO - #${order.id.slice(0, 4)}*\n\n` +
        `👤 *Cliente:* ${customerName}\n` +
        `📞 *Telefone:* ${customerPhone}\n` +
        `📍 *Endereço:* ${customerAddress}\n\n` +
        `--- *ITENS* ---\n` +
        cart.map(item => `${item.quantity}x ${item.name} (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)})${item.observations ? `\n   Obs: ${item.observations}` : ''}`).join('\n') +
        `\n\n💰 *Total:* ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)}\n` +
        `💳 *Pagamento:* ${paymentMethod.toUpperCase()}\n\n` +
        `_Aguardando confirmação da loja..._`
      );

      const whatsappUrl = `https://wa.me/${store.whatsapp_number}?text=${message}`;

      // 4. Limpar e Redirecionar
      clearCart();
      window.location.href = whatsappUrl;

    } catch (error) {
      console.error('Erro ao processar pedido:', error);
      alert('Ocorreu um erro ao salvar seu pedido. Mas você pode enviar direto pelo WhatsApp!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white h-full w-full max-w-md flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
        
        {/* HEADER DA SACOLA */}
        <div className="px-6 py-6 border-b flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
               <X className="w-6 h-6 text-gray-900" />
             </button>
             <h2 className="text-xl font-black text-gray-900 tracking-tight">
               {step === 'items' ? 'Minha Sacola' : 'Finalizar Pedido'}
             </h2>
          </div>
          {step === 'items' && cart.length > 0 && (
            <button onClick={() => setStep('checkout')} className="text-sm font-bold" style={{ color: store.theme_color }}>
              Continuar
            </button>
          )}
        </div>

        {/* CONTEÚDO */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 'items' ? (
            cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Sua sacola está vazia</h3>
                <p className="text-gray-500 text-sm mt-1">Adicione alguns itens deliciosos!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl shrink-0 overflow-hidden relative">
                      {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                         <h4 className="font-bold text-gray-900 leading-tight">{item.name}</h4>
                         <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500">
                           <X className="w-4 h-4" />
                         </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 italic">{item.observations}</p>
                      
                      <div className="flex items-center justify-between mt-3">
                         <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                           <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-sm font-bold">-</button>
                           <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                           <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-sm font-bold">+</button>
                         </div>
                         <span className="font-bold text-gray-900">
                           {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                         </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* FORMULÁRIO DE CHECKOUT */
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><User className="w-4 h-4" /> Seus Dados</h3>
                <input 
                  type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
                <input 
                  type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Seu WhatsApp (DDD)"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><MapPin className="w-4 h-4" /> Endereço de Entrega</h3>
                <textarea 
                  value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Rua, Número, Bairro, Complemento"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 h-24 resize-none"
                />
              </div>

              <div className="space-y-4 pb-8">
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Forma de Pagamento</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${paymentMethod === 'pix' ? 'border-gray-900 bg-gray-50' : 'border-gray-100 opacity-50'}`}
                  >
                    <div className="w-8 h-8 flex items-center justify-center font-black">PIX</div>
                    <span className="text-xs font-bold">Pix na hora</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('dinheiro')}
                    className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${paymentMethod === 'dinheiro' ? 'border-gray-900 bg-gray-50' : 'border-gray-100 opacity-50'}`}
                  >
                    <div className="w-8 h-8 flex items-center justify-center font-black">R$</div>
                    <span className="text-xs font-bold">Dinheiro</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RODAPÉ FIXO */}
        {cart.length > 0 && (
          <div className="p-6 border-t bg-white sticky bottom-0">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 font-medium">Subtotal</span>
              <span className="text-xl font-black text-gray-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)}
              </span>
            </div>
            {step === 'items' ? (
              <button 
                onClick={() => setStep('checkout')}
                className="w-full text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                style={{ backgroundColor: store.theme_color }}
              >
                Continuar para entrega <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button 
                disabled={loading}
                onClick={handleCheckout}
                className="w-full text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: store.theme_color }}
              >
                {loading ? 'Processando...' : 'Finalizar Pedido via WhatsApp 🚀'}
              </button>
            )}
            {step === 'checkout' && (
              <button onClick={() => setStep('items')} className="w-full text-gray-400 text-sm font-bold mt-4">
                Voltar para itens
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
