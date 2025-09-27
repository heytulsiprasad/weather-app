import { NextResponse } from "next/server";

const BASE_URL = "https://api.openweathermap.org/data/2.5";

type CurrentWeather = {
  name?: string;
  sys?: {
    country?: string;
  };
  main?: {
    temp?: number;
    feels_like?: number;
    humidity?: number;
  };
  weather?: Array<{
    description?: string;
    icon?: string;
  }>;
  wind?: {
    speed?: number;
  };
};

type ForecastWeather = {
  list?: Array<{
    dt: number;
    main?: {
      temp?: number;
    };
    weather?: Array<{
      description?: string;
      icon?: string;
    }>;
  }>;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cityQuery = searchParams.get("city")?.trim();

  if (!cityQuery) {
    return NextResponse.json({ error: "Provide a city name, e.g. 'Seattle'." }, { status: 400 });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OPENWEATHER_API_KEY on the server." },
      { status: 500 },
    );
  }

  try {
    const currentResponse = await fetch(
      `${BASE_URL}/weather?q=${encodeURIComponent(cityQuery)}&units=metric&appid=${apiKey}`,
      { next: { revalidate: 0 } },
    );

    if (!currentResponse.ok) {
      const payload = (await currentResponse.json().catch(() => null)) as { message?: string } | null;
      const reason = payload?.message ?? "Unable to load weather for that city.";
      return NextResponse.json({ error: reason }, { status: currentResponse.status });
    }

    const currentData = (await currentResponse.json()) as CurrentWeather;

    let forecastData: ForecastWeather | null = null;

    try {
      const forecastResponse = await fetch(
        `${BASE_URL}/forecast?q=${encodeURIComponent(cityQuery)}&units=metric&appid=${apiKey}`,
        { next: { revalidate: 0 } },
      );

      if (forecastResponse.ok) {
        forecastData = (await forecastResponse.json()) as ForecastWeather;
      }
    } catch (forecastError) {
      console.error("Forecast lookup failed", forecastError);
    }

    const normalizedForecast = (forecastData?.list ?? [])
      .slice(0, 5)
      .map((entry) => ({
        dt: entry.dt,
        temperature: typeof entry.main?.temp === "number" ? entry.main.temp : 0,
        description: entry.weather?.[0]?.description ?? "",
        icon: entry.weather?.[0]?.icon ?? "01d",
      }));

    return NextResponse.json({
      location: {
        city: currentData.name ?? cityQuery,
        country: currentData.sys?.country ?? "",
      },
      current: {
        temperature:
          typeof currentData.main?.temp === "number" ? currentData.main.temp : 0,
        feelsLike:
          typeof currentData.main?.feels_like === "number" ? currentData.main.feels_like : 0,
        description: currentData.weather?.[0]?.description ?? "",
        humidity:
          typeof currentData.main?.humidity === "number" ? currentData.main.humidity : 0,
        windSpeed:
          typeof currentData.wind?.speed === "number" ? currentData.wind.speed : 0,
        icon: currentData.weather?.[0]?.icon ?? "01d",
      },
      forecast: normalizedForecast,
    });
  } catch (error) {
    console.error("Weather lookup failed", error);
    return NextResponse.json(
      { error: "Something went wrong while contacting OpenWeatherMap." },
      { status: 500 },
    );
  }
}
