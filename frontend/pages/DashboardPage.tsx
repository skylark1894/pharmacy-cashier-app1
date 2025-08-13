import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, ShoppingCart, Package, AlertTriangle } from "lucide-react";

export function DashboardPage() {
  const backend = useBackend();
  const today = new Date().toISOString().split('T')[0];

  const { data: summary } = useQuery({
    queryKey: ["dashboard-summary", today],
    queryFn: () => backend.dashboard.getSummary({ from: today, to: today }),
  });

  const { data: salesChart } = useQuery({
    queryKey: ["dashboard-sales-chart", "day"],
    queryFn: () => backend.dashboard.getSalesChart({ granularity: "day" }),
  });

  const { data: expWarnings } = useQuery({
    queryKey: ["dashboard-exp-warnings"],
    queryFn: () => backend.dashboard.getExpWarnings({ days: 30 }),
  });

  const { data: lowStock } = useQuery({
    queryKey: ["dashboard-low-stock"],
    queryFn: () => backend.dashboard.getLowStock(),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Ringkasan aktivitas apotek hari ini</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penjualan Hari Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.total_sales || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_transactions || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Item Terjual</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.items_sold || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Grafik Penjualan</CardTitle>
          <CardDescription>Tren penjualan dalam 30 hari terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="revenue" className="space-y-4">
            <TabsList>
              <TabsTrigger value="revenue">Pendapatan</TabsTrigger>
              <TabsTrigger value="transactions">Transaksi</TabsTrigger>
            </TabsList>
            <TabsContent value="revenue" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesChart?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            <TabsContent value="transactions" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesChart?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="transactions" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Peringatan Kedaluwarsa
            </CardTitle>
            <CardDescription>Obat yang akan atau sudah kedaluwarsa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expWarnings?.expired && expWarnings.expired.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-600 mb-2">Sudah Kedaluwarsa</h4>
                  <div className="space-y-2">
                    {expWarnings.expired.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                        <div>
                          <p className="font-medium text-sm">{item.nama}</p>
                          <p className="text-xs text-gray-600">Stok: {item.stok}</p>
                        </div>
                        <Badge variant="destructive">
                          {item.days_since_exp} hari lalu
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {expWarnings?.near_expired && expWarnings.near_expired.length > 0 && (
                <div>
                  <h4 className="font-medium text-orange-600 mb-2">Hampir Kedaluwarsa</h4>
                  <div className="space-y-2">
                    {expWarnings.near_expired.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                        <div>
                          <p className="font-medium text-sm">{item.nama}</p>
                          <p className="text-xs text-gray-600">Stok: {item.stok}</p>
                        </div>
                        <Badge variant="secondary">
                          {item.days_until_exp} hari lagi
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!expWarnings?.expired?.length && !expWarnings?.near_expired?.length) && (
                <Alert>
                  <AlertDescription>
                    Tidak ada obat yang akan atau sudah kedaluwarsa.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-yellow-500" />
              Stok Kritis
            </CardTitle>
            <CardDescription>Obat dengan stok di bawah minimum</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStock?.items && lowStock.items.length > 0 ? (
                lowStock.items.slice(0, 8).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                    <div>
                      <p className="font-medium text-sm">{item.nama}</p>
                      <p className="text-xs text-gray-600">Min: {item.min_stok}</p>
                    </div>
                    <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                      {item.stok}
                    </Badge>
                  </div>
                ))
              ) : (
                <Alert>
                  <AlertDescription>
                    Semua obat memiliki stok yang cukup.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
