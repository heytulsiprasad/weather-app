import type { SearchHistoryEntry, GroupedHistory } from "@/types/search-history";

const HISTORY_KEY = "weather_search_history";
const MAX_HISTORY_ITEMS = 50;

export function saveSearchToHistory(entry: Omit<SearchHistoryEntry, "id" | "timestamp">): void {
  if (typeof window === "undefined") return;

  const history = getSearchHistory();
  const newEntry: SearchHistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };

  const updatedHistory = [newEntry, ...history].slice(0, MAX_HISTORY_ITEMS);

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error("Failed to save search history:", error);
  }
}

export function getSearchHistory(): SearchHistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to retrieve search history:", error);
    return [];
  }
}

export function groupHistoryByDate(history: SearchHistoryEntry[]): GroupedHistory[] {
  const grouped = new Map<string, SearchHistoryEntry[]>();

  history.forEach((entry) => {
    const date = new Date(entry.timestamp);
    const dateKey = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(entry);
  });

  return Array.from(grouped.entries()).map(([date, entries]) => ({
    date,
    entries,
  }));
}

export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error("Failed to clear search history:", error);
  }
}
