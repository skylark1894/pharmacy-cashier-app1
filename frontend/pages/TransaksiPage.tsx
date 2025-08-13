import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useBackend } from "../hooks/useBackend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Search, ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import type { Obat } from "~backend/obat/obat";

interface CartItem {
  obat: Obat;
  qty: number;
}

export function TransaksiPage() {
  const backend = useBackend();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [metodeBayar, setMetodeBayar] = useState<"tunai" | "debit" | "ewallet">("tunai");
  const [jumlahBayar, setJumlahBayar] = useState(0);

  const { data: obatList } = useQuery({
    queryKey: ["obat", searchTerm],
    queryFn: () => backend.obat.listObat({ search: searchTerm || undefined }),
    enabled: searchTerm.length > 0,
  });

  const createPenjualanMutation = useMutation({
    mutationFn: (data: any) => backend.penjualan.createPenjualan(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["obat"] });
      setCart([]);
      setJumlahBayar(0);
      toast({ title: "Transaksi berhasil disimpan" });
      navigate(`/struk/${result.id}`);
    },
    onError: (error) => {
      console.error("Create penjualan failed:", error);
      toast({ title: "Gagal menyimpan transaksi", variant: "destructive" });
    },
  });

  // Auto focus barcode input
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  const handleBarcodeSearch = async (barcode: string) => {
    if (!barcode.trim()) return;

    try {
      const obat = await backend.barcode.searchByBarcode({ kode: barcode });
      addToCart(obat);
      setBarcodeInput("");
    } catch (error) {
      toast({ title: "Obat tidak ditemukan", variant: "destructive" });
    }
  };

  const addToCart = (obat: Obat) => {
    // Check if expired
    if (new Date(obat.tgl_kadaluarsa) <= new Date()) {
      toast({ title: "Obat sudah kedaluwarsa", variant: "destructive" });
      return;
    }

    // Check stock
    if (obat.stok <= 0) {
      toast({ title: "Stok obat habis", variant: "destructive" });
      return;
    }

    setCart(prev => {
      const existingItem = prev.find(item => item.obat.id === obat.id);
      if (existingItem) {
        if (existingItem.qty >= obat.stok) {
          toast({ title: "Stok tidak mencukupi", variant: "destructive" });
          return prev;
        }
        return prev.map(item =>
          item.obat.id === obat.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      } else {
        return [...prev, { obat, qty: 1 }];
      }
    });
  };

  const updateCartQty = (obatId: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(obatId);
      return;
    }

    const item = cart.find(item => item.obat.id === obatId);
    if (item && newQty > item.obat.stok) {
      toast({ title: "Stok tidak mencukupi", variant: "destructive" });
      return;
    }

    setCart(prev =>
      prev.map(item =>
        item.obat.id === obatId
          ? { ...item, qty: newQty }
          : item
      )
    );
  };

  const removeFromCart = (obatId: number) => {
    setCart(prev => prev.filter(item => item.obat.id !== obatId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.qty * item.obat.harga_jual), 0);
  };

  const calculateKembalian = () => {
    const total = calculateTotal();
    return jumlahBayar - total;
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ title: "Keranjang kosong", variant: "destructive" });
      return;
    }

    const total = calculateTotal();
    if (metodeBayar === "tunai" && jumlahBayar < total) {
      toast({ title: "Jumlah bayar kurang", variant: "destructive" });
      return;
    }

    const items = cart.map(item => ({
      obatId: item.obat.id,
      qty: item.qty,
      harga: item.obat.harga_jual,
    }));

    createPenjualanMutation.mutate({
      items,
      metode_bayar: metodeBayar,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transaksi Penjualan</h1>
        <p className="text-gray-600">Proses penjualan obat</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Product Search */}
        <div className="lg:col-span-2 space-y-6">
          {/* Barcode Scanner */}
          <Card>
            <CardHeader>
              <CardTitle>Scan Barcode</CardTitle>
              <CardDescription>Scan atau ketik kode/barcode obat</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  ref={barcodeInputRef}
                  placeholder="Scan atau ketik kode/barcode..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleBarcodeSearch(barcodeInput);
                    }
                  }}
                />
                <Button onClick={() => handleBarcodeSearch(barcodeInput)}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Product Search */}
          <Card>
            <CardHeader>
              <CardTitle>Cari Obat</CardTitle>
              <CardDescription>Cari obat berdasarkan nama</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Ketik nama obat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                {obatList && obatList.obat.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {obatList.obat.map((obat) => {
                      const isExpired = new Date(obat.tgl_kadaluarsa) <= new Date();
                      const isOutOfStock = obat.stok <= 0;

                      return (
                        <Card
                          key={obat.id}
                          className={`cursor-pointer transition-colors ${
                            isExpired || isOutOfStock
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => !isExpired && !isOutOfStock && addToCart(obat)}
                        >
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-sm">{obat.nama}</h4>
                              <Badge variant="outline" className="text-xs">{obat.kategori}</Badge>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div className="flex justify-between">
                                <span>Harga:</span>
                                <span className="font-medium">{formatCurrency(obat.harga_jual)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Stok:</span>
                                <span className={obat.stok <= obat.min_stok ? "text-red-600 font-medium" : ""}>
                                  {obat.stok}
                                </span>
                              </div>
                              {isExpired && (
                                <Badge variant="destructive" className="text-xs">Kedaluwarsa</Badge>
                              )}
                              {isOutOfStock && (
                                <Badge variant="destructive" className="text-xs">Stok Habis</Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Cart & Checkout */}
        <div className="space-y-6">
          {/* Cart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Keranjang ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Keranjang kosong</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.obat.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.obat.nama}</h4>
                        <p className="text-xs text-gray-600">{formatCurrency(item.obat.harga_jual)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartQty(item.obat.id, item.qty - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.qty}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartQty(item.obat.id, item.qty + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeFromCart(item.obat.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Checkout */}
          <Card>
            <CardHeader>
              <CardTitle>Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metode_bayar">Metode Bayar</Label>
                <Select value={metodeBayar} onValueChange={(value: any) => setMetodeBayar(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tunai">Tunai</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                    <SelectItem value="ewallet">E-Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-bold">{formatCurrency(calculateTotal())}</span>
                </div>

                {metodeBayar === "tunai" && (
                  <>
                    <div>
                      <Label htmlFor="jumlah_bayar">Jumlah Bayar</Label>
                      <Input
                        id="jumlah_bayar"
                        type="number"
                        value={jumlahBayar}
                        onChange={(e) => setJumlahBayar(Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="flex justify-between">
                      <span>Kembalian:</span>
                      <span className={calculateKembalian() < 0 ? "text-red-600" : "text-green-600"}>
                        {formatCurrency(calculateKembalian())}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <Button
                onClick={handleCheckout}
                disabled={createPenjualanMutation.isPending || cart.length === 0}
                className="w-full"
              >
                {createPenjualanMutation.isPending ? "Memproses..." : "Simpan & Cetak Struk"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
