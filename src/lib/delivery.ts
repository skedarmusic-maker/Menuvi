export async function calculateDeliveryDistance(customerCep: string, storeCep: string) {
  const cleanCustomerCep = customerCep.replace(/\D/g, '');
  const cleanStoreCep = storeCep?.replace(/\D/g, '');

  if (!cleanCustomerCep || cleanCustomerCep.length !== 8 || !cleanStoreCep) return null;

  try {
    const response = await fetch("https://gateway.apibrasil.io/api/v2/cep/distancia/calcular", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2dhdGV3YXkuYXBpYnJhc2lsLmlvL2FwaS9vYXV0aC9leGNoYW5nZSIsImlhdCI6MTc3NjI2ODUwNywiZXhwIjoxODA3ODA0NTA3LCJuYmYiOjE3NzYyNjg1MDcsImp0aSI6Im5pR1NKWHVHcVh1QjBTODIiLCJzdWIiOiIyMTI2MyJ9.uOPVoIuYNf9xDU__QFBpCYwSuxjFueitS8-FraPsZXQ"
      },
      body: JSON.stringify({
        tipo: "calcula-distancia-cep",
        ceps: [cleanStoreCep, cleanCustomerCep],
        mode: "driving",
        homolog: false
      })
    });

    const data = await response.json();
    
    // A API retorna distanceRaw em metros dentro do objeto data
    const distanceMeters = data?.data?.distanceRaw || 0;
    const distanceKm = distanceMeters / 1000;
    
    console.log('🏁 Distância Calculada:', distanceKm.toFixed(2), 'KM');
    return distanceKm;
  } catch (error) {
    console.error("❌ Erro ao calcular distância:", error);
    return null;
  }
}

export interface DeliveryRule {
  min: number;
  max: number;
  fee: number;
}

export function getDeliveryFee(distanceKm: number, rules: DeliveryRule[]): number {
  if (!rules || !Array.isArray(rules)) return 0;

  // Encontra a regra que se encaixa na distância
  const rule = rules.find(r => distanceKm >= r.min && distanceKm <= r.max);

  if (rule) return rule.fee;

  // Se estiver fora de todas as faixas, retorna a taxa da maior faixa cadastrada ou um valor padrão
  const maxRange = [...rules].sort((a, b) => b.max - a.max)[0];
  return maxRange ? maxRange.fee : 0;
}
