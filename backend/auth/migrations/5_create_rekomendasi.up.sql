CREATE TABLE gejala (
  id BIGSERIAL PRIMARY KEY,
  nama VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE rekomendasi (
  id BIGSERIAL PRIMARY KEY,
  gejala_id BIGINT NOT NULL REFERENCES gejala(id) ON DELETE CASCADE,
  obat_id BIGINT NOT NULL REFERENCES obat(id) ON DELETE CASCADE,
  aturan_pakai TEXT NOT NULL,
  catatan TEXT,
  umur_kategori VARCHAR(50) NOT NULL DEFAULT 'semua' CHECK (umur_kategori IN ('anak', 'dewasa', 'semua')),
  hamil_menyusui_allowed BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_rekomendasi_gejala_id ON rekomendasi(gejala_id);
CREATE INDEX idx_rekomendasi_obat_id ON rekomendasi(obat_id);
