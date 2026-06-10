import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// Admin client with service role key - bypasses RLS completely
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // 1. Verify the user is authenticated via cookies
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado. Faça login novamente.' }, { status: 401 });
    }

    // 2. Parse body
    const body = await req.json();
    const { restaurantId, ...updateData } = body;

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId não fornecido.' }, { status: 400 });
    }

    // 3. Verify this restaurant belongs to the logged-in user (security check)
    const { data: restaurant, error: fetchError } = await supabaseAdmin
      .from('restaurants')
      .select('id, user_id')
      .eq('id', restaurantId)
      .single();

    if (fetchError || !restaurant) {
      console.error('[save-settings] Restaurante não encontrado:', fetchError);
      return NextResponse.json({ error: 'Restaurante não encontrado.' }, { status: 404 });
    }

    if (restaurant.user_id !== user.id) {
      // Check if user is a super admin
      const { data: superAdmin } = await supabaseAdmin
        .from('super_admins')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (!superAdmin) {
        return NextResponse.json({ error: 'Sem permissão para editar este restaurante.' }, { status: 403 });
      }
    }

    // 4. Update with service role (bypasses RLS)
    const { error: updateError } = await supabaseAdmin
      .from('restaurants')
      .update(updateData)
      .eq('id', restaurantId);

    if (updateError) {
      console.error('[save-settings] Erro ao atualizar:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log(`[save-settings] Restaurante ${restaurantId} atualizado com sucesso pelo usuário ${user.email}`);
    return NextResponse.json({ success: true });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno do servidor.';
    console.error('[save-settings] Exceção:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
