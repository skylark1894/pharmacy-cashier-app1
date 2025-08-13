import { api, Query } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = SQLDatabase.named("pharmacy");

export interface Obat {
  id: number;
  kode: string;
  nama: string;
  kategori: "bebas" | "resep" | "herbal";
  harga_modal: number;
  harga_jual: number;
  stok: number;
  min_stok: number;
  tgl_kadaluarsa: string;
  batch: string;
  barcode?: string;
  gambar_url?: string;
  created_at: Date;
  updated_at: Date;
}

interface ListObatParams {
  search?: Query<string>;
  kategori?: Query<string>;
  status_exp?: Query<string>;
}

interface ListObatResponse {
  obat: Obat[];
}

interface GetObatRequest {
  id: number;
}

interface CreateObatRequest {
  kode: string;
  nama: string;
  kategori: "bebas" | "resep" | "herbal";
  harga_modal: number;
  harga_jual: number;
  stok: number;
  min_stok: number;
  tgl_kadaluarsa: string;
  batch: string;
  barcode?: string;
  gambar_url?: string;
}

interface UpdateObatRequest {
  id: number;
  kode: string;
  nama: string;
  kategori: "bebas" | "resep" | "herbal";
  harga_modal: number;
  harga_jual: number;
  stok: number;
  min_stok: number;
  tgl_kadaluarsa: string;
  batch: string;
  barcode?: string;
  gambar_url?: string;
}

interface DeleteObatRequest {
  id: number;
}

interface StokMasukRequest {
  id: number;
  jumlah: number;
  keterangan?: string;
}

interface StokKeluarRequest {
  id: number;
  jumlah: number;
  keterangan: "rusak" | "expired" | "penyesuaian";
}

// Returns list of medicines with optional filters
export const listObat = api<ListObatParams, ListObatResponse>(
  { auth: true, expose: true, method: "GET", path: "/api/obat" },
  async (req) => {
    let query = `SELECT * FROM obat WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (req.search) {
      query += ` AND (nama ILIKE $${paramIndex} OR kode ILIKE $${paramIndex})`;
      params.push(`%${req.search}%`);
      paramIndex++;
    }

    if (req.kategori) {
      query += ` AND kategori = $${paramIndex}`;
      params.push(req.kategori);
      paramIndex++;
    }

    if (req.status_exp) {
      if (req.status_exp === "expired") {
        query += ` AND tgl_kadaluarsa < CURRENT_DATE`;
      } else if (req.status_exp === "near_expired") {
        query += ` AND tgl_kadaluarsa BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'`;
      }
    }

    query += ` ORDER BY nama`;

    const obat = await db.rawQueryAll<Obat>(query, ...params);
    return { obat };
  }
);

// Returns a single medicine by ID
export const getObat = api<GetObatRequest, Obat>(
  { auth: true, expose: true, method: "GET", path: "/api/obat/:id" },
  async (req) => {
    const obat = await db.queryRow<Obat>`
      SELECT * FROM obat WHERE id = ${req.id}
    `;
    
    if (!obat) {
      throw APIError.notFound("obat not found");
    }
    
    return obat;
  }
);

// Creates a new medicine
export const createObat = api<CreateObatRequest, Obat>(
  { auth: true, expose: true, method: "POST", path: "/api/obat" },
  async (req) => {
    const auth = getAuthData()!;
    if (auth.role !== "admin") {
      throw APIError.permissionDenied("admin access required");
    }

    if (req.harga_jual < req.harga_modal) {
      throw APIError.invalidArgument("harga jual must be >= harga modal");
    }

    const obat = await db.queryRow<Obat>`
      INSERT INTO obat (kode, nama, kategori, harga_modal, harga_jual, stok, min_stok, tgl_kadaluarsa, batch, barcode, gambar_url, updated_at)
      VALUES (${req.kode}, ${req.nama}, ${req.kategori}, ${req.harga_modal}, ${req.harga_jual}, ${req.stok}, ${req.min_stok}, ${req.tgl_kadaluarsa}, ${req.batch}, ${req.barcode}, ${req.gambar_url}, NOW())
      RETURNING *
    `;

    if (!obat) {
      throw new Error("Failed to create obat");
    }

    return obat;
  }
);

// Updates an existing medicine
export const updateObat = api<UpdateObatRequest, Obat>(
  { auth: true, expose: true, method: "PUT", path: "/api/obat/:id" },
  async (req) => {
    const auth = getAuthData()!;
    if (auth.role !== "admin") {
      throw APIError.permissionDenied("admin access required");
    }

    if (req.harga_jual < req.harga_modal) {
      throw APIError.invalidArgument("harga jual must be >= harga modal");
    }

    const obat = await db.queryRow<Obat>`
      UPDATE obat 
      SET kode = ${req.kode}, nama = ${req.nama}, kategori = ${req.kategori}, 
          harga_modal = ${req.harga_modal}, harga_jual = ${req.harga_jual}, 
          stok = ${req.stok}, min_stok = ${req.min_stok}, tgl_kadaluarsa = ${req.tgl_kadaluarsa}, 
          batch = ${req.batch}, barcode = ${req.barcode}, gambar_url = ${req.gambar_url}, 
          updated_at = NOW()
      WHERE id = ${req.id}
      RETURNING *
    `;

    if (!obat) {
      throw APIError.notFound("obat not found");
    }

    return obat;
  }
);

// Deletes a medicine
export const deleteObat = api<DeleteObatRequest, void>(
  { auth: true, expose: true, method: "DELETE", path: "/api/obat/:id" },
  async (req) => {
    const auth = getAuthData()!;
    if (auth.role !== "admin") {
      throw APIError.permissionDenied("admin access required");
    }

    await db.exec`DELETE FROM obat WHERE id = ${req.id}`;
  }
);

// Adds stock to a medicine
export const stokMasuk = api<StokMasukRequest, void>(
  { auth: true, expose: true, method: "POST", path: "/api/obat/:id/stok-masuk" },
  async (req) => {
    const auth = getAuthData()!;
    if (auth.role !== "admin") {
      throw APIError.permissionDenied("admin access required");
    }
    
    await db.exec`
      UPDATE obat SET stok = stok + ${req.jumlah}, updated_at = NOW() WHERE id = ${req.id}
    `;

    await db.exec`
      INSERT INTO stok_masuk (obat_id, jumlah, keterangan)
      VALUES (${req.id}, ${req.jumlah}, ${req.keterangan || 'Stok masuk'})
    `;
  }
);

// Removes stock from a medicine
export const stokKeluar = api<StokKeluarRequest, void>(
  { auth: true, expose: true, method: "POST", path: "/api/obat/:id/stok-keluar" },
  async (req) => {
    const auth = getAuthData()!;
    if (auth.role !== "admin") {
      throw APIError.permissionDenied("admin access required");
    }
    
    const obat = await db.queryRow<{ stok: number }>`
      SELECT stok FROM obat WHERE id = ${req.id}
    `;

    if (!obat) {
      throw APIError.notFound("obat not found");
    }

    if (obat.stok < req.jumlah) {
      throw APIError.invalidArgument("insufficient stock");
    }

    await db.exec`
      UPDATE obat SET stok = stok - ${req.jumlah}, updated_at = NOW() WHERE id = ${req.id}
    `;

    await db.exec`
      INSERT INTO stok_keluar (obat_id, jumlah, keterangan)
      VALUES (${req.id}, ${req.jumlah}, ${req.keterangan})
    `;
  }
);
