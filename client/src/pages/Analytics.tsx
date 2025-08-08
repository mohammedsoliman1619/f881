import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/lib/store';
import { formatDate } from '@/utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StreakCalendar } from '@/components/analytics/StreakCalendar';
import {
  BarChart3,
  TrendingUp,
  Target,
  CheckCircle,
  Flame,
  Calendar,
  Clock,
  Award
} from 'lucide-react';

export function Analytics() {
  const { t } = useTranslation();
  const { analytics, tasks, goals } = useAppStore();

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-hierarchy-1">{t('analytics.title')}</h1>
          <p className="text-muted-foreground">Analytics data is being calculated...</p>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('status.loading')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalGoals = goals.length;
  const completedGoals = goals.filter(goal => 
    goal.targetValue && goal.currentValue >= goal.targetValue
  ).length;
  const activeStreaks = goals.filter(goal => goal.isHabit && goal.streakCount > 0);

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color 
  }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: any;
    color: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-hierarchy-small text-muted-foreground">{title}</p>
            <p className="text-hierarchy-1 mt-1">{value}</p>
            <p className="text-hierarchy-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ProductivityChart = () => {
    const maxCount = Math.max(...analytics.completedTasksByDay.map(d => d.count), 1);
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Task Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.completedTasksByDay.slice(-7).map((day) => (
              <div key={day.date} className="flex items-center space-x-4">
                <div className="w-16 text-hierarchy-small text-muted-foreground">
                  {formatDate(new Date(day.date), 'EEE')}
                </div>
                <div className="flex-1">
                  <Progress 
                    value={(day.count / maxCount) * 100} 
                    className="h-3" 
                  />
                </div>
                <div className="w-16 text-hierarchy-small font-medium text-right">
                  {day.count} tasks
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const ProjectBreakdown = () => (
    <Card>
      <CardHeader>
        <CardTitle>Tasks by Project</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analytics.completedTasksByProject.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t('common.no_data')}</p>
          ) : (
            analytics.completedTasksByProject.map((project) => (
              <div key={project.project} className="flex items-center justify-between">
                <span className="text-hierarchy-small">{project.project}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32">
                    <Progress value={(project.count / totalTasks) * 100} className="h-2" />
                  </div>
                  <span className="text-hierarchy-small font-medium w-8 text-right">
                    {project.count}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );

  const GoalProgress = () => (
    <Card>
      <CardHeader>
        <CardTitle>Goal Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analytics.goalProgress.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t('common.no_data')}</p>
          ) : (
            analytics.goalProgress.map((goal) => (
              <div key={goal.goal} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-hierarchy-small font-medium">{goal.goal}</span>
                  <span className="text-hierarchy-small text-muted-foreground">
                    {Math.round(goal.progress)}%
                  </span>
                </div>
                <Progress value={goal.progress} className="h-2" />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );

  const StreakTracker = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Flame className="w-5 h-5 text-amber-500" />
          <span>Current Streaks</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {analytics.streaks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No active streaks</p>
          ) : (
            analytics.streaks.map((streak) => (
              <div key={streak.type} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <div>
                  <p className="text-hierarchy-small font-medium">{streak.type}</p>
                  <p className="text-hierarchy-xs text-muted-foreground">
                    Last completed: {formatDate(new Date(streak.date))}
                  </p>
                </div>
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                  {streak.count} days
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-hierarchy-1">{t('analytics.title')}</h1>
        <p className="text-muted-foreground">
          Track your productivity and progress over time
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('analytics.productivity_score')}
          value={`${analytics.productivityScore}%`}
          subtitle="Overall completion rate"
          icon={TrendingUp}
          color="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title={t('analytics.tasks_completed')}
          value={completedTasks}
          subtitle={`out of ${totalTasks} total`}
          icon={CheckCircle}
          color="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title={t('analytics.goals_achieved')}
          value={completedGoals}
          subtitle={`out of ${totalGoals} total`}
          icon={Target}
          color="bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
        />
        <StatCard
          title={t('analytics.current_streaks')}
          value={activeStreaks.length}
          subtitle="habits maintained"
          icon={Flame}
          color="bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="streaks">Streaks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProductivityChart />
            <ProjectBreakdown />
          </div>
        </TabsContent>
        
        <TabsContent value="tasks" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProductivityChart />
            <ProjectBreakdown />
          </div>
        </TabsContent>
        
        <TabsContent value="goals" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GoalProgress />
            <Card>
              <CardHeader>
                <CardTitle>Goal Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('common.coming_soon')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="streaks" className="mt-6">
          <StreakCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
}
