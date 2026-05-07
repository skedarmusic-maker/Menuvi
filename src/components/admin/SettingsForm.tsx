'use client';

import { useState } from 'react';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { Save, Loader2, Store, Phone, Palette, Globe, Image as ImageIcon, Camera, Trash2, MapPin, Clock, CreditCard, Truck, Plus, Info } from 'lucide-react';
import { DeliveryRule } from '@/lib/delivery';

const THEME_COLORS = [
  { label: 'Vermelho', value: '#ef4444' },
  { label: 'Laranja', value: '#f97316' },
  { label: 'Amarelo', value: '#eab308' },
  { label: 'Verde', value: '#22c55e' },
  { label: 'Ciano', value: '#06b6d4' },
  { label: 'Azul', value: '#3b82f6' },
  { label: 'Roxo', value: '#8b5cf6' },
  { label: 'Rosa', value: '#ec4899' },
];

export default function SettingsForm({ restaurant }: { restaurant: any }) {
  const supabase = createSupabaseBrowserClient();
  const [name, setName] = useState(restaurant.name || '');
  const [whatsapp, setWhatsapp] = useState(
    // Remove o 55 do início para exibir só o DDD + número
    (restaurant.whatsapp_number || '').replace(/^55/, '')
  );
  const [themeColor, setThemeColor] = useState(restaurant.theme_color || '#ef4444');
  const [logoUrl, setLogoUrl] = useState(restaurant.logo_url || '');
  const [bannerUrl, setBannerUrl] = useState(restaurant.banner_url || '');
  const [address, setAddress] = useState(restaurant.address || '');
  const [openingHours, setOpeningHours] = useState(restaurant.opening_hours || '');
  const [paymentMethods, setPaymentMethods] = useState(restaurant.payment_methods || '');
  const [cep, setCep] = useState(restaurant.cep || '');
  const [hasDistanceDelivery, setHasDistanceDelivery] = useState(restaurant.has_distance_delivery || false);
  const [deliveryRules, setDeliveryRules] = useState<DeliveryRule[]>(
    restaurant.delivery_rules || [
      { min: 0, max: 2, fee: 0 },
      { min: 2, max: 5, fee: 7 }
    ]
  );
  
  // Horários de Funcionamento Estruturados
  const DAYS_OF_WEEK = [
    'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'
  ];

  const [workingHours, setWorkingHours] = useState(
    restaurant.working_hours || DAYS_OF_WEEK.map(day => ({
      day,
      isOpen: true,
      open: '08:00',
      close: '22:00'
    }))
  );
  const [acceptsOnlinePix, setAcceptsOnlinePix] = useState(restaurant.accepts_online_pix ?? true);
  const [acceptsOnlineCredit, setAcceptsOnlineCredit] = useState(restaurant.accepts_online_credit_card ?? false);
  const [acceptsDeliveryPix, setAcceptsDeliveryPix] = useState(restaurant.accepts_delivery_pix ?? true);
  const [acceptsDeliveryCash, setAcceptsDeliveryCash] = useState(restaurant.accepts_delivery_cash ?? true);
  const [acceptsDeliveryCard, setAcceptsDeliveryCard] = useState(restaurant.accepts_delivery_card ?? true);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(type);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${restaurant.id}/${type}-${Math.random()}.${fileExt}`;
      const filePath = `restaurants/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menuvi-public')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('menuvi-public')
        .getPublicUrl(filePath);

      if (type === 'logo') setLogoUrl(publicUrl);
      else setBannerUrl(publicUrl);

    } catch (error: any) {
      alert('Erro ao subir imagem: ' + error.message);
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    const { error } = await supabase
      .from('restaurants')
      .update({
        name,
        whatsapp_number: `55${whatsapp.replace(/\D/g, '')}`,
        theme_color: themeColor,
        logo_url: logoUrl,
        banner_url: bannerUrl,
        address,
        opening_hours: openingHours,
        working_hours: workingHours, // Salvando o JSON estruturado
        payment_methods: paymentMethods,
        cep,
        has_distance_delivery: hasDistanceDelivery,
        delivery_rules: deliveryRules,
        accepts_online_pix: acceptsOnlinePix,
        accepts_online_credit_card: acceptsOnlineCredit,
        accepts_delivery_pix: acceptsDeliveryPix,
        accepts_delivery_cash: acceptsDeliveryCash,
        accepts_delivery_card: acceptsDeliveryCard,
      })
      .eq('id', restaurant.id);

    setSaving(false);
    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-xl pb-32">
      {/* Identidade Visual */}
      <div className="space-y-6">
        <label className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-3">
          <ImageIcon className="w-4 h-4" /> Identidade Visual
        </label>
        
        <div className="flex flex-col gap-6">
          {/* Banner Upload */}
          <div className="relative h-40 w-full bg-gray-800 rounded-3xl overflow-hidden group border-2 border-dashed border-gray-700 hover:border-orange-500/50 transition-all">
            {bannerUrl ? (
              <>
                <Image src={bannerUrl} alt="Banner" fill className="object-cover opacity-60" />
                <button 
                  type="button" onClick={() => setBannerUrl('')}
                  className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-xs font-bold">Banner de Fundo</span>
              </div>
            )}
            <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 hover:bg-black/40 transition-all group">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'banner')} />
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-xs font-black">
                {uploading === 'banner' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                {uploading === 'banner' ? 'Subindo...' : 'Alterar Banner'}
              </div>
            </label>
          </div>

          {/* Logo Upload */}
          <div className="flex items-center gap-6 -mt-16 sm:-mt-20 ml-6">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-gray-900 rounded-3xl p-1 shadow-2xl border-4 border-gray-950 overflow-hidden group">
              {logoUrl ? (
                <Image src={logoUrl} alt="Logo" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-700 bg-gray-800">
                  <Store className="w-8 h-8" />
                </div>
              )}
              <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 hover:bg-black/60 transition-all group">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'logo')} />
                <div className="opacity-0 group-hover:opacity-100 text-white">
                  {uploading === 'logo' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-6 h-6" />}
                </div>
              </label>
            </div>
            <div className="pt-10 sm:pt-14">
              <h3 className="text-white font-black text-sm">Logo da Loja</h3>
              <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mt-1">Recomendado: 400x400px</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nome */}
      <div>
        <label className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-3">
          <Store className="w-4 h-4" /> Nome do Restaurante
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
        />
      </div>

      {/* Slug (leitura) */}
      <div>
        <label className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4" /> Link do Cardápio
        </label>
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3.5 flex items-center gap-2">
          <span className="text-gray-600 text-sm">menuvi.app/</span>
          <span className="text-orange-400 font-bold text-sm">{restaurant.slug}</span>
        </div>
        <p className="text-gray-600 text-xs mt-2">O slug não pode ser alterado.</p>
      </div>

      {/* WhatsApp */}
      <div>
        <label className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-3">
          <Phone className="w-4 h-4" /> WhatsApp para Pedidos
        </label>
        <div className="flex items-center bg-gray-900 border border-gray-700 rounded-xl overflow-hidden focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 transition-all">
          <span className="px-4 text-gray-500 text-sm font-bold border-r border-gray-700 py-3.5">+55</span>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="11 99999-9999"
            className="flex-1 bg-transparent px-4 py-3.5 text-white focus:outline-none"
          />
        </div>
        <p className="text-gray-600 text-xs mt-2">Os pedidos serão enviados para este número via WhatsApp.</p>
      </div>

      {/* Endereço */}
      <div>
        <label className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4" /> Endereço Completo
        </label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Rua Exemplo, 123 - Bairro, Cidade - UF"
          rows={2}
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all resize-none"
        />
      </div>

      {/* Horário de Funcionamento Estruturado */}
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-bold">Horário de Funcionamento</h3>
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Defina quando sua loja está aberta</p>
          </div>
        </div>

        <div className="space-y-3">
          {workingHours.map((wh: any, index: number) => (
            <div key={wh.day} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-800/30 rounded-2xl border border-gray-700/30 gap-4 transition-all hover:border-gray-600">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const newHours = [...workingHours];
                    newHours[index].isOpen = !newHours[index].isOpen;
                    setWorkingHours(newHours);
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative ${wh.isOpen ? 'bg-orange-500' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${wh.isOpen ? 'left-7' : 'left-1'}`} />
                </button>
                <span className={`font-bold text-sm ${wh.isOpen ? 'text-white' : 'text-gray-600'}`}>{wh.day}</span>
              </div>

              {wh.isOpen ? (
                <div className="flex items-center gap-2 animate-in fade-in duration-300">
                  <input
                    type="time"
                    value={wh.open}
                    onChange={(e) => {
                      const newHours = [...workingHours];
                      newHours[index].open = e.target.value;
                      setWorkingHours(newHours);
                    }}
                    className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-orange-500"
                  />
                  <span className="text-gray-600 text-[10px] font-black uppercase">até</span>
                  <input
                    type="time"
                    value={wh.close}
                    onChange={(e) => {
                      const newHours = [...workingHours];
                      newHours[index].close = e.target.value;
                      setWorkingHours(newHours);
                    }}
                    className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
              ) : (
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Fechado</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Campo de observações adicionais (opcional) */}
      <div>
        <label className="text-gray-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-3 px-2">
          <Info className="w-4 h-4 text-orange-500" /> Observações de Horário (Ex: Feriados)
        </label>
        <textarea
          value={openingHours}
          onChange={(e) => setOpeningHours(e.target.value)}
          placeholder="Ex: Não abrimos em feriados nacionais."
          rows={2}
          className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-orange-500 transition-all placeholder:text-gray-700"
        />
      </div>

      {/* Opções de Pagamento */}
      <div>
        <label className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4" /> Configurações de Pagamento
        </label>
        
        <div className="space-y-6">
          {/* Pagamento Online */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h4 className="text-sm font-bold text-white mb-4">Pagamento Online (App)</h4>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm text-gray-200 font-bold">Pix Integrado</p>
                  <p className="text-xs text-gray-500">QR Code gerado automaticamente via Asaas</p>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors relative ${acceptsOnlinePix ? 'bg-orange-500' : 'bg-gray-700'}`}>
                  <input type="checkbox" className="sr-only" checked={acceptsOnlinePix} onChange={(e) => setAcceptsOnlinePix(e.target.checked)} />
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${acceptsOnlinePix ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm text-gray-200 font-bold">Cartão de Crédito</p>
                  <p className="text-xs text-gray-500">Link de pagamento seguro Asaas</p>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors relative ${acceptsOnlineCredit ? 'bg-orange-500' : 'bg-gray-700'}`}>
                  <input type="checkbox" className="sr-only" checked={acceptsOnlineCredit} onChange={(e) => setAcceptsOnlineCredit(e.target.checked)} />
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${acceptsOnlineCredit ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </div>
              </label>
            </div>
          </div>

          {/* Pagamento na Entrega */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h4 className="text-sm font-bold text-white mb-4">Pagamento na Entrega</h4>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm text-gray-200 font-bold">Pix na Entrega</p>
                  <p className="text-xs text-gray-500">Chave do entregador ou estabelecimento</p>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors relative ${acceptsDeliveryPix ? 'bg-orange-500' : 'bg-gray-700'}`}>
                  <input type="checkbox" className="sr-only" checked={acceptsDeliveryPix} onChange={(e) => setAcceptsDeliveryPix(e.target.checked)} />
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${acceptsDeliveryPix ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm text-gray-200 font-bold">Dinheiro</p>
                  <p className="text-xs text-gray-500">Com opção de troco</p>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors relative ${acceptsDeliveryCash ? 'bg-orange-500' : 'bg-gray-700'}`}>
                  <input type="checkbox" className="sr-only" checked={acceptsDeliveryCash} onChange={(e) => setAcceptsDeliveryCash(e.target.checked)} />
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${acceptsDeliveryCash ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm text-gray-200 font-bold">Cartão (Maquininha)</p>
                  <p className="text-xs text-gray-500">O entregador leva a máquina</p>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors relative ${acceptsDeliveryCard ? 'bg-orange-500' : 'bg-gray-700'}`}>
                  <input type="checkbox" className="sr-only" checked={acceptsDeliveryCard} onChange={(e) => setAcceptsDeliveryCard(e.target.checked)} />
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${acceptsDeliveryCard ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </div>
              </label>
            </div>
          </div>
          
          <div>
            <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">
              Observações Adicionais (Opcional)
            </label>
            <input
              type="text"
              value={paymentMethods}
              onChange={(e) => setPaymentMethods(e.target.value)}
              placeholder="Ex: Aceitamos Vale Refeição da Alelo na entrega"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Configurações de Frete */}
      <div className="pt-6 border-t border-gray-800 space-y-6">
        <div className="flex items-center justify-between">
          <label className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Truck className="w-4 h-4" /> Entrega e Frete por Distância
          </label>
          <button
            type="button"
            onClick={() => setHasDistanceDelivery(!hasDistanceDelivery)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              hasDistanceDelivery ? 'bg-green-500' : 'bg-gray-700'
            }`}
          >
            <span
              className={`${
                hasDistanceDelivery ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </button>
        </div>

        {hasDistanceDelivery && (
          <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
            {/* CEP da Loja */}
            <div>
              <label className="text-gray-500 text-[10px] font-black uppercase mb-2 block">Seu CEP de Origem</label>
              <input
                type="text"
                value={cep}
                onChange={(e) => setCep(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="00000-000"
                className="w-full max-w-[200px] bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-all"
              />
              <p className="text-[10px] text-gray-600 mt-2 flex items-center gap-1">
                <Info className="w-3 h-3" /> Usado para calcular a distância até o cliente via API Brasil.
              </p>
            </div>

            {/* Tabela de Preços */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-gray-500 text-[10px] font-black uppercase">Tabela de Preços por KM</label>
                <button
                  type="button"
                  onClick={() => setDeliveryRules([...deliveryRules, { min: 0, max: 0, fee: 0 }])}
                  className="text-orange-500 hover:text-orange-400 text-[10px] font-black flex items-center gap-1 uppercase"
                >
                  <Plus className="w-3 h-3" /> Adicionar Faixa
                </button>
              </div>

              <div className="space-y-3">
                {deliveryRules.map((rule, index) => (
                  <div key={index} className="flex items-center gap-3 bg-gray-800/50 p-3 rounded-2xl border border-gray-700/50">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <span className="text-[9px] text-gray-600 uppercase font-black">De (KM)</span>
                        <input
                          type="number" step="0.1"
                          value={rule.min}
                          onChange={(e) => {
                            const newRules = [...deliveryRules];
                            newRules[index].min = parseFloat(e.target.value) || 0;
                            setDeliveryRules(newRules);
                          }}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-gray-600 uppercase font-black">Até (KM)</span>
                        <input
                          type="number" step="0.1"
                          value={rule.max}
                          onChange={(e) => {
                            const newRules = [...deliveryRules];
                            newRules[index].max = parseFloat(e.target.value) || 0;
                            setDeliveryRules(newRules);
                          }}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-gray-600 uppercase font-black">Valor (R$)</span>
                        <input
                          type="number" step="0.01"
                          value={rule.fee}
                          onChange={(e) => {
                            const newRules = [...deliveryRules];
                            newRules[index].fee = parseFloat(e.target.value) || 0;
                            setDeliveryRules(newRules);
                          }}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-orange-500 text-orange-400 font-bold"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeliveryRules(deliveryRules.filter((_, i) => i !== index))}
                      className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cor do Tema */}
      <div>
        <label className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4" /> Cor Principal do Cardápio
        </label>
        <div className="grid grid-cols-4 gap-3">
          {THEME_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => setThemeColor(color.value)}
              className={`h-12 rounded-xl transition-all relative border-2 ${
                themeColor === color.value
                  ? 'border-white scale-110 shadow-lg'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.label}
            >
              {themeColor === color.value && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-black text-lg">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
        <p className="text-gray-600 text-xs mt-3">
          Cor selecionada: <span className="font-bold" style={{ color: themeColor }}>{themeColor}</span>
        </p>
      </div>

      {/* Preview */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Preview do Botão</p>
        <button
          type="button"
          className="px-6 py-3 rounded-xl text-white font-bold text-sm"
          style={{ backgroundColor: themeColor }}
        >
          Ver minha sacola (2 itens) · R$ 72,90
        </button>
      </div>

      {/* Salvar */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-orange-500 hover:bg-orange-400 disabled:opacity-50 transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
        {success && (
          <span className="text-green-400 text-sm font-bold animate-in fade-in">✅ Salvo com sucesso!</span>
        )}
      </div>
    </form>
  );
}
