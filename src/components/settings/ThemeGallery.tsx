import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown } from 'lucide-react';
import { themeContracts } from '../../domain/themes';

const colorChannels = (value) => {
  if (!value) return [255, 255, 255];
  const hex = String(value)
    .trim()
    .match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const full =
      hex[1].length === 3
        ? hex[1]
            .split('')
            .map((part) => part + part)
            .join('')
        : hex[1];
    return [
      Number.parseInt(full.slice(0, 2), 16),
      Number.parseInt(full.slice(2, 4), 16),
      Number.parseInt(full.slice(4, 6), 16)
    ];
  }
  const rgb = String(value).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : [255, 255, 255];
};

const isDarkColor = (value) => {
  const [red, green, blue] = colorChannels(value);
  return (red * 299 + green * 587 + blue * 114) / 1000 < 140;
};

function ThemeGalleryCard({ themeOption, isSelected, setThemeChoice }) {
  const contract = themeContracts[themeOption.visualTheme] || themeContracts.default;
  const lightTokens = contract.tokens.light;
  const darkTokens = contract.tokens.dark || contract.tokens.light;
  const tokens = themeOption.group === 'dark' || themeOption.group === 'terminal' ? darkTokens : lightTokens;
  const isSystem = themeOption.group === 'system';
  const darkCard = isSystem ? false : isDarkColor(tokens.bg);
  const labelStyle = darkCard
    ? { backgroundColor: 'rgb(15 23 42)', color: 'rgb(248 250 252)' }
    : { backgroundColor: 'rgb(255 255 255)', color: 'rgb(15 23 42)' };
  const cardBackground = isSystem
    ? `linear-gradient(135deg, ${lightTokens.bg} 50%, ${darkTokens.bg} 50%)`
    : tokens.bg;
  const previewBackground = isSystem
    ? `linear-gradient(135deg, ${lightTokens.surface} 50%, ${darkTokens.surface} 50%)`
    : tokens.surface;

  return (
    <button
      key={themeOption.value}
      type="button"
      aria-pressed={isSelected}
      data-testid="theme-gallery-card"
      data-theme-card={themeOption.visualTheme}
      onClick={() => setThemeChoice(themeOption.value)}
      className={`flex min-h-[4.75rem] items-center justify-between gap-3 overflow-hidden rounded-xl border-2 p-3 text-left contain-paint transition-[border-color,box-shadow,transform,background-color] duration-150 ease-out hover:-translate-y-0.5 ${
        isSelected
          ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500'
          : 'border-slate-200 hover:border-indigo-300 dark:border-slate-700 dark:hover:border-indigo-400'
      }`}
      style={{ background: cardBackground }}
    >
      <span
        data-testid="theme-gallery-label"
        className="min-w-0 flex-1 break-words rounded-md px-2.5 py-1 text-sm font-semibold leading-tight shadow-sm ring-1 ring-black/10"
        style={labelStyle}
      >
        {themeOption.label}
      </span>
      <div
        className="relative grid h-10 w-16 shrink-0 place-items-center overflow-hidden rounded-md border border-black/10 shadow-inner dark:border-white/10"
        style={{ background: previewBackground }}
      >
        <div className="flex gap-1.5">
          <div
            className="h-2.5 w-2.5 rounded-full shadow-sm"
            style={{ backgroundColor: tokens.accent }}
          ></div>
          <div
            className="h-2.5 w-2.5 rounded-full shadow-sm"
            style={{ backgroundColor: tokens.mutedText }}
          ></div>
        </div>
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
