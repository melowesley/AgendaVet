import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface AdminStatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  variant?: 'blue' | 'amber' | 'emerald' | 'violet';
}

const VARIANTS = {
  blue:    { bg: 'bg-blue-50 dark:bg-blue-950/30',   icon: 'text-blue-600 dark:text-blue-400',   ring: 'bg-blue-100 dark:bg-blue-900/40' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-950/30', icon: 'text-amber-600 dark:text-amber-400', ring: 'bg-amber-100 dark:bg-amber-900/40' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', icon: 'text-emerald-600 dark:text-emerald-400', ring: 'bg-emerald-100 dark:bg-emerald-900/40' },
  violet:  { bg: 'bg-violet-50 dark:bg-violet-950/30', icon: 'text-violet-600 dark:text-violet-400', ring: 'bg-violet-100 dark:bg-violet-900/40' },
};

export const AdminStatsCard = ({ title, value, icon: Icon, description, variant = 'blue' }: AdminStatsCardProps) => {
  const v = VARIANTS[variant];
  return (
    <Card className="border-slate-200 dark:border-border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1 leading-none">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1.5 truncate">{description}</p>
            )}
          </div>
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${v.ring}`}>
            <Icon className={`h-6 w-6 ${v.icon}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
