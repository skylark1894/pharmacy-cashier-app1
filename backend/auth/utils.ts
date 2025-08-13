import bcrypt from "bcrypt";

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function isExpired(expirationDate: string): boolean {
  return new Date(expirationDate) <= new Date();
}

export function isNearExpired(expirationDate: string, days: number = 30): boolean {
  const expDate = new Date(expirationDate);
  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + days);
  return expDate <= warningDate && expDate > new Date();
}

export function validateStock(currentStock: number, requestedQty: number): boolean {
  return currentStock >= requestedQty;
}

export function generateTransactionNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const time = now.getTime().toString().slice(-6);
  return `TRX${year}${month}${day}${time}`;
}

export function filterRecommendationsByAge(
  recommendations: any[],
  ageCategory?: "anak" | "dewasa"
): any[] {
  if (!ageCategory) return recommendations;
  
  return recommendations.filter(rec => 
    rec.umur_kategori === ageCategory || rec.umur_kategori === "semua"
  );
}
