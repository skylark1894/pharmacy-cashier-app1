import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { useBackend } from "../hooks/useBackend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Search, Edit, Trash2, Package, PackageMinus } from "lucide-react";
import type { Obat } from "~backend/obat/obat";

export function ObatPage() {
  const { user } = useAuth();
  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("");
  const [selectedStatusExp, setSelectedStatusExp] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStokDialogOpen, setIsStokDialogOpen] = useState(false);
  const [selectedObat, setSelectedObat] = useState<Obat | null>(null);
  const [stokAction, setStokAction] = useState<"masuk" | "keluar">("masuk");

  const { data: obatList, isLoading } = useQuery({
    queryKey: ["obat", searchTerm, selectedKategori, selectedStatusExp],
    queryFn: () => backend.obat.listObat({
      search: searchTerm || undefined,
      kategori: selectedKategori || undefined,
      status_exp: selectedStatusExp || undefined,
    }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => backend.obat.createObat(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obat"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Obat berhasil ditambahkan" });
    },
    onError: (error) => {
      console.error("Create obat failed:", error);
      toast({ title: "Gagal menambahkan obat", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => backend.obat.updateObat(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obat"] });
      setIsEditDialogOpen(false);
      toast({ title: "Obat berhasil diperbarui" });
    },
    onError: (error) => {
      console.error("Update obat failed:", error);
      toast({ title: "Gagal memperbarui obat", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => backend.obat.deleteObat(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obat"] });
      toast({ title: "Obat berhasil dihapus" });
    },
    onError: (error) => {
      console.error("Delete obat failed:", error);
      toast({ title: "Gagal menghapus obat", variant: "destructive" });
    },
  });

  const stokMasukMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => backend.obat.stokMasuk(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obat"] });
      setIsStokDialogOpen(false);
      toast({ title: "Stok berhasil ditambahkan" });
    },
    onError: (error) => {
      console.error("Stok masuk failed:", error);
      toast({ title: "Gagal menambahkan stok", variant: "destructive" });
    },
  });

  const stokKeluarMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => backend.obat.stokKeluar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obat"] });
      setIsStokDialogOpen(false);
      toast({ title: "Stok berhasil dikurangi" });
    },
    onError: (error) => {
      console.error("Stok keluar failed:", error);
      toast({ title: "Gagal mengurangi stok", variant: "destructive" });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const getExpiredStatus = (tglKadaluarsa: string) => {
    const expDate = new Date(tglKadaluarsa);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: "expired", label: "Kedaluwarsa", variant: "destructive" as const };
    } else if (diffDays <= 30) {
      return { status: "near_expired", label: "Hampir Kedaluwarsa", variant: "secondary" as const };
    }
    return { status: "good", label: "Baik", variant: "default" as const };
  };

  const ObatForm = ({ obat, onSubmit, isLoading }: { obat?: Obat; onSubmit: (data: any) => void; isLoading: boolean }) => {
    const [formData, setFormData] = useState({
      kode: obat?.kode || "",
      nama: obat?.nama || "",
      kategori: obat?.kategori || "bebas",
      harga_modal: obat?.harga_modal || 0,
      harga_jual: obat?.harga_jual || 0,
      stok: obat?.stok || 0,
      min_stok: obat?.min_stok || 0,
      tgl_kadaluarsa: obat?.tgl_kadaluarsa || "",
      batch: obat?.batch || "",
      barcode: obat?.barcode || "",
      gambar_url: obat?.gambar_url || "",
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="kode">Kode Obat</Label>
            <Input
              id="kode"
              value={formData.kode}
              onChange={(e) => setFormData(prev => ({ ...prev, kode: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="nama">Nama Obat</Label>
            <Input
              id="nama"
              value={formData.nama}
              onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="kategori">Kategori</Label>
          <Select value={formData.kategori} onValueChange={(value) => setFormData(prev => ({ ...prev, kategori: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bebas">Bebas</SelectItem>
              <SelectItem value="resep">Resep</SelectItem>
              <SelectItem value="herbal">Herbal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="harga_modal">Harga Modal</Label>
            <Input
              id="harga_modal"
              type="number"
              value={formData.harga_modal}
              onChange={(e) => setFormData(prev => ({ ...prev, harga_modal: Number(e.target.value) }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="harga_jual">Harga Jual</Label>
            <Input
              id="harga_jual"
              type="number"
              value={formData.harga_jual}
              onChange={(e) => setFormData(prev => ({ ...prev, harga_jual: Number(e.target.value) }))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="stok">Stok</Label>
            <Input
              id="stok"
              type="number"
              value={formData.stok}
              onChange={(e) => setFormData(prev => ({ ...prev, stok: Number(e.target.value) }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="min_stok">Minimum Stok</Label>
            <Input
              id="min_stok"
              type="number"
              value={formData.min_stok}
              onChange={(e) => setFormData(prev => ({ ...prev, min_stok: Number(e.target.value) }))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tgl_kadaluarsa">Tanggal Kedaluwarsa</Label>
            <Input
              id="tgl_kadaluarsa"
              type="date"
              value={formData.tgl_kadaluarsa}
              onChange={(e) => setFormData(prev => ({ ...prev, tgl_kadaluarsa: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="batch">Batch</Label>
            <Input
              id="batch"
              value={formData.batch}
              onChange={(e) => setFormData(prev => ({ ...prev, batch: e.target.value }))}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="barcode">Barcode (Opsional)</Label>
          <Input
            id="barcode"
            value={formData.barcode}
            onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="gambar_url">URL Gambar (Opsional)</Label>
          <Input
            id="gambar_url"
            value={formData.gambar_url}
            onChange={(e) => setFormData(prev => ({ ...prev, gambar_url: e.target.value }))}
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Menyimpan..." : obat ? "Perbarui" : "Tambah"} Obat
        </Button>
      </form>
    );
  };

  const StokForm = ({ obat, action, onSubmit, isLoading }: { obat: Obat; action: "masuk" | "keluar"; onSubmit: (data: any) => void; isLoading: boolean }) => {
    const [formData, setFormData] = useState({
      jumlah: 0,
      keterangan: action === "masuk" ? "" : "penyesuaian",
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="jumlah">Jumlah</Label>
          <Input
            id="jumlah"
            type="number"
            min="1"
            value={formData.jumlah}
            onChange={(e) => setFormData(prev => ({ ...prev, jumlah: Number(e.target.value) }))}
            required
          />
        </div>

        {action === "keluar" && (
          <div>
            <Label htmlFor="keterangan">Keterangan</Label>
            <Select value={formData.keterangan} onValueChange={(value) => setFormData(prev => ({ ...prev, keterangan: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rusak">Rusak</SelectItem>
                <SelectItem value="expired">Kedaluwarsa</SelectItem>
                <SelectItem value="penyesuaian">Penyesuaian</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {action === "masuk" && (
          <div>
            <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
            <Input
              id="keterangan"
              value={formData.keterangan}
              onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
              placeholder="Keterangan stok masuk"
            />
          </div>
        )}

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Memproses..." : action === "masuk" ? "Tambah Stok" : "Kurangi Stok"}
        </Button>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Obat</h1>
          <p className="text-gray-600">Kelola data obat dan stok</p>
        </div>
        {user?.role === "admin" && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Obat
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tambah Obat Baru</DialogTitle>
                <DialogDescription>
                  Masukkan informasi obat yang akan ditambahkan
                </DialogDescription>
              </DialogHeader>
              <ObatForm
                onSubmit={(data) => createMutation.mutate(data)}
                isLoading={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Pencarian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Cari Obat</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nama atau kode obat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="kategori">Kategori</Label>
              <Select value={selectedKategori} onValueChange={setSelectedKategori}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua kategori</SelectItem>
                  <SelectItem value="bebas">Bebas</SelectItem>
                  <SelectItem value="resep">Resep</SelectItem>
                  <SelectItem value="herbal">Herbal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status_exp">Status Kedaluwarsa</Label>
              <Select value={selectedStatusExp} onValueChange={setSelectedStatusExp}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua status</SelectItem>
                  <SelectItem value="expired">Sudah Kedaluwarsa</SelectItem>
                  <SelectItem value="near_expired">Hampir Kedaluwarsa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedKategori("");
                  setSelectedStatusExp("");
                }}
                className="w-full"
              >
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Obat List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Obat</CardTitle>
          <CardDescription>
            Total: {obatList?.obat.length || 0} obat
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {obatList?.obat.map((obat) => {
                const expStatus = getExpiredStatus(obat.tgl_kadaluarsa);
                const isLowStock = obat.stok <= obat.min_stok;

                return (
                  <Card key={obat.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{obat.nama}</CardTitle>
                          <p className="text-sm text-gray-600">{obat.kode}</p>
                        </div>
                        <Badge variant="outline">{obat.kategori}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Harga Jual:</span>
                        <span className="font-medium">{formatCurrency(obat.harga_jual)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Stok:</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isLowStock ? "text-red-600" : ""}`}>
                            {obat.stok}
                          </span>
                          {isLowStock && <Badge variant="destructive" className="text-xs">Kritis</Badge>}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Kedaluwarsa:</span>
                        <Badge variant={expStatus.variant} className="text-xs">
                          {expStatus.label}
                        </Badge>
                      </div>

                      <div className="text-xs text-gray-500">
                        Batch: {obat.batch} | Exp: {new Date(obat.tgl_kadaluarsa).toLocaleDateString("id-ID")}
                      </div>

                      {user?.role === "admin" && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedObat(obat);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedObat(obat);
                              setStokAction("masuk");
                              setIsStokDialogOpen(true);
                            }}
                          >
                            <Package className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedObat(obat);
                              setStokAction("keluar");
                              setIsStokDialogOpen(true);
                            }}
                          >
                            <PackageMinus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm("Yakin ingin menghapus obat ini?")) {
                                deleteMutation.mutate(obat.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Obat</DialogTitle>
            <DialogDescription>
              Perbarui informasi obat
            </DialogDescription>
          </DialogHeader>
          {selectedObat && (
            <ObatForm
              obat={selectedObat}
              onSubmit={(data) => updateMutation.mutate({ id: selectedObat.id, data })}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Stok Dialog */}
      <Dialog open={isStokDialogOpen} onOpenChange={setIsStokDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {stokAction === "masuk" ? "Tambah Stok" : "Kurangi Stok"}
            </DialogTitle>
            <DialogDescription>
              {selectedObat?.nama} - Stok saat ini: {selectedObat?.stok}
            </DialogDescription>
          </DialogHeader>
          {selectedObat && (
            <StokForm
              obat={selectedObat}
              action={stokAction}
              onSubmit={(data) => {
                if (stokAction === "masuk") {
                  stokMasukMutation.mutate({ id: selectedObat.id, data });
                } else {
                  stokKeluarMutation.mutate({ id: selectedObat.id, data });
                }
              }}
              isLoading={stokMasukMutation.isPending || stokKeluarMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
