import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ObatPage } from "./pages/ObatPage";
import { TransaksiPage } from "./pages/TransaksiPage";
import { RekomendasiPage } from "./pages/RekomendasiPage";
import { LaporanPage } from "./pages/LaporanPage";
import { UsersPage } from "./pages/UsersPage";
import { StrukPage } from "./pages/StrukPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppInner() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="obat" element={<ObatPage />} />
          <Route path="transaksi" element={<TransaksiPage />} />
          <Route path="rekomendasi" element={<RekomendasiPage />} />
          <Route path="laporan" element={<LaporanPage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>
        <Route path="/struk/:id" element={<StrukPage />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </QueryClientProvider>
  );
}
