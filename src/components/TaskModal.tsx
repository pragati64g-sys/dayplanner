import { X } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  CATEGORIES,
  Category,
  PRIORITIES,
  Priority,
  TaskItem,
  TIME_SLOTS,
  TimeSlot,
} from '../types/planner';
import { inferTimeSlotFromTime } from '../utils/date';

interface TaskModalProps {
  open: boolean;
  initialTask: TaskItem | null;
  defaultDate: string;
  defaultTimeSlot: TimeSlot;
  onClose: () => void;
  onSave: (payload: {
    id?: string;
    title: string;
    notes?: string;
    date: string;
    timeSlot: TimeSlot;
    scheduledTime?: string;
    priority: Priority;
    category: Category;
  }) => void;
}

export function TaskModal({
  open,
  initialTask,
  defaultDate,
  defaultTimeSlot,
  onClose,
  onSave,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [scheduledTime, setScheduledTime] = useState('');
  const [timeSlot, setTimeSlot] = useState<TimeSlot>(defaultTimeSlot);
  const [slotManuallyPicked, setSlotManuallyPicked] = useState(false);
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<Category>('work');
  const [error, setError] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    if (initialTask) {
      setTitle(initialTask.title);
      setNotes(initialTask.notes ?? '');
      setDate(initialTask.date);
      setScheduledTime(initialTask.scheduledTime ?? '');
      setTimeSlot(initialTask.timeSlot);
      setSlotManuallyPicked(true);
      setPriority(initialTask.priority);
      setCategory(initialTask.category);
    } else {
      setTitle('');
      setNotes('');
      setDate(defaultDate);
      setScheduledTime('');
      setTimeSlot(defaultTimeSlot);
      setSlotManuallyPicked(false);
      setPriority('medium');
      setCategory('work');
    }
    setError(null);

    const focusTimer = window.setTimeout(() => {
      titleInputRef.current?.focus();
    }, 20);
    return () => window.clearTimeout(focusTimer);
  }, [open, initialTask, defaultDate, defaultTimeSlot]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function handleTimeChange(nextTime: string) {
    setScheduledTime(nextTime);
    if (!slotManuallyPicked && nextTime) {
      setTimeSlot(inferTimeSlotFromTime(nextTime));
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Please enter a task title.');
      titleInputRef.current?.focus();
      return;
    }

    onSave({
      id: initialTask?.id,
      title: trimmed,
      notes: notes.trim() || undefined,
      date,
      timeSlot,
      scheduledTime: scheduledTime.trim() || undefined,
      priority,
      category,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg bg-[#13151A] border border-[#252932] rounded-xl shadow-2xl shadow-black/70 overflow-hidden z-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#252932]">
          <h2
            id="task-modal-title"
            className="text-base font-semibold text-[#F3F4F6]"
          >
            {initialTask ? 'Edit task' : 'New task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1A1D24] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label
              htmlFor="task-title"
              className="block text-xs font-medium text-[#9CA3AF] mb-1.5"
            >
              Task title
            </label>
            <input
              ref={titleInputRef}
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g., Finalize architecture notes"
              className="w-full bg-[#0B0C0F] border border-[#252932] rounded-lg px-3.5 py-2.5 text-sm text-[#F3F4F6] placeholder-[#6B7280] focus:outline-none focus:border-amber-500/70"
            />
            {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
          </div>

          <div>
            <label
              htmlFor="task-notes"
              className="block text-xs font-medium text-[#9CA3AF] mb-1.5"
            >
              Notes (optional)
            </label>
            <textarea
              id="task-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add context, links, or checklist details…"
              className="w-full bg-[#0B0C0F] border border-[#252932] rounded-lg px-3.5 py-2 text-sm text-[#F3F4F6] placeholder-[#6B7280] focus:outline-none focus:border-amber-500/70 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="task-date"
                className="block text-xs font-medium text-[#9CA3AF] mb-1.5"
              >
                Date
              </label>
              <input
                id="task-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-[#0B0C0F] border border-[#252932] rounded-lg px-3 py-2 text-sm font-mono tabular-nums text-[#F3F4F6] [color-scheme:dark] focus:outline-none focus:border-amber-500/70"
              />
            </div>

            <div>
              <label
                htmlFor="task-time"
                className="block text-xs font-medium text-[#9CA3AF] mb-1.5"
              >
                Time (optional)
              </label>
              <input
                id="task-time"
                type="time"
                value={scheduledTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full bg-[#0B0C0F] border border-[#252932] rounded-lg px-3 py-2 text-sm font-mono tabular-nums text-[#F3F4F6] [color-scheme:dark] focus:outline-none focus:border-amber-500/70"
              />
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
              Time block
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#0B0C0F] border border-[#252932] rounded-lg">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => {
                    setTimeSlot(slot.id);
                    setSlotManuallyPicked(true);
                  }}
                  className={`py-2 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    timeSlot === slot.id
                      ? 'bg-[#1F232C] text-amber-300'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <span className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
                Priority
              </span>
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#0B0C0F] border border-[#252932] rounded-lg">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id)}
                    className={`py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      priority === p.id
                        ? 'bg-[#1F232C] text-amber-300'
                        : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="task-category"
                className="block text-xs font-medium text-[#9CA3AF] mb-1.5"
              >
                Category
              </label>
              <select
                id="task-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full bg-[#0B0C0F] border border-[#252932] rounded-lg px-3 py-2 text-sm text-[#F3F4F6] focus:outline-none focus:border-amber-500/70"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#252932]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#D1D5DB] hover:text-[#F3F4F6] hover:bg-[#1A1D24] rounded-lg transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-[#0B0C0F] bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap"
            >
              {initialTask ? 'Save changes' : 'Add task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
