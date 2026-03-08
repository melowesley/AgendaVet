export interface PerformanceMetric {
    operation: string;
    duration: number;
    timestamp: string;
}

const metrics: PerformanceMetric[] = [];

export const recordMetric = (operation: string, duration: number) => {
    metrics.push({
        operation,
        duration,
        timestamp: new Date().toISOString()
    });

    // Limitar histórico local
    if (metrics.length > 100) metrics.shift();
};

export const getAverageLatency = (operation: string) => {
    const filtered = metrics.filter(m => m.operation === operation);
    if (filtered.length === 0) return 0;
    return filtered.reduce((acc, current) => acc + current.duration, 0) / filtered.length;
};
