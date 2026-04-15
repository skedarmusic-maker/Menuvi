'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { X, Trash2, MapPin, Phone, User, CreditCard, ChevronRight } from 'lucide-react';
import { calculateDeliveryDistance, getDeliveryFee } from '@/lib/delivery';
import { supabase } from '@/lib/supabase';

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  store: any;
}

export default function CartSheet({ isOpen, onClose, store }: CartSheetProps) {
  const { cart, totalPrice: cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const [step, setStep] = useState<'items' | 'checkout'>('items');
  const [loading, setLoading] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState({
    street: '',
    number: '',
    neighborhood: '',
    cep: '',
    complement: ''
  });
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'dinheiro'>('pix');

  const totalPriceWithDelivery = cartTotal + (deliveryFee || 0);

  const handleCepBlur = async () => {
    if (address.cep.replace(/\D/g, '').length === 8) {
      setCalculatingFee(true);
      try {
        const distance = await calculateDeliveryDistance(address.cep);
        if (distance !== null) {
          const fee = getDeliveryFee(distance);
          setDeliveryFee(fee);
        }
      } catch (error) {
        console.error('Erro ao calcular frete:', error);
      } finally {
        setCalculatingFee(false);
      }
    }
  };

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (!customerName || !customerPhone || !address.street || !address.number || !address.neighborhood) {
      alert('Por favor, preencha nome, telefone e o endereço completo (Rua, Número e Bairro).');
      return;
    }

    const fullAddress = `${address.street}, ${address.number}${address.complement ? ` (${address.complement})` : ''} - ${address.neighborhood}${address.cep ? ` - CEP: ${address.cep}` : ''}`;

    setLoading(true);

    try {
      // 1. Validar IDs
      const isRestaurantUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(store.id);
      
      console.log('🏁 Iniciando pedido:', {
        restaurantId: store.id,
        isUUID: isRestaurantUUID
      });

      // 1. Salvar no Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: isRestaurantUUID ? store.id : '00000000-0000-0000-0000-000000000000',
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: fullAddress,
          total_amount: totalPriceWithDelivery,
          payment_method: paymentMethod,
          status: 'new'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Salvar itens do pedido
      const itemsToInsert = cart.map(item => {
        const rawId = item.id.includes('-') ? item.id.split('-')[0] : item.id;
        
        // Verifica se é um UUID válido (formato: 8-4-4-4-12 caracteres)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);
        
        console.log('📦 Processando item:', {
          originalId: item.id,
          cleanedId: rawId,
          isUUID: isUUID
        });

        return {
          order_id: order.id,
          product_id: isUUID ? rawId : null,
          quantity: item.quantity,
          unit_price: item.price,
          observations: item.observations
        };
      });

      const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      // 3. Gerar Mensagem WhatsApp formatada
      const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPriceWithDelivery);
      
      const message = encodeURIComponent(
        `🔥 *NOVO PEDIDO NO MENUVI* 🔥\n` +
        `---------------------------------------\n` +
        `🆔 *Pedido:* #${order.id.slice(0, 4).toUpperCase()}\n\n` +
        
        `👤 *DADOS DO CLIENTE*\n` +
        `*Nome:* ${customerName}\n` +
        `📞 *WhatsApp:* ${customerPhone}\n\n` +
        
        `📍 *ENDEREÇO DE ENTREGA*\n` +
        `*Rua:* ${address.street}, ${address.number}\n` +
        `*Bairro:* ${address.neighborhood}\n` +
        `${address.complement ? `*Compl.:* ${address.complement}\n` : ''}` +
        `${address.cep ? `*CEP:* ${address.cep}\n` : ''}` +
        `🛵 *Frete:* ${deliveryFee === 0 ? 'Grátis' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deliveryFee || 0)}\n\n` +
        
        `🛒 *ITENS DO PEDIDO*\n` +
        `---------------------------------------\n` +
        cart.map(item => 
          `✅ *${item.quantity}x ${item.name}*\n` +
          `   ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}` +
          `${item.observations ? `\n   📝 _Obs: ${item.observations}_` : ''}`
        ).join('\n\n') +
        `\n\n---------------------------------------\n` +
        `💰 *VALOR TOTAL:* ${formattedTotal}\n` +
        `💳 *FORMA DE PAGAMENTO:* ${paymentMethod.toUpperCase()}\n` +
        `---------------------------------------\n\n` +
        `_Enviado via Menuvi SaaS_ 🚀`
      );

      const whatsappUrl = `https://wa.me/${store.whatsapp_number}?text=${message}`;

      // 4. Limpar e Redirecionar
      clearCart();
      window.location.href = whatsappUrl;

    } catch (error: any) {
      console.error('Erro detalhado ao processar pedido:', error);
      alert('Erro ao salvar pedido: ' + (error.message || 'Erro desconhecido. Tentando enviar por WhatsApp...'));
      // Fallback: mesmo com erro no banco, tenta abrir o WhatsApp se tivermos os dados básicos
      if (customerName && customerPhone) {
        // ... (o código do passo 3 pode ser duplicado aqui se quiser garantir o envio mesmo sem banco, 
        // mas por hora vamos focar em arrumar o banco)
      }
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
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-3">
                    <input 
                      type="text" value={address.street} onChange={(e) => setAddress({...address, street: e.target.value})}
                      placeholder="Rua / Avenida"
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                    />
                  </div>
                  <div className="col-span-1">
                    <input 
                      type="text" value={address.number} onChange={(e) => setAddress({...address, number: e.target.value})}
                      placeholder="Nº"
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="text" value={address.neighborhood} onChange={(e) => setAddress({...address, neighborhood: e.target.value})}
                    placeholder="Bairro"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                  <input 
                    type="text" value={address.cep} 
                    onChange={(e) => setAddress({...address, cep: e.target.value})}
                    onBlur={handleCepBlur}
                    placeholder="CEP"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </div>
                {calculatingFee && <p className="text-[10px] text-orange-500 animate-pulse font-bold px-2">Calculando frete...</p>}
                {deliveryFee !== null && !calculatingFee && (
                  <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl flex items-center justify-between">
                    <span className="text-xs text-orange-700 font-bold">Taxa de Entrega:</span>
                    <span className="text-sm text-orange-700 font-black">
                      {deliveryFee === 0 ? 'GRÁTIS' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deliveryFee)}
                    </span>
                  </div>
                )}
                <input 
                  type="text" value={address.complement} onChange={(e) => setAddress({...address, complement: e.target.value})}
                  placeholder="Complemento (Apto, Bloco, Casa...)"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
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
              <span className="text-gray-500 font-medium">Total do Pedido</span>
              <h3 className="font-bold text-gray-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPriceWithDelivery)}</h3>
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
