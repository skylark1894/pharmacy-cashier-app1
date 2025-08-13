CREATE TABLE penjualan (
  id BIGSERIAL PRIMARY KEY,
  no_transaksi VARCHAR(100) UNIQUE NOT NULL,
  tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total DECIMAL(10,2) NOT NULL,
  metode_bayar VARCHAR(50) NOT NULL CHECK (metode_bayar IN ('tunai', 'debit', 'ewallet')),
  kasir_id BIGINT NOT NULL REFERENCES users(id)
);

CREATE TABLE penjualan_detail (
  id BIGSERIAL PRIMARY KEY,
  penjualan_id BIGINT NOT NULL REFERENCES penjualan(id) ON DELETE CASCADE,
  obat_id BIGINT NOT NULL REFERENCES obat(id),
  qty INTEGER NOT NULL CHECK (qty > 0),
  harga_satuan DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);

CREATE INDEX idx_penjualan_tanggal ON penjualan(tanggal);
CREATE INDEX idx_penjualan_no_transaksi ON penjualan(no_transaksi);
CREATE INDEX idx_penjualan_detail_penjualan_id ON penjualan_detail(penjualan_id);
CREATE INDEX idx_penjualan_detail_obat_id ON penjualan_detail(obat_id);
