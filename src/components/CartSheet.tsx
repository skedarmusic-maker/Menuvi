'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { X, Trash2, MapPin, Phone, User, CreditCard, ChevronRight, Pencil, RotateCcw, CheckCircle } from 'lucide-react';
import { calculateDeliveryDistance, getDeliveryFee } from '@/lib/delivery';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import Link from 'next/link';

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  store: any;
  onEditItem?: (item: any) => void;
}

export default function CartSheet({ isOpen, onClose, store, onEditItem }: CartSheetProps) {
  const supabase = createSupabaseBrowserClient();
  const { cart, totalPrice: cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const [step, setStep] = useState<'items' | 'checkout'>('items');
  const [loading, setLoading] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');
  const [address, setAddress] = useState({
    street: '',
    number: '',
    neighborhood: '',
    cep: '',
    complement: ''
  });
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [savedProfile, setSavedProfile] = useState<any>(null);
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [pixData, setPixData] = useState<{ qrCode: string; pixCode: string; paymentId: string } | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  useEffect(() => {
    async function checkUser() {
      if (!isOpen) return; // Só busca quando a sacola abre

      console.log('🔍 CartSheet aberta, verificando autenticação...');
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        console.log('✅ Usuário identificado:', user.id);
        setUserId(user.id);
        const { data: profile, error: profileError } = await supabase.from('customer_profiles').select('*').eq('id', user.id).single();

        if (profileError) {
          console.error('❌ Erro ao buscar perfil:', profileError);
        }

        if (profile) {
          console.log('📋 Perfil encontrado:', profile);
          setSavedProfile(profile);

          // Só ativa o "Endereço Salvo" se houver uma rua cadastrada
          if (profile.address_street) {
            setUseSavedAddress(true);
            setCustomerName(profile.full_name || '');
            setCustomerPhone(profile.phone || '');
            setAddress({
              street: profile.address_street || '',
              number: profile.address_number || '',
              neighborhood: profile.neighborhood || '',
              cep: profile.cep || '',
              complement: profile.complement || ''
            });

            // Auto-calcula frete para o endereço salvo
            if (profile.cep && store.has_distance_delivery) {
              console.log('🚚 Calculando frete automático para CEP:', profile.cep);
              const distance = await calculateDeliveryDistance(profile.cep, store.cep);
              if (distance !== null) setDeliveryFee(getDeliveryFee(distance, store.delivery_rules));
            }
          }
        }
      } else {
        console.log('ℹ️ Nenhum usuário logado na sacola.');
      }
    }
    checkUser();
  }, [isOpen, store.has_distance_delivery]);

  const totalPriceWithDelivery = cartTotal + (deliveryFee || 0);

  const handleCepBlur = async () => {
    // Só calcula se o SuperAdmin habilitou o recurso para esta loja
    if (!store.has_distance_delivery) return;

    if (address.cep.replace(/\D/g, '').length === 8) {
      setCalculatingFee(true);
      try {
        const distance = await calculateDeliveryDistance(address.cep, store.cep);
        if (distance !== null) {
          const fee = getDeliveryFee(distance, store.delivery_rules);
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
    if (!customerName || !customerPhone || !customerCpf || !address.street || !address.number || !address.neighborhood) {
      alert('Por favor, preencha nome, telefone, CPF e o endereço completo.');
      return;
    }

    if (!paymentMethod) {
      alert('Por favor, selecione uma forma de pagamento antes de finalizar.');
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
          customer_id: userId,
          status: 'new'
        })
        .select()
        .single();

      if (orderError) throw orderError;
      setCreatedOrderId(order.id);

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

      // --- LOGICA ONLINE (PIX OU CARTÃO) COM ASAAS ---
      if (paymentMethod === 'online_pix' || paymentMethod === 'online_credit_card') {
        const response = await fetch('/api/checkout/asaas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            restaurantId: store.id,
            customerName,
            customerPhone,
            customerCpf,
            totalAmount: totalPriceWithDelivery,
            paymentMethod: paymentMethod, // informa a API se é pix ou credit_card
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Erro ao gerar Pagamento');
        }

        const data = await response.json();
        
        if (paymentMethod === 'online_credit_card') {
          // Limpa o carrinho e redireciona pro Asaas
          clearCart();
          window.location.href = data.invoiceUrl;
          return;
        } else {
          // Se for PIX, mostra o QR Code na mesma tela
          setPixData(data);
          setLoading(false);
          return;
        }
      }

      // --- LOGICA NA ENTREGA ---
      // Se não for pagamento online, apenas mostra a tela de sucesso.
      // O Kanban cuidará do resto (não redirecionamos mais pro WhatsApp, a não ser que o lojista queira, mas seguimos a orientação de centralizar no painel).
      setOrderSuccess(true);
      clearCart();

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
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-gray-900 leading-tight pr-2">{item.name}</h4>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => onEditItem?.(item)} className="p-1 text-gray-400 hover:text-orange-500 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 italic">{item.observations}</p>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-sm font-bold text-gray-900 border border-gray-100">-</button>
                          <span className="text-sm font-black w-4 text-center text-gray-900">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-sm font-bold text-gray-900 border border-gray-100">+</button>
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
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
                <input
                  type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Seu WhatsApp (DDD + Número)"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
                <input
                  type="text" value={customerCpf} onChange={(e) => setCustomerCpf(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="Seu CPF (Apenas números)"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><MapPin className="w-4 h-4" /> Endereço de Entrega</h3>

                {useSavedAddress && savedProfile?.address_street ? (
                  /* CARD DE ENDEREÇO SALVO */
                  <div className="bg-white border-2 border-orange-500/20 p-5 rounded-3xl space-y-3 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl">SALVO</div>
                    <div>
                      <p className="text-gray-900 font-bold">{savedProfile.address_street}, {savedProfile.address_number}</p>
                      <p className="text-gray-500 text-xs">{savedProfile.neighborhood} - {savedProfile.cep}</p>
                      {savedProfile.complement && <p className="text-gray-400 text-[10px] italic">Ref: {savedProfile.complement}</p>}
                    </div>

                    <button
                      onClick={() => {
                        setUseSavedAddress(false);
                        setAddress({ street: '', number: '', neighborhood: '', cep: '', complement: '' });
                        setDeliveryFee(null);
                      }}
                      className="text-xs font-bold text-orange-500 flex items-center gap-1 hover:underline"
                    >
                      Usar outro endereço
                    </button>
                  </div>
                ) : (
                  /* FORMULÁRIO MANUAL */
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-4 gap-3">
                      <div className="col-span-3">
                        <input
                          type="text" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })}
                          placeholder="Rua / Avenida"
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          type="text" value={address.number} onChange={(e) => setAddress({ ...address, number: e.target.value })}
                          placeholder="Nº"
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text" value={address.neighborhood} onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                        placeholder="Bairro"
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
                      />
                      <input
                        type="text" value={address.cep}
                        onChange={(e) => setAddress({ ...address, cep: e.target.value })}
                        onBlur={handleCepBlur}
                        placeholder="CEP"
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
                      />
                    </div>
                    <input
                      type="text" value={address.complement} onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                      placeholder="Complemento (Apto, Bloco, Casa...)"
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    />

                    {savedProfile?.address_street && (
                      <button
                        onClick={() => {
                          setUseSavedAddress(true);
                          setAddress({
                            street: savedProfile.address_street,
                            number: savedProfile.address_number,
                            neighborhood: savedProfile.neighborhood,
                            cep: savedProfile.cep,
                            complement: savedProfile.complement
                          });
                          handleCepBlur();
                        }}
                        className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Voltar para endereço salvo
                      </button>
                    )}
                  </div>
                )}

                {calculatingFee && <p className="text-[10px] text-orange-500 animate-pulse font-bold px-2">Calculando frete...</p>}
                {deliveryFee !== null && !calculatingFee && (
                  <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl flex items-center justify-between">
                    <span className="text-xs text-orange-700 font-bold">Taxa de Entrega:</span>
                    <span className="text-sm text-orange-700 font-black">
                      {deliveryFee === 0 ? 'GRÁTIS' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deliveryFee)}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-6 pb-8">
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Forma de Pagamento</h3>
                
                {/* PAGAMENTO ONLINE */}
                {(store.accepts_online_pix || store.accepts_online_credit_card) && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Pelo App</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {store.accepts_online_pix && (
                        <button
                          onClick={() => setPaymentMethod('online_pix')}
                          className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${paymentMethod === 'online_pix' ? 'border-gray-950 bg-gray-100' : 'border-gray-100 opacity-60 hover:opacity-100'}`}
                        >
                          <div className="w-8 h-8 flex items-center justify-center font-black text-gray-900">PIX</div>
                          <span className="text-xs font-black text-gray-900 uppercase">Pix (Rápido)</span>
                        </button>
                      )}
                      {store.accepts_online_credit_card && (
                        <button
                          onClick={() => setPaymentMethod('online_credit_card')}
                          className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${paymentMethod === 'online_credit_card' ? 'border-gray-950 bg-gray-100' : 'border-gray-100 opacity-60 hover:opacity-100'}`}
                        >
                          <div className="w-8 h-8 flex items-center justify-center font-black text-gray-900"><CreditCard className="w-5 h-5"/></div>
                          <span className="text-xs font-black text-gray-900 uppercase text-center leading-tight">Cartão<br/>de Crédito</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* PAGAMENTO NA ENTREGA */}
                {(store.accepts_delivery_pix || store.accepts_delivery_cash || store.accepts_delivery_card) && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Na Entrega</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {store.accepts_delivery_pix && (
                        <button
                          onClick={() => setPaymentMethod('delivery_pix')}
                          className={`p-3 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${paymentMethod === 'delivery_pix' ? 'border-gray-950 bg-gray-100' : 'border-gray-100 opacity-60 hover:opacity-100'}`}
                        >
                          <span className="text-xs font-black text-gray-900 uppercase">Pix Entregador</span>
                        </button>
                      )}
                      {store.accepts_delivery_card && (
                        <button
                          onClick={() => setPaymentMethod('delivery_card')}
                          className={`p-3 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${paymentMethod === 'delivery_card' ? 'border-gray-950 bg-gray-100' : 'border-gray-100 opacity-60 hover:opacity-100'}`}
                        >
                          <span className="text-xs font-black text-gray-900 uppercase">Cartão (Máquina)</span>
                        </button>
                      )}
                      {store.accepts_delivery_cash && (
                        <button
                          onClick={() => setPaymentMethod('delivery_cash')}
                          className={`p-3 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${paymentMethod === 'delivery_cash' ? 'border-gray-950 bg-gray-100' : 'border-gray-100 opacity-60 hover:opacity-100'}`}
                        >
                          <span className="text-xs font-black text-gray-900 uppercase">Dinheiro</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TELA DE SUCESSO / PIX */}
          {(orderSuccess || pixData) && (
            <div className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              
              <h3 className="text-2xl font-black text-gray-900 mb-2">Pedido Recebido!</h3>
              <p className="text-gray-500 text-sm mb-8">
                {paymentMethod === 'online_pix' 
                  ? 'Gere seu Pix abaixo para confirmar o pedido.' 
                  : 'Acompanhe o status do seu pedido pelo aplicativo.'}
              </p>

              {/* Se for PIX Online, mostra o QR Code */}
              {pixData ? (
                <div className="w-full space-y-6 animate-in slide-in-from-bottom-4 duration-500 delay-200">
                  <div className="bg-white border-2 border-gray-100 p-5 rounded-[2.5rem] shadow-sm max-w-[240px] mx-auto">
                    <img src={`data:image/png;base64,${pixData.qrCode}`} alt="QR Code Pix" className="w-full h-full" />
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pixData.pixCode);
                        alert('Código Copiado!');
                      }}
                      className="w-full bg-gray-100 text-gray-900 font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
                    >
                      Copiar Código Copia e Cola
                    </button>

                    <Link 
                      href={`/order-status/${createdOrderId}`}
                      className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
                    >
                      Acompanhar Status do Pedido <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                /* Pagamento na Entrega (Dinheiro/Cartão/Pix) */
                <div className="w-full space-y-4">
                  <Link 
                    href={`/order-status/${createdOrderId}`}
                    className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
                  >
                    Acompanhar Status do Pedido <ChevronRight className="w-4 h-4" />
                  </Link>

                  <button 
                    onClick={() => onClose()}
                    className="w-full bg-gray-100 text-gray-900 font-bold py-4 rounded-2xl"
                  >
                    Voltar para o Cardápio
                  </button>
                </div>
              )}
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
