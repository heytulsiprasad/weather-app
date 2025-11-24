"use client";

import { useState, useMemo } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("all");

  const availableDates = useMemo(() => {
    return history.map((group) => group.date);
  }, [history]);

  const allEntries = useMemo(() => {
    return history.flatMap((group) =>
      group.entries.map((entry) => ({
        ...entry,
        dateGroup: group.date,
      }))
    );
  }, [history]);

  const filteredEntries = useMemo(() => {
    return allEntries.filter((entry) => {
      const matchesSearch = entry.city
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesDate =
        selectedDate === "all" || entry.dateGroup === selectedDate;
      return matchesSearch && matchesDate;
    });
  }, [allEntries, searchQuery, selectedDate]);

  const groupedFilteredEntries = useMemo(() => {
    const groups: { [key: string]: typeof filteredEntries } = {};
    filteredEntries.forEach((entry) => {
      if (!groups[entry.dateGroup]) {
        groups[entry.dateGroup] = [];
      }
      groups[entry.dateGroup].push(entry);
    });
    return Object.entries(groups).map(([date, entries]) => ({ date, entries }));
  }, [filteredEntries]);

  const totalSearches = allEntries.length;

  return (
    <div className="glass-card rounded-3xl p-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex w-full items-center justify-between"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <svg
            className="h-5 w-5 text-[rgb(var(--color-primary))]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-left">
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              Search History
            </h3>
            <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
              {totalSearches} {totalSearches === 1 ? "search" : "searches"} recorded
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-sm text-slate-500 group-hover:text-[rgb(var(--color-primary))] dark:text-slate-400 sm:inline">
            {isOpen ? "Hide" : "Show"}
          </span>
          <svg
            className={`h-5 w-5 text-slate-500 transition-all duration-300 group-hover:text-[rgb(var(--color-primary))] dark:text-slate-400 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="mt-8 space-y-6">
          {/* Search and Filter Controls */}
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Search Input */}
            <div className="flex-1">
              <label htmlFor="search-history" className="sr-only">
                Search by city
              </label>
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  id="search-history"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by city..."
                  className="w-full rounded-2xl border-2 border-slate-200/60 bg-white/60 py-3 pl-11 pr-4 font-body text-sm text-slate-900 placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:border-[rgb(var(--color-primary))] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[rgb(var(--color-primary))]/10 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
            </div>

            {/* Date Filter */}
            <div className="sm:w-64">
              <label htmlFor="date-filter" className="sr-only">
                Filter by date
              </label>
              <select
                id="date-filter"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-200/60 bg-white/60 px-4 py-3 font-body text-sm text-slate-900 backdrop-blur-sm transition-all duration-300 focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-4 focus:ring-[rgb(var(--color-primary))]/10 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-100"
              >
                <option value="all">All Dates</option>
                {availableDates.map((date) => (
                  <option key={date} value={date}>
                    {date}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
              {filteredEntries.length} of {totalSearches}{" "}
              {filteredEntries.length === 1 ? "result" : "results"}
            </p>
            {(searchQuery || selectedDate !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedDate("all");
                }}
                className="font-body text-sm font-medium text-[rgb(var(--color-primary))] transition-colors hover:text-[rgb(var(--color-primary-dark))] dark:text-[rgb(var(--color-primary-light))]"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Grid Display */}
          {filteredEntries.length > 0 ? (
            <div className="space-y-6">
              {groupedFilteredEntries.map((group) => (
                <div key={group.date}>
                  <h4 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <div className="h-1 w-1 rounded-full bg-[rgb(var(--color-primary))]" />
                    {group.date}
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      ({group.entries.length})
                    </span>
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.entries.map((entry, index) => (
                      <HistoryCard key={entry.id} entry={entry} index={index} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-200/60 bg-slate-50/50 p-12 text-center backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/30">
              <svg
                className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-4 font-body text-sm font-medium text-slate-600 dark:text-slate-400">
                No searches found
              </p>
              <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-500">
                Try adjusting your filters
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type HistoryCardProps = {
  entry: SearchHistoryEntry;
  index: number;
};

function HistoryCard({ entry, index }: HistoryCardProps) {
  const [showForecast, setShowForecast] = useState(false);
  const time = new Date(entry.timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      className="glass-card-hover group overflow-hidden rounded-2xl border-2 border-slate-200/60 bg-white/60 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/60"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Main Card Content */}
      <div className="p-6">
        {/* Header with Icon and Location */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h5 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              {entry.city}
            </h5>
            {entry.country && (
              <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                {entry.country}
              </p>
            )}
            <p className="mt-2 font-mono text-xs text-slate-400 dark:text-slate-500">
              {time}
            </p>
          </div>
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-[rgb(var(--color-primary))]/10 blur-xl" />
            <Image
              src={iconUrl(entry.weather.icon)}
              alt={entry.weather.description}
              width={56}
              height={56}
              className="relative h-14 w-14"
              unoptimized
            />
          </div>
        </div>

        {/* Temperature Display */}
        <div className="mt-5 space-y-2 rounded-2xl bg-gradient-to-br from-[rgb(var(--color-primary))]/5 to-transparent p-4">
          <div className="flex items-baseline gap-2">
            <p className="font-display text-4xl font-semibold text-slate-900 dark:text-white">
              {formatTemperature(entry.weather.temperature).c}°
            </p>
            <span className="font-mono text-sm text-slate-500 dark:text-slate-400">
              {formatTemperature(entry.weather.temperature).f}°F
            </span>
          </div>
          <p className="font-body text-sm capitalize text-slate-600 dark:text-slate-300">
            {entry.weather.description}
          </p>
        </div>

        {/* Weather Details */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/60 p-3 text-center backdrop-blur-sm dark:bg-slate-800/60">
            <p className="font-mono text-xs text-slate-500 dark:text-slate-400">Feels</p>
            <p className="mt-1 font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              {formatTemperature(entry.weather.feelsLike).c}°
            </p>
          </div>
          <div className="rounded-xl bg-white/60 p-3 text-center backdrop-blur-sm dark:bg-slate-800/60">
            <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
              Humid
            </p>
            <p className="mt-1 font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              {entry.weather.humidity}%
            </p>
          </div>
          <div className="rounded-xl bg-white/60 p-3 text-center backdrop-blur-sm dark:bg-slate-800/60">
            <p className="font-mono text-xs text-slate-500 dark:text-slate-400">Wind</p>
            <p className="mt-1 font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              {Math.round(entry.weather.windSpeed)}
            </p>
          </div>
        </div>

        {/* Show Forecast Button */}
        {entry.forecast.length > 0 && (
          <button
            onClick={() => setShowForecast(!showForecast)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200/60 bg-white/40 px-4 py-2.5 font-body text-sm font-medium text-slate-700 backdrop-blur-sm transition-all duration-300 hover:border-[rgb(var(--color-primary))]/60 hover:bg-[rgb(var(--color-primary))]/5 dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:bg-[rgb(var(--color-primary))]/10"
          >
            {showForecast ? "Hide" : "View"} Forecast
            <svg
              className={`h-4 w-4 transition-transform duration-300 ${
                showForecast ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Expandable Forecast Section */}
      {showForecast && entry.forecast.length > 0 && (
        <div className="border-t-2 border-slate-200/60 bg-slate-50/50 p-4 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-950/50">
          <p className="mb-3 flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
            <div className="h-1 w-1 rounded-full bg-[rgb(var(--color-primary))]" />
            Next Hours
          </p>
          <div className="grid grid-cols-5 gap-2">
            {entry.forecast.map((forecast) => {
              const temps = formatTemperature(forecast.temperature);
              const date = new Date(forecast.dt * 1000);

              return (
                <div
                  key={forecast.dt}
                  className="flex flex-col items-center rounded-xl bg-white/60 p-2 backdrop-blur-sm transition-transform hover:scale-105 dark:bg-slate-900/60"
                >
                  <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
                    {date.toLocaleTimeString([], {
                      hour: "numeric",
                    })}
                  </p>
                  <Image
                    src={iconUrl(forecast.icon)}
                    alt={forecast.description}
                    width={32}
                    height={32}
                    className="my-1 h-8 w-8"
                    unoptimized
                  />
                  <p className="font-display text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {temps.c}°
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
