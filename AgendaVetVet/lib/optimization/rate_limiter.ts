const requestLog: number[] = [];
const LIMIT = 10; // Requisições por minuto
const WINDOW_MS = 60000;

export const isRateLimited = () => {
    const now = Date.now();
    // Limpar logs antigos
    while (requestLog.length > 0 && requestLog[0] < now - WINDOW_MS) {
        requestLog.shift();
    }

    if (requestLog.length >= LIMIT) return true;

    requestLog.push(now);
    return false;
};
