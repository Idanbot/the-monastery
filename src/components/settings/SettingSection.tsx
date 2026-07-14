import * as Collapsible from '@radix-ui/react-collapsible';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';

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
      <section className="settings-section overflow-hidden border-b border-[var(--ui-border-subtle)] text-[var(--ui-text-primary)]">
        <Collapsible.Trigger className="ui-focus-ring flex w-full items-center justify-between gap-3 rounded-lg px-1 py-3 text-left">
          <span className="text-base font-semibold text-[var(--ui-text-primary)]">{title}</span>
          <ChevronDown
            size={16}
            className={`text-[var(--ui-text-secondary)] transition-transform ${isOpen ? '' : '-rotate-90'}`}
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
                <div className="space-y-3 pb-6 pt-1">{children}</div>
              </motion.div>
            </Collapsible.Content>
          )}
        </AnimatePresence>
      </section>
    </Collapsible.Root>
  );
}
