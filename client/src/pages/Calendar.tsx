import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Target,
  Clock,
  Grid3X3,
  List,
  BarChart3,
  Timer,
  Calendar as CalendarViewIcon,
  Repeat,
  Edit,
  Trash2
} from 'lucide-react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isToday, 
  addWeeks, 
  subWeeks, 
  addMonths, 
  subMonths,
  startOfDay,
  addMinutes,
  parseISO
} from 'date-fns';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { TaskFormModal } from '@/components/modals/TaskFormModal';
import { EventFormModal } from '@/components/modals/EventFormModal';
import { TimeBlockForm } from '@/components/calendar/TimeBlockForm';
import { FocusMode } from '@/components/calendar/FocusMode';
import { MiniCalendar } from '@/components/calendar/MiniCalendar';
import { RecurrenceForm } from '@/components/calendar/RecurrenceForm';
import { 
  convertToCalendarItems, 
  CalendarItem, 
  autoRolloverTasks, 
  calculateWorkload, 
  formatDuration,
  getWorkloadColor
} from '@/utils/calendarHelpers';
import { cn } from '@/lib/utils';

type ViewType = 'month' | 'week' | 'day' | 'list';

interface CalendarItem {
  id: string;
  title: string;
  type: 'task' | 'event' | 'goal' | 'reminder' | 'timeblock';
  date: Date;
  priority?: string;
  completed?: boolean;
  startTime?: string;
  endTime?: string;
}

export function Calendar() {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Store data
  const { 
    tasks, 
    calendarEvents, // Renamed from 'events' to 'calendarEvents' to avoid naming conflict
    goals, 
    reminders, 
    timeBlocks,
    createTask, 
    updateTask,
    createEvent, 
    updateEvent,
    createTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,
    createRecurrenceRule,
    updateRecurrenceRule,
    deleteRecurrenceRule
  } = useAppStore();

  // View state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [showWorkload, setShowWorkload] = useState(false);

  // Modal states
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [isTimeBlockFormOpen, setIsTimeBlockFormOpen] = useState(false);
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [isRecurrenceFormOpen, setIsRecurrenceFormOpen] = useState(false);

  // Form states
  const [editingItem, setEditingItem] = useState<any>(null);
  const [draggedItem, setDraggedItem] = useState<CalendarItem | null>(null);
  const [draggedOver, setDraggedOver] = useState<Date | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Auto-rollover tasks on component mount
  useEffect(() => {
    const rolledTasks = autoRolloverTasks(tasks);
    const tasksToUpdate = rolledTasks.filter((task, index) => 
      task.isAutoRolled !== tasks[index].isAutoRolled
    );

    tasksToUpdate.forEach(task => {
      updateTask(task.id, { dueDate: task.dueDate, isAutoRolled: true });
    });
  }, []);

  // Get calendar items
  const calendarItems = convertToCalendarItems(tasks, calendarEvents, goals, reminders, timeBlocks || []);

  // Filter items
  const filteredItems = calendarItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = filterProject === 'all' || item.project === filterProject;
    const matchesType = filterType === 'all' || item.type === filterType;

    return matchesSearch && matchesProject && matchesType;
  });

  // Get projects for filter
  const projects = Array.from(new Set(calendarItems.map(item => item.project).filter(Boolean)));

  // Navigation handlers
  const navigatePrevious = () => {
    if (viewType === 'month') {
      setCurrentDate(prev => subMonths(prev, 1));
    } else if (viewType === 'week') {
      setCurrentDate(prev => subWeeks(prev, 1));
    } else if (viewType === 'day') {
      setCurrentDate(prev => new Date(prev.getTime() - 24 * 60 * 60 * 1000));
    }
  };

  const navigateNext = () => {
    if (viewType === 'month') {
      setCurrentDate(prev => addMonths(prev, 1));
    } else if (viewType === 'week') {
      setCurrentDate(prev => addWeeks(prev, 1));
    } else if (viewType === 'day') {
      setCurrentDate(prev => new Date(prev.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  const navigateToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Drag and drop handlers
  const handleDragStart = (item: CalendarItem) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    setDraggedOver(date);
  };

  const handleDrop = async (e: React.DragEvent, date: Date) => {
    e.preventDefault();

    if (!draggedItem) return;

    try {
      const newDate = startOfDay(date);

      if (draggedItem.type === 'task') {
        await updateTask(draggedItem.id, { dueDate: newDate.toISOString() });
      } else if (draggedItem.type === 'event') {
        const duration = draggedItem.endTime 
          ? parseISO(draggedItem.endTime).getTime() - parseISO(draggedItem.startTime!).getTime()
          : 60 * 60 * 1000; // 1 hour default

        await updateEvent(draggedItem.id, { 
          startDate: newDate.toISOString(),
          endDate: new Date(newDate.getTime() + duration).toISOString()
        });
      } else if (draggedItem.type === 'timeblock') {
        const duration = draggedItem.endTime 
          ? parseISO(draggedItem.endTime).getTime() - parseISO(draggedItem.startTime!).getTime()
          : 60 * 60 * 1000;

        await updateTimeBlock(draggedItem.id, {
          startTime: newDate.toISOString(),
          endTime: new Date(newDate.getTime() + duration).toISOString()
        });
      }

      toast({
        title: t('actions.success'),
        description: t('calendar.dragToReschedule') + ' - ' + t('actions.completed'),
      });
    } catch (error) {
      toast({
        title: t('actions.error'),
        description: t('calendar.rescheduleError'),
        variant: 'destructive',
      });
    } finally {
      setDraggedItem(null);
      setDraggedOver(null);
    }
  };

  // Form handlers
  const handleCreateTimeBlock = (date?: Date, startTime?: string, endTime?: string) => {
    setEditingItem(null);
    setSelectedDate(date || selectedDate);
    setIsTimeBlockFormOpen(true);
  };

  const handleEditItem = (item: CalendarItem) => {
    setEditingItem(item);

    switch (item.type) {
      case 'task':
        setIsTaskFormOpen(true);
        break;
      case 'event':
        setIsEventFormOpen(true);
        break;
      case 'timeblock':
        setIsTimeBlockFormOpen(true);
        break;
    }
  };

  const handleUpdateCalendarItem = async (id: string, updates: Partial<CalendarItem>) => {
    const item = calendarItems.find(i => i.id === id);
    if (!item) return;

    try {
      switch (item.type) {
        case 'task':
          await updateTask(id, updates);
          break;
        case 'event':
          await updateEvent(id, updates);
          break;
        case 'timeblock':
          await updateTimeBlock(id, updates);
          break;
      }
    } catch (error) {
      toast({
        title: t('actions.error'),
        description: t('calendar.updateError'),
        variant: 'destructive',
      });
    }
  };

  // Calendar view components
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-3 text-center font-medium text-muted-foreground">
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map(day => {
          const dayItems = filteredItems.filter(item => isSameDay(item.date, day));
          const workload = calculateWorkload(dayItems, day);
          const isDayToday = isToday(day);
          const isSelected = isSameDay(day, selectedDate);
          const isDragOver = draggedOver && isSameDay(draggedOver, day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[120px] p-2 border border-border rounded-lg transition-colors',
                'hover:bg-muted/50 cursor-pointer',
                {
                  'bg-primary/5 border-primary': isDayToday,
                  'bg-secondary': isSelected,
                  'bg-muted': isDragOver,
                  [getWorkloadColor(workload)]: showWorkload && workload > 0,
                }
              )}
              onClick={() => setSelectedDate(day)}
              onDragOver={(e) => handleDragOver(e, day)}
              onDrop={(e) => handleDrop(e, day)}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={cn(
                  'text-sm font-medium',
                  { 'text-primary': isDayToday }
                )}>
                  {format(day, 'd')}
                </span>

                {showWorkload && workload > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {formatDuration(workload)}
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                {dayItems.slice(0, 3).map(item => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditItem(item);
                    }}
                    className={cn(
                      'text-xs p-1 rounded truncate cursor-move',
                      'hover:shadow-sm transition-shadow',
                      item.color || 'bg-primary text-primary-foreground',
                      { 'line-through opacity-60': item.status === 'completed' }
                    )}
                    style={item.color ? { backgroundColor: item.color, color: 'white' } : {}}
                  >
                    <div className="flex items-center space-x-1">
                      {item.type === 'task' && <Clock className="w-3 h-3" />}
                      {item.type === 'event' && <CalendarIcon className="w-3 h-3" />}
                      {item.type === 'timeblock' && <Grid3X3 className="w-3 h-3" />}
                      <span className="truncate">{item.title}</span>
                    </div>
                  </div>
                ))}

                {dayItems.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayItems.length - 3} {t('calendar.more')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => {
          const dayItems = filteredItems.filter(item => isSameDay(item.date, day));
          const workload = calculateWorkload(dayItems, day);
          const isDayToday = isToday(day);

          return (
            <div key={day.toISOString()} className="space-y-2">
              <div className={cn(
                'text-center p-2 rounded-lg',
                { 'bg-primary text-primary-foreground': isDayToday }
              )}>
                <div className="text-sm font-medium">{format(day, 'EEE')}</div>
                <div className="text-lg">{format(day, 'd')}</div>
                {showWorkload && workload > 0 && (
                  <Badge variant="outline" className="text-xs mt-1">
                    {formatDuration(workload)}
                  </Badge>
                )}
              </div>

              <div
                className="min-h-[400px] p-2 border border-border rounded-lg space-y-1"
                onDragOver={(e) => handleDragOver(e, day)}
                onDrop={(e) => handleDrop(e, day)}
              >
                {dayItems.map(item => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item)}
                    onClick={() => handleEditItem(item)}
                    className={cn(
                      'text-xs p-2 rounded cursor-move border',
                      item.color || 'bg-primary text-primary-foreground',
                      { 'line-through opacity-60': item.status === 'completed' }
                    )}
                    style={item.color ? { backgroundColor: item.color, color: 'white' } : {}}
                  >
                    <div className="font-medium truncate">{item.title}</div>
                    <div className="flex items-center space-x-1 mt-1">
                      <span>{format(parseISO(item.startTime!), 'HH:mm')}</span>
                      {item.duration && (
                        <span>({formatDuration(item.duration)})</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderListView = () => {
    const sortedItems = [...filteredItems].sort((a, b) => 
      parseISO(a.startTime!).getTime() - parseISO(b.startTime!).getTime()
    );

    return (
      <div className="space-y-4">
        {sortedItems.map(item => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-medium">{item.title}</h3>
                    <Badge variant="outline">{item.type}</Badge>
                    {item.project && (
                      <Badge variant="outline">{item.project}</Badge>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>{format(parseISO(item.startTime!), 'MMM dd, yyyy HH:mm')}</span>
                    {item.duration && (
                      <span>{formatDuration(item.duration)}</span>
                    )}
                    {item.status && (
                      <Badge variant={item.status === 'completed' ? 'default' : 'outline'}>
                        {item.status}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditItem(item)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {sortedItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {t('calendar.noItemsFound')}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">{t('calendar.title')}</h1>
          <p className="text-muted-foreground">
            {format(currentDate, 'MMMM yyyy')}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setIsFocusModeOpen(true)}>
            <Target className="w-4 h-4 mr-2" />
            {t('calendar.focusMode')}
          </Button>

          <Button onClick={() => handleCreateTimeBlock()}>
            <Plus className="w-4 h-4 mr-2" />
            {t('calendar.createTimeBlock')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Mini Calendar */}
        <div className="xl:col-span-1">
          <MiniCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            items={filteredItems}
            showWorkload={showWorkload}
          />

          {/* Quick Stats */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">{t('analytics.quickStats')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">{t('calendar.todayItems')}</span>
                <Badge variant="outline">
                  {filteredItems.filter(item => isToday(item.date)).length}
                </Badge>
              </div>

              <div className="flex justify-between">
                <span className="text-sm">{t('calendar.totalScheduledTime')}</span>
                <Badge variant="outline">
                  {formatDuration(calculateWorkload(filteredItems, selectedDate))}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="workload-toggle" className="text-sm">
                  {t('calendar.workloadHeatmap')}
                </Label>
                <Switch
                  id="workload-toggle"
                  checked={showWorkload}
                  onCheckedChange={setShowWorkload}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Calendar */}
        <div className="xl:col-span-3 space-y-4">
          {/* Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                {/* View Controls */}
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={navigatePrevious}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <Button variant="outline" onClick={navigateToday}>
                    {t('calendar.today')}
                  </Button>

                  <Button variant="outline" onClick={navigateNext}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>

                  <Tabs value={viewType} onValueChange={(value) => setViewType(value as ViewType)}>
                    <TabsList>
                      <TabsTrigger value="month">
                        <CalendarViewIcon className="w-4 h-4 mr-2" />
                        {t('calendar.month')}
                      </TabsTrigger>
                      <TabsTrigger value="week">
                        <Grid3X3 className="w-4 h-4 mr-2" />
                        {t('calendar.week')}
                      </TabsTrigger>
                      <TabsTrigger value="list">
                        <List className="w-4 h-4 mr-2" />
                        {t('calendar.list')}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Search and Filters */}
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t('actions.search')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>

                  <Select value={filterProject} onValueChange={setFilterProject}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder={t('tasks.project')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('tasks.allProjects')}</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project} value={project!}>
                          {project}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder={t('calendar.type')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('calendar.allTypes')}</SelectItem>
                      <SelectItem value="task">{t('tasks.title')}</SelectItem>
                      <SelectItem value="event">{t('events.title')}</SelectItem>
                      <SelectItem value="goal">{t('goals.title')}</SelectItem>
                      <SelectItem value="reminder">{t('reminders.title')}</SelectItem>
                      <SelectItem value="timeblock">{t('calendar.timeBlocks')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar Views */}
          <Card>
            <CardContent className="p-4">
              {viewType === 'month' && renderMonthView()}
              {viewType === 'week' && renderWeekView()}
              {viewType === 'list' && renderListView()}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <TaskFormModal
        isOpen={isTaskFormOpen}
        onClose={() => {
          setIsTaskFormOpen(false);
          setEditingItem(null);
        }}
        task={editingItem?.type === 'task' ? editingItem.originalItem : undefined}
      />

      <EventFormModal
        isOpen={isEventFormOpen}
        onClose={() => {
          setIsEventFormOpen(false);
          setEditingItem(null);
        }}
        event={editingItem?.type === 'event' ? editingItem.originalItem : undefined}
      />

      <TimeBlockForm
        isOpen={isTimeBlockFormOpen}
        onClose={() => {
          setIsTimeBlockFormOpen(false);
          setEditingItem(null);
        }}
        timeBlock={editingItem?.type === 'timeblock' ? editingItem.originalItem : undefined}
        onSave={createTimeBlock}
        tasks={tasks}
        events={calendarEvents} // Use calendarEvents here
        goals={goals}
        reminders={reminders}
        initialDate={selectedDate}
      />

      <FocusMode
        isOpen={isFocusModeOpen}
        onClose={() => setIsFocusModeOpen(false)}
        items={filteredItems}
        onUpdateItem={handleUpdateCalendarItem}
      />
    </div>
  );
}

export default Calendar;