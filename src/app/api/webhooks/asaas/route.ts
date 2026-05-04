import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.event;
    const payment = body.payment;

    console.log(`🔔 Webhook Asaas Recebido: ${event}`, payment.id);

    // Se o pagamento foi confirmado
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const orderId = payment.externalReference;

      // 1. Atualizar o status do pagamento no Supabase
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'accepted' // Opcional: já aceita o pedido automaticamente
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('❌ Erro ao atualizar pedido via webhook:', updateError);
        return NextResponse.json({ error: 'Erro ao atualizar pedido' }, { status: 500 });
      }

      console.log(`✅ Pedido #${orderId} atualizado para PAGO.`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Erro no Webhook Asaas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
