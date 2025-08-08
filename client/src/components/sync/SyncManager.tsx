import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { db } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

export function SyncManager() {
  const { toast } = useToast();
  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const lastSyncRef = useRef<Date>(new Date());
  
  const {
    tasks,
    goals,
    reminders,
    calendarEvents,
    loadTasks,
    loadGoals,
    loadReminders,
    loadCalendarEvents,
    loadAnalytics
  } = useAppStore();

  // Real-time sync functionality
  useEffect(() => {
    const syncData = async () => {
      try {
        // Check if there are local changes that need syncing
        const now = new Date();
        const lastSync = lastSyncRef.current;
        
        // Load fresh data from database
        await Promise.all([
          loadTasks(),
          loadGoals(),
          loadReminders(),
          loadCalendarEvents(),
          loadAnalytics()
        ]);

        // Update last sync time
        lastSyncRef.current = now;

        // Optional: Show sync status
        console.log('Data synchronized at:', now.toISOString());
        
      } catch (error) {
        console.error('Sync error:', error);
        toast({
          title: 'Sync Error',
          description: 'Failed to synchronize data. Please check your connection.',
          variant: 'destructive',
        });
      }
    };

    // Initial sync
    syncData();

    // Set up periodic sync (every 30 seconds for real-time feel)
    syncIntervalRef.current = setInterval(syncData, 30000);

    // Sync on window focus (when user returns to the app)
    const handleFocus = () => {
      syncData();
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadTasks, loadGoals, loadReminders, loadCalendarEvents, loadAnalytics, toast]);

  // Sync when critical data changes
  useEffect(() => {
    const syncOnChange = async () => {
      try {
        // Reload analytics when tasks/goals change
        await loadAnalytics();
      } catch (error) {
        console.error('Analytics sync error:', error);
      }
    };

    syncOnChange();
  }, [tasks, goals, loadAnalytics]);

  // Calendar sync functionality
  useEffect(() => {
    const syncCalendarEvents = async () => {
      try {
        // Sync tasks with due dates to calendar
        const tasksWithDueDates = tasks.filter(task => 
          task.dueDate && !task.completed
        );

        for (const task of tasksWithDueDates) {
          // Check if calendar event already exists for this task
          const existingEvent = calendarEvents.find(event => 
            event.linkedItems?.tasks?.includes(task.id)
          );

          if (!existingEvent && task.dueDate) {
            // Create calendar event for task
            const { createCalendarEvent } = useAppStore.getState();
            await createCalendarEvent({
              title: `Task: ${task.title}`,
              description: task.description,
              startDate: task.startDate || task.dueDate,
              endDate: task.dueDate,
              isAllDay: !task.startDate,
              color: getPriorityColor(task.priority),
              priority: task.priority,
              tags: task.tags,
              location: task.location,
              linkedItems: { 
                tasks: [task.id], 
                goals: [], 
                reminders: [], 
                events: [] 
              }
            });
          }
        }

        // Sync goals with deadlines to calendar
        const goalsWithDeadlines = goals.filter(goal => 
          goal.deadline && goal.currentValue < (goal.targetValue || 0)
        );

        for (const goal of goalsWithDeadlines) {
          const existingEvent = calendarEvents.find(event => 
            event.linkedItems?.goals?.includes(goal.id)
          );

          if (!existingEvent && goal.deadline) {
            const { createCalendarEvent } = useAppStore.getState();
            await createCalendarEvent({
              title: `Goal Deadline: ${goal.title}`,
              description: goal.description,
              startDate: goal.deadline,
              endDate: goal.deadline,
              isAllDay: true,
              color: '#10b981',
              priority: 'P2',
              tags: goal.tags,
              linkedItems: { 
                tasks: [], 
                goals: [goal.id], 
                reminders: [], 
                events: [] 
              }
            });
          }
        }

      } catch (error) {
        console.error('Calendar sync error:', error);
      }
    };

    syncCalendarEvents();
  }, [tasks, goals, calendarEvents]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1': return '#ef4444';
      case 'P2': return '#f59e0b';
      case 'P3': return '#3b82f6';
      case 'P4': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  // Component doesn't render anything - it's just for side effects
  return null;
}