import { useEffect } from 'react';
import { Command } from 'cmdk';
import { Keyboard } from 'lucide-react';
import { ThemedSurface } from './ui/ThemedSurface';

export type CommandPaletteCommand = {
  value: string;
  label: string;
  onSelect: () => void;
  leading?: React.ReactNode;
};

export type CommandPaletteGroup = {
  heading: string;
  commands: CommandPaletteCommand[];
};

/**
 * Controlled command palette. The parent owns `open`/`onOpenChange` and the
 * command list; this component owns only the dialog chrome and the Cmd+K
 * shortcut. This is the single palette for the whole app — there is no
 * duplicate inline palette anymore.
 */
export function CommandPalette({
  open,
  onOpenChange,
  groups
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: CommandPaletteGroup[];
}) {
  useEffect(() => {
    if (!open) return;
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  if (!open) return null;

  const close = () => onOpenChange(false);

  return (
    <ThemedSurface
      variant="overlay"
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-24"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <ThemedSurface
        role="dialog"
        aria-label="Command palette"
        variant="modal"
        className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden pointer-events-auto"
      >
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Keyboard size={16} className="text-indigo-500" />
          <h3 className="font-bold text-sm">Command Palette</h3>
        </div>
        <Command className="p-2" shouldFilter loop>
          <Command.Input
            aria-label="Search commands"
            placeholder="Search commands"
            className="mb-2 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
          <Command.List className="max-h-[22rem] overflow-y-auto custom-scrollbar space-y-1">
            <Command.Empty className="px-3 py-4 text-sm text-slate-400">No command found.</Command.Empty>
            {groups.map((group) =>
              group.commands.length === 0 ? null : (
                <Command.Group key={group.heading} heading={group.heading}>
                  {group.commands.map((command) => (
                    <Command.Item
                      key={command.value}
                      value={command.value}
                      onSelect={() => {
                        close();
                        command.onSelect();
                      }}
                      className="rounded-lg px-3 py-2 text-sm cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 flex items-center gap-2"
                    >
                      {command.leading}
                      {command.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              )
            )}
          </Command.List>
        </Command>
      </ThemedSurface>
    </ThemedSurface>
  );
}
