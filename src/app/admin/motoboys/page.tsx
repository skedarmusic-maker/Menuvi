'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { User, Phone, Trash2, Plus, Loader2, Bike } from 'lucide-react';

export default function MotoboysPage() {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [motoboys, setMotoboys] = useState<any[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: rest } = await supabase.from('restaurants').select('id').eq('user_id', user.id).single();
        if (rest) {
          setRestaurantId(rest.id);
          const { data } = await supabase.from('delivery_people').select('*').eq('restaurant_id', rest.id);
          setMotoboys(data || []);
        }
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleAdd = async () => {
    if (!newName || !restaurantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('delivery_people')
      .insert({ restaurant_id: restaurantId, name: newName, phone: newPhone })
      .select()
      .single();

    if (error) {
      alert('Erro ao cadastrar: ' + error.message);
    } else {
      setMotoboys([...motoboys, data]);
      setNewName('');
      setNewPhone('');
      setIsAdding(false);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este motoboy?')) return;
    const { error } = await supabase.from('delivery_people').delete().eq('id', id);
    if (error) alert(error.message);
    else setMotoboys(motoboys.filter(m => m.id !== id));
  };

  if (loading && motoboys.length === 0) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Bike className="w-8 h-8 text-orange-500" /> Motoboys
          </h1>
          <p className="text-gray-500">Gerencie quem faz as suas entregas.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-orange-500 text-white font-bold px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-5 h-5" /> Novo Motoboy
        </button>
      </div>

      {isAdding && (
        <div className="bg-white border-2 border-orange-500/20 p-6 rounded-3xl mb-8 shadow-sm animate-in slide-in-from-top-2">
          <h3 className="font-bold mb-4">Novo Cadastro</h3>
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="text" placeholder="Nome do Motoboy" value={newName} onChange={e => setNewName(e.target.value)}
              className="bg-gray-50 border p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
            />
            <input 
              type="tel" placeholder="WhatsApp (DDD + Número)" value={newPhone} onChange={e => setNewPhone(e.target.value)}
              className="bg-gray-50 border p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setIsAdding(false)} className="text-gray-500 font-bold px-4">Cancelar</button>
            <button onClick={handleAdd} className="bg-gray-900 text-white font-bold px-6 py-2 rounded-xl">Salvar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {motoboys.map(motoboy => (
          <div key={motoboy.id} className="bg-white border p-5 rounded-3xl flex justify-between items-center group hover:border-orange-500/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                <User className="text-gray-400" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{motoboy.name}</h4>
                <p className="text-gray-500 text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> {motoboy.phone || 'Sem telefone'}</p>
              </div>
            </div>
            <button onClick={() => handleDelete(motoboy.id)} className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
        {motoboys.length === 0 && !isAdding && (
          <div className="col-span-2 py-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed">
            <p className="text-gray-400">Nenhum motoboy cadastrado ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
