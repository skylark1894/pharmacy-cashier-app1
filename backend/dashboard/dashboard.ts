import { api, Query } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = SQLDatabase.named("pharmacy");

interface SummaryParams {
  from?: Query<string>;
  to?: Query<string>;
}

interface SummaryResponse {
  total_sales: number;
  total_transactions: number;
  items_sold: number;
}

interface SalesChartParams {
  granularity?: Query<"day" | "month">;
  from?: Query<string>;
  to?: Query<string>;
}

interface SalesChartResponse {
  data: Array<{
    date: string;
    total: number;
    transactions: number;
  }>;
}

interface ExpWarningsParams {
  days?: Query<number>;
}

interface ExpWarningsResponse {
  near_expired: Array<{
    id: number;
    nama: string;
    tgl_kadaluarsa: string;
    stok: number;
    days_until_exp: number;
  }>;
  expired: Array<{
    id: number;
    nama: string;
    tgl_kadaluarsa: string;
    stok: number;
    days_since_exp: number;
  }>;
}

interface LowStockResponse {
  items: Array<{
    id: number;
    nama: string;
    stok: number;
    min_stok: number;
  }>;
}

// Returns sales summary for dashboard
export const getSummary = api<SummaryParams, SummaryResponse>(
  { auth: true, expose: true, method: "GET", path: "/api/dashboard/summary" },
  async (req) => {
    const fromDate = req.from || new Date().toISOString().split('T')[0];
    const toDate = req.to || new Date().toISOString().split('T')[0];

    const result = await db.queryRow<{
      total_sales: number;
      total_transactions: number;
      items_sold: number;
    }>`
      SELECT 
        COALESCE(SUM(p.total), 0) as total_sales,
        COUNT(p.id) as total_transactions,
        COALESCE(SUM(pd.qty), 0) as items_sold
      FROM penjualan p
      LEFT JOIN penjualan_detail pd ON p.id = pd.penjualan_id
      WHERE DATE(p.tanggal) BETWEEN ${fromDate} AND ${toDate}
    `;

    return result || { total_sales: 0, total_transactions: 0, items_sold: 0 };
  }
);

// Returns sales chart data
export const getSalesChart = api<SalesChartParams, SalesChartResponse>(
  { auth: true, expose: true, method: "GET", path: "/api/dashboard/sales-chart" },
  async (req) => {
    const granularity = req.granularity || "day";
    const fromDate = req.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = req.to || new Date().toISOString().split('T')[0];

    let dateFormat = "DATE(tanggal)";
    if (granularity === "month") {
      dateFormat = "DATE_TRUNC('month', tanggal)";
    }

    const data = await db.rawQueryAll<{
      date: string;
      total: number;
      transactions: number;
    }>`
      SELECT 
        ${dateFormat} as date,
        COALESCE(SUM(total), 0) as total,
        COUNT(*) as transactions
      FROM penjualan
      WHERE DATE(tanggal) BETWEEN $1 AND $2
      GROUP BY ${dateFormat}
      ORDER BY date
    `, fromDate, toDate);

    return { data };
  }
);

// Returns expiration warnings
export const getExpWarnings = api<ExpWarningsParams, ExpWarningsResponse>(
  { auth: true, expose: true, method: "GET", path: "/api/dashboard/exp-warnings" },
  async (req) => {
    const days = req.days || 30;

    const nearExpired = await db.rawQueryAll<{
      id: number;
      nama: string;
      tgl_kadaluarsa: string;
      stok: number;
      days_until_exp: number;
    }>`
      SELECT 
        id, nama, tgl_kadaluarsa, stok,
        (tgl_kadaluarsa - CURRENT_DATE) as days_until_exp
      FROM obat
      WHERE tgl_kadaluarsa BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${days} days'
      AND stok > 0
      ORDER BY tgl_kadaluarsa
    `);

    const expired = await db.rawQueryAll<{
      id: number;
      nama: string;
      tgl_kadaluarsa: string;
      stok: number;
      days_since_exp: number;
    }>`
      SELECT 
        id, nama, tgl_kadaluarsa, stok,
        (CURRENT_DATE - tgl_kadaluarsa) as days_since_exp
      FROM obat
      WHERE tgl_kadaluarsa < CURRENT_DATE
      AND stok > 0
      ORDER BY tgl_kadaluarsa DESC
    `);

    return {
      near_expired: nearExpired,
      expired: expired
    };
  }
);

// Returns low stock items
export const getLowStock = api<void, LowStockResponse>(
  { auth: true, expose: true, method: "GET", path: "/api/dashboard/low-stock" },
  async () => {
    const items = await db.queryAll<{
      id: number;
      nama: string;
      stok: number;
      min_stok: number;
    }>`
      SELECT id, nama, stok, min_stok
      FROM obat
      WHERE stok <= min_stok
      ORDER BY (stok - min_stok), nama
    `;

    return { items };
  }
);
