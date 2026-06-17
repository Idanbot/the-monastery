import { Flame } from 'lucide-react';

export function UrgencyBadge({ urgency }) {
  let color =
    'text-emerald-500 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20';
  if (urgency > 3)
    color = 'text-amber-500 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20';
  if (urgency > 7)
    color = 'text-rose-500 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20';
  return (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${color}`}>
      <Flame size={10} /> {urgency}
    </div>
  );
}
