/**
 * Logger global para erros e eventos do Supabase.
 * Intercepta erros para diagnóstico em Android (WebView) e browser.
 *
 * Em produção, os logs aparecem no console do Chrome DevTools
 * (conecte o dispositivo Android via USB e use chrome://inspect).
 */

type LogContext = Record<string, unknown>;

const isDev = import.meta.env.DEV;

function formatContext(ctx: LogContext): string {
  try {
    return JSON.stringify(ctx, null, isDev ? 2 : 0);
  } catch {
    return String(ctx);
  }
}

export const supabaseLogger = {
  error(message: string, context?: LogContext) {
    const details = context ? `\n  Detalhes: ${formatContext(context)}` : '';
    console.error(`[Supabase Error] ${message}${details}`);
    if (context?.error && typeof context.error === 'object') {
      const err = context.error as { message?: string; details?: string };
      console.error('  error.message:', err.message);
      if (err.details) console.error('  error.details:', err.details);
    }
  },

  warn(message: string, context?: LogContext) {
    const details = context ? `\n  ${formatContext(context)}` : '';
    console.warn(`[Supabase Warn] ${message}${details}`);
  },

  debug(message: string, context?: LogContext) {
    if (isDev && context) {
      console.debug(`[Supabase Debug] ${message}`, context);
    }
  },
};

/**
 * Helper para logar erros de queries Supabase (PostgrestError).
 * Use após: const { data, error } = await supabase.from('x').select();
 */
export function logSupabaseError(
  operation: string,
  error: { message?: string; details?: string; code?: string } | null,
  context?: LogContext
) {
  if (!error) return;
  supabaseLogger.error(operation, {
    ...context,
    error,
    message: error.message,
    details: error.details,
    code: error.code,
  });
}
