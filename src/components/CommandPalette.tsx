import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Search, Moon, Sun, CheckCircle, Plus, LayoutDashboard, Layout } from 'lucide-react';
import { ThemedSurface } from './ui/ThemedSurface';

export function CommandPalette({ settings, setSettings, setMonkMode, setView, openTaskModal }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
      <ThemedSurface
        variant="modal"
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl"
      >
        <Command
          className="bg-transparent w-full flex flex-col"
          shouldFilter={true}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
        >
          <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-4">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <Command.Input
              autoFocus
              className="w-full bg-transparent p-4 text-base outline-none placeholder-slate-400 text-slate-900 dark:text-white"
              placeholder="Type a command or search..."
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
            <Command.Empty className="p-4 text-center text-sm text-slate-500">
              No results found.
            </Command.Empty>

            <Command.Group heading="Actions" className="text-xs font-semibold text-slate-500 px-2 py-1.5">
              <Command.Item
                onSelect={() => {
                  openTaskModal();
                  setOpen(false);
                }}
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-500/20 aria-selected:text-indigo-700 dark:aria-selected:text-indigo-300 transition-colors text-slate-700 dark:text-slate-300"
              >
                <Plus size={16} /> Create new task
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  setMonkMode(!settings.monkMode);
                  setOpen(false);
                }}
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-500/20 aria-selected:text-indigo-700 dark:aria-selected:text-indigo-300 transition-colors text-slate-700 dark:text-slate-300"
              >
                <CheckCircle size={16} /> {settings.monkMode ? 'Exit Monk Mode' : 'Enter Monk Mode'}
              </Command.Item>
            </Command.Group>

            <Command.Group
              heading="Navigation"
              className="text-xs font-semibold text-slate-500 px-2 py-1.5 mt-2"
            >
              <Command.Item
                onSelect={() => {
                  setView('board');
                  setOpen(false);
                }}
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-500/20 aria-selected:text-indigo-700 dark:aria-selected:text-indigo-300 transition-colors text-slate-700 dark:text-slate-300"
              >
                <Layout size={16} /> Go to Board
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  setView('dashboard');
                  setOpen(false);
                }}
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-500/20 aria-selected:text-indigo-700 dark:aria-selected:text-indigo-300 transition-colors text-slate-700 dark:text-slate-300"
              >
                <LayoutDashboard size={16} /> Go to Analytics
              </Command.Item>
            </Command.Group>

            <Command.Group
              heading="Appearance"
              className="text-xs font-semibold text-slate-500 px-2 py-1.5 mt-2"
            >
              <Command.Item
                onSelect={() => {
                  setSettings((prev) => ({ ...prev, visualTheme: 'liquid-glass' }));
                  setOpen(false);
                }}
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-500/20 aria-selected:text-indigo-700 dark:aria-selected:text-indigo-300 transition-colors text-slate-700 dark:text-slate-300"
              >
                <Sun size={16} /> Set theme: Liquid Glass
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  setSettings((prev) => ({ ...prev, visualTheme: 'obsidian-glass' }));
                  setOpen(false);
                }}
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-500/20 aria-selected:text-indigo-700 dark:aria-selected:text-indigo-300 transition-colors text-slate-700 dark:text-slate-300"
              >
                <Moon size={16} /> Set theme: Obsidian Glass
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </ThemedSurface>
    </div>
  );
}
