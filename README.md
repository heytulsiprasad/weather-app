# SkySnap Weather

A minimal Next.js + Tailwind CSS app that lets you search any city and instantly see the current conditions plus the next few hours of forecast data from OpenWeatherMap.

## Features

- 🌤️ Real-time weather data from OpenWeatherMap
- 📍 Search any city worldwide
- 🌡️ Dual temperature display (Celsius & Fahrenheit)
- ⏰ 5-hour forecast with 3-hour intervals
- 🎨 Modern UI with Tailwind CSS v4
- 🌙 Dark mode support
- 📱 Fully responsive design

## Prerequisites

- Node.js 18+
- An OpenWeatherMap API key (free tier works)

## Getting an OpenWeatherMap API Key

1. Visit [https://home.openweathermap.org/users/sign_up](https://home.openweathermap.org/users/sign_up) and create a free account.
2. Verify your email address, then open the **API keys** tab in your account dashboard.
3. Use the default key or create a new one; copy the generated value. Keys may take up to two hours to activate—requests can return `401` until then.

## Local Setup

```bash
npm install
```

Create a `.env.local` at the project root:

```bash
OPENWEATHER_API_KEY=your_api_key_here
```

## Development

```bash
npm run dev
```

Open http://localhost:3000 to use the app. Searches call a Next.js API route (`/api/weather`) that proxies OpenWeatherMap, so your key stays on the server.

## Linting

```bash
npm run lint
```

## Deployment Notes

- Set the `OPENWEATHER_API_KEY` environment variable in your hosting provider.
- The app only requests metric units from OpenWeatherMap and converts to Fahrenheit for display; adjust the API call if you prefer imperial units by default.
