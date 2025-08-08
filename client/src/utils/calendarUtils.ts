import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

export function getMonthDays(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  return eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });
}

export function getWeekDays(date: Date): Date[] {
  const weekStart = startOfWeek(date);
  const weekEnd = endOfWeek(date);

  return eachDayOfInterval({
    start: weekStart,
    end: weekEnd
  });
}

export function getMonthName(date: Date): string {
  return format(date, 'MMMM yyyy');
}

export function getWeekRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(date),
    end: endOfWeek(date)
  };
}

export function navigateMonth(date: Date, direction: 'prev' | 'next'): Date {
  return direction === 'next' ? addMonths(date, 1) : subMonths(date, 1);
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function isCurrentMonth(date: Date, currentDate: Date): boolean {
  return isSameMonth(date, currentDate);
}

export function getDayOfMonth(date: Date): number {
  return date.getDate();
}

export function formatTime(date: Date): string {
  return format(date, 'h:mm a');
}

export function formatDayName(date: Date): string {
  return format(date, 'EEE');
}

export function formatMonthDay(date: Date): string {
  return format(date, 'd');
}