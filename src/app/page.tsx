import WeatherApp from "@/components/weather-app";
import { ThemeToggle } from "@/components/theme-toggle";
import { ColorThemeSelector } from "@/components/color-theme-selector";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[rgb(var(--color-primary-light))] via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-10 px-6 pb-12 pt-20 sm:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <header className="flex flex-col items-center text-center sm:items-start sm:text-left">
            <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-slate-600 shadow-sm dark:bg-slate-900/60 dark:text-slate-300">
              Weather App
            </span>
            <h1 className="mt-6 text-4xl font-semibold text-slate-900 dark:text-slate-50 sm:text-5xl">
              Check conditions anywhere in seconds
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-600 dark:text-slate-300">
              Search any city worldwide to see the current temperature, feel-like conditions, humidity, wind, and a quick look at the next few hours. Powered by OpenWeatherMap.
            </p>
          </header>

          <div className="flex flex-col gap-4 self-center sm:self-start">
            <ThemeToggle />
            <ColorThemeSelector />
          </div>
        </div>

        <WeatherApp />

        <footer className="text-center text-xs text-slate-500 dark:text-slate-400 sm:text-left">
          Data courtesy of OpenWeatherMap · Updated live when you search.
        </footer>
      </div>
    </main>
  );
}
