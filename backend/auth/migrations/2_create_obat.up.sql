CREATE TABLE obat (
  id BIGSERIAL PRIMARY KEY,
  kode VARCHAR(100) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  kategori VARCHAR(50) NOT NULL CHECK (kategori IN ('bebas', 'resep', 'herbal')),
  harga_modal DECIMAL(10,2) NOT NULL,
  harga_jual DECIMAL(10,2) NOT NULL,
  stok INTEGER NOT NULL DEFAULT 0,
  min_stok INTEGER NOT NULL DEFAULT 0,
  tgl_kadaluarsa DATE NOT NULL,
  batch VARCHAR(100),
  barcode VARCHAR(255),
  gambar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_harga CHECK (harga_jual >= harga_modal)
);

CREATE INDEX idx_obat_kode ON obat(kode);
CREATE INDEX idx_obat_barcode ON obat(barcode);
CREATE INDEX idx_obat_tgl_kadaluarsa ON obat(tgl_kadaluarsa);
CREATE INDEX idx_obat_kategori ON obat(kategori);
