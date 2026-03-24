'use client'

import { useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useReactToPrint } from 'react-to-print'
import { Save, Printer, X, ArrowLeft, FileText } from 'lucide-react'

interface BaseAttendanceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    previewContent: React.ReactNode
    children: React.ReactNode
    onSave: () => void
    saveLabel: string
    isSaving: boolean
    printTitle: string
    onBack?: () => void
}

export function BaseAttendanceDialog({
    open,
    onOpenChange,
    title,
    previewContent,
    children,
    onSave,
    saveLabel,
    isSaving,
    printTitle,
    onBack
}: BaseAttendanceDialogProps) {
    const printRef = useRef<HTMLDivElement>(null)

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: printTitle,
        pageStyle: `
            @page { size: A4; margin: 15mm 12mm; }
            @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; font-size: 10pt; }
                html { margin: 0; padding: 0; }
                .no-print { display: none !important; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                h1 { font-size: 16pt !important; }
                h2 { font-size: 14pt !important; }
                h3 { font-size: 12pt !important; }
                p, td, th, li, span { font-size: 10pt !important; }
                table { font-size: 9pt !important; page-break-inside: auto; }
                tr { page-break-inside: avoid; }
            }
        `
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="clinical-modal-content sm:max-w-5xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
                {/* Header - Estilo Galeria */}
                <DialogHeader className="px-6 py-4 border-b border-border/30 flex flex-row items-start justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                                onClick={onBack}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
                                <DialogDescription className="text-sm text-muted-foreground">
                                    {printTitle}
                                </DialogDescription>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </DialogHeader>

                {/* Corpo - Layout dois painéis estilo Galeria */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Coluna Esquerda - Formulário */}
                    <div className="w-full md:w-[40%] p-6 border-r border-border/30 overflow-y-auto">
                        {children}
                    </div>

                    {/* Coluna Direita - Preview do Documento */}
                    <div className="w-full md:w-[60%] bg-muted/10 flex flex-col overflow-hidden">
                        {/* Header do painel direito */}
                        <div className="p-4 border-b border-border/30 bg-muted/20 flex items-center justify-between shrink-0">
                            <h3 className="font-semibold text-sm">Preview do Documento</h3>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrint}
                                    className="h-8 text-xs cursor-pointer transition-colors duration-200"
                                >
                                    <Printer className="w-3.5 h-3.5 mr-1.5" />
                                    Imprimir
                                </Button>
                            </div>
                        </div>

                        {/* Preview compacto */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="a4-paper-preview" ref={printRef}>
                                {previewContent}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - Ações */}
                <div className="px-6 py-3 border-t border-border/30 bg-white flex items-center justify-between shrink-0">
                    <Button
                        onClick={onSave}
                        disabled={isSaving}
                        className="h-9 text-sm bg-emerald-600 hover:bg-emerald-700 cursor-pointer transition-colors duration-200"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Salvando...' : saveLabel}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
