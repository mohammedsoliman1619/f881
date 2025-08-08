import Dexie, { Table } from 'dexie';
import { 
  Task, 
  Project, 
  Goal, 
  Reminder, 
  CalendarEvent,
  InsertTask,
  InsertProject,
  InsertGoal,
  InsertReminder,
  InsertCalendarEvent,
  TimeBlock,
  RecurrenceRule
} from '@shared/schema';

export interface Settings {
  id: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  firstDayOfWeek: number;
  notifications: {
    enabled: boolean;
    taskReminders: boolean;
    goalMilestones: boolean;
    dailyDigest: boolean;
  };
  privacy: {
    pinLock: boolean;
    pinCode?: string;
    biometric: boolean;
  };
}

export class ProductiFlowDB extends Dexie {
  tasks!: Table<Task>;
  projects!: Table<Project>;
  goals!: Table<Goal>;
  reminders!: Table<Reminder>;
  calendarEvents!: Table<CalendarEvent>;
  settings!: Table<Settings>;
  timeBlocks!: Table<TimeBlock>;
  recurrenceRules!: Table<RecurrenceRule>;

  constructor() {
    super('ProductiFlowDB');
    
    this.version(1).stores({
      tasks: '++id, title, completed, dueDate, startDate, priority, project, createdAt, updatedAt',
      projects: '++id, name, createdAt, updatedAt',
      goals: '++id, title, category, deadline, isHabit, streakCount, lastCompletedDate, createdAt, updatedAt',
      reminders: '++id, title, dueDate, completed, createdAt, updatedAt',
      calendarEvents: '++id, title, startDate, endDate, createdAt, updatedAt',
      settings: '++id, theme, language',
      timeBlocks: '++id, title, startTime, endTime, createdAt, updatedAt',
      recurrenceRules: '++id, frequency, interval, createdAt, updatedAt'
    });

    this.on('ready', async () => {
      try {
        const settingsCount = await this.settings.count();
        if (settingsCount === 0) {
          await this.settings.add({
            id: '1',
            theme: 'system',
            language: 'en',
            dateFormat: 'MM/dd/yyyy',
            timeFormat: '12h',
            firstDayOfWeek: 0,
            notifications: {
              enabled: true,
              taskReminders: true,
              goalMilestones: true,
              dailyDigest: false
            },
            privacy: {
              pinLock: false,
              biometric: false
            }
          } as Settings);
        }

        // Add default project if none exist
        const projectCount = await this.projects.count();
        if (projectCount === 0) {
          await this.projects.add({
            id: 'inbox',
            name: 'Inbox',
            color: '#6b7280',
            description: 'Default project for tasks',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      } catch (error) {
        console.error('Database initialization error:', error);
      }
    });
  }
}

export const db = new ProductiFlowDB();

// Database utilities
export const dbUtils = {
  async createTask(taskData: InsertTask): Promise<Task> {
    try {
      const now = new Date();
      const task: Task = {
        ...taskData,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now
      };
      await db.tasks.add(task);
      return task;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    await db.tasks.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  },

  async deleteTask(id: string): Promise<void> {
    await db.tasks.delete(id);
  },

  async createProject(projectData: InsertProject): Promise<Project> {
    const now = new Date();
    const project: Project = {
      ...projectData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    };
    await db.projects.add(project);
    return project;
  },

  async createGoal(goalData: InsertGoal): Promise<Goal> {
    const now = new Date();
    const goal: Goal = {
      ...goalData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    };
    await db.goals.add(goal);
    return goal;
  },

  async updateGoal(id: string, updates: Partial<Goal>): Promise<void> {
    await db.goals.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  },

  async createReminder(reminderData: InsertReminder): Promise<Reminder> {
    const now = new Date();
    const reminder: Reminder = {
      ...reminderData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    };
    await db.reminders.add(reminder);
    return reminder;
  },

  async createCalendarEvent(eventData: InsertCalendarEvent): Promise<CalendarEvent> {
    const now = new Date();
    const event: CalendarEvent = {
      ...eventData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    };
    await db.calendarEvents.add(event);
    return event;
  },

  async getSettings(): Promise<Settings | undefined> {
    try {
      return await db.settings.orderBy('id').first();
    } catch (error) {
      console.error('Error getting settings:', error);
      return undefined;
    }
  },

  async updateSettings(updates: Partial<Settings>): Promise<void> {
    try {
      const settings = await this.getSettings();
      if (settings) {
        await db.settings.update('1', updates);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  async exportData(): Promise<string> {
    const tasks = await db.tasks.toArray();
    const projects = await db.projects.toArray();
    const goals = await db.goals.toArray();
    const reminders = await db.reminders.toArray();
    const calendarEvents = await db.calendarEvents.toArray();
    const settings = await db.settings.toArray();

    return JSON.stringify({
      tasks,
      projects,
      goals,
      reminders,
      calendarEvents,
      settings,
      exportDate: new Date().toISOString()
    }, null, 2);
  },

  async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);
    
    await db.transaction('rw', [db.tasks, db.projects, db.goals, db.reminders, db.calendarEvents, db.settings], async () => {
      if (data.tasks) await db.tasks.bulkAdd(data.tasks);
      if (data.projects) await db.projects.bulkAdd(data.projects);
      if (data.goals) await db.goals.bulkAdd(data.goals);
      if (data.reminders) await db.reminders.bulkAdd(data.reminders);
      if (data.calendarEvents) await db.calendarEvents.bulkAdd(data.calendarEvents);
      if (data.settings) await db.settings.bulkAdd(data.settings);
    });
  },

  async resetData(): Promise<void> {
    await db.transaction('rw', [db.tasks, db.projects, db.goals, db.reminders, db.calendarEvents], async () => {
      await db.tasks.clear();
      await db.projects.clear();
      await db.goals.clear();
      await db.reminders.clear();
      await db.calendarEvents.clear();
    });
  }
};
