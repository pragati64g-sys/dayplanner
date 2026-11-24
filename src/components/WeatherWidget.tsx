import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Crosshair,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Sun,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  CitySearchResult,
  SavedLocation,
  TemperatureUnit,
  WeatherState,
} from '../types/planner';
import {
  describeWeatherCode,
  formatTemperature,
  searchCities,
  WeatherIconKind,
} from '../utils/weather';

interface WeatherWidgetProps {
  weather: WeatherState;
  onToggleUnit: (unit: TemperatureUnit) => void;
  onUseCurrentLocation: () => void;
  onSelectManualLocation: (location: SavedLocation) => void;
  onRefreshWeather: () => void;
}

function WeatherConditionIcon({
  kind,
  className = 'w-4 h-4',
}: {
  kind: WeatherIconKind;
  className?: string;
}) {
  switch (kind) {
    case 'sun':
      return <Sun className={className} />;
    case 'partly-cloudy':
      return <CloudSun className={className} />;
    case 'cloudy':
      return <Cloud className={className} />;
    case 'fog':
      return <CloudFog className={className} />;
    case 'rain':
      return <CloudRain className={className} />;
    case 'snow':
      return <CloudSnow className={className} />;
    case 'storm':
      return <CloudLightning className={className} />;
  }
}

export function WeatherWidget({
  weather,
  onToggleUnit,
  onUseCurrentLocation,
  onSelectManualLocation,
  onRefreshWeather,
}: WeatherWidgetProps) {
  const [open, setOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [results, setResults] = useState<CitySearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  useEffect(() => {
    const trimmed = cityQuery.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearchError(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const list = await searchCities(trimmed);
        if (!cancelled) {
          setResults(list);
        }
      } catch {
        if (!cancelled) {
          setSearchError('Could not search cities right now.');
          setResults([]);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [cityQuery]);

  const condition =
    weather.weatherCode !== null
      ? describeWeatherCode(weather.weatherCode)
      : null;

  const formattedTemp =
    weather.temperatureC !== null
      ? formatTemperature(weather.temperatureC, weather.unit)
      : null;

  const formattedFeelsLike =
    weather.apparentTempC !== null
      ? formatTemperature(weather.apparentTempC, weather.unit)
      : null;

  return (
    <div ref={containerRef} className="relative flex items-center gap-2 shrink-0">
      <div className="flex items-center bg-[#13151A] border border-[#252932] rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label="Local temperature and location settings"
          className="flex items-center gap-2 px-3 h-9 text-sm text-[#F3F4F6] hover:bg-[#1A1D24] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70"
        >
          {weather.status === 'loading' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
              <span className="text-xs text-[#9CA3AF]">Locating…</span>
            </>
          ) : weather.status === 'ready' && formattedTemp && condition ? (
            <>
              <WeatherConditionIcon
                kind={condition.icon}
                className="w-4 h-4 text-amber-400 shrink-0"
              />
              <span className="font-mono font-medium tabular-nums text-[#F3F4F6]">
                {formattedTemp}
              </span>
              <span className="text-[#4B5563]" aria-hidden="true">
                ·
              </span>
              <span className="text-xs text-[#9CA3AF] truncate max-w-[130px] sm:max-w-[170px]">
                {weather.location?.cityName || 'Local'}
              </span>
            </>
          ) : (
            <>
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-xs text-[#D1D5DB]">Set location</span>
            </>
          )}
        </button>

        <div
          className="flex items-center border-l border-[#252932] bg-[#0F1115]"
          role="group"
          aria-label="Temperature unit"
        >
          <button
            type="button"
            onClick={() => onToggleUnit('C')}
            aria-pressed={weather.unit === 'C'}
            className={`px-2 h-9 text-xs font-mono font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 ${
              weather.unit === 'C'
                ? 'bg-[#1F232C] text-amber-400'
                : 'text-[#6B7280] hover:text-[#D1D5DB]'
            }`}
          >
            °C
          </button>
          <button
            type="button"
            onClick={() => onToggleUnit('F')}
            aria-pressed={weather.unit === 'F'}
            className={`px-2 h-9 text-xs font-mono font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 ${
              weather.unit === 'F'
                ? 'bg-[#1F232C] text-amber-400'
                : 'text-[#6B7280] hover:text-[#D1D5DB]'
            }`}
          >
            °F
          </button>
        </div>
      </div>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 bg-[#13151A] border border-[#252932] rounded-xl shadow-2xl shadow-black/60 p-4 z-50"
          role="dialog"
          aria-label="Weather and location settings"
        >
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#252932]">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#9CA3AF]">Local weather</p>
              {weather.status === 'ready' && weather.location && formattedTemp && condition ? (
                <div className="mt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-mono font-semibold tabular-nums text-[#F3F4F6]">
                      {formattedTemp}
                    </span>
                    <span className="text-xs text-[#9CA3AF] truncate">
                      {condition.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5 truncate">
                    {weather.location.cityName}
                    {weather.location.region ? `, ${weather.location.region}` : ''}
                    {formattedFeelsLike ? ` · Feels like ${formattedFeelsLike}` : ''}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[#D1D5DB] mt-1">
                  {weather.errorMessage || 'Detect your location or search a city below.'}
                </p>
              )}
            </div>

            {weather.location && (
              <button
                type="button"
                onClick={onRefreshWeather}
                disabled={weather.status === 'loading'}
                title="Refresh weather"
                aria-label="Refresh weather"
                className="p-2 rounded-lg text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1A1D24] transition-colors shrink-0 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    weather.status === 'loading' ? 'animate-spin' : ''
                  }`}
                />
              </button>
            )}
          </div>

          <div className="mt-3 space-y-2.5">
            <button
              type="button"
              onClick={() => {
                onUseCurrentLocation();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 rounded-lg transition-colors whitespace-nowrap"
            >
              <Crosshair className="w-3.5 h-3.5 shrink-0" />
              <span>Use current location</span>
            </button>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                placeholder="Search city manually…"
                aria-label="Search city manually"
                className="w-full bg-[#0B0C0F] border border-[#252932] rounded-lg pl-8 pr-3 py-2 text-xs text-[#F3F4F6] placeholder-[#6B7280] focus:outline-none focus:border-amber-500/60"
              />
            </div>

            {searching && (
              <p className="text-xs text-[#6B7280] px-1">Searching cities…</p>
            )}

            {searchError && (
              <p className="text-xs text-red-400 px-1">{searchError}</p>
            )}

            {results.length > 0 && (
              <ul className="max-h-44 overflow-y-auto divide-y divide-[#252932]/60 border border-[#252932] rounded-lg bg-[#0B0C0F]">
                {results.map((city) => (
                  <li key={city.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectManualLocation({
                          cityName: city.name,
                          region: city.admin1 || city.country,
                          latitude: city.latitude,
                          longitude: city.longitude,
                          source: 'manual',
                        });
                        setCityQuery('');
                        setResults([]);
                        setOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-[#1A1D24] transition-colors flex items-center justify-between gap-2"
                    >
                      <span className="font-medium text-[#F3F4F6] truncate">
                        {city.name}
                      </span>
                      <span className="text-[#6B7280] truncate shrink-0 max-w-[130px]">
                        {[city.admin1, city.country].filter(Boolean).join(', ')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
