import * as Collapsible from '@radix-ui/react-collapsible';
import { Check, ChevronDown } from 'lucide-react';
import { resolveThemeGalleryTokens } from '../../domain/themeGallery';

function ThemeGalleryCard({ themeOption, isSelected, setThemeChoice }) {
  const tokens = resolveThemeGalleryTokens(themeOption.visualTheme, themeOption.group);

  return (
    <button
      key={themeOption.value}
      type="button"
      aria-label={`Select ${themeOption.label} theme`}
      aria-pressed={isSelected}
      data-testid="theme-gallery-card"
      data-theme-card={themeOption.visualTheme}
      onClick={() => setThemeChoice(themeOption.value)}
      className={`group relative min-h-28 overflow-hidden rounded-2xl border p-0 text-left transition-[border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-[1px] ${
        isSelected
          ? 'border-[var(--ui-info)] shadow-md ring-1 ring-[var(--ui-info)]'
          : 'border-[var(--ui-border-subtle)] hover:border-[var(--ui-border-strong)]'
      }`}
    >
      <div
        data-testid="theme-card-preview"
        className="relative h-20 overflow-hidden p-3"
        style={{ background: tokens.swatchStart }}
      >
        <div
          className={`mb-2 flex h-4 items-center gap-1 border px-1.5 ${themeOption.group === 'terminal' ? 'rounded-sm' : 'rounded-md'} ${tokens.hasGlass ? 'backdrop-blur-sm' : ''}`}
          style={{ background: tokens.surface, borderColor: tokens.border }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: tokens.accent }} />
          <span className="h-1 w-8 rounded-full opacity-60" style={{ background: tokens.mutedText }} />
        </div>
        <div className="grid grid-cols-[1fr_0.55fr] gap-2">
          <div className="space-y-1.5">
            <div className="h-2 w-3/4 rounded-full" style={{ background: tokens.labelText }} />
            <div className="h-1.5 w-full rounded-full opacity-55" style={{ background: tokens.mutedText }} />
            <div className="h-1.5 w-4/5 rounded-full opacity-55" style={{ background: tokens.mutedText }} />
          </div>
          <div
            className={`h-9 border ${themeOption.group === 'terminal' ? 'rounded-sm' : 'rounded-lg'}`}
            style={{ background: tokens.mutedSurface, borderColor: tokens.border }}
          />
        </div>
      </div>
      <div
        style={{
          backgroundColor: tokens.labelBackground,
          color: tokens.labelText
        }}
        className="flex min-h-10 items-center justify-between gap-2 border-t px-3 py-2"
      >
        <span data-testid="theme-gallery-label" className="min-w-0 truncate text-sm font-semibold">
          {themeOption.label}
        </span>
        {isSelected && (
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
            style={{ background: tokens.accent, color: tokens.labelBackground }}
          >
            <Check size={12} strokeWidth={3} />
          </span>
        )}
      </div>
    </button>
  );
}

function ThemeGalleryGroup({
  title,
  group,
  options,
  normalizedThemeChoice,
  setThemeChoice,
  collapsible = true
}) {
  const groupOptions = options.filter((themeOption) => themeOption.group === group);
  const containsSelectedTheme = groupOptions.some(
    (themeOption) => normalizedThemeChoice === themeOption.value
  );
  const cards = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {groupOptions.map((themeOption) => (
        <ThemeGalleryCard
          key={themeOption.value}
          themeOption={themeOption}
          isSelected={normalizedThemeChoice === themeOption.value}
          setThemeChoice={setThemeChoice}
        />
      ))}
    </div>
  );

  if (!collapsible) {
    return (
      <div data-testid={`theme-gallery-group-${group}`}>
        <h4 className="ui-eyebrow mb-2">{title}</h4>
        {cards}
      </div>
    );
  }

  return (
    <Collapsible.Root defaultOpen={containsSelectedTheme} data-testid={`theme-gallery-group-${group}`}>
      <Collapsible.Trigger className="ui-eyebrow ui-focus-ring mb-2 flex w-full items-center justify-between rounded-lg px-1 py-1 text-left hover:bg-[var(--ui-control)]">
        <span>{title}</span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className="transition-transform radix-state-closed:-rotate-90"
        />
      </Collapsible.Trigger>
      <Collapsible.Content>{cards}</Collapsible.Content>
    </Collapsible.Root>
  );
}

export function ThemeGallery({ options, normalizedThemeChoice, setThemeChoice }) {
  return (
    <div data-testid="theme-gallery" className="space-y-6">
      <ThemeGalleryGroup
        title="System"
        group="system"
        options={options}
        normalizedThemeChoice={normalizedThemeChoice}
        setThemeChoice={setThemeChoice}
        collapsible={false}
      />
      <ThemeGalleryGroup
        title="Light Themes"
        group="light"
        options={options}
        normalizedThemeChoice={normalizedThemeChoice}
        setThemeChoice={setThemeChoice}
      />
      <ThemeGalleryGroup
        title="Terminal Themes"
        group="terminal"
        options={options}
        normalizedThemeChoice={normalizedThemeChoice}
        setThemeChoice={setThemeChoice}
      />
      <ThemeGalleryGroup
        title="Dark Themes"
        group="dark"
        options={options}
        normalizedThemeChoice={normalizedThemeChoice}
        setThemeChoice={setThemeChoice}
      />
    </div>
  );
}
