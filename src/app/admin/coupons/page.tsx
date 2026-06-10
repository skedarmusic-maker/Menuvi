'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { Ticket, Plus, Trash2, Loader2, Percent, DollarSign, ToggleLeft, ToggleRight, Check, X } from 'lucide-react';

interface Coupon {
  id: string;
  restaurant_id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  only_first_order: boolean;
  active: boolean;
  created_at: string;
}

export default function CouponsPage() {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState('');
  const [onlyFirstOrder, setOnlyFirstOrder] = useState(true);
  const [active, setActive] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: rest } = await supabase.from('restaurants').select('id').eq('user_id', user.id).single();
        if (rest) {
          setRestaurantId(rest.id);
          const { data } = await supabase
            .from('coupons')
            .select('*')
            .eq('restaurant_id', rest.id)
            .order('created_at', { ascending: false });
          setCoupons(data || []);
        }
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !value || !restaurantId) return;

    const formattedCode = code.toUpperCase().trim().replace(/\s+/g, '');
    const numericValue = parseFloat(value);

    if (isNaN(numericValue) || numericValue <= 0) {
      alert('Por favor, insira um valor de desconto válido.');
      return;
    }

    if (type === 'percentage' && numericValue > 100) {
      alert('O desconto percentual não pode ser maior que 100%.');
      return;
    }

    setSaving(true);
    const { data, error } = await supabase
      .from('coupons')
      .insert({
        restaurant_id: restaurantId,
        code: formattedCode,
        type,
        value: numericValue,
        only_first_order: onlyFirstOrder,
        active
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      if (error.code === '23505') {
        alert('Você já possui um cupom cadastrado com este código!');
      } else {
        alert('Erro ao cadastrar cupom: ' + error.message);
      }
    } else {
      setCoupons([data, ...coupons]);
      setCode('');
      setValue('');
      setOnlyFirstOrder(true);
      setActive(true);
      setIsAdding(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('coupons')
      .update({ active: !currentStatus })
      .eq('id', id);

    if (error) {
      alert('Erro ao alterar status: ' + error.message);
    } else {
      setCoupons(coupons.map(c => c.id === id ? { ...c, active: !currentStatus } : c));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este cupom?')) return;

    const { error } = await supabase.from('coupons').delete().eq('id', id);

    if (error) {
      alert('Erro ao excluir: ' + error.message);
    } else {
      setCoupons(coupons.filter(c => c.id !== id));
    }
  };

  if (loading && coupons.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
        <Loader2 className="animate-spin text-orange-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen bg-gray-950 text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2 tracking-tight">
            <Ticket className="w-8 h-8 text-orange-500" /> Cupons de Desconto
          </h1>
          <p className="text-gray-400 text-sm mt-1">Crie cupons para atrair clientes do iFood e fidelizar no seu cardápio próprio.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-orange-500 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/10"
        >
          <Plus className="w-5 h-5" /> Novo Cupom
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-gray-900 border border-gray-800 p-6 rounded-3xl mb-8 shadow-xl animate-in slide-in-from-top-2 duration-300">
          <h3 className="font-bold text-lg mb-4 text-white">Cadastrar Novo Cupom</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-gray-400">Código do Cupom</label>
              <input
                type="text"
                placeholder="Ex: IFOOD15"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
                className="bg-gray-950 border border-gray-800 p-4 rounded-xl focus:border-orange-500 outline-none text-white font-mono placeholder:text-gray-600"
              />
              <p className="text-[10px] text-gray-500">Sem espaços, ex: PRIMEIRO10</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-gray-400">Tipo de Desconto</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as 'percentage' | 'fixed')}
                className="bg-gray-950 border border-gray-800 p-4 rounded-xl focus:border-orange-500 outline-none text-white font-bold"
              >
                <option value="percentage">Porcentagem (%)</option>
                <option value="fixed">Valor Fixo (R$)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-gray-400">Valor do Desconto</label>
              <input
                type="number"
                step="0.01"
                placeholder={type === 'percentage' ? 'Ex: 15' : 'Ex: 10.00'}
                value={value}
                onChange={e => setValue(e.target.value)}
                required
                className="bg-gray-950 border border-gray-800 p-4 rounded-xl focus:border-orange-500 outline-none text-white font-bold"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <label className="flex items-center gap-3 cursor-pointer group bg-gray-950 p-4 rounded-2xl border border-gray-800 flex-1 hover:border-gray-700 transition-colors">
              <input
                type="checkbox"
                checked={onlyFirstOrder}
                onChange={e => setOnlyFirstOrder(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${onlyFirstOrder ? 'bg-orange-500 border-orange-500' : 'border-gray-700'}`}>
                {onlyFirstOrder && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">Apenas no Primeiro Pedido</p>
                <p className="text-[10px] text-gray-500 mt-1">O sistema verifica pelo telefone do cliente se ele já comprou antes.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group bg-gray-950 p-4 rounded-2xl border border-gray-800 flex-1 hover:border-gray-700 transition-colors">
              <input
                type="checkbox"
                checked={active}
                onChange={e => setActive(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${active ? 'bg-orange-500 border-orange-500' : 'border-gray-700'}`}>
                {active && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">Cupom Ativo</p>
                <p className="text-[10px] text-gray-500 mt-1">Se estiver inativo, nenhum cliente poderá usar este cupom.</p>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-800 pt-5">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              disabled={saving}
              className="text-gray-400 hover:text-white font-bold px-4"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-white text-gray-950 font-black px-6 py-2.5 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Cupom'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {coupons.map(coupon => (
          <div
            key={coupon.id}
            className={`bg-gray-900 border border-gray-800 p-6 rounded-[2rem] flex flex-col justify-between group hover:border-orange-500/30 transition-all ${!coupon.active ? 'opacity-60' : ''}`}
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className="font-mono text-lg font-black tracking-wider text-white bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-xl">
                  {coupon.code}
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(coupon.id, coupon.active)}
                    title={coupon.active ? 'Desativar Cupom' : 'Ativar Cupom'}
                    className="p-1.5 text-gray-500 hover:text-white transition-colors"
                  >
                    {coupon.active ? <ToggleRight className="w-6 h-6 text-orange-500" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 text-orange-400">
                {coupon.type === 'percentage' ? (
                  <Percent className="w-5 h-5" />
                ) : (
                  <DollarSign className="w-5 h-5" />
                )}
                <span className="text-2xl font-black leading-none">
                  {coupon.type === 'percentage' ? `${coupon.value}%` : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(coupon.value)}
                </span>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1">de desconto</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-800/60 flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${coupon.only_first_order ? 'bg-indigo-500' : 'bg-green-500'}`} />
                {coupon.only_first_order ? 'Apenas no 1º Pedido' : 'Uso Geral'}
              </span>
              <span>
                Criado em {new Date(coupon.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        ))}

        {coupons.length === 0 && !isAdding && (
          <div className="col-span-2 py-16 text-center bg-gray-900/40 rounded-[2.5rem] border border-dashed border-gray-800">
            <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-bold">Nenhum cupom cadastrado ainda.</p>
            <p className="text-gray-600 text-xs mt-1">Clique em "Novo Cupom" para criar a sua primeira promoção.</p>
          </div>
        )}
      </div>
    </div>
  );
}
