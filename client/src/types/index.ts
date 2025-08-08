export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: Date;
  startDate?: Date;
  priority: 'low' | 'medium' | 'high';
  projectId?: string;
  tags: string[];
  subtasks: Subtask[];
  recurrence?: RecurrencePattern;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  targetValue?: number;
  currentValue: number;
  unit?: string;
  deadline?: Date;
  isHabit: boolean;
  streakCount: number;
  lastCompletedDate?: Date;
  milestones: Milestone[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  title: string;
  targetValue: number;
  completed: boolean;
  completedAt?: Date;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  completed: boolean;
  recurrence?: RecurrencePattern;
  taskId?: string;
  goalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number;
  daysOfWeek?: number[];
  endDate?: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  color: string;
  taskId?: string;
  goalId?: string;
  reminderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    reducedMotion: boolean;
  };
  security: {
    pinEnabled: boolean;
    pin?: string;
  };
}

export interface AnalyticsData {
  completedTasksByDay: { date: string; count: number }[];
  completedTasksByProject: { project: string; count: number }[];
  goalProgress: { goal: string; progress: number }[];
  productivityScore: number;
  streaks: { type: string; count: number; date: string }[];
  timeSpent: { date: string; hours: number }[];
}

export interface AppState {
  tasks: Task[];
  projects: Project[];
  goals: Goal[];
  reminders: Reminder[];
  calendarEvents: CalendarEvent[];
  settings: Settings;
  analytics: AnalyticsData;
}

export type QuickAddType = 'task' | 'event' | 'goal' | 'reminder';

export interface QuickAddData {
  type: QuickAddType;
  text: string;
  dueDate?: Date;
  project?: string;
  priority?: 'low' | 'medium' | 'high';
}