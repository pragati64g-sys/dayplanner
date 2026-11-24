import { TimeSlot } from '../types/planner';

export function toLocalDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayISO(): string {
  return toLocalDateISO(new Date());
}

export function addDaysISO(baseISO: string, deltaDays: number): string {
  const [y, m, d] = baseISO.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  return toLocalDateISO(dt);
}

export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatAgendaHeadingDate(iso: string): string {
  const dt = parseLocalDate(iso);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(dt);
}

export function formatShortDate(iso: string): string {
  const dt = parseLocalDate(iso);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(dt);
}

export function getRelativeDayLabel(iso: string): string {
  const today = getTodayISO();
  if (iso === today) return 'Today';
  if (iso === addDaysISO(today, 1)) return 'Tomorrow';
  if (iso === addDaysISO(today, -1)) return 'Yesterday';
  return parseLocalDate(iso).toLocaleDateString('en-US', { weekday: 'short' });
}

export function inferTimeSlotFromTime(timeStr?: string): TimeSlot {
  if (!timeStr) return 'anytime';
  const hour = Number(timeStr.split(':')[0]);
  if (Number.isNaN(hour)) return 'anytime';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
