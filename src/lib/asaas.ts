export async function createAsaasCustomer(name: string, phone: string, cpfCnpj: string) {
  const apiKey = process.env.ASAAS_API_KEY?.trim();
  const apiUrl = (process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3').trim();
  
  const maskedKey = apiKey ? `${apiKey.substring(0, 10)}... (Total: ${apiKey.length} chars)` : 'UNDEFINED';
  console.log('🚀 [Asaas API] URL:', apiUrl);
  console.log('🔑 [Asaas API] Key Masked:', maskedKey);

  const response = await fetch(`${apiUrl}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey || '',
    },
    body: JSON.stringify({
      name,
      mobilePhone: phone,
      cpfCnpj,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [Asaas API] Erro no Customer:', errorText);
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
  const apiKey = process.env.ASAAS_API_KEY?.trim();
  const apiUrl = (process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3').trim();

  const response = await fetch(`${apiUrl}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey || '',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [Asaas API] Erro no Payment:', errorText);
    throw new Error(`Erro ao criar pagamento no Asaas: ${errorText}`);
  }

  return response.json();
}

export async function getAsaasPixQrCode(paymentId: string) {
  const apiKey = process.env.ASAAS_API_KEY?.trim();
  const apiUrl = (process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3').trim();

  const response = await fetch(`${apiUrl}/payments/${paymentId}/pixQrCode`, {
    method: 'GET',
    headers: {
      'access_token': apiKey || '',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [Asaas API] Erro no Pix:', errorText);
    throw new Error(`Erro ao buscar QR Code Pix: ${errorText}`);
  }

  return response.json();
}
