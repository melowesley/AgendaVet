let lastCall = 0

export function canCallAI() {
  const now = Date.now()
  if (now - lastCall < 2000) {
    return false
  }
  lastCall = now
  return true
}
