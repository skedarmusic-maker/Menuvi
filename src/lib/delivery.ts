export async function calculateDeliveryDistance(customerCep: string, storeCep: string = "09942120") {
  const cleanCustomerCep = customerCep.replace(/\D/g, '');
  const cleanStoreCep = storeCep.replace(/\D/g, '');

  if (cleanCustomerCep.length !== 8) return null;

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
    
    // De acordo com a documentação da API Brasil, o retorno costuma vir em objects ou string
    // Vamos extrair a distância em KM
    const distanceKm = data?.response?.distancia_km || data?.distancia_km || data?.response?.distancia_total || 0;
    
    console.log('🏁 Distância Calculada:', distanceKm, 'KM');
    return parseFloat(distanceKm);
  } catch (error) {
    console.error("❌ Erro ao calcular distância:", error);
    return null;
  }
}

export function getDeliveryFee(distanceKm: number): number {
  if (distanceKm <= 2.0) return 0;
  if (distanceKm <= 3.0) return 3.0;
  if (distanceKm <= 5.0) return 5.0;
  if (distanceKm <= 7.0) return 7.0;
  return 10.0; // Padrão acima de 7km
}
