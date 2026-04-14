import { createSupabaseServerClient } from '@/lib/supabase-server';
import { Store, CheckCircle, AlertTriangle } from 'lucide-react';

export default async function SuperAdminDashboard() {
  const supabase = await createSupabaseServerClient();

  // Buscar métricas
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('plan_status, is_active, created_at, expires_at');

  const total = restaurants?.length || 0;
  const active = restaurants?.filter(r => r.is_active).length || 0;
  const overdue = restaurants?.filter(r => r.plan_status === 'overdue' || new Date(r.expires_at) < new Date()).length || 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Dashboard Mestre</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral do negócio (Micro SaaS)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Store className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-semibold">Total de Lojas</p>
              <h2 className="text-3xl font-black text-white">{total}</h2>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-semibold">Lojas Ativas</p>
              <h2 className="text-3xl font-black text-white">{active}</h2>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-semibold">Vencidas / Inadimplentes</p>
              <h2 className="text-3xl font-black text-white">{overdue}</h2>
            </div>
          </div>
        </div>
      </div>
      
      {/* Aqui pode entrar um gráfico de faturamento ou lista de contas a vencer em breve */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
         <h3 className="text-lg font-bold text-white mb-4">Bem-vindo(a) ao seu painel.</h3>
         <p className="text-gray-500 text-sm">Vá para a guia Lojas para gerenciar quem está online ou criar novos acessos para seus clientes.</p>
      </div>

    </div>
  );
}
