const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /you\s+are\s+now/i,
  /\[INST\]/i,
  /\[SYSTEM\]/i,
  /act\s+as\s+(a|an)\s+/i,
  /bypass\s+(the\s+)?safety/i,
  /disregard\s+(all\s+)?prior/i,
  /forget\s+(all\s+)?previous/i,
  /new\s+instructions?\s*:/i,
  /system\s*prompt\s*:/i,
];

const MAX_INPUT_LENGTH = 4000;

export function sanitizeUserInput(input: string): string {
  let sanitized = input.substring(0, MAX_INPUT_LENGTH);

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      sanitized = sanitized.replace(pattern, '[FILTERED]');
    }
  }

  return sanitized.trim();
}

export function validateMessages(messages: any[]): boolean {
  if (!Array.isArray(messages) || messages.length === 0) return false;

  return messages.every((m) => {
    if (!m || !['user', 'assistant', 'system', 'tool'].includes(m.role)) return false;
    // AI SDK v6: messages have parts array
    if (Array.isArray(m.parts)) return true;
    // Legacy format: messages have content string
    if (typeof m.content === 'string') return true;
    return false;
  });
}
