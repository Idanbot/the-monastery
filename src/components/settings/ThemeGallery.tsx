import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown } from 'lucide-react';
import { themeContracts } from '../../domain/themes';

function ThemeGalleryCard({ themeOption, isSelected, setThemeChoice }) {
  const contract = themeContracts[themeOption.visualTheme] || themeContracts.default;
  const lightTokens = contract.tokens.light;
  const darkTokens = contract.tokens.dark || contract.tokens.light;
  const tokens = themeOption.group === 'dark' || themeOption.group === 'terminal' ? darkTokens : lightTokens;
  const isSystem = themeOption.group === 'system';

  const bg1 = isSystem ? lightTokens.bg : tokens.bg;
  const bg2 = isSystem ? darkTokens.bg : tokens.accent;
  const labelBackground = tokens.bgColor || tokens.bg;
  const labelText = tokens.text;

  return (
    <button
      key={themeOption.value}
      type="button"
      aria-pressed={isSelected}
      data-testid="theme-gallery-card"
      data-theme-card={themeOption.visualTheme}
      onClick={() => setThemeChoice(themeOption.value)}
      className={`flex min-h-12 items-center gap-3 overflow-visible rounded-xl border p-2 px-3 text-left transition-[border-color,box-shadow,transform,background-color] duration-150 ease-out hover:-translate-y-[1px] ${
        isSelected
          ? 'border-indigo-500 shadow-sm ring-1 ring-indigo-500 bg-slate-50 dark:bg-slate-800/50'
          : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
      }`}
    >
      <div
        className={`h-5 w-5 shrink-0 border border-black/10 shadow-inner dark:border-white/10 overflow-hidden relative ${
          themeOption.group === 'terminal' ? 'rounded-sm' : 'rounded-full'
        }`}
      >
        <div className="absolute inset-0" style={{ background: bg1 }}></div>
        <div className="absolute inset-y-0 right-0 w-1/2" style={{ background: bg2 }}></div>
        {contract.features?.glass && (
          <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-[2px]"></div>
        )}
      </div>
      <span
        data-testid="theme-gallery-label"
        style={{
          backgroundColor: labelBackground,
          color: labelText
        }}
        className="min-w-0 flex-1 whitespace-normal break-words rounded-md px-2 py-0.5 text-sm font-medium leading-tight shadow-sm ring-1 ring-black/5 dark:ring-white/10"
      >
        {themeOption.label}
      </span>
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
  const cards = (
    <div className="grid grid-cols-1 gap-3">
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
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h4>
        {cards}
      </div>
    );
  }

  return (
    <Collapsible.Root defaultOpen data-testid={`theme-gallery-group-${group}`}>
      <Collapsible.Trigger className="mb-2 flex w-full items-center justify-between rounded-lg px-1 py-1 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
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
