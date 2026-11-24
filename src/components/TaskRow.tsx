import {
  Check,
  Clock,
  Flag,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  CATEGORIES,
  Priority,
  TaskItem,
  TIME_SLOTS,
  TimeSlot,
} from '../types/planner';

interface TaskRowProps {
  task: TaskItem;
  onToggleComplete: (id: string) => void;
  onEdit: (task: TaskItem) => void;
  onDelete: (id: string) => void;
  onChangeTimeSlot: (id: string, nextSlot: TimeSlot) => void;
}

const PRIORITY_STYLES: Record<
  Priority,
  { label: string; textClass: string }
> = {
  high: { label: 'High priority', textClass: 'text-red-400' },
  medium: { label: 'Medium priority', textClass: 'text-amber-400' },
  low: { label: 'Low priority', textClass: 'text-[#6B7280]' },
};

export function TaskRow({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onChangeTimeSlot,
}: TaskRowProps) {
  const categoryLabel =
    CATEGORIES.find((c) => c.id === task.category)?.label ?? task.category;
  const priorityInfo = PRIORITY_STYLES[task.priority];

  return (
    <div
      className={`group flex items-start justify-between gap-3 px-3.5 py-3 rounded-lg border transition-colors ${
        task.completed
          ? 'bg-[#0F1115] border-[#1E222B]'
          : 'bg-[#13151A] border-[#252932] hover:border-[#323846] hover:bg-[#161920]'
      }`}
    >
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onToggleComplete(task.id)}
          aria-label={
            task.completed
              ? `Mark "${task.title}" as incomplete`
              : `Mark "${task.title}" as complete`
          }
          aria-pressed={task.completed}
          className="w-10 h-10 -m-2 flex items-center justify-center shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70"
        >
          <span
            className={`w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center transition-colors ${
              task.completed
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400'
                : 'border-[#3B4252] bg-[#0B0C0F] group-hover:border-amber-500/60 text-transparent'
            }`}
          >
            <Check className="w-3 h-3 stroke-[2.5]" />
          </span>
        </button>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-baseline gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onEdit(task)}
              className={`text-left text-[15px] leading-snug font-medium transition-colors focus-visible:outline-none focus-visible:underline ${
                task.completed
                  ? 'line-through text-[#6B7280]'
                  : 'text-[#F3F4F6] hover:text-amber-200'
              }`}
            >
              {task.title}
            </button>
          </div>

          {task.notes && (
            <p
              className={`mt-1 text-xs leading-relaxed line-clamp-2 ${
                task.completed ? 'text-[#4B5563]' : 'text-[#9CA3AF]'
              }`}
            >
              {task.notes}
            </p>
          )}

          {/* Clean unboxed metadata row with typographic separators */}
          <div className="mt-1.5 flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-[#9CA3AF]">
            {task.scheduledTime && (
              <>
                <span className="inline-flex items-center gap-1 font-mono tabular-nums text-[#D1D5DB]">
                  <Clock className="w-3 h-3 text-[#6B7280]" aria-hidden="true" />
                  {task.scheduledTime}
                </span>
                <span className="text-[#4B5563]" aria-hidden="true">
                  ·
                </span>
              </>
            )}

            <span className="text-[#9CA3AF]">{categoryLabel}</span>

            <span className="text-[#4B5563]" aria-hidden="true">
              ·
            </span>

            <span
              className={`inline-flex items-center gap-1 ${priorityInfo.textClass}`}
            >
              <Flag className="w-3 h-3" aria-hidden="true" />
              <span>{priorityInfo.label}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1 shrink-0 pt-0.5">
        <select
          value={task.timeSlot}
          onChange={(e) =>
            onChangeTimeSlot(task.id, e.target.value as TimeSlot)
          }
          aria-label={`Move "${task.title}" to time block`}
          className="hidden sm:block bg-[#0B0C0F] border border-[#252932] hover:border-[#353B48] rounded-md px-2 py-1 text-xs text-[#9CA3AF] focus:outline-none focus:border-amber-500/60 cursor-pointer"
        >
          {TIME_SLOTS.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {slot.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label={`Edit "${task.title}"`}
          title="Edit task"
          className="p-2 rounded-md text-[#6B7280] hover:text-[#F3F4F6] hover:bg-[#1F232C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(task.id)}
          aria-label={`Delete "${task.title}"`}
          title="Delete task"
          className="p-2 rounded-md text-[#6B7280] hover:text-red-400 hover:bg-red-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
