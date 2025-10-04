export type SearchHistoryEntry = {
  id: string;
  timestamp: number;
  city: string;
  country?: string;
  weather: {
    temperature: number;
    feelsLike: number;
    description: string;
    humidity: number;
    windSpeed: number;
    icon: string;
  };
  forecast: Array<{
    dt: number;
    temperature: number;
    description: string;
    icon: string;
  }>;
};

export type GroupedHistory = {
  date: string;
  entries: SearchHistoryEntry[];
};
