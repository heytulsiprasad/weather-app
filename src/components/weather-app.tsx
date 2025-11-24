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
import TemperatureChart from "./temperature-chart";

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
    } else {
      setFavorites([]);
    }
  }, [user]);

  const handleLogin = async () => {
    if (!auth) {
      setError("Sign-in is unavailable because Firebase is not configured.");
      return;
    }

    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sign in";
      setError(errorMessage);
      console.error("Error signing in with Google", error);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;

    try {
      await signOut(auth);
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sign out";
      setError(errorMessage);
      console.error("Error signing out", error);
    }
  };

  const handleSaveFavorite = async () => {
    if (user && weather) {
      const isAlreadyFavorite = favorites.some(
        (fav) => fav.city.toLowerCase() === weather.location.city.toLowerCase()
      );
      if (isAlreadyFavorite) return;
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
    <div className="space-y-6">
      {/* Authentication Card */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div className="font-mono text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {user ? `Signed in as ${user.email}` : "Guest Mode"}
          </div>
          {user ? (
            <button
              onClick={handleLogout}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-red-500 to-red-600 px-5 py-2.5 font-body text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-red-500/25 active:scale-95"
            >
              <span className="relative z-10">Sign Out</span>
              <div className="absolute inset-0 bg-gradient-to-b from-red-400 to-red-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-dark))] px-5 py-2.5 font-body text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-[rgb(var(--color-primary))]/25 active:scale-95"
            >
              <span className="relative z-10">Sign in with Google</span>
              <div className="absolute inset-0 bg-gradient-to-b from-[rgb(var(--color-primary-light))] to-[rgb(var(--color-primary))] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </button>
          )}
        </div>
      </div>

      {/* Search Card */}
      <div className="glass-card rounded-3xl p-8">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 sm:flex-row sm:items-stretch"
          aria-label="Search weather by city"
        >
          <label className="sr-only" htmlFor="city">
            City
          </label>
          <div className="relative flex-1">
            <input
              id="city"
              name="city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Search city..."
              className="w-full rounded-2xl border-2 border-slate-200/60 bg-white/60 px-6 py-4 font-body text-base text-slate-900 placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:border-[rgb(var(--color-primary))] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[rgb(var(--color-primary))]/10 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:bg-slate-900"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <svg
                className="h-5 w-5 text-slate-400"
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
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleUseLocation}
              className="group flex items-center justify-center gap-2 rounded-2xl border-2 border-[rgb(var(--color-primary))] bg-white/60 px-5 py-4 font-body text-sm font-semibold text-[rgb(var(--color-primary))] backdrop-blur-sm transition-all duration-300 hover:bg-[rgb(var(--color-primary))] hover:text-white hover:shadow-lg hover:shadow-[rgb(var(--color-primary))]/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900/60 dark:hover:bg-[rgb(var(--color-primary))]"
              disabled={isLocating || isLoading}
              title="Use your current location"
              aria-label="Use current location"
            >
              {isLocating ? (
                <>
                  <svg
                    className="h-5 w-5 animate-spin"
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
                    className="h-5 w-5"
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
                  <span className="hidden sm:inline">Location</span>
                </>
              )}
            </button>
            <button
              type="submit"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-dark))] px-8 py-4 font-body text-base font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-[rgb(var(--color-primary))]/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading || isLocating}
            >
              <span className="relative z-10">
                {isLoading ? "Searching..." : "Search"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-b from-[rgb(var(--color-primary-light))] to-[rgb(var(--color-primary))] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </button>
          </div>
        </form>
      </div>

      {/* Favorites */}
      {user && favorites.length > 0 && (
        <div className="glass-card rounded-3xl p-8">
          <div className="mb-6 flex items-center gap-3">
            <svg
              className="h-5 w-5 text-[rgb(var(--color-primary))]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              Favorite Locations
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {favorites.map((fav, index) => (
              <div
                key={fav.id}
                className="group relative overflow-hidden rounded-2xl border-2 border-slate-200/60 bg-white/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-[rgb(var(--color-primary))]/60 hover:shadow-lg dark:border-slate-700/60 dark:bg-slate-900/60"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <button
                  onClick={() => handleFavoriteClick(fav)}
                  className="w-full text-center"
                >
                  <p className="font-body text-sm font-semibold text-slate-900 transition-colors group-hover:text-[rgb(var(--color-primary))] dark:text-slate-100">
                    {fav.city}
                  </p>
                  <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {fav.country}
                  </p>
                </button>
                <button
                  onClick={() => handleRemoveFavorite(fav.id)}
                  className="absolute right-2 top-2 rounded-lg bg-red-500/10 p-1.5 text-red-600 opacity-0 transition-all hover:bg-red-500/20 group-hover:opacity-100 dark:text-red-400"
                  title="Remove from favorites"
                >
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="glass-card rounded-2xl border-2 border-red-300/60 bg-red-50/80 p-5 backdrop-blur-sm dark:border-red-900/60 dark:bg-red-950/40">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="font-body text-sm leading-relaxed text-red-800 dark:text-red-200">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Weather Display */}
      {weather && (
        <div className="space-y-6">
          {/* Current Weather - Hero Card */}
          <div className="glass-card relative overflow-hidden rounded-3xl p-8 sm:p-10">
            {/* Decorative gradient overlay */}
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                background: `radial-gradient(circle at 100% 0%, rgb(var(--color-primary)), transparent 60%)`
              }}
            />

            <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-[rgb(var(--color-primary))]" />
                  <p className="font-mono text-sm font-medium uppercase tracking-widest text-[rgb(var(--color-primary))]">
                    {weather.location.city}
                    {weather.location.country && `, ${weather.location.country}`}
                  </p>
                </div>
                <div className="flex items-baseline gap-2">
                  <h2 className="font-display text-7xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-8xl">
                    {formatTemperature(weather.current.temperature).c}°
                  </h2>
                  <span className="font-mono text-2xl text-slate-500 dark:text-slate-400">C</span>
                </div>
                <div className="space-y-2">
                  <p className="font-body text-lg capitalize text-slate-600 dark:text-slate-300">
                    {weather.current.description}
                  </p>
                  <p className="font-body text-sm text-slate-500 dark:text-slate-400">
                    Feels like {formatTemperature(weather.current.feelsLike).c}°C
                    {" · "}
                    {formatTemperature(weather.current.temperature).f}°F
                  </p>
                </div>
                {/* Weather metrics */}
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2 rounded-xl bg-white/60 px-4 py-2 backdrop-blur-sm dark:bg-slate-900/60">
                    <svg className="h-4 w-4 text-[rgb(var(--color-primary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                    <span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
                      {weather.current.humidity}% humidity
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-white/60 px-4 py-2 backdrop-blur-sm dark:bg-slate-900/60">
                    <svg className="h-4 w-4 text-[rgb(var(--color-primary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
                      {Math.round(weather.current.windSpeed)} m/s wind
                    </span>
                  </div>
                </div>
              </div>

              {/* Weather Icon & Actions */}
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse rounded-full bg-[rgb(var(--color-primary))]/20 blur-2xl" />
                  <Image
                    src={iconUrl(weather.current.icon)}
                    alt={weather.current.description}
                    width={128}
                    height={128}
                    className="relative h-32 w-32"
                    priority
                    unoptimized
                  />
                </div>
                {user && (
                  <button
                    onClick={handleSaveFavorite}
                    disabled={favorites.some(
                      (fav) => fav.city.toLowerCase() === weather?.location.city.toLowerCase()
                    )}
                    className="group flex items-center gap-2 rounded-2xl border-2 border-[rgb(var(--color-primary))]/30 bg-white/60 px-5 py-2.5 font-body text-sm font-semibold text-[rgb(var(--color-primary))] backdrop-blur-sm transition-all duration-300 hover:border-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))] hover:text-white hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900/60"
                  >
                    <svg className="h-4 w-4" fill={favorites.some((fav) => fav.city.toLowerCase() === weather?.location.city.toLowerCase()) ? "currentColor" : "none"} viewBox="0 0 20 20" stroke="currentColor" strokeWidth="2">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {favorites.some(
                      (fav) => fav.city.toLowerCase() === weather?.location.city.toLowerCase()
                    )
                      ? "Saved"
                      : "Add to Favorites"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Temperature Chart & Forecast */}
          {weather.forecast.length > 0 && (
            <>
              <div className="glass-card rounded-3xl p-8">
                <div className="mb-6 flex items-center gap-3">
                  <svg className="h-5 w-5 text-[rgb(var(--color-primary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                    Temperature Trend
                  </h3>
                </div>
                <TemperatureChart forecast={weather.forecast} />
              </div>

              <div className="glass-card rounded-3xl p-8">
                <div className="mb-6 flex items-center gap-3">
                  <svg className="h-5 w-5 text-[rgb(var(--color-primary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                    Hourly Forecast
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {weather.forecast.map((entry, index) => {
                    const temps = formatTemperature(entry.temperature);
                    const date = new Date(entry.dt * 1000);

                    return (
                      <div
                        key={entry.dt}
                        className="glass-card-hover group rounded-2xl border-2 border-slate-200/60 bg-white/60 p-5 text-center backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/60"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <p className="font-mono text-xs font-medium text-slate-500 dark:text-slate-400">
                          {date.toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                        <Image
                          src={iconUrl(entry.icon)}
                          alt={entry.description}
                          width={64}
                          height={64}
                          className="mx-auto my-3 h-16 w-16 transition-transform duration-300 group-hover:scale-110"
                          unoptimized
                        />
                        <p className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
                          {temps.c}°
                        </p>
                        <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                          {temps.f}°F
                        </p>
                        <p className="mt-2 font-body text-xs capitalize leading-snug text-slate-600 dark:text-slate-400">
                          {entry.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Search History */}
      {history.length > 0 && (
        <div className="opacity-0 animate-fade-in-up stagger-4">
          <SearchHistory history={history} />
        </div>
      )}
    </div>
  );
}
