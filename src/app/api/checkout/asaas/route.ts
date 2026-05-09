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
    const body = await req.json();
    const { 
      orderId, 
      restaurantId, 
      customerName, 
      customerPhone, 
      customerCpf, 
      totalAmount, 
      paymentMethod,
      cardData,
      customerAddress
    } = body;

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
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDate = tomorrow.toISOString().split('T')[0];
    
    const isCreditCard = paymentMethod === 'online_credit_card';
    const asaasBillingType = isCreditCard ? 'CREDIT_CARD' : 'PIX';

    // 4.1 Preparar dados do cartão se for o caso
    let creditCardData = undefined;
    let creditCardHolderInfo = undefined;

    if (isCreditCard && cardData) {
      const [expiryMonth, expiryYear] = cardData.expiry.split('/');
      creditCardData = {
        holderName: cardData.holderName,
        number: cardData.number,
        expiryMonth: expiryMonth,
        expiryYear: '20' + expiryYear,
        ccv: cardData.cvv,
      };

      creditCardHolderInfo = {
        name: customerName,
        email: 'cliente@menuvi.app', // Placeholder ou pegar do cadastro
        cpfCnpj: customerCpf,
        postalCode: customerAddress?.cep || '',
        addressNumber: customerAddress?.number || 'S/N',
        phone: customerPhone,
      };
    }

    const payment = await createAsaasPayment({
      customer: asaasCustomer.id,
      billingType: asaasBillingType,
      value: totalAmount,
      dueDate: dueDate,
      description: `Pedido #${orderId.slice(0, 8)} - ${restaurant.name}`,
      externalReference: orderId,
      split: split,
      // Se for cartão, envia os dados extras
      ...(isCreditCard ? {
        creditCard: creditCardData,
        creditCardHolderInfo: creditCardHolderInfo,
      } : {}),
    });

    console.log('💳 [Asaas Debug] Pagamento Criado:', JSON.stringify(payment, null, 2));

    let responsePayload: any = {
      paymentId: payment.id,
    };

    // 5. Atualizar o pedido no Supabase
    const updateData: any = {
      gateway_payment_id: payment.id,
      payment_status: 'pending'
    };

    if (isCreditCard) {
      // Retorna o link de pagamento do Asaas
      responsePayload.invoiceUrl = payment.invoiceUrl;
    } else {
      // 5.1 Buscar o QR Code do Pix (Tentativa)
      try {
        const pixData = await getAsaasPixQrCode(payment.id);
        responsePayload.qrCode = pixData.encodedImage;
        responsePayload.pixCode = pixData.payload;
        
        updateData.payment_qr_code = pixData.encodedImage;
        updateData.payment_qr_code_text = pixData.payload;
      } catch (pixErr) {
        console.error('⚠️ [Asaas] Falha ao gerar QR Code, usando InvoiceUrl como fallback');
        // Se falhar o QR Code direto, mandamos o InvoiceUrl para o cliente não ficar na mão
        responsePayload.invoiceUrl = payment.invoiceUrl;
        responsePayload.pixError = true;
      }
    }

    await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    return NextResponse.json(responsePayload);

  } catch (error: any) {
    console.error('Erro no checkout Asaas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
