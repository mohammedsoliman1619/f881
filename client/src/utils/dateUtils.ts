import { format, isToday, isTomorrow, isPast, isAfter, startOfWeek, endOfWeek, addDays } from 'date-fns';

export function formatDate(date: Date): string {
  if (isToday(date)) {
    return 'Today';
  } else if (isTomorrow(date)) {
    return 'Tomorrow';
  } else {
    return format(date, 'MMM dd');
  }
}

export function isDueToday(date: Date): boolean {
  return isToday(date);
}

export function isDueTomorrow(date: Date): boolean {
  return isTomorrow(date);
}

export function isOverdue(date: Date): boolean {
  return isPast(date) && !isToday(date);
}

export function formatDateTime(date: Date): string {
  return format(date, 'MMM dd, yyyy HH:mm');
}

export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

export function isAfterDate(date1: Date, date2: Date): boolean {
  return isAfter(date1, date2);
}

export function parseNaturalDate(input: string): Date | null {
  const text = input.toLowerCase().trim();
  const now = new Date();
  
  // Today
  if (text === 'today') {
    return now;
  }
  
  // Tomorrow
  if (text === 'tomorrow') {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    return tomorrow;
  }
  
  // Yesterday
  if (text === 'yesterday') {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return yesterday;
  }
  
  // Next week
  if (text === 'next week') {
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    return nextWeek;
  }
  
  // Try to parse as a standard date
  const parsed = new Date(input);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  return null;
}

export function getCurrentWeekDates(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }), // Monday
    end: endOfWeek(now, { weekStartsOn: 1 }), // Sunday
  };
}

export function getUpcomingDates(days: number): Date[] {
  const result: Date[] = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    result.push(addDays(today, i));
  }
  
  return result;
}