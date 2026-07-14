import { Check, TriangleAlert, X } from 'lucide-react';
import { Button } from '../ui/Button';

export function VisualSystemPreview() {
  return (
    <section
      data-testid="visual-system-preview"
      aria-labelledby="visual-system-preview-title"
      className="ui-surface overflow-hidden rounded-2xl border"
    >
      <div className="border-b border-[var(--ui-border-subtle)] p-4">
        <div className="ui-eyebrow">Live components</div>
        <h4 id="visual-system-preview-title" className="mt-1 text-lg font-semibold">
          Interface preview
        </h4>
        <p className="mt-1 text-sm text-[var(--ui-text-secondary)]">
          Controls and states update with the selected theme.
        </p>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-[var(--ui-text-secondary)]">
            Example field
            <input
              readOnly
              value="Focused work"
              className="ui-control mt-1.5 w-full rounded-xl px-3 py-2 text-sm outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button aria-label="Primary action preview" variant="primary">
              Primary
            </Button>
            <Button aria-label="Secondary action preview" variant="secondary">
              Secondary
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap content-start gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-current px-2 py-1 text-[11px] font-semibold text-[var(--ui-success)]">
            <Check size={13} /> Success
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-current px-2 py-1 text-[11px] font-semibold text-[var(--ui-warning)]">
            <TriangleAlert size={13} /> Warning
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-current px-2 py-1 text-[11px] font-semibold text-[var(--ui-danger)]">
            <X size={13} /> Attention
          </span>
        </div>
      </div>
    </section>
  );
}
