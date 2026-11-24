export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'anytime';

export type Priority = 'high' | 'medium' | 'low';

export type Category = 'work' | 'personal' | 'health' | 'errands' | 'focus';

export type StatusFilter = 'all' | 'active' | 'completed';

export type TemperatureUnit = 'C' | 'F';

export interface TaskItem {
  id: string;
  title: string;
  notes?: string;
  date: string; // YYYY-MM-DD local calendar date
  timeSlot: TimeSlot;
  scheduledTime?: string; // HH:MM (24h)
  priority: Priority;
  category: Category;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}

export interface SavedLocation {
  cityName: string;
  region?: string;
  latitude: number;
  longitude: number;
  source: 'geolocation' | 'manual';
}

export interface WeatherState {
  status: 'idle' | 'loading' | 'ready' | 'needs_location' | 'error';
  temperatureC: number | null;
  apparentTempC: number | null;
  weatherCode: number | null;
  location: SavedLocation | null;
  unit: TemperatureUnit;
  lastUpdated: number | null;
  errorMessage?: string;
}

export interface CitySearchResult {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

export interface PlannerExportPayload {
  version: 1;
  exportedAt: string;
  tasks: TaskItem[];
}

export const TIME_SLOTS: {
  id: TimeSlot;
  label: string;
  windowLabel: string;
}[] = [
  { id: 'morning', label: 'Morning', windowLabel: '06:00 – 12:00' },
  { id: 'afternoon', label: 'Afternoon', windowLabel: '12:00 – 17:00' },
  { id: 'evening', label: 'Evening', windowLabel: '17:00 – 23:00' },
  { id: 'anytime', label: 'Anytime', windowLabel: 'Flexible' },
];

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'work', label: 'Work' },
  { id: 'focus', label: 'Focus' },
  { id: 'personal', label: 'Personal' },
  { id: 'health', label: 'Health' },
  { id: 'errands', label: 'Errands' },
];

export const PRIORITIES: { id: Priority; label: string }[] = [
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];
