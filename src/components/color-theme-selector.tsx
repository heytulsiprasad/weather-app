'use client';

import { useTheme } from '@/contexts/theme-context';

const colors = [
  { name: 'blue', label: 'Blue', class: 'bg-sky-500' },
  { name: 'green', label: 'Green', class: 'bg-green-500' },
  { name: 'rose', label: 'Rose', class: 'bg-rose-500' },
  { name: 'amber', label: 'Amber', class: 'bg-amber-500' },
  { name: 'violet', label: 'Violet', class: 'bg-violet-500' },
] as const;

export function ColorThemeSelector() {
  const { accentColor, setAccentColor } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Theme:</span>
      <div className="flex items-center gap-2">
        {colors.map((color) => (
          <button
            key={color.name}
            onClick={() => setAccentColor(color.name)}
            className={`w-8 h-8 rounded-full ${color.class} transition-all ${
              accentColor === color.name
                ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 ring-offset-white dark:ring-offset-slate-900 scale-110'
                : 'hover:scale-105 opacity-70 hover:opacity-100'
            }`}
            aria-label={`${color.label} theme`}
            title={`${color.label} theme`}
          />
        ))}
      </div>
    </div>
  );
}
