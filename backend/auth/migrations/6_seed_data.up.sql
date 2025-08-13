-- Insert admin and kasir users
INSERT INTO users (username, password_hash, role) VALUES 
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('kasir', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'kasir');

-- Insert sample medicines
INSERT INTO obat (kode, nama, kategori, harga_modal, harga_jual, stok, min_stok, tgl_kadaluarsa, batch) VALUES
('OBT001', 'Paracetamol 500mg', 'bebas', 2000, 3000, 100, 10, '2025-12-31', 'BATCH001'),
('OBT002', 'Amoxicillin 500mg', 'resep', 5000, 8000, 50, 5, '2025-06-30', 'BATCH002'),
('OBT003', 'OBH Combi', 'bebas', 8000, 12000, 30, 5, '2024-03-15', 'BATCH003'),
('OBT004', 'Antangin JRG', 'herbal', 3000, 5000, 80, 10, '2025-09-20', 'BATCH004'),
('OBT005', 'Ibuprofen 400mg', 'bebas', 3000, 4500, 60, 8, '2024-02-28', 'BATCH005'),
('OBT006', 'Vitamin C 1000mg', 'bebas', 15000, 20000, 40, 5, '2025-11-15', 'BATCH006'),
('OBT007', 'Betadine Solution', 'bebas', 12000, 18000, 25, 3, '2025-08-10', 'BATCH007'),
('OBT008', 'Mylanta Tablet', 'bebas', 8000, 12000, 35, 5, '2025-05-25', 'BATCH008'),
('OBT009', 'Sangobion Kapsul', 'bebas', 25000, 35000, 20, 3, '2025-10-30', 'BATCH009'),
('OBT010', 'Tolak Angin', 'herbal', 2500, 4000, 90, 15, '2025-07-18', 'BATCH010');

-- Insert symptoms
INSERT INTO gejala (nama) VALUES
('demam'),
('batuk'),
('pilek'),
('pusing'),
('diare'),
('nyeri otot');

-- Insert recommendations
INSERT INTO rekomendasi (gejala_id, obat_id, aturan_pakai, catatan, umur_kategori, hamil_menyusui_allowed) VALUES
(1, 1, '3x sehari 1 tablet setelah makan', 'Untuk menurunkan demam', 'semua', true),
(1, 5, '3x sehari 1 tablet setelah makan', 'Alternatif penurun demam', 'dewasa', false),
(2, 3, '3x sehari 1 sendok makan', 'Untuk batuk berdahak', 'semua', true),
(3, 6, '1x sehari 1 tablet', 'Meningkatkan daya tahan tubuh', 'semua', true),
(4, 1, '3x sehari 1 tablet', 'Untuk mengatasi sakit kepala', 'semua', true),
(6, 5, '3x sehari 1 tablet setelah makan', 'Untuk nyeri dan peradangan', 'dewasa', false);
