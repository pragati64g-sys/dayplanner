import {
  Calendar,
  Download,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { ChangeEvent, useRef, useState } from 'react';
import {
  CATEGORIES,
  Category,
  PRIORITIES,
  Priority,
  TaskItem,
} from '../types/planner';
import { addDaysISO, formatShortDate, getTodayISO } from '../utils/date';

interface SidebarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  categoryFilter: Category | 'all';
  onSelectCategory: (category: Category | 'all') => void;
  priorityFilter: Priority | 'all';
  onSelectPriority: (priority: Priority | 'all') => void;
  dayTasks: TaskItem[];
  onExportJSON: () => void;
  onImportJSON: (jsonText: string) => void;
  onClearCompletedForDay: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  selectedDate,
  onSelectDate,
  categoryFilter,
  onSelectCategory,
  priorityFilter,
  onSelectPriority,
  dayTasks,
  onExportJSON,
  onImportJSON,
  onClearCompletedForDay,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const todayISO = getTodayISO();
  const tomorrowISO = addDaysISO(todayISO, 1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const totalCount = dayTasks.length;
  const completedCount = dayTasks.filter((t) => t.completed).length;
  const completionPct =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const categoryCounts = CATEGORIES.reduce<Record<Category, number>>(
    (acc, cat) => {
      acc[cat.id] = dayTasks.filter((t) => t.category === cat.id).length;
      return acc;
    },
    { work: 0, focus: 0, personal: 0, health: 0, errands: 0 }
  );

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImportJSON(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  const content = (
    <div className="flex flex-col h-full justify-between p-5 gap-6">
      <div className="space-y-6">
        {/* Date Navigation */}
        <section aria-label="Schedule dates">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-medium text-[#9CA3AF]">Schedule</h2>
            {mobileOpen && (
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close sidebar"
                className="lg:hidden p-1.5 rounded-md text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1A1D24]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                onSelectDate(todayISO);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
                selectedDate === todayISO
                  ? 'bg-amber-500/12 text-amber-300 font-medium'
                  : 'text-[#D1D5DB] hover:bg-[#1A1D24]'
              }`}
            >
              <span>Today</span>
              <span className="text-xs font-mono tabular-nums text-[#6B7280]">
                {formatShortDate(todayISO)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectDate(tomorrowISO);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
                selectedDate === tomorrowISO
                  ? 'bg-amber-500/12 text-amber-300 font-medium'
                  : 'text-[#D1D5DB] hover:bg-[#1A1D24]'
              }`}
            >
              <span>Tomorrow</span>
              <span className="text-xs font-mono tabular-nums text-[#6B7280]">
                {formatShortDate(tomorrowISO)}
              </span>
            </button>

            <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-[#9CA3AF] hover:bg-[#1A1D24] transition-colors cursor-pointer">
              <span className="flex items-center gap-2 whitespace-nowrap">
                <Calendar className="w-3.5 h-3.5 text-[#6B7280]" />
                <span>Jump to date</span>
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    onSelectDate(e.target.value);
                    onCloseMobile();
                  }
                }}
                aria-label="Jump to date"
                className="bg-transparent text-xs font-mono tabular-nums text-[#D1D5DB] focus:outline-none [color-scheme:dark] w-[112px] text-right cursor-pointer"
              />
            </label>
          </div>
        </section>

        {/* Daily Progress Summary */}
        <section className="pt-5 border-t border-[#252932]" aria-label="Daily progress">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-[#9CA3AF]">Day progress</span>
            <span className="font-mono tabular-nums text-[#D1D5DB]">
              {completedCount}/{totalCount}
            </span>
          </div>
          <div className="h-1.5 w-full bg-[#1A1D24] rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-[width] duration-200 ease-out rounded-full"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-[#6B7280] font-mono tabular-nums">
            {completionPct}% complete
          </p>
        </section>

        {/* Category Filter */}
        <section className="pt-5 border-t border-[#252932]" aria-label="Categories">
          <h2 className="text-xs font-medium text-[#9CA3AF] mb-2.5">Categories</h2>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                onSelectCategory('all');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                categoryFilter === 'all'
                  ? 'bg-[#1A1D24] text-[#F3F4F6] font-medium'
                  : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1A1D24]/60'
              }`}
            >
              <span>All categories</span>
              <span className="text-xs font-mono tabular-nums text-[#6B7280]">
                {totalCount}
              </span>
            </button>

            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onSelectCategory(cat.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                  categoryFilter === cat.id
                    ? 'bg-[#1A1D24] text-[#F3F4F6] font-medium'
                    : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1A1D24]/60'
                }`}
              >
                <span>{cat.label}</span>
                <span className="text-xs font-mono tabular-nums text-[#6B7280]">
                  {categoryCounts[cat.id]}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Priority Filter */}
        <section className="pt-5 border-t border-[#252932]" aria-label="Priority filter">
          <h2 className="text-xs font-medium text-[#9CA3AF] mb-2.5">Priority</h2>
          <div className="grid grid-cols-4 gap-1 p-1 bg-[#0B0C0F] border border-[#252932] rounded-lg">
            <button
              type="button"
              onClick={() => onSelectPriority('all')}
              className={`py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
                priorityFilter === 'all'
                  ? 'bg-[#1F232C] text-[#F3F4F6] font-medium'
                  : 'text-[#6B7280] hover:text-[#D1D5DB]'
              }`}
            >
              All
            </button>
            {PRIORITIES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPriority(p.id)}
                className={`py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
                  priorityFilter === p.id
                    ? 'bg-[#1F232C] text-amber-300 font-medium'
                    : 'text-[#6B7280] hover:text-[#D1D5DB]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Data Utilities */}
      <div className="pt-5 border-t border-[#252932] space-y-2">
        {completedCount > 0 && (
          <div>
            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#9CA3AF] hover:text-red-300 hover:bg-[#1A1D24] rounded-lg transition-colors whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>Clear completed ({completedCount})</span>
              </button>
            ) : (
              <div className="flex items-center justify-between gap-2 px-2 py-1.5 bg-[#1A1D24] border border-[#252932] rounded-lg">
                <span className="text-xs text-[#D1D5DB]">Clear done?</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onClearCompletedForDay();
                      setConfirmClear(false);
                    }}
                    className="px-2 py-1 text-xs font-medium text-red-300 hover:bg-red-500/15 rounded"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="px-2 py-1 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onExportJSON}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#D1D5DB] bg-[#1A1D24] hover:bg-[#222630] border border-[#252932] rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#D1D5DB] bg-[#1A1D24] hover:bg-[#222630] border border-[#252932] rounded-lg transition-colors whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 shrink-0" />
            <span>Import</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Import Dayplanner JSON backup"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-[264px] shrink-0 border-r border-[#252932] bg-[#101216]">
        {content}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-[2px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] h-full bg-[#101216] border-r border-[#252932] overflow-y-auto z-10">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
