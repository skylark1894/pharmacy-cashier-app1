CREATE TABLE stok_masuk (
  id BIGSERIAL PRIMARY KEY,
  obat_id BIGINT NOT NULL REFERENCES obat(id) ON DELETE CASCADE,
  jumlah INTEGER NOT NULL CHECK (jumlah > 0),
  tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  keterangan TEXT
);

CREATE TABLE stok_keluar (
  id BIGSERIAL PRIMARY KEY,
  obat_id BIGINT NOT NULL REFERENCES obat(id) ON DELETE CASCADE,
  jumlah INTEGER NOT NULL CHECK (jumlah > 0),
  tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  keterangan VARCHAR(50) NOT NULL CHECK (keterangan IN ('rusak', 'expired', 'penyesuaian'))
);

CREATE INDEX idx_stok_masuk_obat_id ON stok_masuk(obat_id);
CREATE INDEX idx_stok_keluar_obat_id ON stok_keluar(obat_id);
CREATE INDEX idx_stok_masuk_tanggal ON stok_masuk(tanggal);
CREATE INDEX idx_stok_keluar_tanggal ON stok_keluar(tanggal);
