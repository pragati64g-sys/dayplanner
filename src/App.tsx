import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Plus,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TaskModal } from './components/TaskModal';
import { TaskRow } from './components/TaskRow';
import { WeatherWidget } from './components/WeatherWidget';
import {
  Category,
  PlannerExportPayload,
  Priority,
  SavedLocation,
  StatusFilter,
  TaskItem,
  TemperatureUnit,
  TIME_SLOTS,
  TimeSlot,
  WeatherState,
} from './types/planner';
import {
  addDaysISO,
  formatAgendaHeadingDate,
  getRelativeDayLabel,
  getTodayISO,
} from './utils/date';
import {
  loadSavedLocation,
  loadTasks,
  loadTemperatureUnit,
  parseImportedTasks,
  saveLocation,
  saveTasks,
  saveTemperatureUnit,
} from './utils/storage';
import {
  fetchOpenMeteoWeather,
  reverseGeocodeLocation,
} from './utils/weather';

const PRIORITY_RANK: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function sortTasksForBlock(list: TaskItem[]): TaskItem[] {
  return [...list].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.scheduledTime && b.scheduledTime) {
      const cmp = a.scheduledTime.localeCompare(b.scheduledTime);
      if (cmp !== 0) return cmp;
    } else if (a.scheduledTime || b.scheduledTime) {
      return a.scheduledTime ? -1 : 1;
    }
    if (a.priority !== b.priority) {
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    }
    return a.createdAt - b.createdAt;
  });
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [tasks, setTasks] = useState<TaskItem[]>(() => loadTasks());
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayISO());
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [quickTitle, setQuickTitle] = useState('');
  const [quickSlot, setQuickSlot] = useState<TimeSlot>('morning');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [defaultModalSlot, setDefaultModalSlot] = useState<TimeSlot>('morning');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notice, setNotice] = useState<{
    kind: 'success' | 'error';
    text: string;
  } | null>(null);

  const [weather, setWeather] = useState<WeatherState>(() => ({
    status: 'idle',
    temperatureC: null,
    apparentTempC: null,
    weatherCode: null,
    location: loadSavedLocation(),
    unit: loadTemperatureUnit(),
    lastUpdated: null,
  }));

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const loadWeatherForCoords = useCallback(
    async (loc: SavedLocation, persist = true) => {
      setWeather((prev) => ({
        ...prev,
        status: 'loading',
        location: loc,
        errorMessage: undefined,
      }));
      try {
        const result = await fetchOpenMeteoWeather(loc.latitude, loc.longitude);
        if (persist) {
          saveLocation(loc);
        }
        setWeather((prev) => ({
          ...prev,
          status: 'ready',
          temperatureC: result.temperatureC,
          apparentTempC: result.apparentTempC,
          weatherCode: result.weatherCode,
          location: loc,
          lastUpdated: Date.now(),
          errorMessage: undefined,
        }));
      } catch {
        setWeather((prev) => ({
          ...prev,
          status: 'error',
          errorMessage: 'Unable to fetch current temperature.',
        }));
      }
    },
    []
  );

  const detectCurrentLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setWeather((prev) => ({
        ...prev,
        status: 'needs_location',
        errorMessage: 'Geolocation unavailable. Search for your city below.',
      }));
      return;
    }

    setWeather((prev) => ({
      ...prev,
      status: 'loading',
      errorMessage: undefined,
    }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const geo = await reverseGeocodeLocation(latitude, longitude);
        const resolvedLocation: SavedLocation = {
          cityName: geo.cityName,
          region: geo.region,
          latitude,
          longitude,
          source: 'geolocation',
        };
        await loadWeatherForCoords(resolvedLocation, true);
      },
      () => {
        setWeather((prev) => ({
          ...prev,
          status: prev.temperatureC !== null ? 'ready' : 'needs_location',
          errorMessage:
            'Location permission declined. Search and select your city below.',
        }));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [loadWeatherForCoords]);

  useEffect(() => {
    const saved = loadSavedLocation();
    if (saved) {
      loadWeatherForCoords(saved, false);
    } else {
      detectCurrentLocation();
    }
  }, [detectCurrentLocation, loadWeatherForCoords]);

  useEffect(() => {
    if (!weather.location) return;
    const loc = weather.location;
    const interval = window.setInterval(() => {
      loadWeatherForCoords(loc, false);
    }, 15 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [weather.location, loadWeatherForCoords]);

  useEffect(() => {
    function handleShortcut(e: KeyboardEvent) {
      if (modalOpen) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.isContentEditable
      ) {
        return;
      }
      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setEditingTask(null);
        setDefaultModalSlot('morning');
        setModalOpen(true);
      }
    }
    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, [modalOpen]);

  const handleToggleUnit = useCallback((unit: TemperatureUnit) => {
    saveTemperatureUnit(unit);
    setWeather((prev) => ({ ...prev, unit }));
  }, []);

  const dayTasks = useMemo(
    () => tasks.filter((task) => task.date === selectedDate),
    [tasks, selectedDate]
  );

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return dayTasks.filter((task) => {
      if (categoryFilter !== 'all' && task.category !== categoryFilter) {
        return false;
      }
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }
      if (statusFilter === 'active' && task.completed) return false;
      if (statusFilter === 'completed' && !task.completed) return false;
      if (query) {
        const haystack = `${task.title} ${task.notes ?? ''}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [dayTasks, categoryFilter, priorityFilter, statusFilter, searchQuery]);

  const tasksBySlot = useMemo(() => {
    const grouped: Record<TimeSlot, TaskItem[]> = {
      morning: [],
      afternoon: [],
      evening: [],
      anytime: [],
    };
    for (const task of filteredTasks) {
      grouped[task.timeSlot].push(task);
    }
    return {
      morning: sortTasksForBlock(grouped.morning),
      afternoon: sortTasksForBlock(grouped.afternoon),
      evening: sortTasksForBlock(grouped.evening),
      anytime: sortTasksForBlock(grouped.anytime),
    };
  }, [filteredTasks]);

  const activeDayCount = dayTasks.filter((t) => !t.completed).length;
  const completedDayCount = dayTasks.length - activeDayCount;
  const hasActiveFilters =
    categoryFilter !== 'all' ||
    priorityFilter !== 'all' ||
    statusFilter !== 'all' ||
    searchQuery.trim().length > 0;

  function handleQuickAdd(e: FormEvent) {
    e.preventDefault();
    const trimmed = quickTitle.trim();
    if (!trimmed) return;

    const newTask: TaskItem = {
      id: generateId(),
      title: trimmed,
      date: selectedDate,
      timeSlot: quickSlot,
      priority: priorityFilter === 'all' ? 'medium' : priorityFilter,
      category: categoryFilter === 'all' ? 'work' : categoryFilter,
      completed: false,
      createdAt: Date.now(),
    };
    setTasks((prev) => [newTask, ...prev]);
    setQuickTitle('');
  }

  function handleSaveTask(payload: {
    id?: string;
    title: string;
    notes?: string;
    date: string;
    timeSlot: TimeSlot;
    scheduledTime?: string;
    priority: Priority;
    category: Category;
  }) {
    if (payload.id) {
      setTasks((prev) =>
        prev.map((item) =>
          item.id === payload.id
            ? {
                ...item,
                title: payload.title,
                notes: payload.notes,
                date: payload.date,
                timeSlot: payload.timeSlot,
                scheduledTime: payload.scheduledTime,
                priority: payload.priority,
                category: payload.category,
              }
            : item
        )
      );
    } else {
      const created: TaskItem = {
        id: generateId(),
        title: payload.title,
        notes: payload.notes,
        date: payload.date,
        timeSlot: payload.timeSlot,
        scheduledTime: payload.scheduledTime,
        priority: payload.priority,
        category: payload.category,
        completed: false,
        createdAt: Date.now(),
      };
      setTasks((prev) => [created, ...prev]);
    }
    if (payload.date !== selectedDate) {
      setSelectedDate(payload.date);
    }
  }

  function handleToggleComplete(id: string) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              completedAt: !task.completed ? Date.now() : undefined,
            }
          : task
      )
    );
  }

  function handleDeleteTask(id: string) {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }

  function handleChangeTimeSlot(id: string, nextSlot: TimeSlot) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, timeSlot: nextSlot } : task
      )
    );
  }

  function handleClearCompletedForDay() {
    setTasks((prev) =>
      prev.filter((task) => !(task.date === selectedDate && task.completed))
    );
  }

  function handleExportJSON() {
    const payload: PlannerExportPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dayplanner-backup-${getTodayISO()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setNotice({ kind: 'success', text: 'Backup exported as JSON.' });
  }

  function handleImportJSON(jsonText: string) {
    try {
      const imported = parseImportedTasks(jsonText);
      setTasks(imported);
      setNotice({
        kind: 'success',
        text: `Imported ${imported.length} task${imported.length === 1 ? '' : 's'}.`,
      });
    } catch {
      setNotice({
        kind: 'error',
        text: 'Could not import file. Make sure it is a valid Dayplanner JSON backup.',
      });
    }
  }

  function openNewTaskModal(slot: TimeSlot = 'morning') {
    setEditingTask(null);
    setDefaultModalSlot(slot);
    setModalOpen(true);
  }

  const todayISO = getTodayISO();
  const relativeDay = getRelativeDayLabel(selectedDate);

  return (
    <div className="min-h-screen bg-[#0B0C0F] text-[#F3F4F6] flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 h-16 bg-[#0B0C0F]/95 backdrop-blur-sm border-b border-[#252932]">
        <div className="max-w-[1440px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-8">
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation filters"
              className="lg:hidden p-2 -ml-2 rounded-lg text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1A1D24] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                setSelectedDate(todayISO);
              }}
              className="font-display text-lg font-semibold tracking-tight text-[#F3F4F6] whitespace-nowrap shrink-0"
            >
              Dayplanner
            </a>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <WeatherWidget
              weather={weather}
              onToggleUnit={handleToggleUnit}
              onUseCurrentLocation={detectCurrentLocation}
              onSelectManualLocation={(loc) => loadWeatherForCoords(loc, true)}
              onRefreshWeather={() => {
                if (weather.location) {
                  loadWeatherForCoords(weather.location, false);
                } else {
                  detectCurrentLocation();
                }
              }}
            />

            <button
              type="button"
              onClick={() => openNewTaskModal('morning')}
              className="inline-flex items-center gap-1.5 px-4 h-9 bg-amber-500 hover:bg-amber-400 text-[#0B0C0F] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <Plus className="w-4 h-4 stroke-[2.25] shrink-0" />
              <span className="hidden sm:inline">New task</span>
              <span className="sm:hidden">Task</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 w-full max-w-[1440px] mx-auto flex">
        <Sidebar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          categoryFilter={categoryFilter}
          onSelectCategory={setCategoryFilter}
          priorityFilter={priorityFilter}
          onSelectPriority={setPriorityFilter}
          dayTasks={dayTasks}
          onExportJSON={handleExportJSON}
          onImportJSON={handleImportJSON}
          onClearCompletedForDay={handleClearCompletedForDay}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-10 py-6 sm:py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {notice && (
              <div
                role="status"
                className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border text-xs ${
                  notice.kind === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                <span>{notice.text}</span>
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  aria-label="Dismiss notification"
                  className="p-1 rounded hover:bg-white/5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Agenda Date Heading */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#252932]">
              <div>
                <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
                  <span>{relativeDay}</span>
                  {selectedDate !== todayISO && (
                    <>
                      <span className="text-[#4B5563]" aria-hidden="true">
                        ·
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedDate(todayISO)}
                        className="text-[#9CA3AF] hover:text-[#F3F4F6] underline underline-offset-4 transition-colors"
                      >
                        Back to today
                      </button>
                    </>
                  )}
                </div>

                <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[#F3F4F6]">
                  {formatAgendaHeadingDate(selectedDate)}
                </h1>

                <p className="mt-1 text-xs text-[#9CA3AF] font-mono tabular-nums">
                  {activeDayCount} remaining · {completedDayCount} completed
                </p>
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSelectedDate((d) => addDaysISO(d, -1))}
                  aria-label="Previous day"
                  className="p-2 rounded-lg bg-[#13151A] hover:bg-[#1A1D24] border border-[#252932] text-[#D1D5DB] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayISO)}
                  className="px-3 h-9 rounded-lg bg-[#13151A] hover:bg-[#1A1D24] border border-[#252932] text-xs font-medium text-[#D1D5DB] transition-colors whitespace-nowrap"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate((d) => addDaysISO(d, 1))}
                  aria-label="Next day"
                  className="p-2 rounded-lg bg-[#13151A] hover:bg-[#1A1D24] border border-[#252932] text-[#D1D5DB] transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Capture Form */}
            <form
              onSubmit={handleQuickAdd}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#13151A] border border-[#252932] rounded-xl p-2"
            >
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder={`Quick add a task for ${relativeDay.toLowerCase()}… (or press N for details)`}
                aria-label="Quick add task title"
                className="flex-1 bg-transparent px-3 py-2 text-sm text-[#F3F4F6] placeholder-[#6B7280] focus:outline-none"
              />
              <div className="flex items-center gap-2 justify-end px-1 sm:px-0">
                <select
                  value={quickSlot}
                  onChange={(e) => setQuickSlot(e.target.value as TimeSlot)}
                  aria-label="Quick add time block"
                  className="bg-[#0B0C0F] border border-[#252932] rounded-lg px-2.5 h-9 text-xs text-[#D1D5DB] focus:outline-none focus:border-amber-500/60 cursor-pointer"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!quickTitle.trim()}
                  className="px-4 h-9 rounded-lg bg-[#1F232C] hover:bg-[#2A303C] disabled:opacity-40 disabled:pointer-events-none text-xs font-medium text-[#F3F4F6] transition-colors whitespace-nowrap"
                >
                  Add
                </button>
              </div>
            </form>

            {/* Search & Status Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search this day’s tasks…"
                  aria-label="Search tasks"
                  className="w-full bg-[#13151A] border border-[#252932] rounded-lg pl-9 pr-8 py-2 text-xs text-[#F3F4F6] placeholder-[#6B7280] focus:outline-none focus:border-amber-500/60"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#6B7280] hover:text-[#F3F4F6]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div
                  className="flex items-center gap-1 p-1 bg-[#13151A] border border-[#252932] rounded-lg"
                  role="tablist"
                  aria-label="Task completion status filter"
                >
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'active', label: 'Active' },
                      { id: 'completed', label: 'Done' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={statusFilter === tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        statusFilter === tab.id
                          ? 'bg-[#1F232C] text-amber-300'
                          : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('all');
                      setPriorityFilter('all');
                      setStatusFilter('all');
                      setSearchQuery('');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-2 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors whitespace-nowrap"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Agenda Time-Block Sections */}
            {filteredTasks.length === 0 ? (
              <div className="bg-[#13151A] border border-[#252932] rounded-xl px-6 py-12 text-center">
                <h2 className="text-base font-semibold text-[#F3F4F6]">
                  {dayTasks.length === 0
                    ? `No tasks planned for ${relativeDay.toLowerCase()}`
                    : 'No tasks match your current filters'}
                </h2>
                <p className="mt-1.5 text-xs text-[#9CA3AF] max-w-md mx-auto">
                  {dayTasks.length === 0
                    ? 'Add your first time-blocked task or flexible reminder to structure your day.'
                    : 'Try clearing your search or category filter to view the full daily agenda.'}
                </p>
                <div className="mt-5 flex items-center justify-center gap-3">
                  {dayTasks.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => openNewTaskModal('morning')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-[#0B0C0F] text-xs font-semibold rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Plan first task</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryFilter('all');
                        setPriorityFilter('all');
                        setStatusFilter('all');
                        setSearchQuery('');
                      }}
                      className="px-4 py-2 bg-[#1A1D24] hover:bg-[#222630] border border-[#252932] text-xs font-medium text-[#F3F4F6] rounded-lg transition-colors"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-7">
                {TIME_SLOTS.map((slot) => {
                  const slotTasks = tasksBySlot[slot.id];
                  if (slotTasks.length === 0 && hasActiveFilters) return null;

                  return (
                    <section key={slot.id} aria-labelledby={`slot-${slot.id}`}>
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div className="flex items-baseline gap-2.5 min-w-0">
                          <h2
                            id={`slot-${slot.id}`}
                            className="text-sm font-semibold text-[#F3F4F6]"
                          >
                            {slot.label}
                          </h2>
                          <span className="text-xs font-mono tabular-nums text-[#6B7280]">
                            {slot.windowLabel}
                          </span>
                          <span className="text-[#353B48]" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-xs font-mono tabular-nums text-[#9CA3AF]">
                            {slotTasks.length}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => openNewTaskModal(slot.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-[#9CA3AF] hover:text-amber-300 hover:bg-[#13151A] transition-colors whitespace-nowrap shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>

                      {slotTasks.length === 0 ? (
                        <div className="border border-dashed border-[#252932] rounded-lg px-4 py-4 flex items-center justify-between text-xs text-[#6B7280]">
                          <span>Nothing scheduled for {slot.label.toLowerCase()}.</span>
                          <button
                            type="button"
                            onClick={() => openNewTaskModal(slot.id)}
                            className="text-[#9CA3AF] hover:text-amber-300 transition-colors whitespace-nowrap"
                          >
                            Schedule task
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {slotTasks.map((task) => (
                            <TaskRow
                              key={task.id}
                              task={task}
                              onToggleComplete={handleToggleComplete}
                              onEdit={(item) => {
                                setEditingTask(item);
                                setModalOpen(true);
                              }}
                              onDelete={handleDeleteTask}
                              onChangeTimeSlot={handleChangeTimeSlot}
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      <TaskModal
        open={modalOpen}
        initialTask={editingTask}
        defaultDate={selectedDate}
        defaultTimeSlot={defaultModalSlot}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
      />
    </div>
  );
}
