import { recordMetric, getAverageLatency } from '../AgendaVet-Vet-App/lib/analytics/performance_metrics';

console.log("Iniciando testes de performance...");

recordMetric('test-op', 150);
recordMetric('test-op', 250);

const avg = getAverageLatency('test-op');
console.log(`Latência média calculada: ${avg}ms`);

if (avg === 200) {
    console.log("Cálculo de performance verificado com sucesso!");
} else {
    console.log("Erro no cálculo de performance.");
}
