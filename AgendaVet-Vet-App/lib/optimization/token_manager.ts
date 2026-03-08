export const estimateTokenCount = (text: string) => {
    // Estimativa simples: ~4 caracteres por token em média para inglês/português
    return Math.ceil(text.length / 4);
};

export const checkTokenLimit = (prompt: string, limit: number) => {
    const estimated = estimateTokenCount(prompt);
    return estimated <= limit;
};
