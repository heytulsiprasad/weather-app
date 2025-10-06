# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SkySnap Weather is a Next.js 15 weather app using React 19, TypeScript, and Tailwind CSS v4. The app allows users to search for any city and displays current weather conditions plus a 5-hour forecast using the OpenWeatherMap API.

## Common Commands

```bash
# Development (uses Turbopack)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint codebase
npm run lint
```

The dev server runs at http://localhost:3000.

## Architecture

### API Route Pattern
- **Server-side proxy**: [src/app/api/weather/route.ts](src/app/api/weather/route.ts) acts as a proxy to OpenWeatherMap to keep the API key secure
- Fetches both current weather (`/weather`) and 5-hour forecast (`/forecast`) from OpenWeatherMap
- Normalizes responses into a consistent `WeatherSummary` shape consumed by the UI
- Uses metric units from API and converts to Fahrenheit client-side

### Client Component
- **Main UI**: [src/components/weather-app.tsx](src/components/weather-app.tsx) is the only client component
- Manages form state, API calls to `/api/weather`, and renders results
- Displays dual temperature units (Celsius primary, Fahrenheit secondary)

### Image Configuration
Weather icons from OpenWeatherMap require Next.js remote pattern configuration in [next.config.ts](next.config.ts).

### Styling
- Tailwind CSS v4 with dark mode support
- Uses Geist Sans and Geist Mono fonts from `next/font/google`
- Responsive design with mobile-first breakpoints

## Key Dependencies

- **Next.js 15.5.4** with Turbopack enabled for dev and build
- **React 19.1.0** (latest stable)
- **Tailwind CSS v4** with PostCSS integration
- **TypeScript 5**