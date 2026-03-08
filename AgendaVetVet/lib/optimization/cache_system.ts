const cache = new Map<string, { response: string, expiry: number }>();

export const getCachedResponse = (key: string) => {
    const entry = cache.get(key);
    if (entry && entry.expiry > Date.now()) {
        return entry.response;
    }
    return null;
};

export const setCachedResponse = (key: string, response: string, ttlMs: number = 3600000) => {
    cache.set(key, {
        response,
        expiry: Date.now() + ttlMs
    });
};
