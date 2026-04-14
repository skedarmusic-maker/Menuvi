import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import SettingsForm from '@/components/admin/SettingsForm';

export default async function AdminSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!restaurant) redirect('/login');

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Configurações</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie as informações do seu restaurante.</p>
      </div>
      <SettingsForm restaurant={restaurant} />
    </div>
  );
}
