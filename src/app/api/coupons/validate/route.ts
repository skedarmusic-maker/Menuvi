import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, restaurantId, phone } = body;

    if (!code || !restaurantId) {
      return NextResponse.json({ error: 'Código do cupom e ID do restaurante são obrigatórios.' }, { status: 400 });
    }

    const formattedCode = code.toUpperCase().trim().replace(/\s+/g, '');

    // 1. Buscar o cupom ativo no banco de dados
    const { data: coupon, error: couponError } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('code', formattedCode)
      .eq('active', true)
      .maybeSingle();

    if (couponError) {
      console.error('[validate-coupon] Erro ao buscar cupom:', couponError);
      return NextResponse.json({ error: 'Erro ao validar cupom.' }, { status: 500 });
    }

    if (!coupon) {
      return NextResponse.json({ error: 'Cupom inválido ou expirado.' }, { status: 400 });
    }

    // 2. Se for exclusivo para primeiro pedido, validar o telefone
    if (coupon.only_first_order) {
      if (!phone) {
        return NextResponse.json({ error: 'O número de telefone é obrigatório para validar este cupom.' }, { status: 400 });
      }

      const cleanPhone = phone.replace(/\D/g, '');

      if (cleanPhone.length < 10) {
        return NextResponse.json({ error: 'O número de telefone fornecido é inválido.' }, { status: 400 });
      }

      // Gerar variações comuns do telefone para garantir a busca correta no histórico de pedidos
      const variations = [cleanPhone];
      const ddd = cleanPhone.slice(0, 2);

      if (cleanPhone.length === 11) {
        const part1 = cleanPhone.slice(2, 7);
        const part2 = cleanPhone.slice(7);
        variations.push(`(${ddd}) ${part1}-${part2}`); // (11) 99999-9999
        variations.push(`${ddd} ${part1}-${part2}`);   // 11 99999-9999
        variations.push(`(${ddd})${part1}-${part2}`);  // (11)99999-9999
        variations.push(`${ddd}${part1}${part2}`);      // 11999999999

        // Variação antiga de 8 dígitos (sem o 9)
        const cleanWithoutNine = ddd + cleanPhone.slice(3);
        variations.push(cleanWithoutNine);
        const part1Old = cleanWithoutNine.slice(2, 6);
        const part2Old = cleanWithoutNine.slice(6);
        variations.push(`(${ddd}) ${part1Old}-${part2Old}`); // (11) 9999-9999
        variations.push(`${ddd} ${part1Old}-${part2Old}`);   // 11 9999-9999
      } else if (cleanPhone.length === 10) {
        const part1 = cleanPhone.slice(2, 6);
        const part2 = cleanPhone.slice(6);
        variations.push(`(${ddd}) ${part1}-${part2}`); // (11) 9999-9999
        variations.push(`${ddd} ${part1}-${part2}`);   // 11 9999-9999
        variations.push(`(${ddd})${part1}-${part2}`);  // (11)9999-9999
        variations.push(`${ddd}${part1}${part2}`);      // 1199999999

        // Variação nova com o dígito 9 inserido
        const cleanWithNine = ddd + '9' + cleanPhone.slice(2);
        variations.push(cleanWithNine);
        const part1New = cleanWithNine.slice(2, 7);
        const part2New = cleanWithNine.slice(7);
        variations.push(`(${ddd}) ${part1New}-${part2New}`); // (11) 99999-9999
        variations.push(`${ddd} ${part1New}-${part2New}`);   // 11 99999-9999
      }

      // Adicionar também versões com o prefixo do país (+55)
      const ddiVariations = variations.flatMap(v => [`+55${v}`, `+55 ${v}`, `55${v}`]);
      const allPhoneSearchTerms = Array.from(new Set([...variations, ...ddiVariations]));

      // Consultar se há algum pedido finalizado para este restaurante com qualquer variação do telefone
      const { data: existingOrders, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .in('customer_phone', allPhoneSearchTerms)
        .not('status', 'in', '("cancelled","rejected")')
        .limit(1);

      if (ordersError) {
        console.error('[validate-coupon] Erro ao consultar histórico de pedidos:', ordersError);
        return NextResponse.json({ error: 'Erro ao validar histórico do cliente.' }, { status: 500 });
      }

      if (existingOrders && existingOrders.length > 0) {
        return NextResponse.json({ error: 'Este cupom é exclusivo para novos clientes (primeiro pedido).' }, { status: 400 });
      }
    }

    // Retornar as informações do cupom para aplicação no carrinho
    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: Number(coupon.value)
      }
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno do servidor.';
    console.error('[validate-coupon] Exceção:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
