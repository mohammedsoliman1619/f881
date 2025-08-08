import {
  type Task,
  type InsertTask,
  type Project,
  type InsertProject,
  type Goal,
  type InsertGoal,
  type Reminder,
  type InsertReminder,
  type CalendarEvent,
  type InsertCalendarEvent
} from "@shared/schema";
import { randomUUID } from "crypto";

// Storage interface for the productivity application
export interface IStorage {
  // Task operations
  getTask(id: string): Promise<Task | undefined>;
  getTasks(): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Project operations
  getProject(id: string): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;

  // Goal operations
  getGoal(id: string): Promise<Goal | undefined>;
  getGoals(): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: string, goal: Partial<Goal>): Promise<Goal | undefined>;
  deleteGoal(id: string): Promise<boolean>;

  // Reminder operations
  getReminder(id: string): Promise<Reminder | undefined>;
  getReminders(): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: string, reminder: Partial<Reminder>): Promise<Reminder | undefined>;
  deleteReminder(id: string): Promise<boolean>;

  // Calendar Event operations
  getCalendarEvent(id: string): Promise<CalendarEvent | undefined>;
  getCalendarEvents(): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, event: Partial<CalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private tasks: Map<string, Task>;
  private projects: Map<string, Project>;
  private goals: Map<string, Goal>;
  private reminders: Map<string, Reminder>;
  private calendarEvents: Map<string, CalendarEvent>;

  constructor() {
    this.tasks = new Map();
    this.projects = new Map();
    this.goals = new Map();
    this.reminders = new Map();
    this.calendarEvents = new Map();
  }

  // Task operations
  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const now = new Date();
    const task: Task = { ...insertTask, id, createdAt: now, updatedAt: now };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, taskUpdate: Partial<Task>): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return undefined;
    
    const updatedTask: Task = { ...existingTask, ...taskUpdate, id, updatedAt: new Date() };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Project operations
  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const now = new Date();
    const project: Project = { ...insertProject, id, createdAt: now, updatedAt: now };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, projectUpdate: Partial<Project>): Promise<Project | undefined> {
    const existingProject = this.projects.get(id);
    if (!existingProject) return undefined;
    
    const updatedProject: Project = { ...existingProject, ...projectUpdate, id, updatedAt: new Date() };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Goal operations
  async getGoal(id: string): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async getGoals(): Promise<Goal[]> {
    return Array.from(this.goals.values());
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = randomUUID();
    const now = new Date();
    const goal: Goal = { ...insertGoal, id, createdAt: now, updatedAt: now };
    this.goals.set(id, goal);
    return goal;
  }

  async updateGoal(id: string, goalUpdate: Partial<Goal>): Promise<Goal | undefined> {
    const existingGoal = this.goals.get(id);
    if (!existingGoal) return undefined;
    
    const updatedGoal: Goal = { ...existingGoal, ...goalUpdate, id, updatedAt: new Date() };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }

  async deleteGoal(id: string): Promise<boolean> {
    return this.goals.delete(id);
  }

  // Reminder operations
  async getReminder(id: string): Promise<Reminder | undefined> {
    return this.reminders.get(id);
  }

  async getReminders(): Promise<Reminder[]> {
    return Array.from(this.reminders.values());
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const id = randomUUID();
    const now = new Date();
    const reminder: Reminder = { ...insertReminder, id, createdAt: now, updatedAt: now };
    this.reminders.set(id, reminder);
    return reminder;
  }

  async updateReminder(id: string, reminderUpdate: Partial<Reminder>): Promise<Reminder | undefined> {
    const existingReminder = this.reminders.get(id);
    if (!existingReminder) return undefined;
    
    const updatedReminder: Reminder = { ...existingReminder, ...reminderUpdate, id, updatedAt: new Date() };
    this.reminders.set(id, updatedReminder);
    return updatedReminder;
  }

  async deleteReminder(id: string): Promise<boolean> {
    return this.reminders.delete(id);
  }

  // Calendar Event operations
  async getCalendarEvent(id: string): Promise<CalendarEvent | undefined> {
    return this.calendarEvents.get(id);
  }

  async getCalendarEvents(): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEvents.values());
  }

  async createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const id = randomUUID();
    const now = new Date();
    const event: CalendarEvent = { ...insertEvent, id, createdAt: now, updatedAt: now };
    this.calendarEvents.set(id, event);
    return event;
  }

  async updateCalendarEvent(id: string, eventUpdate: Partial<CalendarEvent>): Promise<CalendarEvent | undefined> {
    const existingEvent = this.calendarEvents.get(id);
    if (!existingEvent) return undefined;
    
    const updatedEvent: CalendarEvent = { ...existingEvent, ...eventUpdate, id, updatedAt: new Date() };
    this.calendarEvents.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteCalendarEvent(id: string): Promise<boolean> {
    return this.calendarEvents.delete(id);
  }
}

export const storage = new MemStorage();
