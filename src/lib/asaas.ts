const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

export async function createAsaasCustomer(name: string, phone: string, cpfCnpj: string) {
  console.log('🔑 [Asaas Debug] Usando Key:', ASAAS_API_KEY ? ASAAS_API_KEY.substring(0, 15) + '...' : 'UNDEFINED');

  const response = await fetch(`${ASAAS_API_URL}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY!,
    },
    body: JSON.stringify({
      name,
      mobilePhone: phone,
      cpfCnpj,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erro ao criar cliente no Asaas: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function createAsaasPayment(data: {
  customer: string;
  billingType: 'PIX';
  value: number;
  dueDate: string;
  description: string;
  externalReference: string;
  split?: {
    walletId: string;
    percentualValue?: number;
    fixedValue?: number;
  }[];
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
