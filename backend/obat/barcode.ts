import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { APIError } from "encore.dev/api";
import { Obat } from "./obat";

const db = SQLDatabase.named("pharmacy");

interface BarcodeSearchRequest {
  kode: string;
}

// Searches for medicine by barcode or code
export const searchByBarcode = api<BarcodeSearchRequest, Obat>(
  { auth: true, expose: true, method: "GET", path: "/api/barcode/:kode" },
  async (req) => {
    const obat = await db.queryRow<Obat>`
      SELECT * FROM obat 
      WHERE kode = ${req.kode} OR barcode = ${req.kode}
    `;
    
    if (!obat) {
      throw APIError.notFound("obat not found");
    }
    
    return obat;
  }
);
