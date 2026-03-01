
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Thermometer, Heart, Beaker, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const VetDiagnosticTest = () => {
    const [status, setStatus] = useState<'idle' | 'running' | 'completed'>('idle');
    const [results, setResults] = useState<{ label: string; value: string; status: 'ok' | 'warn' }[]>([]);

    const runDiagnostic = () => {
        setStatus('running');
        setResults([]);

        toast.info("Iniciando diagnóstico preventivo...");

        // Simulação de check-up em tempo real
        setTimeout(() => {
            setResults(prev => [...prev, { label: 'Temperatura', value: '38.5°C', status: 'ok' }]);
        }, 800);

        setTimeout(() => {
            setResults(prev => [...prev, { label: 'Frequência Cardíaca', value: '110 bpm', status: 'ok' }]);
        }, 1600);

        setTimeout(() => {
            setResults(prev => [...prev, { label: 'Nível de Hidratação', value: 'Alerta', status: 'warn' }]);
            toast.warning("Hidratação abaixo do ideal detectada.");
        }, 2400);

        setTimeout(() => {
            setStatus('completed');
            toast.success("Diagnóstico concluído com sucesso!");
        }, 3200);
    };

    return (
        <Card className="w-full max-w-md mx-auto overflow-hidden border-teal-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white pb-6">
                <div className="flex justify-between items-center">
                    <Badge variant="secondary" className="bg-white/20 text-white border-none">
                        Módulo Veterinário
                    </Badge>
                    <Activity size={20} className="animate-pulse" />
                </div>
                <CardTitle className="text-xl mt-4">Painel de Diagnóstico Rápido</CardTitle>
                <CardDescription className="text-teal-50">
                    Ferramenta de triagem instantânea para exames físicos.
                </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
                <div className="space-y-4">
                    {status === 'idle' && (
                        <div className="text-center py-8">
                            <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Beaker className="text-teal-600" size={32} />
                            </div>
                            <p className="text-sm text-gray-500 mb-6">
                                Clique no botão abaixo para iniciar a varredura de sinais vitais.
                            </p>
                            <Button
                                onClick={runDiagnostic}
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-6 rounded-xl font-bold transition-all shadow-md active:scale-95"
                            >
                                INICIAR TESTE AGORA
                            </Button>
                        </div>
                    )}

                    {status !== 'idle' && (
                        <div className="space-y-3">
                            {results.map((res, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 animate-in fade-in slide-in-from-bottom-2"
                                >
                                    <div className="flex items-center gap-3">
                                        {res.label.includes('Temp') ? <Thermometer size={18} className="text-teal-500" /> : <Heart size={18} className="text-red-500" />}
                                        <span className="text-sm font-medium text-gray-700">{res.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-bold ${res.status === 'warn' ? 'text-amber-600' : 'text-teal-600'}`}>
                                            {res.value}
                                        </span>
                                        {res.status === 'ok' ? (
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                        ) : (
                                            <AlertCircle size={16} className="text-amber-500" />
                                        )}
                                    </div>
                                </div>
                            ))}

                            {status === 'running' && (
                                <div className="flex flex-col items-center py-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-2" />
                                    <span className="text-xs text-teal-600 font-medium">Analisando dados...</span>
                                </div>
                            )}

                            {status === 'completed' && (
                                <Button
                                    onClick={() => setStatus('idle')}
                                    variant="outline"
                                    className="w-full mt-4 border-teal-200 text-teal-700 hover:bg-teal-50"
                                >
                                    NOVO DIAGNÓSTICO
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
