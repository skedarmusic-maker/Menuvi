'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { ChevronLeft, Save, Loader2, User, Phone, MapPin, Building, Hash } from 'lucide-react';
import Link from 'next/link';

export default function EditProfilePage() {
  const { slug } = useParams();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    address_street: '',
    address_number: '',
    neighborhood: '',
    cep: '',
    complement: ''
  });

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${slug}/login`);
        return;
      }

      const { data } = await supabase.from('customer_profiles').select('*').eq('id', user.id).single();
      if (data) setProfile(data);
      setLoading(false);
    }
    loadProfile();
  }, [supabase, slug, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('customer_profiles')
      .upsert({
        id: user.id,
        ...profile,
        updated_at: new Date().toISOString()
      });

    setSaving(false);
    if (!error) {
      router.push(`/${slug}/account`);
    } else {
      alert('Erro ao salvar perfil: ' + error.message);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-6 py-6 sticky top-0 z-10 flex items-center gap-4">
        <Link href={`/${slug}/account`} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </Link>
        <h1 className="text-xl font-black text-gray-900">Editar Perfil</h1>
      </div>

      <form onSubmit={handleSave} className="max-w-md mx-auto p-6 space-y-6">
        {/* Dados Pessoais */}
        <section className="space-y-4">
          <h3 className="text-xs font-black text-gray-400 tracking-widest uppercase ml-1">Dados Pessoais</h3>
          
          <div className="space-y-2">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" required value={profile.full_name} onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                placeholder="Nome completo"
                className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="tel" required value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})}
                placeholder="Seu WhatsApp (DDD)"
                className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
              />
            </div>
          </div>
        </section>

        {/* Endereço */}
        <section className="space-y-4 pt-4">
          <h3 className="text-xs font-black text-gray-400 tracking-widest uppercase ml-1">Endereço de Entrega</h3>
          
          <div className="grid grid-cols-4 gap-3">
             <div className="col-span-3 relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" required value={profile.address_street} onChange={(e) => setProfile({...profile, address_street: e.target.value})}
                  placeholder="Rua / Avenida"
                  className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm text-sm"
                />
             </div>
             <div className="col-span-1">
                <input 
                  type="text" required value={profile.address_number} onChange={(e) => setProfile({...profile, address_number: e.target.value})}
                  placeholder="Nº"
                  className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm text-sm"
                />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" required value={profile.neighborhood} onChange={(e) => setProfile({...profile, neighborhood: e.target.value})}
                placeholder="Bairro"
                className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm text-sm"
              />
            </div>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" required value={profile.cep} onChange={(e) => setProfile({...profile, cep: e.target.value})}
                placeholder="CEP"
                className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm text-sm"
              />
            </div>
          </div>

          <input 
            type="text" value={profile.complement} onChange={(e) => setProfile({...profile, complement: e.target.value})}
            placeholder="Complemento (Apto, Bloco, Casa...)"
            className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm text-sm"
          />
        </section>

        <button 
          type="submit" disabled={saving}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-8"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              <Save className="w-5 h-5" />
              Salvar Dados
            </>
          )}
        </button>
      </form>
    </main>
  );
}
