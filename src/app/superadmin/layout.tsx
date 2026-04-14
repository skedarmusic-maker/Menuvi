import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import Link from 'next/link';
import { LayoutDashboard, Store, LogOut, Shield } from 'lucide-react';
import SubSidebarToggle from '@/components/superadmin/SuperAdminSidebar'; // Componentizado

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: superAdmin } = await supabase
    .from('super_admins')
    .select('id')
    .eq('email', user.email)
    .single();

  if (!superAdmin) redirect('/admin');

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Super Admin Sidebar */}
      <SubSidebarToggle />
      <main className="flex-1 ml-64 min-h-screen bg-gray-950">
        {children}
      </main>
    </div>
  );
}
