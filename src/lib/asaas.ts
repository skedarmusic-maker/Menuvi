const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

export async function createAsaasCustomer(name: string, phone: string, cpfCnpj: string) {
  const maskedKey = ASAAS_API_KEY ? `${ASAAS_API_KEY.substring(0, 10)}... (Total: ${ASAAS_API_KEY.length} chars)` : 'UNDEFINED';
  console.log('🚀 [Asaas API] Tentando criar cliente...');
  console.log('🔑 [Asaas API] URL:', ASAAS_API_URL);
  console.log('🔑 [Asaas API] Key Masked:', maskedKey);

  const response = await fetch(`${ASAAS_API_URL}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY || '',
    },
    body: JSON.stringify({
      name,
      mobilePhone: phone,
      cpfCnpj,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [Asaas API] Erro Detalhado:', errorText);
    throw new Error(`Erro ao criar cliente no Asaas: ${errorText}`);
  }

  return response.json();
}

export async function createAsaasPayment(data: {
  customer: string;
  billingType: 'PIX' | 'CREDIT_CARD';
  value: number;
  dueDate: string;
  description: string;
  externalReference: string;
  split?: {
    walletId: string;
    percentualValue?: number;
    fixedValue?: number;
  }[];
  creditCard?: any;
  creditCardHolderInfo?: any;
}) {
  const response = await fetch(`${ASAAS_API_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY!,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erro ao criar pagamento no Asaas: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function getAsaasPixQrCode(paymentId: string) {
  const response = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
    method: 'GET',
    headers: {
      'access_token': ASAAS_API_KEY!,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erro ao buscar QR Code Pix: ${JSON.stringify(error)}`);
  }

  return response.json();
}
