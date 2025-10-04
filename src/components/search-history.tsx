"use client";

import { useState } from "react";
import Image from "next/image";
import type { GroupedHistory, SearchHistoryEntry } from "@/types/search-history";

const formatTemperature = (celsius: number) => ({
  c: Math.round(celsius),
  f: Math.round((celsius * 9) / 5 + 32),
});

const iconUrl = (iconCode: string) =>
  `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

type SearchHistoryProps = {
  history: GroupedHistory[];
};

export function SearchHistory({ history }: SearchHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-2xl bg-slate-100 px-6 py-4 text-left transition hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
        aria-expanded={isOpen}
      >
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Recent Searches
        </h3>
        <svg
          className={`h-5 w-5 text-slate-600 transition-transform dark:text-slate-400 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          {history.map((group) => (
            <DateGroup key={group.date} date={group.date} entries={group.entries} />
          ))}
        </div>
      )}
    </div>
  );
}

type DateGroupProps = {
  date: string;
  entries: SearchHistoryEntry[];
};

function DateGroup({ date, entries }: DateGroupProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/50 dark:border-slate-700 dark:bg-slate-800/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-5 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/50"
        aria-expanded={isOpen}
      >
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {date}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {entries.length} {entries.length === 1 ? "search" : "searches"}
          </p>
        </div>
        <svg
          className={`h-4 w-4 text-slate-600 transition-transform dark:text-slate-400 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="space-y-3 border-t border-slate-200 p-4 dark:border-slate-700">
          {entries.map((entry) => (
            <HistoryEntry key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

type HistoryEntryProps = {
  entry: SearchHistoryEntry;
};

function HistoryEntry({ entry }: HistoryEntryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const time = new Date(entry.timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white/70 dark:border-slate-600 dark:bg-slate-800/70">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/50"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <Image
            src={iconUrl(entry.weather.icon)}
            alt={entry.weather.description}
            width={40}
            height={40}
            className="h-10 w-10"
          />
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {entry.city}
              {entry.country ? `, ${entry.country}` : ""}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{time}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {formatTemperature(entry.weather.temperature).c}°C
          </p>
          <svg
            className={`h-4 w-4 text-slate-600 transition-transform dark:text-slate-400 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-slate-200 p-4 dark:border-slate-600">
          <div className="space-y-3">
            <div className="rounded-xl bg-primary-light/40 p-4 dark:bg-slate-700/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-primary-dark dark:text-primary-light">
                    Temperature
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    {formatTemperature(entry.weather.temperature).c}°C
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Feels like {formatTemperature(entry.weather.feelsLike).c}°C · {entry.weather.description}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formatTemperature(entry.weather.temperature).f}°F · humidity {entry.weather.humidity}% · wind
                    {" "}
                    {Math.round(entry.weather.windSpeed)} m/s
                  </p>
                </div>
                <Image
                  src={iconUrl(entry.weather.icon)}
                  alt={entry.weather.description}
                  width={64}
                  height={64}
                  className="h-16 w-16"
                />
              </div>
            </div>

            {entry.forecast.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  Forecast
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {entry.forecast.map((forecast) => {
                    const temps = formatTemperature(forecast.temperature);
                    const date = new Date(forecast.dt * 1000);

                    return (
                      <div
                        key={forecast.dt}
                        className="rounded-xl border border-slate-200 bg-white/70 p-3 text-center dark:border-slate-600 dark:bg-slate-700/70"
                      >
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          {date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </p>
                        <Image
                          src={iconUrl(forecast.icon)}
                          alt={forecast.description}
                          width={32}
                          height={32}
                          className="mx-auto h-8 w-8"
                        />
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {temps.c}°C
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{temps.f}°F</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
