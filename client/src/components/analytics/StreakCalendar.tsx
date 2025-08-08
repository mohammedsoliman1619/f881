import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/lib/store';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isToday } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Target, Zap } from 'lucide-react';

interface StreakCalendarProps {
  currentDate?: Date;
}

export function StreakCalendar({ currentDate = new Date() }: StreakCalendarProps) {
  const { t } = useTranslation();
  const { tasks, goals } = useAppStore();

  // Calculate activity data for each day
  const activityData = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    const days = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd
    });

    return days.map(day => {
      // Count completed tasks for this day
      const completedTasks = tasks.filter(task => 
        task.completed && 
        task.updatedAt && 
        isSameDay(task.updatedAt, day)
      ).length;

      // Count completed goals/habits for this day
      const completedGoals = goals.filter(goal => 
        goal.lastCompletedDate && 
        isSameDay(goal.lastCompletedDate, day)
      ).length;

      const totalActivity = completedTasks + completedGoals;

      // Determine intensity level
      let intensity = 0;
      if (totalActivity >= 5) intensity = 4;
      else if (totalActivity >= 3) intensity = 3;
      else if (totalActivity >= 2) intensity = 2;
      else if (totalActivity >= 1) intensity = 1;

      return {
        date: day,
        completedTasks,
        completedGoals,
        totalActivity,
        intensity,
        isCurrentMonth: day >= monthStart && day <= monthEnd,
        isToday: isToday(day)
      };
    });
  }, [currentDate, tasks, goals]);

  // Calculate streak statistics
  const streakStats = useMemo(() => {
    const today = new Date();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Sort activity data by date (newest first)
    const sortedData = activityData
      .filter(day => day.isCurrentMonth && day.date <= today)
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    // Calculate current streak (from today backwards)
    for (const day of sortedData) {
      if (day.totalActivity > 0) {
        if (currentStreak === 0 || isSameDay(day.date, new Date(Date.now() - currentStreak * 24 * 60 * 60 * 1000))) {
          currentStreak++;
        } else {
          break;
        }
      } else if (currentStreak === 0) {
        // If today has no activity, current streak is 0
        break;
      }
    }

    // Calculate longest streak
    for (const day of sortedData.reverse()) {
      if (day.totalActivity > 0) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    const totalActiveDays = sortedData.filter(day => day.totalActivity > 0).length;
    const totalTasks = sortedData.reduce((sum, day) => sum + day.completedTasks, 0);
    const totalGoals = sortedData.reduce((sum, day) => sum + day.completedGoals, 0);

    return {
      currentStreak,
      longestStreak,
      totalActiveDays,
      totalTasks,
      totalGoals
    };
  }, [activityData]);

  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 0: return 'bg-muted';
      case 1: return 'bg-emerald-200 dark:bg-emerald-900/30';
      case 2: return 'bg-emerald-300 dark:bg-emerald-800/50';
      case 3: return 'bg-emerald-400 dark:bg-emerald-700/70';
      case 4: return 'bg-emerald-500 dark:bg-emerald-600';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Streak Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">{t('analytics.current_streak')}</p>
                <p className="text-2xl font-bold">{streakStats.currentStreak}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">{t('analytics.longest_streak')}</p>
                <p className="text-2xl font-bold">{streakStats.longestStreak}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('analytics.active_days')}</p>
              <p className="text-2xl font-bold">{streakStats.totalActiveDays}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('analytics.total_completed')}</p>
              <p className="text-2xl font-bold">{streakStats.totalTasks + streakStats.totalGoals}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streak Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5" />
            <span>{t('analytics.activity_calendar')}</span>
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {format(currentDate, 'MMMM yyyy')}
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="space-y-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 text-xs font-medium text-muted-foreground">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center p-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {activityData.map((day, index) => (
                <div
                  key={index}
                  className={`
                    relative h-8 w-8 rounded-sm border transition-colors cursor-pointer
                    ${getIntensityColor(day.intensity)}
                    ${day.isCurrentMonth ? 'border-border' : 'border-transparent opacity-30'}
                    ${day.isToday ? 'ring-2 ring-primary ring-offset-1' : ''}
                    hover:ring-2 hover:ring-accent hover:ring-offset-1
                  `}
                  title={`
                    ${format(day.date, 'MMM d, yyyy')}
                    ${day.totalActivity > 0 ? 
                      `\n${day.completedTasks} tasks, ${day.completedGoals} goals` : 
                      '\nNo activity'
                    }
                  `}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`
                      text-xs font-medium
                      ${day.intensity >= 3 ? 'text-white' : 'text-foreground'}
                      ${!day.isCurrentMonth ? 'text-muted-foreground' : ''}
                    `}>
                      {format(day.date, 'd')}
                    </span>
                  </div>
                  
                  {/* Activity indicator */}
                  {day.totalActivity > 0 && (
                    <div className="absolute -top-1 -right-1">
                      <div className={`
                        w-2 h-2 rounded-full
                        ${day.intensity >= 3 ? 'bg-white' : 'bg-primary'}
                      `} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t('analytics.less_active')}</span>
              <div className="flex items-center space-x-1">
                {[0, 1, 2, 3, 4].map(level => (
                  <div
                    key={level}
                    className={`w-3 h-3 rounded-sm ${getIntensityColor(level)}`}
                  />
                ))}
              </div>
              <span>{t('analytics.more_active')}</span>
            </div>
          </div>

          {/* Activity Breakdown */}
          <div className="mt-6 space-y-2">
            <h4 className="font-medium">{t('analytics.activity_breakdown')}</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>{streakStats.totalTasks} {t('analytics.tasks_completed')}</span>
              </Badge>
              <Badge variant="outline" className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span>{streakStats.totalGoals} {t('analytics.goals_completed')}</span>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}