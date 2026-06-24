import * as Collapsible from '@radix-ui/react-collapsible';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { themedSurfaceClassName } from '../ui/themedSurfaceStyles';

export function SettingSection({
  id,
  title,
  openSections,
  toggleSection,
  motionDuration,
  motionEase,
  children
}) {
  const isOpen = Boolean(openSections[id]);

  return (
    <Collapsible.Root open={isOpen} onOpenChange={() => toggleSection(id)} asChild>
      <section
        className={themedSurfaceClassName(
          'panel',
          'rounded-xl border border-slate-200 dark:border-slate-700 bg-white/35 dark:bg-slate-900/30 overflow-hidden'
        )}
      >
        <Collapsible.Trigger className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform ${isOpen ? '' : '-rotate-90'}`}
          />
        </Collapsible.Trigger>
        <AnimatePresence initial={false}>
          {isOpen && (
            <Collapsible.Content forceMount asChild>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: motionDuration, ease: motionEase }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3">{children}</div>
              </motion.div>
            </Collapsible.Content>
          )}
        </AnimatePresence>
      </section>
    </Collapsible.Root>
  );
}
