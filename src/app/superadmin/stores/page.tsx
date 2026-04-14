import { createSupabaseServerClient } from '@/lib/supabase-server';
import StoreManager from '@/components/superadmin/StoreManager';

export default async function SuperAdminStoresPage() {
  const supabase = await createSupabaseServerClient();
  
  // Pegamos as lojas com mais informações (poderia puxar email do auth if we had access, but auth requires service key, so we strictly use restaurant fields)
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Lojas e Clientes</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie os acessos, bloqueie inativos e crie novas lojas.</p>
      </div>

      <StoreManager initialStores={restaurants || []} />
    </div>
  );
}
