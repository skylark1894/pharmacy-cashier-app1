import { api, Query } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = SQLDatabase.named("pharmacy");

interface PenjualanItem {
  obatId: number;
  qty: number;
  harga: number;
}

interface CreatePenjualanRequest {
  items: PenjualanItem[];
  metode_bayar: "tunai" | "debit" | "ewallet";
}

interface CreatePenjualanResponse {
  id: number;
  no_transaksi: string;
  total: number;
}

interface ListPenjualanParams {
  from?: Query<string>;
  to?: Query<string>;
  kasirId?: Query<number>;
}

interface GetPenjualanRequest {
  id: number;
}

interface PenjualanSummary {
  id: number;
  no_transaksi: string;
  tanggal: Date;
  total: number;
  metode_bayar: string;
  kasir_username: string;
}

interface ListPenjualanResponse {
  penjualan: PenjualanSummary[];
}

interface PenjualanDetail {
  id: number;
  no_transaksi: string;
  tanggal: Date;
  total: number;
  metode_bayar: string;
  kasir_username: string;
  items: Array<{
    nama_obat: string;
    qty: number;
    harga_satuan: number;
    subtotal: number;
  }>;
}

// Generates unique transaction number
function generateTransactionNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const time = now.getTime().toString().slice(-6);
  return `TRX${year}${month}${day}${time}`;
}

// Creates a new sale transaction
export const createPenjualan = api<CreatePenjualanRequest, CreatePenjualanResponse>(
  { auth: true, expose: true, method: "POST", path: "/api/penjualan" },
  async (req) => {
    const auth = getAuthData()!;
    
    if (req.items.length === 0) {
      throw APIError.invalidArgument("no items provided");
    }

    const tx = await db.begin();
    
    try {
      // Validate stock and expiration for all items
      for (const item of req.items) {
        const obat = await tx.queryRow<{
          id: number;
          nama: string;
          stok: number;
          tgl_kadaluarsa: string;
        }>`
          SELECT id, nama, stok, tgl_kadaluarsa
          FROM obat
          WHERE id = ${item.obatId}
        `;

        if (!obat) {
          throw APIError.notFound(`obat with id ${item.obatId} not found`);
        }

        if (new Date(obat.tgl_kadaluarsa) <= new Date()) {
          throw APIError.invalidArgument(`obat ${obat.nama} is expired`);
        }

        if (obat.stok < item.qty) {
          throw APIError.invalidArgument(`insufficient stock for ${obat.nama}`);
        }
      }

      // Calculate total
      const total = req.items.reduce((sum, item) => sum + (item.qty * item.harga), 0);
      
      // Generate transaction number
      const no_transaksi = generateTransactionNumber();

      // Create penjualan record
      const penjualan = await tx.queryRow<{
        id: number;
        no_transaksi: string;
        total: number;
      }>`
        INSERT INTO penjualan (no_transaksi, total, metode_bayar, kasir_id)
        VALUES (${no_transaksi}, ${total}, ${req.metode_bayar}, ${parseInt(auth.userID)})
        RETURNING id, no_transaksi, total
      `;

      if (!penjualan) {
        throw new Error("Failed to create penjualan");
      }

      // Create penjualan_detail records and update stock
      for (const item of req.items) {
        const subtotal = item.qty * item.harga;
        
        await tx.exec`
          INSERT INTO penjualan_detail (penjualan_id, obat_id, qty, harga_satuan, subtotal)
          VALUES (${penjualan.id}, ${item.obatId}, ${item.qty}, ${item.harga}, ${subtotal})
        `;

        await tx.exec`
          UPDATE obat SET stok = stok - ${item.qty}, updated_at = NOW()
          WHERE id = ${item.obatId}
        `;

        await tx.exec`
          INSERT INTO stok_keluar (obat_id, jumlah, keterangan)
          VALUES (${item.obatId}, ${item.qty}, 'penyesuaian')
        `;
      }

      await tx.commit();
      
      return {
        id: penjualan.id,
        no_transaksi: penjualan.no_transaksi,
        total: penjualan.total
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);

// Returns list of sales transactions
export const listPenjualan = api<ListPenjualanParams, ListPenjualanResponse>(
  { auth: true, expose: true, method: "GET", path: "/api/penjualan" },
  async (req) => {
    const auth = getAuthData()!;
    
    let query = `
      SELECT p.id, p.no_transaksi, p.tanggal, p.total, p.metode_bayar, u.username as kasir_username
      FROM penjualan p
      JOIN users u ON p.kasir_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (req.from) {
      query += ` AND DATE(p.tanggal) >= $${paramIndex}`;
      params.push(req.from);
      paramIndex++;
    }

    if (req.to) {
      query += ` AND DATE(p.tanggal) <= $${paramIndex}`;
      params.push(req.to);
      paramIndex++;
    }

    if (req.kasirId) {
      query += ` AND p.kasir_id = $${paramIndex}`;
      params.push(req.kasirId);
      paramIndex++;
    } else if (auth.role === "kasir") {
      query += ` AND p.kasir_id = $${paramIndex}`;
      params.push(parseInt(auth.userID));
      paramIndex++;
    }

    query += ` ORDER BY p.tanggal DESC`;

    const penjualan = await db.rawQueryAll<PenjualanSummary>(query, ...params);
    return { penjualan };
  }
);

// Returns detailed sale transaction
export const getPenjualan = api<GetPenjualanRequest, PenjualanDetail>(
  { auth: true, expose: true, method: "GET", path: "/api/penjualan/:id" },
  async (req) => {
    const auth = getAuthData()!;
    
    let query = `
      SELECT p.id, p.no_transaksi, p.tanggal, p.total, p.metode_bayar, u.username as kasir_username
      FROM penjualan p
      JOIN users u ON p.kasir_id = u.id
      WHERE p.id = $1
    `;
    const params: any[] = [req.id];

    if (auth.role === "kasir") {
      query += ` AND p.kasir_id = $2`;
      params.push(parseInt(auth.userID));
    }

    const penjualan = await db.rawQueryRow<PenjualanSummary>(query, ...params);
    
    if (!penjualan) {
      throw APIError.notFound("penjualan not found");
    }

    const items = await db.queryAll<{
      nama_obat: string;
      qty: number;
      harga_satuan: number;
      subtotal: number;
    }>`
      SELECT o.nama as nama_obat, pd.qty, pd.harga_satuan, pd.subtotal
      FROM penjualan_detail pd
      JOIN obat o ON pd.obat_id = o.id
      WHERE pd.penjualan_id = ${req.id}
      ORDER BY o.nama
    `;

    return {
      id: penjualan.id,
      no_transaksi: penjualan.no_transaksi,
      tanggal: penjualan.tanggal,
      total: penjualan.total,
      metode_bayar: penjualan.metode_bayar,
      kasir_username: penjualan.kasir_username,
      items
    };
  }
);
