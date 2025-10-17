
"use client";

import Image from "next/image";
import { FormEvent, useState, useEffect } from "react";
import {
  saveSearchToHistory,
  getSearchHistory,
  groupHistoryByDate,
} from "@/lib/search-history";
import type { GroupedHistory } from "@/types/search-history";
import { SearchHistory } from "./search-history";
import { useAuth } from "@/contexts/auth-context";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  addFavorite,
  getFavorites,
  removeFavorite,
  Favorite,
} from "@/lib/firestore";

type WeatherSummary = {
  location: {
    city: string;
    country?: string;
  };
  current: {
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

const formatTemperature = (celsius: number) => ({
  c: Math.round(celsius),
  f: Math.round((celsius * 9) / 5 + 32),
});

const iconUrl = (iconCode: string) =>
  `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

const playSearchSound = () => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const audioContext = new AudioContextClass();

    const playTone = (
      frequency: number,
      startTime: number,
      duration: number
    ) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        startTime + duration
      );

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = audioContext.currentTime;
    playTone(800, now, 0.15);
    playTone(600, now + 0.1, 0.2);
  } catch (err) {
    console.debug("Audio playback not available:", err);
  }
};

export default function WeatherApp() {
  const [city, setCity] = useState("New York");
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [history, setHistory] = useState<GroupedHistory[]>([]);
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  useEffect(() => {
    if (user) {
      getFavorites(user.uid).then(setFavorites);
    }
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const handleSaveFavorite = async () => {
    if (user && weather) {
      const newFavorite = await addFavorite(
        user.uid,
        weather.location.city,
        weather.location.country || ""
      );
      setFavorites([...favorites, newFavorite]);
    }
  };

  const handleRemoveFavorite = async (favoriteId: string) => {
    if (user) {
      await removeFavorite(user.uid, favoriteId);
      setFavorites(favorites.filter((fav) => fav.id !== favoriteId));
    }
  };

  const fetchWeatherByCity = async (cityName: string) => {
    playSearchSound();

    const trimmed = cityName.trim();

    if (!trimmed) {
      setError("Enter a city to get the forecast.");
      setWeather(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/weather?city=${encodeURIComponent(trimmed)}`
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          payload?.error ?? "Unable to retrieve weather right now."
        );
      }

      const payload: WeatherSummary = await response.json();
      setWeather(payload);

      saveSearchToHistory({
        city: payload.location.city,
        country: payload.location.country,
        weather: payload.current,
        forecast: payload.forecast,
      });

      const updatedHistory = getSearchHistory();
      setHistory(groupHistoryByDate(updatedHistory));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error.";
      setError(message);
      setWeather(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavoriteClick = (favorite: Favorite) => {
    setCity(favorite.city);
    fetchWeatherByCity(favorite.city);
  };

  useEffect(() => {
    const loadedHistory = getSearchHistory();
    setHistory(groupHistoryByDate(loadedHistory));
  }, []);

  const fetchWeatherByCoords = async (latitude: number, longitude: number) => {
    setIsLocating(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/weather?lat=${latitude}&lon=${longitude}`
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          payload?.error ?? "Unable to retrieve weather for your location."
        );
      }

      const payload: WeatherSummary = await response.json();
      setWeather(payload);
      setCity(payload.location.city);

      saveSearchToHistory({
        city: payload.location.city,
        country: payload.location.country,
        weather: payload.current,
        forecast: payload.forecast,
      });

      const updatedHistory = getSearchHistory();
      setHistory(groupHistoryByDate(updatedHistory));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error.";
      setError(message);
      setWeather(null);
    } finally {
      setIsLocating(false);
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeatherByCoords(
          position.coords.latitude,
          position.coords.longitude
        );
      },
      (err) => {
        setIsLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError(
              "Location permission denied. Please enable location access."
            );
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location information unavailable.");
            break;
          case err.TIMEOUT:
            setError("Location request timed out.");
            break;
          default:
            setError("Unable to get your location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    fetchWeatherByCity(city);
  };

  return (
    <section className="w-full rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur dark:bg-slate-900/70 sm:p-10">
      <div className="flex justify-end mb-4">
        {user ? (
          <div className="flex items-center gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Welcome, {user.email}
            </p>
            <button
              onClick={handleLogout}
              className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/20 focus-visible:ring-offset-2"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="rounded-2xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2"
          >
            Login with Google
          </button>
        )}
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 sm:flex-row sm:items-center"
        aria-label="Search weather by city"
      >
        <label className="sr-only" htmlFor="city">
          City
        </label>
        <input
          id="city"
          name="city"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="Try San Francisco, Tokyo, Paris..."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm transition focus:border-[rgb(var(--color-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <div className="flex gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleUseLocation}
            className="flex items-center justify-center rounded-2xl border-2 border-[rgb(var(--color-primary))] bg-white px-4 py-3 text-base font-semibold text-[rgb(var(--color-primary))] transition hover:bg-[rgb(var(--color-primary))]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--color-primary))] dark:border-[rgb(var(--color-primary-light))] dark:bg-slate-800 dark:text-[rgb(var(--color-primary-light))] dark:hover:bg-[rgb(var(--color-primary-light))]/10"
            disabled={isLocating || isLoading}
            title="Use your current location"
            aria-label="Use current location"
          >
            {isLocating ? (
              <>
                <svg
                  className="mr-2 h-5 w-5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="hidden sm:inline">Locating...</span>
              </>
            ) : (
              <>
                <svg
                  className="h-5 w-5 sm:mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="hidden sm:inline">Current Location</span>
              </>
            )}
          </button>
          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-2xl bg-[rgb(var(--color-primary))] px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[rgb(var(--color-primary-dark))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary))]/20 focus-visible:ring-offset-2 disabled:opacity-50 sm:w-auto"
            disabled={isLoading || isLocating}
          >
            {isLoading ? "Loading…" : "Get weather"}
          </button>
        </div>
      </form>

      {user && favorites.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            Favorite Locations
          </h3>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {favorites.map((fav) => (
              <li
                key={fav.id}
                className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800/70"
              >
                <button
                  onClick={() => handleFavoriteClick(fav)}
                  className="text-base font-semibold text-slate-800 dark:text-slate-100"
                >
                  {fav.city}
                </button>
                <button
                  onClick={() => handleRemoveFavorite(fav.id)}
                  className="mt-2 text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error ? (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {weather ? (
        <div className="mt-8 space-y-8">
          <div className="flex flex-col gap-6 rounded-3xl bg-[rgb(var(--color-primary-light))]/60 p-6 dark:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-[rgb(var(--color-primary-dark))] dark:text-[rgb(var(--color-primary-light))]">
                {weather.location.city}
                {weather.location.country
                  ? `, ${weather.location.country}`
                  : ""}
              </p>
              <h2 className="mt-2 text-4xl font-semibold text-slate-900 dark:text-slate-50">
                {formatTemperature(weather.current.temperature).c}°C
              </h2>
              <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
                Feels like {formatTemperature(weather.current.feelsLike).c}
                °C · {weather.current.description}
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {formatTemperature(weather.current.temperature).f}°F ·
                humidity {weather.current.humidity}% · wind{" "}
                {Math.round(weather.current.windSpeed)} m/s
              </p>
            </div>
            <div className="flex flex-col items-center sm:flex-row sm:gap-4">
              <Image
                src={iconUrl(weather.current.icon)}
                alt={weather.current.description}
                width={96}
                height={96}
                className="h-24 w-24"
                priority
              />
              {user && (
                <button
                  onClick={handleSaveFavorite}
                  className="rounded-2xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2"
                >
                  Save to Favorites
                </button>
              )}
            </div>
          </div>

          {weather.forecast.length ? (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Next Hours
              </h3>
              <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
                {weather.forecast.map((entry) => {
                  const temps = formatTemperature(entry.temperature);
                  const date = new Date(entry.dt * 1000);

                  return (
                    <li
                      key={entry.dt}
                      className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800/70"
                    >
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {date.toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                      <Image
                        src={iconUrl(entry.icon)}
                        alt={entry.description}
                        width={48}
                        height={48}
                        className="mx-auto h-12 w-12"
                      />
                      <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
                        {temps.c}°C
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {temps.f}°F
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {entry.description}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {history.length > 0 && <SearchHistory history={history} />}
    </section>
  );
}
