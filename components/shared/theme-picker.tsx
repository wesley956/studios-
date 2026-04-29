import type { CSSProperties } from 'react';
import { THEME_OPTIONS, getThemePalette, type ThemeKey } from '@/lib/themes';
import { cn } from '@/lib/utils';

function ThemeSwatches({ themeKey }: { themeKey: ThemeKey }) {
  const palette = getThemePalette(themeKey);
  const heroStyle: CSSProperties = {
    background: `linear-gradient(135deg, ${palette.bg} 0%, ${palette.surfaceAlt} 48%, ${palette.primarySoft} 100%)`
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border" style={heroStyle}>
      <div className="flex h-20 items-end gap-2 p-3">
        <span className="h-10 flex-1 rounded-xl border border-white/25" style={{ backgroundColor: palette.primary }} />
        <span className="h-8 flex-1 rounded-xl border border-white/25" style={{ backgroundColor: palette.accent }} />
        <span className="h-6 flex-1 rounded-xl border border-white/25" style={{ backgroundColor: palette.surface }} />
      </div>
    </div>
  );
}

export function ThemeRadioGrid({
  name,
  defaultValue,
  className
}: {
  name: string;
  defaultValue?: string | null;
  className?: string;
}) {
  const selectedValue = (defaultValue || 'modern_neutral') as ThemeKey;

  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 xl:grid-cols-3', className)}>
      {THEME_OPTIONS.map((option) => {
        const palette = getThemePalette(option.value);

        return (
          <label key={option.value} className="group cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={option.value === selectedValue}
              className="peer sr-only"
            />

            <div className="h-full rounded-[1.35rem] border border-border bg-surface p-3 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-soft peer-checked:border-primary peer-checked:ring-2 peer-checked:ring-primary/25">
              <ThemeSwatches themeKey={option.value} />

              <div className="mt-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-text">{option.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{option.description}</p>
                </div>

                <span
                  className="mt-1 h-4 w-4 shrink-0 rounded-full border border-border"
                  style={{ backgroundColor: palette.primary }}
                />
              </div>

              <p className="mt-3 inline-flex rounded-full border border-border bg-[var(--theme-surface-alt)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                {option.group}
              </p>
            </div>
          </label>
        );
      })}
    </div>
  );
}
