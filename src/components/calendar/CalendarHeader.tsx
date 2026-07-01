import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface CalendarHeaderProps {
  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  viewMode: 'day' | 'week';
  setViewMode: React.Dispatch<React.SetStateAction<'day' | 'week'>>;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  setCurrentDate,
  viewMode,
  setViewMode
}) => {
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - (viewMode === 'week' ? 7 : 1));
      return next;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + (viewMode === 'week' ? 7 : 1));
      return next;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const formatHeaderDate = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }

    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(currentDate.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (monday.getFullYear() !== sunday.getFullYear()) {
      return `${monday.toLocaleDateString('en-US', { ...formatOptions, year: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { ...formatOptions, year: 'numeric' })}`;
    }
    return `${monday.toLocaleDateString('en-US', formatOptions)} – ${sunday.toLocaleDateString('en-US', { ...formatOptions, year: 'numeric' })}`;
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4 shrink-0">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-600 dark:text-indigo-400">
          <Calendar size={18} />
        </div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white" data-testid="calendar-header-title">
          {formatHeaderDate()}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={handlePrev}
            aria-label="Previous period"
            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
          >
            Today
          </button>
          <button
            onClick={handleNext}
            aria-label="Next period"
            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setViewMode('day')}
            aria-pressed={viewMode === 'day'}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${viewMode === 'day' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}
          >
            Day
          </button>
          <button
            onClick={() => setViewMode('week')}
            aria-pressed={viewMode === 'week'}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${viewMode === 'week' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}
          >
            Week
          </button>
        </div>
      </div>
    </div>
  );
};
