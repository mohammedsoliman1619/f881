import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/lib/store';
import { Reminder } from '@/types';
import { formatDate, formatTime, isOverdue, isDueToday } from '@/utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Bell,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Search,
  MoreVertical
} from 'lucide-react';

export function Reminders() {
  const { t } = useTranslation();
  const { reminders, createReminder } = useAppStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    dueDate: '',
    dueTime: ''
  });

  // Filter reminders based on search
  const filteredReminders = reminders.filter(reminder =>
    reminder.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (reminder.description && reminder.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Categorize reminders
  const upcomingReminders = filteredReminders.filter(reminder => 
    !reminder.completed && reminder.dueDate > new Date()
  );
  const overdueReminders = filteredReminders.filter(reminder => 
    !reminder.completed && isOverdue(reminder.dueDate)
  );
  const todayReminders = filteredReminders.filter(reminder => 
    !reminder.completed && isDueToday(reminder.dueDate)
  );
  const completedReminders = filteredReminders.filter(reminder => reminder.completed);

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminder.title.trim() || !newReminder.dueDate) return;

    const dueDateTime = new Date(`${newReminder.dueDate}T${newReminder.dueTime || '09:00'}`);

    await createReminder({
      title: newReminder.title,
      description: newReminder.description,
      dueDate: dueDateTime,
      completed: false
    });

    setNewReminder({
      title: '',
      description: '',
      dueDate: '',
      dueTime: ''
    });
    setIsCreateDialogOpen(false);
  };

  const ReminderCard = ({ reminder }: { reminder: Reminder }) => {
    const isReminderOverdue = isOverdue(reminder.dueDate);
    const isReminderToday = isDueToday(reminder.dueDate);

    return (
      <Card className={`hover:shadow-md transition-shadow ${
        reminder.completed ? 'bg-muted/30' : ''
      }`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {reminder.completed ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : isReminderOverdue ? (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                ) : (
                  <Bell className="w-5 h-5 text-primary" />
                )}
                <h3 className={`text-hierarchy-3 ${
                  reminder.completed ? 'line-through text-muted-foreground' : ''
                }`}>
                  {reminder.title}
                </h3>
              </div>
              
              {reminder.description && (
                <p className="text-hierarchy-small text-muted-foreground mb-3">
                  {reminder.description}
                </p>
              )}

              <div className="flex items-center space-x-4 text-hierarchy-small text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(reminder.dueDate)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(reminder.dueDate)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 mt-3">
                {isReminderToday && !reminder.completed && (
                  <Badge variant="default">Today</Badge>
                )}
                {isReminderOverdue && !reminder.completed && (
                  <Badge variant="destructive">Overdue</Badge>
                )}
                {reminder.completed && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                    Completed
                  </Badge>
                )}
              </div>
            </div>
            
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>

          {!reminder.completed && (
            <div className="flex space-x-2 pt-3 border-t">
              <Button size="sm" variant="outline" className="flex-1">
                Snooze
              </Button>
              <Button size="sm" className="flex-1">
                Mark Complete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const CreateReminderDialog = () => (
    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          {t('reminders.add_reminder')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('reminders.add_reminder')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateReminder} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={newReminder.title}
              onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
              placeholder="Enter reminder title"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newReminder.description}
              onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dueDate">Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={newReminder.dueDate}
                onChange={(e) => setNewReminder({ ...newReminder, dueDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="dueTime">Time</Label>
              <Input
                id="dueTime"
                type="time"
                value={newReminder.dueTime}
                onChange={(e) => setNewReminder({ ...newReminder, dueTime: e.target.value })}
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              {t('actions.cancel')}
            </Button>
            <Button type="submit" className="flex-1">
              {t('actions.add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  const ReminderSection = ({ 
    reminders, 
    title, 
    emptyMessage, 
    icon: Icon 
  }: { 
    reminders: Reminder[]; 
    title: string; 
    emptyMessage: string;
    icon: any;
  }) => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Icon className="w-5 h-5" />
        <h2 className="text-hierarchy-2">{title}</h2>
        <Badge variant="secondary">{reminders.length}</Badge>
      </div>
      
      {reminders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Icon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{emptyMessage}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reminders.map(reminder => (
            <ReminderCard key={reminder.id} reminder={reminder} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-hierarchy-1">{t('reminders.title')}</h1>
          <p className="text-muted-foreground">
            {upcomingReminders.length + todayReminders.length + overdueReminders.length} active, {completedReminders.length} completed
          </p>
        </div>
        <CreateReminderDialog />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('actions.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reminder Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upcoming">{t('reminders.upcoming')}</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="completed">{t('reminders.completed')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="mt-6">
          <ReminderSection
            reminders={upcomingReminders}
            title={t('reminders.upcoming')}
            emptyMessage="No upcoming reminders"
            icon={Bell}
          />
        </TabsContent>
        
        <TabsContent value="today" className="mt-6">
          <ReminderSection
            reminders={todayReminders}
            title="Today's Reminders"
            emptyMessage="No reminders for today"
            icon={Clock}
          />
        </TabsContent>
        
        <TabsContent value="overdue" className="mt-6">
          <ReminderSection
            reminders={overdueReminders}
            title="Overdue Reminders"
            emptyMessage="No overdue reminders"
            icon={AlertCircle}
          />
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          <ReminderSection
            reminders={completedReminders}
            title={t('reminders.completed')}
            emptyMessage="No completed reminders"
            icon={CheckCircle}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
