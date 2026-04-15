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

export function getDeliveryFee(distanceKm: number): number {
  if (distanceKm <= 2.0) return 0;
  if (distanceKm <= 3.0) return 3.0;
  if (distanceKm <= 5.0) return 5.0;
  if (distanceKm <= 7.0) return 7.0;
  return 10.0; // Padrão acima de 7km
}
