import WeatherApp from "@/components/weather-app";
import { ThemeToggle } from "@/components/theme-toggle";
import { ColorThemeSelector } from "@/components/color-theme-selector";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Atmospheric gradient background */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(circle at 20% 20%, var(--gradient-sky-start) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, var(--gradient-sky-mid) 0%, transparent 50%),
            radial-gradient(circle at 40% 90%, var(--gradient-sky-end) 0%, transparent 40%),
            var(--background)
          `
        }}
      />

      {/* Subtle noise texture */}
      <div className="noise-overlay" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 pb-16 pt-12 sm:px-10 lg:pt-20">
        {/* Header with controls */}
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <header className="flex flex-col opacity-0 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 self-start">
              <div className="h-1 w-1 rounded-full bg-[rgb(var(--color-primary))]" />
              <span className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Meteorology Lab
              </span>
            </div>
            <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-6xl lg:text-7xl">
              Weather
              <span className="block text-[rgb(var(--color-primary))]">Intelligence</span>
            </h1>
            <p className="mt-6 max-w-xl font-body text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
              Real-time atmospheric data and forecasting powered by advanced meteorological systems.
              Search any location worldwide.
            </p>
          </header>

          <div className="flex flex-row gap-3 self-start opacity-0 animate-fade-in-up stagger-1 sm:flex-col">
            <ThemeToggle />
            <ColorThemeSelector />
          </div>
        </div>

        {/* Weather app */}
        <div className="opacity-0 animate-fade-in-up stagger-2">
          <WeatherApp />
        </div>

        {/* Footer */}
        <footer className="mt-auto text-center font-mono text-xs text-slate-400 opacity-0 animate-fade-in stagger-3 sm:text-left dark:text-slate-500">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span>Powered by OpenWeatherMap API</span>
            <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span>Live data</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
