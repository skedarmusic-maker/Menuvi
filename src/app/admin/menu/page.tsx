import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import MenuManager from '@/components/admin/MenuManager';

export default async function AdminMenuPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Buscar Restaurante
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!restaurant) redirect('/login');

  // Buscar Categorias e Produtos
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('order_index', { ascending: true });

  const { data: products } = await supabase
    .from('products')
    .select('*, categories!inner(restaurant_id)')
    .eq('categories.restaurant_id', restaurant.id)
    .order('created_at', { ascending: false });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Cardápio</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gerencie as categorias e os itens do seu cardápio online.
        </p>
      </div>

      <MenuManager 
        restaurantId={restaurant.id}
        initialCategories={categories || []}
        initialProducts={products || []}
      />
    </div>
  );
}
