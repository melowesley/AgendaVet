import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface AppNavbarProps {
  /** Título exibido ao lado do logo */
  title?: string;
  /** Botões de ação customizados */
  actions?: React.ReactNode;
  /** Se true, mostra o link "Voltar ao início" */
  showHomeLink?: boolean;
}

/**
 * Barra de navegação no estilo Hero Section, usada nas páginas de Auth e em páginas standalone.
 */
export function AppNavbar({ title = 'AgendaVet', actions, showHomeLink = true }: AppNavbarProps) {
  return (
    <nav className="flex w-full items-center justify-between border-t border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
      <div className="flex items-center gap-2">
        <div className="size-7 shrink-0 overflow-hidden rounded-lg">
          <img src="/agendavet-logo.png" alt="AgendaVet" className="size-7 object-contain" />
        </div>
        <h1 className="text-base font-bold text-slate-800 dark:text-white md:text-2xl">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        {showHomeLink && (
          <Button variant="outline" size="sm" asChild>
            <Link to="/">Voltar ao início</Link>
          </Button>
        )}
      </div>
    </nav>
  );
}
