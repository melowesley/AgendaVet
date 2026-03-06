import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { queryClient } from "@/core/lib/queryClient";
import { initializeAuth } from "@/core/auth/useAuthStore";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";
import { AdminRoute } from "@/shared/components/AdminRoute";
import { PawPrint } from "lucide-react";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./modules/tutor/pages/Auth"));
const ClientPortal = lazy(() => import("./modules/tutor/pages/Dashboard"));
const PetProfile = lazy(() => import("./modules/tutor/pages/PetProfile"));
const AdminDashboard = lazy(() => import("./modules/vet/pages/Dashboard"));
const AdminAuth = lazy(() => import("./modules/vet/pages/Auth"));
const AdminPetProfile = lazy(() => import("./modules/vet/pages/PetProfile"));
const NotFound = lazy(() => import("./pages/NotFound"));

const LoadingFallback = () => (
  <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background">
    <PawPrint className="h-10 w-10 text-teal-600 animate-pulse" />
    <p className="text-sm text-muted-foreground">Carregando...</p>
  </div>
);

const App = () => {
  useEffect(() => {
    const cleanup = initializeAuth();
    return cleanup;
  }, []);

  return (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="h-full min-h-0 overflow-hidden flex flex-col">
          <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/cliente" element={
              <ProtectedRoute><ClientPortal /></ProtectedRoute>
            } />
            <Route path="/cliente/pet/:petId" element={
              <ProtectedRoute><PetProfile /></ProtectedRoute>
            } />
            <Route path="/admin/login" element={<AdminAuth />} />
            <Route path="/admin" element={
              <AdminRoute><AdminDashboard /></AdminRoute>
            } />
            <Route path="/admin/pet/:petId" element={
              <AdminRoute><AdminPetProfile /></AdminRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;
