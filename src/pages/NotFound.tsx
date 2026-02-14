import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { BorderedContentFrame } from "@/components/layout/BorderedContentFrame";
import { AppNavbar } from "@/components/layout/AppNavbar";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900">
      <AppNavbar title="AgendaVet" showHomeLink />
      <BorderedContentFrame className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-slate-800 dark:text-white">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">Página não encontrada</p>
          <a href="/" className="text-primary underline hover:text-primary/90 font-medium">
            Voltar ao início
          </a>
        </div>
      </BorderedContentFrame>
    </div>
  );
};

export default NotFound;
