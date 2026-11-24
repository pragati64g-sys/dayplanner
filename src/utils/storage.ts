import {
  PlannerExportPayload,
  SavedLocation,
  TaskItem,
  TemperatureUnit,
} from '../types/planner';
import { addDaysISO, getTodayISO } from './date';

const TASKS_STORAGE_KEY = 'dayplanner.tasks.v1';
const UNIT_STORAGE_KEY = 'dayplanner.tempUnit.v1';
const LOCATION_STORAGE_KEY = 'dayplanner.location.v1';
const INITIALIZED_KEY = 'dayplanner.initialized.v1';

function buildStarterTasks(): TaskItem[] {
  const today = getTodayISO();
  const tomorrow = addDaysISO(today, 1);
  const now = Date.now();

  return [
    {
      id: 'starter-1',
      title: 'Review today’s top three priorities',
      notes: 'Confirm scope before checking messages.',
      date: today,
      timeSlot: 'morning',
      scheduledTime: '08:30',
      priority: 'high',
      category: 'focus',
      completed: false,
      createdAt: now - 5000,
    },
    {
      id: 'starter-2',
      title: 'Ship sprint milestone & update deployment notes',
      date: today,
      timeSlot: 'morning',
      scheduledTime: '10:00',
      priority: 'high',
      category: 'work',
      completed: false,
      createdAt: now - 4000,
    },
    {
      id: 'starter-3',
      title: 'Midday walk & hydration check',
      date: today,
      timeSlot: 'afternoon',
      scheduledTime: '13:15',
      priority: 'medium',
      category: 'health',
      completed: false,
      createdAt: now - 3000,
    },
    {
      id: 'starter-4',
      title: 'Pick up groceries on the way back',
      date: today,
      timeSlot: 'evening',
      scheduledTime: '18:00',
      priority: 'low',
      category: 'errands',
      completed: false,
      createdAt: now - 2000,
    },
    {
      id: 'starter-5',
      title: 'Read 20 pages before winding down',
      date: today,
      timeSlot: 'anytime',
      priority: 'low',
      category: 'personal',
      completed: false,
      createdAt: now - 1000,
    },
    {
      id: 'starter-6',
      title: 'Prepare outline for tomorrow’s design review',
      date: tomorrow,
      timeSlot: 'morning',
      scheduledTime: '09:30',
      priority: 'medium',
      category: 'work',
      completed: false,
      createdAt: now - 500,
    },
  ];
}

export function loadTasks(): TaskItem[] {
  try {
    const initialized = localStorage.getItem(INITIALIZED_KEY);
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);

    if (!initialized && !raw) {
      const starter = buildStarterTasks();
      localStorage.setItem(INITIALIZED_KEY, '1');
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(starter));
      return starter;
    }

    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: TaskItem[]): void {
  try {
    localStorage.setItem(INITIALIZED_KEY, '1');
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function loadTemperatureUnit(): TemperatureUnit {
  try {
    const stored = localStorage.getItem(UNIT_STORAGE_KEY);
    return stored === 'F' ? 'F' : 'C';
  } catch {
    return 'C';
  }
}

export function saveTemperatureUnit(unit: TemperatureUnit): void {
  try {
    localStorage.setItem(UNIT_STORAGE_KEY, unit);
  } catch {
    // Ignore storage errors
  }
}

export function loadSavedLocation(): SavedLocation | null {
  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.cityName === 'string' &&
      typeof parsed?.latitude === 'number' &&
      typeof parsed?.longitude === 'number'
    ) {
      return parsed as SavedLocation;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveLocation(location: SavedLocation): void {
  try {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
  } catch {
    // Ignore storage errors
  }
}

export function parseImportedTasks(jsonText: string): TaskItem[] {
  const parsed: unknown = JSON.parse(jsonText);
  const candidateList = Array.isArray(parsed)
    ? parsed
    : (parsed as PlannerExportPayload)?.tasks;

  if (!Array.isArray(candidateList)) {
    throw new Error('Invalid Dayplanner backup format.');
  }

  return candidateList
    .filter(
      (item): item is TaskItem =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.date === 'string'
    )
    .map((item) => ({
      ...item,
      timeSlot: item.timeSlot || 'anytime',
      priority: item.priority || 'medium',
      category: item.category || 'personal',
      completed: Boolean(item.completed),
      createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
    }));
}
