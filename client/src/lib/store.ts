import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  Task,
  Project,
  Goal,
  Reminder,
  CalendarEvent,
  TimeBlock,
  RecurrenceRule,
  InsertTask,
  InsertProject,
  InsertGoal,
  InsertReminder,
  InsertCalendarEvent,
  NewTask,
  NewTimeBlock,
  NewRecurrenceRule
} from '@shared/schema';
import { db, dbUtils, Settings } from './db';

export interface AnalyticsData {
  completedTasksByDay: { date: string; count: number }[];
  completedTasksByProject: { project: string; count: number }[];
  goalProgress: { goal: string; progress: number }[];
  productivityScore: number;
  streaks: { type: string; count: number; date: string }[];
  timeSpent: { date: string; hours: number }[];
}

export interface QuickAddData {
  type: 'task' | 'event' | 'goal' | 'reminder';
  title: string;
  text?: string;
  description?: string;
  dueDate?: Date;
  project?: string;
  priority?: string;
}

interface AppStore {
  // Data
  tasks: Task[];
  projects: Project[];
  goals: Goal[];
  reminders: Reminder[];
  calendarEvents: CalendarEvent[];
  timeBlocks: TimeBlock[];
  recurrenceRules: RecurrenceRule[];
  settings: Settings | null;
  analytics: AnalyticsData | null;

  // UI State
  currentPage: string;
  isQuickAddOpen: boolean;
  isMobileMenuOpen: boolean;
  isLoading: boolean;

  // Actions
  setCurrentPage: (page: string) => void;
  setQuickAddOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;

  // Data Actions
  loadTasks: () => Promise<void>;
  loadProjects: () => Promise<void>;
  loadGoals: () => Promise<void>;
  loadReminders: () => Promise<void>;
  loadCalendarEvents: () => Promise<void>;
  loadTimeBlocks: () => Promise<void>;
  loadRecurrenceRules: () => Promise<void>;
  loadSettings: () => Promise<void>;
  loadAnalytics: () => Promise<void>;

  createTask: (taskData: InsertTask) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;

  createProject: (projectData: InsertProject) => Promise<void>;

  createGoal: (goalData: InsertGoal) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  updateGoalProgress: (id: string, value: number) => Promise<void>;

  createReminder: (reminderData: InsertReminder) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;

  // Time Blocks
  createTimeBlock: (timeBlock: NewTimeBlock) => Promise<void>;
  updateTimeBlock: (id: string, updates: Partial<TimeBlock>) => Promise<void>;
  deleteTimeBlock: (id: string) => Promise<void>;

  // Recurrence Rules
  createRecurrenceRule: (rule: NewRecurrenceRule) => Promise<void>;
  updateRecurrenceRule: (id: string, updates: Partial<RecurrenceRule>) => Promise<void>;
  deleteRecurrenceRule: (id: string) => Promise<void>;

  createCalendarEvent: (eventData: InsertCalendarEvent) => Promise<void>;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;

  updateSettings: (updates: Partial<Settings>) => Promise<void>;

  handleQuickAdd: (data: QuickAddData) => Promise<void>;

  initializeApp: () => Promise<void>;
}

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    tasks: [],
    projects: [],
    goals: [],
    reminders: [],
    calendarEvents: [],
    timeBlocks: [],
    recurrenceRules: [],
    settings: null,
    analytics: null,
    currentPage: 'dashboard',
    isQuickAddOpen: false,
    isMobileMenuOpen: false,
    isLoading: false,

    // UI Actions
    setCurrentPage: (page) => set({ currentPage: page }),
    setQuickAddOpen: (open) => set({ isQuickAddOpen: open }),
    setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

    // Data Loading Actions
    loadTasks: async () => {
      try {
        await db.ready;
        const tasks = await db.tasks.orderBy('createdAt').reverse().toArray();
        set({ tasks });
      } catch (error) {
        console.error('Error loading tasks:', error);
        set({ tasks: [] });
      }
    },

    loadProjects: async () => {
      try {
        await db.ready;
        const projects = await db.projects.orderBy('name').toArray();
        set({ projects });
      } catch (error) {
        console.error('Error loading projects:', error);
        set({ projects: [] });
      }
    },

    loadGoals: async () => {
      try {
        await db.ready;
        const goals = await db.goals.orderBy('createdAt').reverse().toArray();
        set({ goals });
      } catch (error) {
        console.error('Error loading goals:', error);
        set({ goals: [] });
      }
    },

    loadReminders: async () => {
      try {
        await db.ready;
        const reminders = await db.reminders.orderBy('dueDate').toArray();
        set({ reminders });
      } catch (error) {
        console.error('Error loading reminders:', error);
        set({ reminders: [] });
      }
    },

    loadCalendarEvents: async () => {
      try {
        await db.ready;
        const calendarEvents = await db.calendarEvents.orderBy('startDate').toArray();
        set({ calendarEvents });
      } catch (error) {
        console.error('Error loading calendar events:', error);
        set({ calendarEvents: [] });
      }
    },

    loadTimeBlocks: async () => {
      try {
        await db.ready;
        const timeBlocks = await db.timeBlocks?.orderBy('startTime').toArray() || [];
        set({ timeBlocks });
      } catch (error) {
        console.error('Error loading time blocks:', error);
        set({ timeBlocks: [] });
      }
    },

    loadRecurrenceRules: async () => {
      try {
        await db.ready;
        const recurrenceRules = await db.recurrenceRules?.orderBy('createdAt').toArray() || [];
        set({ recurrenceRules });
      } catch (error) {
        console.error('Error loading recurrence rules:', error);
        set({ recurrenceRules: [] });
      }
    },

    loadSettings: async () => {
      const settings = await dbUtils.getSettings();
      set({ settings });
    },

    loadAnalytics: async () => {
      const { tasks, goals } = get();
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Calculate completed tasks by day
      const completedTasksByDay = tasks
        .filter(task => task.completed && task.updatedAt >= thirtyDaysAgo)
        .reduce((acc, task) => {
          const date = task.updatedAt.toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      // Calculate completed tasks by project
      const { projects } = get();
      const completedTasksByProject = tasks
        .filter(task => task.completed)
        .reduce((acc, task) => {
          const project = projects.find(p => p.id === task.project)?.name || 'No Project';
          acc[project] = (acc[project] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      // Calculate goal progress
      const goalProgress = goals.map(goal => ({
        goal: goal.title,
        progress: goal.targetValue ? (goal.currentValue / goal.targetValue) * 100 : 0
      }));

      // Calculate productivity score (simplified)
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.completed).length;
      const productivityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Calculate streaks
      const streaks = goals
        .filter(goal => goal.isHabit && goal.streakCount > 0)
        .map(goal => ({
          type: goal.title,
          count: goal.streakCount,
          date: goal.lastCompletedDate?.toISOString().split('T')[0] || ''
        }));

      const analytics: AnalyticsData = {
        completedTasksByDay: Object.entries(completedTasksByDay).map(([date, count]) => ({ date, count })),
        completedTasksByProject: Object.entries(completedTasksByProject).map(([project, count]) => ({ project, count })),
        goalProgress,
        productivityScore,
        streaks,
        timeSpent: [] // Simplified for now
      };

      set({ analytics });
    },

    // Task Actions
    createTask: async (taskData) => {
      await dbUtils.createTask(taskData);
      await get().loadTasks();
      await get().loadAnalytics();
    },

    updateTask: async (id, updates) => {
      await dbUtils.updateTask(id, updates);
      await get().loadTasks();
      await get().loadAnalytics();
    },

    deleteTask: async (id) => {
      await dbUtils.deleteTask(id);
      await get().loadTasks();
      await get().loadAnalytics();
    },

    toggleTaskCompletion: async (id) => {
      const task = get().tasks.find(t => t.id === id);
      if (task) {
        await dbUtils.updateTask(id, { completed: !task.completed });
        await get().loadTasks();
        await get().loadAnalytics();
      }
    },

    // Project Actions
    createProject: async (projectData) => {
      await dbUtils.createProject(projectData);
      await get().loadProjects();
    },

    // Goal Actions
    createGoal: async (goalData) => {
      await dbUtils.createGoal(goalData);
      await get().loadGoals();
      await get().loadAnalytics();
    },

    updateGoal: async (id, updates) => {
      await dbUtils.updateGoal(id, updates);
      await get().loadGoals();
      await get().loadAnalytics();
    },

    updateGoalProgress: async (id, value) => {
      const goal = get().goals.find(g => g.id === id);
      if (goal) {
        const updates: Partial<Goal> = { currentValue: value };

        if (goal.isHabit && value > goal.currentValue) {
          const today = new Date().toDateString();
          const lastCompleted = goal.lastCompletedDate?.toDateString();

          if (lastCompleted !== today) {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
            updates.streakCount = lastCompleted === yesterday ? goal.streakCount + 1 : 1;
            updates.lastCompletedDate = new Date();
          }
        }

        await dbUtils.updateGoal(id, updates);
        await get().loadGoals();
        await get().loadAnalytics();
      }
    },

    // Reminder Actions
    createReminder: async (reminderData) => {
      await dbUtils.createReminder(reminderData);
      await get().loadReminders();
    },

    deleteReminder: async (id: string) => {
      await db.reminders.delete(id);
      await get().loadReminders();
    },

    // Time Blocks
    createTimeBlock: async (timeBlock: NewTimeBlock) => {
      try {
        await db.ready;
        const newTimeBlock: TimeBlock = {
          ...timeBlock,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await db.timeBlocks.add(newTimeBlock);
        await get().loadTimeBlocks();
      } catch (error) {
        console.error('Error creating time block:', error);
      }
    },

    updateTimeBlock: async (id: string, updates: Partial<TimeBlock>) => {
      try {
        await db.ready;
        await db.timeBlocks.update(id, {
          ...updates,
          updatedAt: new Date().toISOString()
        });
        await get().loadTimeBlocks();
      } catch (error) {
        console.error('Error updating time block:', error);
      }
    },

    deleteTimeBlock: async (id: string) => {
      try {
        await db.ready;
        await db.timeBlocks.delete(id);
        await get().loadTimeBlocks();
      } catch (error) {
        console.error('Error deleting time block:', error);
      }
    },

    // Recurrence Rules
    createRecurrenceRule: async (rule: NewRecurrenceRule) => {
      try {
        await db.ready;
        const newRule: RecurrenceRule = {
          ...rule,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await db.recurrenceRules.add(newRule);
        await get().loadRecurrenceRules();
      } catch (error) {
        console.error('Error creating recurrence rule:', error);
      }
    },

    updateRecurrenceRule: async (id: string, updates: Partial<RecurrenceRule>) => {
      try {
        await db.ready;
        await db.recurrenceRules.update(id, {
          ...updates,
          updatedAt: new Date().toISOString()
        });
        await get().loadRecurrenceRules();
      } catch (error) {
        console.error('Error updating recurrence rule:', error);
      }
    },

    deleteRecurrenceRule: async (id: string) => {
      try {
        await db.ready;
        await db.recurrenceRules.delete(id);
        await get().loadRecurrenceRules();
      } catch (error) {
        console.error('Error deleting recurrence rule:', error);
      }
    },

    // Calendar Actions
    createCalendarEvent: async (eventData) => {
      await dbUtils.createCalendarEvent(eventData);
      await get().loadCalendarEvents();
    },

    updateCalendarEvent: async (id: string, updates: Partial<CalendarEvent>) => {
      try {
        await db.ready;
        await db.calendarEvents.update(id, {
          ...updates,
          updatedAt: new Date()
        });
        await get().loadCalendarEvents();
      } catch (error) {
        console.error('Error updating calendar event:', error);
      }
    },

    // Settings Actions
    updateSettings: async (updates) => {
      await dbUtils.updateSettings(updates);
      await get().loadSettings();
    },

    // Quick Add Action
    handleQuickAdd: async (data) => {
      const { type, title, text, dueDate, project, priority } = data;

      switch (type) {
        case 'task':
          await get().createTask({
            title: text || title,
            description: '',
            completed: false,
            status: 'todo',
            dueDate,
            priority: (priority as any) || 'P3',
            project: project === 'none' ? undefined : project,
            tags: [],
            recurrence: 'none',
            subtasks: [],
            linkedItems: { tasks: [], goals: [], reminders: [], events: [] }
          });
          break;
        case 'event':
          const startDate = dueDate || new Date();
          const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later
          await get().createCalendarEvent({
            title: text || title,
            startDate,
            endDate,
            isAllDay: false,
            color: '#3b82f6',
            priority: 'P3',
            tags: [],
            linkedItems: { tasks: [], goals: [], reminders: [], events: [] }
          });
          break;
        case 'goal':
          await get().createGoal({
            title: text || title,
            category: 'personal',
            currentValue: 0,
            isHabit: false,
            streakCount: 0,
            milestones: [],
            priority: 'P3',
            tags: [],
            linkedItems: { tasks: [], goals: [], reminders: [], events: [] }
          });
          break;
        case 'reminder':
          await get().createReminder({
            title: text || title,
            dueDate: dueDate || new Date(),
            completed: false,
            priority: 'P3',
            tags: [],
            linkedItems: { tasks: [], goals: [], reminders: [], events: [] }
          });
          break;
      }

      set({ isQuickAddOpen: false });
    },

    // App Initialization
    initializeApp: async () => {
      set({ isLoading: true });
      try {
        await Promise.all([
          get().loadTasks(),
          get().loadProjects(),
          get().loadGoals(),
          get().loadReminders(),
          get().loadCalendarEvents(),
          get().loadTimeBlocks(),
          get().loadRecurrenceRules(),
          get().loadSettings()
        ]);
        await get().loadAnalytics();
      } finally {
        set({ isLoading: false });
      }
    }
  }))
);

// Subscribe to task/goal changes to update analytics
useAppStore.subscribe(
  (state) => ({ tasks: state.tasks, goals: state.goals }),
  async () => {
    const store = useAppStore.getState();
    await store.loadAnalytics();
  },
  { equalityFn: (a, b) => a.tasks.length === b.tasks.length && a.goals.length === b.goals.length }
);