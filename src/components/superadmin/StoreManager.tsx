'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, X, Search, MoreVertical, Loader2, Calendar, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StoreManager({ initialStores }: { initialStores: any[] }) {
  const router = useRouter();
  const [stores, setStores] = useState(initialStores);
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    restaurantName: '',
    whatsappNumber: '',
    slug: '',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const handleSlug = (name: string) => {
    setFormData({
      ...formData,
      restaurantName: name,
      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    });
  };

  const provisionStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formattedWhatsapp = `55${formData.whatsappNumber.replace(/\D/g, '')}`;
      
      const response = await fetch('/api/admin/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          whatsappNumber: formattedWhatsapp,
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error || 'Erro desconhecido');
      
      alert('Loja criada e usuário liberado com sucesso!');
      setOpenModal(false);
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    if (!confirm(`Deseja realmente ${currentStatus ? 'Bloquear' : 'Desbloquear'} este cliente?`)) return;
    
    const { error } = await supabase.from('restaurants').update({ is_active: !currentStatus }).eq('id', id);
    if (!error) {
      setStores(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
    }
  };

  const toggleDelivery = async (id: string, current: boolean) => {
    const { error } = await supabase.from('restaurants').update({ has_distance_delivery: !current }).eq('id', id);
    if (!error) {
      setStores(prev => prev.map(s => s.id === id ? { ...s, has_distance_delivery: !current } : s));
    }
  };

  const filteredStores = stores.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.slug.includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar lojas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
        <button
          onClick={() => setOpenModal(true)}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nova Loja (Provisionar)
        </button>
      </div>

      {/* Tabela de Lojas */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-gray-800/50 text-xs uppercase font-bold text-gray-500 border-b border-gray-800">
            <tr>
              <th className="px-6 py-4">Restaurante / Slug</th>
              <th className="px-6 py-4">WhatsApp</th>
              <th className="px-6 py-4">Vencimento (Plano)</th>
              <th className="px-6 py-4">Recursos</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredStores.map(store => (
              <tr key={store.id} className={`hover:bg-gray-800/20 transition-colors ${!store.is_active ? 'opacity-60' : ''}`}>
                <td className="px-6 py-4">
                  <p className="text-white font-bold">{store.name}</p>
                  <p className="text-xs">menuvi.app/{store.slug}</p>
                </td>
                <td className="px-6 py-4">{store.whatsapp_number}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(store.expires_at).toLocaleDateString('pt-BR')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => toggleDelivery(store.id, store.has_distance_delivery)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border transition-all ${store.has_distance_delivery ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-gray-800 border-gray-700 text-gray-600'}`}
                  >
                    <MapPin className="w-3 h-3" />
                    {store.has_distance_delivery ? 'FRETE API ATIVO' : 'ATIVAR FRETE API'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  {store.is_active ? (
                    <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-full text-xs font-bold">Ativa</span>
                  ) : (
                    <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-1 rounded-full text-xs font-bold">Bloqueada</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                   <button onClick={() => toggleStatus(store.id, store.is_active)} className="text-indigo-400 hover:text-indigo-300 font-semibold text-xs transition-colors">
                     {store.is_active ? 'Bloquear App' : 'Liberar App'}
                   </button>
                </td>
              </tr>
            ))}
            {filteredStores.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Nenhuma loja encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Provisionamento */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-800 shrink-0">
              <h3 className="text-lg font-black text-white">Criar Nova Loja</h3>
              <button onClick={() => setOpenModal(false)} className="p-1.5 hover:bg-gray-800 rounded-full text-gray-500 hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={provisionStore} className="p-6 space-y-4 overflow-y-auto">
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-4">
                <p className="text-indigo-400 text-xs text-center font-semibold">Este form invoca a API super-admin. O cliente será liberado imediatamente sem limite de e-mails.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">E-mail do Cliente</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">Senha Provisória</label>
                  <input type="text" required minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500" />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">Nome do Restaurante</label>
                <input type="text" required value={formData.restaurantName} onChange={e => handleSlug(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500" />
              </div>

              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">Slug (URL)</label>
                <input type="text" required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 text-sm font-mono" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">WhatsApp</label>
                  <input type="tel" required placeholder="11999999999" value={formData.whatsappNumber} onChange={e => setFormData({...formData, whatsappNumber: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">Vencimento</label>
                  <input type="date" required value={formData.expires_at} onChange={e => setFormData({...formData, expires_at: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500" />
                </div>
              </div>

              <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-colors mt-6 flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-5 h-5 animate-spin"/>} Executar e Salvar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
