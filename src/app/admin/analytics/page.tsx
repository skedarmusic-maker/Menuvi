import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { redirect } from 'next/navigation';
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Calendar,
  ChevronRight,
  Download,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

export default async function AnalyticsPage() {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: { session } } = await supabase.auth.getUser();
  if (!session) redirect('/login');

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  if (!restaurant) redirect('/login');

  // Buscar todos os pedidos
  const { data: allOrders = [] } = await supabase
    .from('orders')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false });

  // Métricas Consolidadas
  const finishedOrders = allOrders?.filter(o => o.status === 'finished') || [];
  const canceledOrders = allOrders?.filter(o => o.status === 'canceled') || [];
  const totalRevenue = finishedOrders.reduce((acc, o) => acc + (o.total_amount || 0), 0);
  const averageTicket = finishedOrders.length > 0 ? totalRevenue / finishedOrders.length : 0;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-orange-500" />
            Relatórios e Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-1">Acompanhe o desempenho das suas vendas</p>
        </div>
        
        <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl text-xs font-bold border border-gray-700 transition-all opacity-50 cursor-not-allowed">
          <Download className="w-4 h-4" /> Exportar Relatório (Em breve)
        </button>
      </div>

      {/* Cards de Métricas Gerais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Faturamento Total" 
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="text-green-400"
          bg="bg-green-500/10"
        />
        <StatCard 
          label="Pedidos Concluídos" 
          value={finishedOrders.length}
          icon={<ShoppingBag className="w-5 h-5" />}
          color="text-blue-400"
          bg="bg-blue-500/10"
        />
        <StatCard 
          label="Ticket Médio" 
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(averageTicket)}
          icon={<Users className="w-5 h-5" />}
          color="text-purple-400"
          bg="bg-purple-500/10"
        />
        <StatCard 
          label="Taxa de Cancelamento" 
          value={`${allOrders.length > 0 ? ((canceledOrders.length / allOrders.length) * 100).toFixed(1) : 0}%`}
          icon={<XCircle className="w-5 h-5" />}
          color="text-red-400"
          bg="bg-red-500/10"
        />
      </div>

      {/* Tabela de Histórico */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-white font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            Histórico de Pedidos
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">ID / Data</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Cliente</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Status</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Pagamento</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {allOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-600 italic">
                    Nenhum pedido registrado no histórico.
                  </td>
                </tr>
              ) : (
                allOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white font-mono text-[11px]">#{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-gray-600 text-[10px] mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')} {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-300 font-medium">{order.customer_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                        {order.payment_method?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-white font-black">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, bg }: { label: string, value: string | number, icon: any, color: string, bg: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5 hover:bg-gray-800/50 transition-all group">
      <div className={`w-10 h-10 rounded-2xl ${bg} ${color} flex items-center justify-center mb-4 border border-white/5`}>
        {icon}
      </div>
      <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{label}</p>
      <p className={`text-xl lg:text-2xl font-black mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    new: { label: 'Novo', icon: <Clock className="w-3 h-3" />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    accepted: { label: 'Preparo', icon: <Clock className="w-3 h-3" />, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
    delivering: { label: 'Entrega', icon: <Clock className="w-3 h-3" />, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    finished: { label: 'Concluído', icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
    canceled: { label: 'Cancelado', icon: <XCircle className="w-3 h-3" />, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  };

  const config = configs[status] || configs.new;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${config.color} ${config.bg}`}>
      {config.icon}
      {config.label}
    </div>
  );
}
