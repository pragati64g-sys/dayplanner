import { CitySearchResult, TemperatureUnit } from '../types/planner';

export interface OpenMeteoCurrentResponse {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
  };
}

export async function fetchOpenMeteoWeather(
  latitude: number,
  longitude: number
): Promise<{ temperatureC: number; apparentTempC: number; weatherCode: number }> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('current', 'temperature_2m,apparent_temperature,weather_code');
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Weather request failed (${response.status})`);
  }

  const data: OpenMeteoCurrentResponse = await response.json();
  if (
    !data.current ||
    typeof data.current.temperature_2m !== 'number' ||
    typeof data.current.weather_code !== 'number'
  ) {
    throw new Error('Incomplete weather data received');
  }

  return {
    temperatureC: data.current.temperature_2m,
    apparentTempC:
      typeof data.current.apparent_temperature === 'number'
        ? data.current.apparent_temperature
        : data.current.temperature_2m,
    weatherCode: data.current.weather_code,
  };
}

export async function reverseGeocodeLocation(
  latitude: number,
  longitude: number
): Promise<{ cityName: string; region?: string }> {
  try {
    const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
    url.searchParams.set('latitude', String(latitude));
    url.searchParams.set('longitude', String(longitude));
    url.searchParams.set('localityLanguage', 'en');

    const res = await fetch(url.toString());
    if (!res.ok) {
      return { cityName: 'Current Location' };
    }
    const data = await res.json();
    const cityName =
      data.city ||
      data.locality ||
      data.principalSubdivision ||
      data.countryName ||
      'Current Location';
    const region = data.principalSubdivision && data.principalSubdivision !== cityName
      ? data.principalSubdivision
      : data.countryCode || undefined;

    return { cityName, region };
  } catch {
    return { cityName: 'Current Location' };
  }
}

export async function searchCities(query: string): Promise<CitySearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', trimmed);
  url.searchParams.set('count', '6');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error('City search unavailable');
  }
  const data = await res.json();
  if (!Array.isArray(data.results)) return [];

  return data.results.map((item: CitySearchResult) => ({
    id: item.id,
    name: item.name,
    admin1: item.admin1,
    country: item.country,
    latitude: item.latitude,
    longitude: item.longitude,
  }));
}

export function formatTemperature(tempC: number, unit: TemperatureUnit): string {
  const value = unit === 'C' ? tempC : (tempC * 9) / 5 + 32;
  return `${Math.round(value)}°${unit}`;
}

export type WeatherIconKind =
  | 'sun'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'rain'
  | 'snow'
  | 'storm';

export function describeWeatherCode(code: number): {
  label: string;
  icon: WeatherIconKind;
} {
  if (code === 0) return { label: 'Clear sky', icon: 'sun' };
  if (code === 1 || code === 2) return { label: 'Partly cloudy', icon: 'partly-cloudy' };
  if (code === 3) return { label: 'Overcast', icon: 'cloudy' };
  if (code === 45 || code === 48) return { label: 'Foggy', icon: 'fog' };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return { label: code >= 61 ? 'Rain' : 'Drizzle', icon: 'rain' };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { label: 'Snow', icon: 'snow' };
  }
  if (code >= 95) return { label: 'Thunderstorm', icon: 'storm' };
  return { label: 'Clear', icon: 'sun' };
}
