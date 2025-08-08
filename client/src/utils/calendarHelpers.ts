
import { format, addDays, isSameDay, startOfDay, endOfDay, parseISO } from 'date-fns';
import { Task, Event, Goal, Reminder, TimeBlock, RecurrenceRule } from '@/types';

export interface CalendarItem {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  type: 'task' | 'event' | 'goal' | 'reminder' | 'timeblock';
  color?: string;
  project?: string;
  group?: string;
  priority?: string;
  status?: string;
  notes?: string;
  isAutoRolled?: boolean;
  originalItem: Task | Event | Goal | Reminder | TimeBlock;
}

export const generateRecurringInstances = (
  rule: RecurrenceRule,
  baseItem: CalendarItem,
  startDate: Date,
  endDate: Date
): CalendarItem[] => {
  const instances: CalendarItem[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (shouldCreateInstance(rule, currentDate)) {
      const instance: CalendarItem = {
        ...baseItem,
        id: `${baseItem.id}-${format(currentDate, 'yyyy-MM-dd')}`,
        startTime: new Date(currentDate),
        endTime: baseItem.endTime ? new Date(currentDate.getTime() + (baseItem.endTime.getTime() - baseItem.startTime.getTime())) : undefined,
      };
      instances.push(instance);
    }
    currentDate = getNextRecurrenceDate(rule, currentDate);
  }

  return instances;
};

const shouldCreateInstance = (rule: RecurrenceRule, date: Date): boolean => {
  if (rule.endDate && date > new Date(rule.endDate)) return false;
  if (rule.exceptions) {
    const exceptions = JSON.parse(rule.exceptions) as string[];
    if (exceptions.includes(format(date, 'yyyy-MM-dd'))) return false;
  }

  switch (rule.frequency) {
    case 'daily':
      return true;
    case 'weekly':
      if (rule.daysOfWeek) {
        const daysOfWeek = JSON.parse(rule.daysOfWeek) as number[];
        return daysOfWeek.includes(date.getDay());
      }
      return true;
    case 'monthly':
      if (rule.dayOfMonth) {
        return date.getDate() === rule.dayOfMonth;
      }
      return true;
    case 'yearly':
      if (rule.monthOfYear && rule.dayOfMonth) {
        return date.getMonth() === rule.monthOfYear - 1 && date.getDate() === rule.dayOfMonth;
      }
      return true;
    default:
      return false;
  }
};

const getNextRecurrenceDate = (rule: RecurrenceRule, currentDate: Date): Date => {
  const interval = rule.interval || 1;
  
  switch (rule.frequency) {
    case 'daily':
      return addDays(currentDate, interval);
    case 'weekly':
      return addDays(currentDate, 7 * interval);
    case 'monthly':
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + interval);
      return nextMonth;
    case 'yearly':
      const nextYear = new Date(currentDate);
      nextYear.setFullYear(nextYear.getFullYear() + interval);
      return nextYear;
    default:
      return addDays(currentDate, 1);
  }
};

export const calculateWorkload = (items: CalendarItem[], date: Date): number => {
  const dayItems = items.filter(item => isSameDay(item.startTime, date));
  return dayItems.reduce((total, item) => total + (item.duration || 30), 0);
};

export const getWorkloadColor = (minutes: number): string => {
  if (minutes === 0) return 'bg-gray-100';
  if (minutes <= 120) return 'bg-green-200';
  if (minutes <= 240) return 'bg-yellow-200';
  if (minutes <= 360) return 'bg-orange-200';
  return 'bg-red-200';
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export const autoRolloverTasks = (tasks: Task[]): Task[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return tasks.map(task => {
    if (task.status !== 'completed' && task.dueDate) {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        return {
          ...task,
          dueDate: today.toISOString(),
          isAutoRolled: true,
        };
      }
    }
    return task;
  });
};

export const validateTimeBlock = (block: Partial<TimeBlock>): string[] => {
  const errors: string[] = [];
  
  if (!block.title?.trim()) {
    errors.push('Title is required');
  }
  
  if (!block.startTime) {
    errors.push('Start time is required');
  }
  
  if (!block.endTime) {
    errors.push('End time is required');
  }
  
  if (block.startTime && block.endTime && new Date(block.endTime) <= new Date(block.startTime)) {
    errors.push('End time must be after start time');
  }
  
  if (block.duration && block.duration <= 0) {
    errors.push('Duration must be positive');
  }
  
  return errors;
};

export const convertToCalendarItems = (
  tasks: Task[] = [],
  events: Event[] = [],
  goals: Goal[] = [],
  reminders: Reminder[] = [],
  timeBlocks: TimeBlock[] = []
): CalendarItem[] => {
  const items: CalendarItem[] = [];

  // Convert tasks
  (tasks || []).forEach(task => {
    if (task.dueDate) {
      items.push({
        id: task.id,
        title: task.title,
        description: task.description,
        startTime: new Date(task.dueDate),
        duration: task.estimatedDuration || 30,
        type: 'task',
        color: getProjectColor(task.project),
        project: task.project,
        group: task.group,
        priority: task.priority,
        status: task.status,
        isAutoRolled: task.isAutoRolled,
        originalItem: task,
      });
    }
  });

  // Convert events
  (events || []).forEach(event => {
    items.push({
      id: event.id,
      title: event.title,
      description: event.description,
      startTime: new Date(event.startDate),
      endTime: event.endDate ? new Date(event.endDate) : undefined,
      duration: event.endDate ? 
        Math.round((new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / 60000) : 
        60,
      type: 'event',
      color: getProjectColor(event.project),
      project: event.project,
      group: event.group,
      originalItem: event,
    });
  });

  // Convert goals (if they have due dates)
  (goals || []).forEach(goal => {
    if (goal.targetDate) {
      items.push({
        id: goal.id,
        title: goal.title,
        description: goal.description,
        startTime: new Date(goal.targetDate),
        duration: 30,
        type: 'goal',
        color: 'bg-purple-500',
        status: goal.status,
        originalItem: goal,
      });
    }
  });

  // Convert reminders
  (reminders || []).forEach(reminder => {
    items.push({
      id: reminder.id,
      title: reminder.title,
      description: reminder.description,
      startTime: new Date(reminder.reminderTime),
      duration: 15,
      type: 'reminder',
      color: 'bg-blue-500',
      originalItem: reminder,
    });
  });

  // Convert time blocks
  (timeBlocks || []).forEach(block => {
    items.push({
      id: block.id,
      title: block.title,
      description: block.description,
      startTime: new Date(block.startTime),
      endTime: new Date(block.endTime),
      duration: block.duration,
      type: 'timeblock',
      color: block.color || 'bg-gray-500',
      project: block.project,
      group: block.group,
      notes: block.notes,
      isAutoRolled: block.isAutoRolled,
      originalItem: block,
    });
  });

  return items.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
};

const getProjectColor = (project?: string): string => {
  if (!project) return 'bg-gray-500';
  
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-indigo-500',
    'bg-pink-500',
    'bg-teal-500',
  ];
  
  const hash = project.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};
