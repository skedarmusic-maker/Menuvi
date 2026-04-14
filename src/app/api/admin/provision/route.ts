import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // A Service Role Key é obrigatória para bypass de RLS e criar usuários com auth.admin
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { email, password, restaurantName, whatsappNumber, slug, plan_status, expires_at } = body;

    if (!email || !password || !restaurantName || !slug) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // 1. Cria o usuário usando a API Admin (Ignora limitações de Rate Limit se for por aqui)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Força a confirmação do e-mail
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Insere a loja via Admin (ignorando RLS para garantir sucesso)
    if (authData.user) {
      const { error: restaurantError } = await supabaseAdmin.from('restaurants').insert({
        user_id: authData.user.id,
        name: restaurantName,
        slug: slug,
        whatsapp_number: whatsappNumber,
        plan_status: plan_status || 'active',
        expires_at: expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
      });

      if (restaurantError) {
        // Se falhar a loja, tentar deletar o usuário para não deixar sujeira
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json({ error: 'Erro ao criar loja. Slug pode estar em uso.' }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, message: 'Loja provisionada com sucesso!' });
  } catch (err: any) {
    console.error('PROVISION_ERROR:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
