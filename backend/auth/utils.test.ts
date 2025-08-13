import { describe, it, expect } from "vitest";
import { 
  hashPassword, 
  verifyPassword, 
  isExpired, 
  isNearExpired, 
  validateStock,
  generateTransactionNumber,
  filterRecommendationsByAge
} from "./utils";

describe("Auth Utils", () => {
  it("should hash and verify password correctly", async () => {
    const password = "testpassword123";
    const hash = await hashPassword(password);
    
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
    
    const isInvalid = await verifyPassword("wrongpassword", hash);
    expect(isInvalid).toBe(false);
  });

  it("should check if date is expired", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    expect(isExpired(yesterday.toISOString().split('T')[0])).toBe(true);
    expect(isExpired(tomorrow.toISOString().split('T')[0])).toBe(false);
  });

  it("should check if date is near expired", () => {
    const in20Days = new Date();
    in20Days.setDate(in20Days.getDate() + 20);
    
    const in40Days = new Date();
    in40Days.setDate(in40Days.getDate() + 40);
    
    expect(isNearExpired(in20Days.toISOString().split('T')[0], 30)).toBe(true);
    expect(isNearExpired(in40Days.toISOString().split('T')[0], 30)).toBe(false);
  });

  it("should validate stock correctly", () => {
    expect(validateStock(10, 5)).toBe(true);
    expect(validateStock(10, 10)).toBe(true);
    expect(validateStock(10, 15)).toBe(false);
  });

  it("should generate unique transaction numbers", () => {
    const trx1 = generateTransactionNumber();
    const trx2 = generateTransactionNumber();
    
    expect(trx1).toMatch(/^TRX\d{8}$/);
    expect(trx2).toMatch(/^TRX\d{8}$/);
    expect(trx1).not.toBe(trx2);
  });

  it("should filter recommendations by age category", () => {
    const recommendations = [
      { id: 1, umur_kategori: "anak" },
      { id: 2, umur_kategori: "dewasa" },
      { id: 3, umur_kategori: "semua" }
    ];
    
    const childRecs = filterRecommendationsByAge(recommendations, "anak");
    expect(childRecs).toHaveLength(2);
    expect(childRecs.map(r => r.id)).toEqual([1, 3]);
    
    const adultRecs = filterRecommendationsByAge(recommendations, "dewasa");
    expect(adultRecs).toHaveLength(2);
    expect(adultRecs.map(r => r.id)).toEqual([2, 3]);
    
    const allRecs = filterRecommendationsByAge(recommendations);
    expect(allRecs).toHaveLength(3);
  });
});
