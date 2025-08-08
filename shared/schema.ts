import { z } from 'zod';

// Enhanced schemas for comprehensive functionality
export const recurrenceSchema = z.object({
  type: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom']).default('none'),
  interval: z.number().min(1).default(1),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  endDate: z.date().optional(),
});

export const subtaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  completed: z.boolean().default(false),
});

export const milestoneSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  targetValue: z.number().min(0),
  completed: z.boolean().default(false),
  completedAt: z.date().optional(),
});

export const linkedItemsSchema = z.object({
  tasks: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
  reminders: z.array(z.string()).default([]),
  events: z.array(z.string()).default([]),
});

// Task Schema - Enhanced for enterprise features (base)
const taskSchemaBase = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']).default('P3'),
  status: z.enum(['todo', 'in-progress', 'done']).default('todo'),
  dueDate: z.date().optional(),
  startDate: z.date().optional(),
  project: z.string().optional(),
  tags: z.array(z.string()).default([]),
  location: z.string().optional(),
  group: z.string().optional(),
  recurrence: z.enum(['none', 'daily', 'weekly']).default('none'),
  subtasks: z.array(subtaskSchema).default([]),
  linkedItems: linkedItemsSchema.default({ tasks: [], goals: [], reminders: [], events: [] }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Task Schema with validation
export const taskSchema = taskSchemaBase.refine((data) => {
  // Validation: dueDate must be after startDate
  if (data.startDate && data.dueDate) {
    return data.dueDate >= data.startDate;
  }
  return true;
}, {
  message: "Due date must be after start date",
  path: ["dueDate"]
});

// Project Schema
export const projectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  color: z.string().default('#6b7280'),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Goal Schema
export const goalSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  targetValue: z.number().min(0).optional(),
  currentValue: z.number().min(0).default(0),
  unit: z.string().optional(),
  deadline: z.date().optional(),
  startDate: z.date().optional(),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']).default('P3'),
  tags: z.array(z.string()).default([]),
  location: z.string().optional(),
  isHabit: z.boolean().default(false),
  streakCount: z.number().min(0).default(0),
  lastCompletedDate: z.date().optional(),
  recurrence: recurrenceSchema.optional(),
  milestones: z.array(milestoneSchema).default([]),
  linkedItems: linkedItemsSchema.default({ tasks: [], goals: [], reminders: [], events: [] }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Reminder Schema
export const reminderSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.date(),
  endDate: z.date().optional(),
  completed: z.boolean().default(false),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']).default('P3'),
  tags: z.array(z.string()).default([]),
  location: z.string().optional(),
  recurrence: recurrenceSchema.optional(),
  linkedItems: linkedItemsSchema.default({ tasks: [], goals: [], reminders: [], events: [] }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Calendar Event Schema
export const calendarEventSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  isAllDay: z.boolean().default(false),
  color: z.string().default('#3b82f6'),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']).default('P3'),
  tags: z.array(z.string()).default([]),
  location: z.string().optional(),
  recurrence: recurrenceSchema.optional(),
  linkedItems: linkedItemsSchema.default({ tasks: [], goals: [], reminders: [], events: [] }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Insert schemas (for creation)
export const insertTaskSchema = taskSchemaBase.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = projectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGoalSchema = goalSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReminderSchema = reminderSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCalendarEventSchema = calendarEventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type Task = z.infer<typeof taskSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Project = z.infer<typeof projectSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Goal = z.infer<typeof goalSchema>;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type Reminder = z.infer<typeof reminderSchema>;
export type InsertReminder = z.infer<typeof insertReminderSchema>;

export type CalendarEvent = z.infer<typeof calendarEventSchema>;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;

export type RecurrencePattern = z.infer<typeof recurrenceSchema>;
export type Subtask = z.infer<typeof subtaskSchema>;
export type Milestone = z.infer<typeof milestoneSchema>;
export type LinkedItems = z.infer<typeof linkedItemsSchema>;