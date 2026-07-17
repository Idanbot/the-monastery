import { forwardRef, type ComponentProps } from 'react';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { cn } from '../../lib/cn';
import { ThemedSurface } from './ThemedSurface';

type ThemedPortalSurfaceProps = ComponentProps<typeof ThemedSurface>;

/** Carries app-shell theme variables into surfaces mounted under document.body. */
export const ThemedPortalSurface = forwardRef<HTMLElement, ThemedPortalSurfaceProps>(
  ({ className, style, ...props }, ref) => {
    const { settings, isDarkMode, themeStyle, modalEffectStyle } = useSettingsContext();

    return (
      <ThemedSurface
        ref={ref}
        data-visual-theme={settings.visualTheme}
        data-animations-enabled={settings.animationsEnabled === false ? 'false' : 'true'}
        className={cn(isDarkMode && 'dark', className)}
        style={{ ...themeStyle, ...modalEffectStyle, ...style }}
        {...props}
      />
    );
  }
);

ThemedPortalSurface.displayName = 'ThemedPortalSurface';
