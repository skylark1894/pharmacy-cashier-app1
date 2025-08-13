import { api, Query } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = SQLDatabase.named("pharmacy");

interface ExportPenjualanParams {
  from?: Query<string>;
  to?: Query<string>;
}

interface PenjualanExportItem {
  no_transaksi: string;
  tanggal: string;
  kasir: string;
  nama_obat: string;
  qty: number;
  harga_satuan: number;
  subtotal: number;
  metode_bayar: string;
}

interface ExportPenjualanResponse {
  data: PenjualanExportItem[];
}

interface ObatTerlarisParams {
  from?: Query<string>;
  to?: Query<string>;
  limit?: Query<number>;
}

interface ObatTerlarisItem {
  nama_obat: string;
  total_qty: number;
  total_revenue: number;
}

interface ObatTerlarisResponse {
  data: ObatTerlarisItem[];
}

interface ExpiredObatParams {
  from?: Query<string>;
  to?: Query<string>;
}

interface ExpiredObatItem {
  nama: string;
  kategori: string;
  tgl_kadaluarsa: string;
  stok: number;
  harga_modal: number;
  total_loss: number;
}

interface ExpiredObatResponse {
  data: ExpiredObatItem[];
}

interface StokItem {
  nama: string;
  kategori: string;
  stok: number;
  min_stok: number;
  harga_modal: number;
  harga_jual: number;
  total_value: number;
}

interface StokResponse {
  data: StokItem[];
}

// Exports sales data for reporting
export const exportPenjualan = api<ExportPenjualanParams, ExportPenjualanResponse>(
  { auth: true, expose: true, method: "GET", path: "/api/laporan/penjualan/export" },
  async (req) => {
    const fromDate = req.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = req.to || new Date().toISOString().split('T')[0];

    const data = await db.rawQueryAll<PenjualanExportItem>`
      SELECT 
        p.no_transaksi,
        p.tanggal::text,
        u.username as kasir,
        o.nama as nama_obat,
        pd.qty,
        pd.harga_satuan,
        pd.subtotal,
        p.metode_bayar
      FROM penjualan p
      JOIN users u ON p.kasir_id = u.id
      JOIN penjualan_detail pd ON p.id = pd.penjualan_id
      JOIN obat o ON pd.obat_id = o.id
      WHERE DATE(p.tanggal) BETWEEN $1 AND $2
      ORDER BY p.tanggal DESC, p.no_transaksi
    `, fromDate, toDate);

    return { data };
  }
);

// Returns best selling medicines
export const getObatTerlaris = api<ObatTerlarisParams, ObatTerlarisResponse>(
  { auth: true, expose: true, method: "GET", path: "/api/laporan/obat-terlaris" },
  async (req) => {
    const fromDate = req.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = req.to || new Date().toISOString().split('T')[0];
    const limit = req.limit || 10;

    const data = await db.rawQueryAll<ObatTerlarisItem>`
      SELECT 
        o.nama as nama_obat,
        SUM(pd.qty) as total_qty,
        SUM(pd.subtotal) as total_revenue
      FROM penjualan_detail pd
      JOIN obat o ON pd.obat_id = o.id
      JOIN penjualan p ON pd.penjualan_id = p.id
      WHERE DATE(p.tanggal) BETWEEN $1 AND $2
      GROUP BY o.id, o.nama
      ORDER BY total_qty DESC
      LIMIT $3
    `, fromDate, toDate, limit);

    return { data };
  }
);

// Returns expired medicines report
export const getExpiredObat = api<ExpiredObatParams, ExpiredObatResponse>(
  { auth: true, expose: true, method: "GET", path: "/api/laporan/expired" },
  async (req) => {
    const fromDate = req.from;
    const toDate = req.to;

    let query = `
      SELECT 
        nama,
        kategori,
        tgl_kadaluarsa::text,
        stok,
        harga_modal,
        (stok * harga_modal) as total_loss
      FROM obat
      WHERE tgl_kadaluarsa < CURRENT_DATE
      AND stok > 0
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (fromDate) {
      query += ` AND tgl_kadaluarsa >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      query += ` AND tgl_kadaluarsa <= $${paramIndex}`;
      params.push(toDate);
      paramIndex++;
    }

    query += ` ORDER BY tgl_kadaluarsa DESC`;

    const data = await db.rawQueryAll<ExpiredObatItem>(query, ...params);
    return { data };
  }
);

// Returns stock report
export const getStokReport = api<void, StokResponse>(
  { auth: true, expose: true, method: "GET", path: "/api/laporan/stok" },
  async () => {
    const data = await db.queryAll<StokItem>`
      SELECT 
        nama,
        kategori,
        stok,
        min_stok,
        harga_modal,
        harga_jual,
        (stok * harga_modal) as total_value
      FROM obat
      ORDER BY nama
    `;

    return { data };
  }
);
