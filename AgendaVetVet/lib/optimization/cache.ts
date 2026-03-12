const cache: Record<string, string> = {}

export function getCache(key: string) {
  return cache[key]
}

export function setCache(key: string, value: string) {
  cache[key] = value
}
