import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { queryClient } from "@/lib/queryClient";
import { initializeAuth } from "@/store/useAuthStore";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ClientPortal from "./pages/ClientPortal";
import PetProfile from "./pages/PetProfile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAuth from "./pages/AdminAuth";
import AdminPetProfile from "./pages/AdminPetProfile";
import SidebarDemo from "./components/sidebar-demo";
import AgendaDemo from "./pages/AgendaDemo";
import NotFound from "./pages/NotFound";

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
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/cliente" element={<ClientPortal />} />
            <Route path="/cliente/pet/:petId" element={<PetProfile />} />
            <Route path="/admin/login" element={<AdminAuth />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/pet/:petId" element={<AdminPetProfile />} />
            <Route path="/sidebar-demo" element={<SidebarDemo />} />
            <Route path="/agenda-demo" element={<AgendaDemo />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;
