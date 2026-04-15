import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import OrdersKanban from '@/components/admin/OrdersKanban';
import { ShoppingBag, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!restaurant) redirect('/login');

  // Busca pedidos de hoje com itens e produtos
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name))')
    .eq('restaurant_id', restaurant.id)
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false });

  const allOrders = orders || [];

  // Métricas do dia
  const totalToday = allOrders.length;
  const finishedToday = allOrders.filter((o) => o.status === 'finished').length;
  const revenueToday = allOrders
    .filter((o) => o.status === 'finished')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);
  const pending = allOrders.filter((o) => ['new', 'accepted'].includes(o.status)).length;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-xl lg:text-2xl font-black text-white">Pedidos do Dia</h1>
        <p className="text-gray-500 text-xs lg:text-sm mt-1">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
        <MetricCard
          icon={<ShoppingBag className="w-5 h-5" />}
          label="Total"
          value={totalToday}
          color="text-blue-400"
          bg="bg-blue-500/10 border-blue-500/20"
        />
        <MetricCard
          icon={<Clock className="w-5 h-5" />}
          label="Em Aberto"
          value={pending}
          color="text-orange-400"
          bg="bg-orange-500/10 border-orange-500/20"
        />
        <MetricCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Finais"
          value={finishedToday}
          color="text-green-400"
          bg="bg-green-500/10 border-green-500/20"
        />
        <MetricCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Faturado"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(revenueToday)}
          color="text-purple-400"
          bg="bg-purple-500/10 border-purple-500/20"
          isText
        />
      </div>

      {/* Kanban */}
      <OrdersKanban initialOrders={allOrders as any} />
    </div>
  );
}

function MetricCard({ icon, label, value, color, bg, isText = false }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  bg: string;
  isText?: boolean;
}) {
  return (
    <div className={`bg-gray-900 border rounded-2xl p-4 border-gray-800`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${bg} ${color} mb-3`}>
        {icon}
      </div>
      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">{label}</p>
      <p className={`font-black mt-1 ${color} ${isText ? 'text-base' : 'text-2xl'}`}>{value}</p>
    </div>
  );
}
