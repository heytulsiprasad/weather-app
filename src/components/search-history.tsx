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

  // Get all available dates
  const availableDates = useMemo(() => {
    return history.map((group) => group.date);
  }, [history]);

  // Flatten all entries for filtering
  const allEntries = useMemo(() => {
    return history.flatMap((group) =>
      group.entries.map((entry) => ({
        ...entry,
        dateGroup: group.date,
      }))
    );
  }, [history]);

  // Filter entries based on search query and selected date
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

  // Group filtered entries by date
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
    <div className="mt-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-[rgb(var(--color-primary))]/80 to-[rgb(var(--color-primary-dark))]/80 px-6 py-4 text-left shadow-lg transition hover:from-[rgb(var(--color-primary))] hover:to-[rgb(var(--color-primary-dark))] dark:from-slate-800 dark:to-slate-900 dark:hover:from-slate-700 dark:hover:to-slate-800"
        aria-expanded={isOpen}
      >
        <div>
          <h3 className="text-base font-semibold text-white dark:text-slate-100">
            Recent Searches
          </h3>
          <p className="text-sm text-white/80 dark:text-slate-300">
            {totalSearches} {totalSearches === 1 ? "search" : "searches"} saved
          </p>
        </div>
        <svg
          className={`h-5 w-5 text-white transition-transform dark:text-slate-100 ${
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
        <div className="mt-4 space-y-6">
          {/* Search and Filter Controls */}
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Search Input */}
            <div className="flex-1">
              <label htmlFor="search-history" className="sr-only">
                Search by city
              </label>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  id="search-history"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by city name..."
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm transition focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Showing {filteredEntries.length} of {totalSearches}{" "}
              {filteredEntries.length === 1 ? "result" : "results"}
            </p>
            {(searchQuery || selectedDate !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedDate("all");
                }}
                className="text-sm text-[rgb(var(--color-primary))] hover:underline dark:text-[rgb(var(--color-primary-light))]"
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
                  <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    {group.date} ({group.entries.length})
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.entries.map((entry) => (
                      <HistoryCard key={entry.id} entry={entry} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
              <svg
                className="mx-auto h-12 w-12 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                No searches found
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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
};

function HistoryCard({ entry }: HistoryCardProps) {
  const [showForecast, setShowForecast] = useState(false);
  const time = new Date(entry.timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-md backdrop-blur transition hover:shadow-xl dark:border-slate-700 dark:bg-slate-800/80">
      {/* Main Card Content */}
      <div className="p-5">
        {/* Header with Icon and Location */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h5 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {entry.city}
              {entry.country && (
                <span className="text-slate-500 dark:text-slate-400">
                  , {entry.country}
                </span>
              )}
            </h5>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {time}
            </p>
          </div>
          <Image
            src={iconUrl(entry.weather.icon)}
            alt={entry.weather.description}
            width={56}
            height={56}
            className="h-14 w-14"
          />
        </div>

        {/* Temperature Display */}
        <div className="mt-4 rounded-xl bg-gradient-to-br from-[rgb(var(--color-primary-light))]/40 to-[rgb(var(--color-primary))]/20 p-4 dark:from-slate-700/40 dark:to-slate-600/20">
          <p className="text-xs uppercase tracking-wide text-[rgb(var(--color-primary-dark))] dark:text-[rgb(var(--color-primary-light))]">
            Temperature
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              {formatTemperature(entry.weather.temperature).c}°C
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {formatTemperature(entry.weather.temperature).f}°F
            </p>
          </div>
          <p className="mt-2 text-sm capitalize text-slate-700 dark:text-slate-200">
            {entry.weather.description}
          </p>
        </div>

        {/* Weather Details */}
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-700/50">
            <p className="text-xs text-slate-500 dark:text-slate-400">Feels</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {formatTemperature(entry.weather.feelsLike).c}°C
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-700/50">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Humidity
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {entry.weather.humidity}%
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-700/50">
            <p className="text-xs text-slate-500 dark:text-slate-400">Wind</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {Math.round(entry.weather.windSpeed)}m/s
            </p>
          </div>
        </div>

        {/* Show Forecast Button */}
        {entry.forecast.length > 0 && (
          <button
            onClick={() => setShowForecast(!showForecast)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            {showForecast ? "Hide" : "View"} Forecast
            <svg
              className={`h-4 w-4 transition-transform ${
                showForecast ? "rotate-180" : ""
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
        )}
      </div>

      {/* Expandable Forecast Section */}
      {showForecast && entry.forecast.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            Next Hours
          </p>
          <div className="grid grid-cols-5 gap-2">
            {entry.forecast.map((forecast) => {
              const temps = formatTemperature(forecast.temperature);
              const date = new Date(forecast.dt * 1000);

              return (
                <div
                  key={forecast.dt}
                  className="flex flex-col items-center rounded-lg bg-white p-2 dark:bg-slate-800"
                >
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {date.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <Image
                    src={iconUrl(forecast.icon)}
                    alt={forecast.description}
                    width={32}
                    height={32}
                    className="my-1 h-8 w-8"
                  />
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {temps.c}°C
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
