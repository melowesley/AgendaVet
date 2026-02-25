import { cn } from '@/lib/utils';

interface BorderedContentFrameProps {
  children: React.ReactNode;
  className?: string;
  /** Quando true, oculta as bordas decorativas (por exemplo em mobile) */
  compact?: boolean;
}

/**
 * Moldura com bordas decorativas no estilo Hero Section (Aceternity).
 * Usado para manter consistência visual em Admin, Cliente e páginas de Auth.
 */
export function BorderedContentFrame({ children, className, compact }: BorderedContentFrameProps) {
  return (
    <div className={cn('relative flex flex-col', className)}>
      {!compact && (
        <>
          <div className="absolute inset-y-0 left-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
            <div className="absolute top-0 h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
          </div>
          <div className="absolute inset-y-0 right-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
            <div className="absolute h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-px w-full bg-neutral-200/80 dark:bg-neutral-800/80">
            <div className="absolute left-1/2 -translate-x-1/2 h-px w-40 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
          </div>
        </>
      )}
      <div className="relative z-10 flex-1">{children}</div>
    </div>
  );
}
