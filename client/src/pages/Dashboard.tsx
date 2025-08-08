import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatTime, isDueToday, isOverdue } from '@/utils/dateUtils';
import {
  CheckSquare,
  Target,
  Flame,
  Clock,
  Plus,
  Check,
  ArrowRight
} from 'lucide-react';

export function Dashboard() {
  const { t } = useTranslation();
  const { tasks, goals, reminders, analytics, toggleTaskCompletion, setQuickAddOpen, setCurrentPage } = useAppStore();
  
  // Real-time task statistics with live sync
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(task => task.completed).length,
    inProgress: tasks.filter(task => task.status === 'in-progress').length,
    overdue: tasks.filter(task => !task.completed && task.dueDate && isOverdue(task.dueDate)).length,
    highPriority: tasks.filter(task => task.priority === 'P1').length,
  };

  // Calculate statistics
  const todayTasks = tasks.filter(task => !task.completed && task.dueDate && isDueToday(task.dueDate));
  const completedGoals = goals.filter(goal => goal.targetValue && goal.currentValue >= goal.targetValue);
  const activeStreak = Math.max(...goals.map(goal => goal.streakCount), 0);
  const completedTasksToday = tasks.filter(task => 
    task.completed && 
    task.updatedAt.toDateString() === new Date().toDateString()
  );

  // Get upcoming events
  const upcomingReminders = reminders
    .filter(reminder => !reminder.completed && reminder.dueDate > new Date())
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 3);

  // Get active goals with progress
  const activeGoals = goals
    .filter(goal => !goal.targetValue || goal.currentValue < goal.targetValue)
    .slice(0, 3);

  const stats = [
    {
      title: t('dashboard.tasks_due_today'),
      value: todayTasks.length.toString(),
      change: taskStats.overdue > 0 ? t('dashboard.overdue_warning') : t('dashboard.on_track'),
      icon: CheckSquare,
      color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
    },
    {
      title: t('dashboard.completed_goals'),
      value: completedGoals.length.toString(),
      change: `${taskStats.completed}/${taskStats.total} ${t('dashboard.tasks_completed')}`,
      icon: Target,
      color: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
    },
    {
      title: t('dashboard.active_streak'),
      value: `${activeStreak} ${t('common.days')}`,
      change: taskStats.inProgress > 0 ? t('dashboard.tasks_in_progress', { count: taskStats.inProgress }) : t('dashboard.no_active_tasks'),
      icon: Flame,
      color: 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
    },
    {
      title: t('dashboard.high_priority_tasks'),
      value: taskStats.highPriority.toString(),
      change: taskStats.highPriority > 0 ? t('dashboard.priority_attention') : t('dashboard.priority_clear'),
      icon: Clock,
      color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h2 className="text-hierarchy-1">{t('dashboard.welcome_back')}</h2>
        <p className="text-muted-foreground">{t('dashboard.today_summary')}</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-hierarchy-small text-muted-foreground">{stat.title}</p>
                    <p className="text-hierarchy-1 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-hierarchy-small">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">{stat.change}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('dashboard.todays_tasks')}</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCurrentPage('tasks')}
              >
                {t('actions.view_all')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayTasks.length === 0 ? (
                <div className="text-center py-6">
                  <CheckSquare className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">{t('dashboard.no_tasks_today')}</p>
                  <p className="text-sm text-muted-foreground">{t('dashboard.add_task_suggestion')}</p>
                </div>
              ) : (
                todayTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`w-5 h-5 rounded border-2 p-0 ${
                        task.completed
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground hover:border-primary'
                      }`}
                      onClick={() => toggleTaskCompletion(task.id)}
                    >
                      {task.completed && <Check className="w-3 h-3" />}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-hierarchy-small font-medium truncate ${
                        task.completed ? 'line-through text-muted-foreground' : ''
                      }`}>
                        {task.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-muted-foreground">Work</span>
                        {task.dueDate && (
                          <span className={`text-xs ${
                            isOverdue(task.dueDate) ? 'text-destructive' : 'text-muted-foreground'
                          }`}>
                            {formatTime(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={
                      task.priority === 'P1' ? 'destructive' :
                      task.priority === 'P2' ? 'secondary' : 'outline'
                    }>
                      {t(`tasks.priority.${task.priority}`)}
                    </Badge>
                  </div>
                ))
              )}
              
              {/* Quick Add Task */}
              <div className="pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setQuickAddOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('tasks.add_task')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events & Goals */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.upcoming')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingReminders.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">{t('common.no_data')}</p>
              ) : (
                upcomingReminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-hierarchy-small font-medium">{reminder.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(reminder.dueDate)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Active Goals */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.active_goals')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeGoals.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">{t('common.no_data')}</p>
              ) : (
                activeGoals.map((goal) => (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-hierarchy-small font-medium">{goal.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {goal.currentValue}/{goal.targetValue || '∞'}
                      </span>
                    </div>
                    <Progress 
                      value={goal.targetValue ? (goal.currentValue / goal.targetValue) * 100 : 0} 
                      className="h-2"
                    />
                    {goal.isHabit && goal.streakCount > 0 && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        {goal.streakCount} {t('goals.streak')}
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity & Analytics Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recent_activity')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {completedTasksToday.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">{t('common.no_data')}</p>
            ) : (
              completedTasksToday.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-hierarchy-small">Completed "{task.title}"</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(task.updatedAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Productivity Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('dashboard.this_week')}</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setCurrentPage('analytics')}
            >
              {t('actions.view_all')}
            </Button>
          </CardHeader>
          <CardContent>
            {analytics ? (
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-2xl font-bold">{analytics.productivityScore}%</p>
                  <p className="text-hierarchy-small text-muted-foreground">
                    {t('analytics.productivity_score')}
                  </p>
                </div>
                <div className="space-y-2">
                  {analytics.completedTasksByDay.slice(-5).map((day, index) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-hierarchy-small text-muted-foreground">
                        {formatDate(new Date(day.date))}
                      </span>
                      <div className="flex-1 mx-3">
                        <Progress value={(day.count / 15) * 100} className="h-2" />
                      </div>
                      <span className="text-hierarchy-small font-medium">
                        {day.count} tasks
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">{t('common.no_data')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
