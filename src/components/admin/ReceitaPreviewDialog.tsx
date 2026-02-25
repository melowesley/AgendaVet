import { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X, Loader2 } from 'lucide-react';

interface ReceitaPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  html: string;
  title: string;
}

export const ReceitaPreviewDialog = ({
  open,
  onClose,
  html,
  title,
}: ReceitaPreviewDialogProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);

  useEffect(() => {
    if (!open) {
      setIframeReady(false);
    }
  }, [open]);

  const handleIframeLoad = () => {
    setIframeReady(true);
  };

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="flex flex-col p-0 gap-0 overflow-hidden"
        style={{ maxWidth: '92vw', width: '1100px', maxHeight: '92vh' }}
      >
        {/* ── Cabeçalho ─────────────────────────────────────── */}
        <DialogHeader className="px-5 py-3.5 border-b bg-white dark:bg-card flex-shrink-0">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* ── Preview (iframe) ──────────────────────────────── */}
        <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-800 p-4">
          {!iframeReady && (
            <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
              <Loader2 className="animate-spin h-5 w-5" />
              <span className="text-sm">Carregando visualização...</span>
            </div>
          )}
          <iframe
            ref={iframeRef}
            srcDoc={html}
            title={title}
            onLoad={handleIframeLoad}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white shadow-sm"
            style={{
              height: '680px',
              display: iframeReady ? 'block' : 'none',
            }}
          />
        </div>

        {/* ── Rodapé com botão imprimir ─────────────────────── */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t bg-white dark:bg-card flex-shrink-0">
          <p className="text-xs text-muted-foreground hidden sm:block">
            Role para cima para ver a receita completa · Clique em <strong>Imprimir</strong> para abrir o diálogo de impressão
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-3.5 w-3.5 mr-1.5" />
              Fechar
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              disabled={!iframeReady}
              className="gradient-primary text-white shadow-sm"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Imprimir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
