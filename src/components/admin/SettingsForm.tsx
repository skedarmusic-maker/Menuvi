'use client';

import { useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Save, Loader2, Store, Phone, Palette, Globe, Image as ImageIcon, Camera, Trash2 } from 'lucide-react';

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
  const [name, setName] = useState(restaurant.name || '');
  const [whatsapp, setWhatsapp] = useState(
    // Remove o 55 do início para exibir só o DDD + número
    (restaurant.whatsapp_number || '').replace(/^55/, '')
  );
  const [themeColor, setThemeColor] = useState(restaurant.theme_color || '#ef4444');
  const [logoUrl, setLogoUrl] = useState(restaurant.logo_url || '');
  const [bannerUrl, setBannerUrl] = useState(restaurant.banner_url || '');
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
