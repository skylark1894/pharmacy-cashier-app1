import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = SQLDatabase.named("pharmacy");

interface Gejala {
  id: number;
  nama: string;
}

interface GejalaListResponse {
  gejala: Gejala[];
}

interface SearchRekomendasiRequest {
  gejalaIds: number[];
  umurKategori?: "anak" | "dewasa";
  hamilMenyusui?: boolean;
}

interface RekomendasiResult {
  obat_id: number;
  nama_obat: string;
  kategori: string;
  harga_jual: number;
  aturan_pakai: string;
  catatan?: string;
  stok: number;
}

interface SearchRekomendasiResponse {
  rekomendasi: RekomendasiResult[];
}

interface CreateRekomendasiRequest {
  gejala_id: number;
  obat_id: number;
  aturan_pakai: string;
  catatan?: string;
  umur_kategori: "anak" | "dewasa" | "semua";
  hamil_menyusui_allowed: boolean;
}

interface DeleteRekomendasiRequest {
  id: number;
}

interface RekomendasiItem {
  id: number;
  gejala_id: number;
  obat_id: number;
  aturan_pakai: string;
  catatan?: string;
  umur_kategori: string;
  hamil_menyusui_allowed: boolean;
}

// Returns list of symptoms for selection
export const listGejala = api<void, GejalaListResponse>(
  { auth: true, expose: true, method: "GET", path: "/api/gejala" },
  async () => {
    const gejala = await db.queryAll<Gejala>`
      SELECT id, nama FROM gejala ORDER BY nama
    `;
    return { gejala };
  }
);

// Searches for medicine recommendations based on symptoms
export const searchRekomendasi = api<SearchRekomendasiRequest, SearchRekomendasiResponse>(
  { auth: true, expose: true, method: "POST", path: "/api/rekomendasi/search" },
  async (req) => {
    if (req.gejalaIds.length === 0) {
      return { rekomendasi: [] };
    }

    let query = `
      SELECT DISTINCT
        o.id as obat_id,
        o.nama as nama_obat,
        o.kategori,
        o.harga_jual,
        r.aturan_pakai,
        r.catatan,
        o.stok
      FROM rekomendasi r
      JOIN obat o ON r.obat_id = o.id
      WHERE r.gejala_id = ANY($1)
      AND o.tgl_kadaluarsa > CURRENT_DATE
      AND o.stok > 0
    `;

    const params: any[] = [req.gejalaIds];
    let paramIndex = 2;

    if (req.umurKategori) {
      query += ` AND (r.umur_kategori = $${paramIndex} OR r.umur_kategori = 'semua')`;
      params.push(req.umurKategori);
      paramIndex++;
    }

    if (req.hamilMenyusui === false) {
      query += ` AND r.hamil_menyusui_allowed = true`;
    }

    query += ` ORDER BY o.nama`;

    const rekomendasi = await db.rawQueryAll<RekomendasiResult>(query, ...params);
    return { rekomendasi };
  }
);

// Creates a new recommendation mapping
export const createRekomendasi = api<CreateRekomendasiRequest, RekomendasiItem>(
  { auth: true, expose: true, method: "POST", path: "/api/rekomendasi" },
  async (req) => {
    const auth = getAuthData()!;
    if (auth.role !== "admin") {
      throw APIError.permissionDenied("admin access required");
    }

    const rekomendasi = await db.queryRow<RekomendasiItem>`
      INSERT INTO rekomendasi (gejala_id, obat_id, aturan_pakai, catatan, umur_kategori, hamil_menyusui_allowed)
      VALUES (${req.gejala_id}, ${req.obat_id}, ${req.aturan_pakai}, ${req.catatan}, ${req.umur_kategori}, ${req.hamil_menyusui_allowed})
      RETURNING *
    `;

    if (!rekomendasi) {
      throw new Error("Failed to create rekomendasi");
    }

    return rekomendasi;
  }
);

// Deletes a recommendation mapping
export const deleteRekomendasi = api<DeleteRekomendasiRequest, void>(
  { auth: true, expose: true, method: "DELETE", path: "/api/rekomendasi/:id" },
  async (req) => {
    const auth = getAuthData()!;
    if (auth.role !== "admin") {
      throw APIError.permissionDenied("admin access required");
    }

    await db.exec`DELETE FROM rekomendasi WHERE id = ${req.id}`;
  }
);
