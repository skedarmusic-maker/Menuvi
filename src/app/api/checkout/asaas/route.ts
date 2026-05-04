import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseBrowserClient } from '@/lib/supabase-client'; // This might be for client, I need a service role one for server
import { createAsaasCustomer, createAsaasPayment, getAsaasPixQrCode } from '@/lib/asaas';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role to bypass RLS if needed, 
// or just standard if we trust the auth token.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { orderId, restaurantId, customerName, customerPhone, customerCpf, totalAmount } = await req.json();

    // 1. Buscar dados do restaurante para o Split
    const { data: restaurant, error: restError } = await supabaseAdmin
      .from('restaurants')
      .select('gateway_wallet_id, split_fee_percent, name')
      .eq('id', restaurantId)
      .single();

    if (restError || !restaurant) {
      return NextResponse.json({ error: 'Restaurante não encontrado ou sem configuração de pagamento.' }, { status: 404 });
    }

    // 2. Criar ou buscar cliente no Asaas
    // Simplificado: Criando sempre um novo para o exemplo, o ideal é vincular ao e-mail/telefone
    const asaasCustomer = await createAsaasCustomer(customerName, customerPhone, customerCpf);

    // 3. Preparar o Split
    // TEMPORARIAMENTE DESATIVADO PARA TESTAR SE É O SPLIT QUE ESTÁ BLOQUEANDO O PIX
    const split = undefined;

    // 4. Criar o Pagamento no Asaas
    const today = new Date().toISOString().split('T')[0];
    const payment = await createAsaasPayment({
      customer: asaasCustomer.id,
      billingType: 'PIX',
      value: totalAmount,
      dueDate: today,
      description: `Pedido #${orderId.slice(0, 8)} - ${restaurant.name}`,
      externalReference: orderId,
      split: split,
    });

    console.log('💳 [Asaas Debug] Pagamento Criado:', JSON.stringify(payment, null, 2));

    // 5. Buscar o QR Code do Pix
    const pixData = await getAsaasPixQrCode(payment.id);

    // 6. Atualizar o pedido no Supabase com os dados do pagamento
    await supabaseAdmin
      .from('orders')
      .update({
        gateway_payment_id: payment.id,
        payment_qr_code: pixData.encodedImage,
        payment_qr_code_text: pixData.payload,
        payment_status: 'pending'
      })
      .eq('id', orderId);

    return NextResponse.json({
      paymentId: payment.id,
      qrCode: pixData.encodedImage,
      pixCode: pixData.payload,
    });

  } catch (error: any) {
    console.error('Erro no checkout Asaas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
