
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Square, 
  Timer, 
  Clock, 
  Target, 
  CheckCircle2, 
  X,
  RotateCcw
} from 'lucide-react';
import { format, isToday } from 'date-fns';
import { CalendarItem } from '@/utils/calendarHelpers';
import { useToast } from '@/hooks/use-toast';

interface FocusModeProps {
  isOpen: boolean;
  onClose: () => void;
  items: CalendarItem[];
  onUpdateItem: (id: string, updates: Partial<CalendarItem>) => Promise<void>;
}

type TimerType = 'pomodoro' | 'session' | 'countdown';

interface TimerState {
  type: TimerType;
  duration: number; // in seconds
  remaining: number;
  isRunning: boolean;
  currentSession: number;
  totalSessions: number;
}

export const FocusMode: React.FC<FocusModeProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateItem,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [timer, setTimer] = useState<TimerState>({
    type: 'pomodoro',
    duration: 25 * 60, // 25 minutes
    remaining: 25 * 60,
    isRunning: false,
    currentSession: 1,
    totalSessions: 4,
  });

  const [customDuration, setCustomDuration] = useState(25);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [completedItems, setCompletedItems] = useState<string[]>([]);

  // Filter today's items
  const todayItems = items.filter(item => isToday(item.startTime));
  const pendingItems = todayItems.filter(item => 
    item.type === 'task' && 
    item.status !== 'completed' && 
    !completedItems.includes(item.id)
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timer.isRunning && timer.remaining > 0) {
      interval = setInterval(() => {
        setTimer(prev => ({
          ...prev,
          remaining: prev.remaining - 1,
        }));
      }, 1000);
    } else if (timer.remaining === 0 && timer.isRunning) {
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [timer.isRunning, timer.remaining]);

  const handleTimerComplete = () => {
    setTimer(prev => ({ ...prev, isRunning: false }));
    
    // Play notification sound (browser notification)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(t('calendar.focusMode.sessionComplete'), {
        body: timer.type === 'pomodoro' 
          ? t('calendar.focusMode.pomodoroComplete')
          : t('calendar.focusMode.sessionComplete'),
        icon: '/favicon.ico',
      });
    }

    toast({
      title: t('calendar.focusMode.sessionComplete'),
      description: `${formatTime(timer.duration)} ${t('calendar.focusMode.sessionCompleted')}`,
    });

    // Handle pomodoro cycle
    if (timer.type === 'pomodoro') {
      if (timer.currentSession < timer.totalSessions) {
        // Start break
        const breakDuration = timer.currentSession % 4 === 0 ? 15 * 60 : 5 * 60; // Long break every 4 sessions
        setTimer(prev => ({
          ...prev,
          duration: breakDuration,
          remaining: breakDuration,
          currentSession: prev.currentSession + 1,
        }));
        
        toast({
          title: t('calendar.focusMode.breakTime'),
          description: `${formatTime(breakDuration)} ${t('calendar.focusMode.breakStarted')}`,
        });
      } else {
        // Cycle complete
        toast({
          title: t('calendar.focusMode.cycleComplete'),
          description: t('calendar.focusMode.pomodorosCycleComplete'),
        });
        resetTimer();
      }
    }
  };

  const startTimer = () => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    setTimer(prev => ({ ...prev, isRunning: true }));
  };

  const pauseTimer = () => {
    setTimer(prev => ({ ...prev, isRunning: false }));
  };

  const stopTimer = () => {
    setTimer(prev => ({
      ...prev,
      isRunning: false,
      remaining: prev.duration,
    }));
  };

  const resetTimer = () => {
    setTimer(prev => ({
      ...prev,
      isRunning: false,
      remaining: prev.duration,
      currentSession: 1,
    }));
  };

  const setTimerType = (type: TimerType) => {
    let duration: number;
    
    switch (type) {
      case 'pomodoro':
        duration = 25 * 60;
        break;
      case 'session':
        duration = customDuration * 60;
        break;
      case 'countdown':
        duration = customDuration * 60;
        break;
      default:
        duration = 25 * 60;
    }

    setTimer({
      type,
      duration,
      remaining: duration,
      isRunning: false,
      currentSession: 1,
      totalSessions: type === 'pomodoro' ? 4 : 1,
    });
  };

  const markItemCompleted = async (item: CalendarItem) => {
    try {
      if (item.type === 'task') {
        await onUpdateItem(item.id, { status: 'completed' });
        setCompletedItems(prev => [...prev, item.id]);
        
        toast({
          title: t('actions.success'),
          description: t('tasks.taskCompleted'),
        });
      }
    } catch (error) {
      toast({
        title: t('actions.error'),
        description: t('tasks.updateError'),
        variant: 'destructive',
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    return ((timer.duration - timer.remaining) / timer.duration) * 100;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>{t('calendar.focusMode')}</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timer Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('calendar.focusMode.timer')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Timer Type Selection */}
                  <Tabs value={timer.type} onValueChange={(value) => setTimerType(value as TimerType)}>
                    <TabsList className="grid grid-cols-3 w-full">
                      <TabsTrigger value="pomodoro">{t('calendar.pomodoroTimer')}</TabsTrigger>
                      <TabsTrigger value="session">{t('calendar.sessionTimer')}</TabsTrigger>
                      <TabsTrigger value="countdown">{t('calendar.countdownTimer')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pomodoro" className="mt-4">
                      <div className="text-center space-y-2">
                        <div className="text-sm text-muted-foreground">
                          {t('calendar.focusMode.session')} {timer.currentSession} {t('calendar.focusMode.of')} {timer.totalSessions}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="session" className="mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="sessionDuration">{t('calendar.duration')} ({t('calendar.minutes')})</Label>
                        <Input
                          id="sessionDuration"
                          type="number"
                          value={customDuration}
                          onChange={(e) => setCustomDuration(Number(e.target.value))}
                          min={1}
                          max={180}
                          disabled={timer.isRunning}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="countdown" className="mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="countdownDuration">{t('calendar.duration')} ({t('calendar.minutes')})</Label>
                        <Input
                          id="countdownDuration"
                          type="number"
                          value={customDuration}
                          onChange={(e) => setCustomDuration(Number(e.target.value))}
                          min={1}
                          max={180}
                          disabled={timer.isRunning}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Timer Display */}
                  <div className="text-center space-y-4">
                    <div className="text-6xl font-mono font-bold">
                      {formatTime(timer.remaining)}
                    </div>
                    
                    <Progress value={getProgress()} className="w-full h-2" />
                    
                    <div className="flex justify-center space-x-2">
                      {!timer.isRunning ? (
                        <Button onClick={startTimer} size="lg">
                          <Play className="w-4 h-4 mr-2" />
                          {t('actions.start')}
                        </Button>
                      ) : (
                        <Button onClick={pauseTimer} size="lg" variant="outline">
                          <Pause className="w-4 h-4 mr-2" />
                          {t('actions.pause')}
                        </Button>
                      )}
                      
                      <Button onClick={stopTimer} size="lg" variant="outline">
                        <Square className="w-4 h-4 mr-2" />
                        {t('actions.stop')}
                      </Button>
                      
                      <Button onClick={resetTimer} size="lg" variant="outline">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        {t('actions.reset')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Item */}
              {selectedItem && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('calendar.focusMode.currentTask')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{selectedItem.title}</h3>
                        {selectedItem.type === 'task' && (
                          <Button
                            size="sm"
                            onClick={() => markItemCompleted(selectedItem)}
                            disabled={completedItems.includes(selectedItem.id)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            {completedItems.includes(selectedItem.id) 
                              ? t('tasks.completed') 
                              : t('actions.complete')
                            }
                          </Button>
                        )}
                      </div>
                      
                      {selectedItem.description && (
                        <p className="text-sm text-muted-foreground">
                          {selectedItem.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {selectedItem.type}
                        </Badge>
                        {selectedItem.duration && (
                          <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />
                            {selectedItem.duration}m
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Today's Items */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('calendar.todayView')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {todayItems.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {t('calendar.focusMode.noItemsToday')}
                      </div>
                    ) : (
                      todayItems.map(item => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedItem?.id === item.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-muted/50'
                          } ${
                            completedItems.includes(item.id)
                              ? 'opacity-50 line-through'
                              : ''
                          }`}
                          onClick={() => setSelectedItem(item)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium">{item.title}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {item.type}
                                </Badge>
                              </div>
                              
                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {item.description}
                                </p>
                              )}
                              
                              <div className="flex items-center space-x-2 mt-2">
                                <span className="text-xs text-muted-foreground">
                                  {format(item.startTime, 'HH:mm')}
                                </span>
                                {item.duration && (
                                  <Badge variant="outline" className="text-xs">
                                    <Timer className="w-3 h-3 mr-1" />
                                    {item.duration}m
                                  </Badge>
                                )}
                                {item.project && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.project}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {item.type === 'task' && !completedItems.includes(item.id) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markItemCompleted(item);
                                }}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Progress Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('analytics.progress')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t('tasks.completed')}</span>
                      <span className="font-medium">
                        {completedItems.length} / {pendingItems.length + completedItems.length}
                      </span>
                    </div>
                    
                    <Progress 
                      value={pendingItems.length + completedItems.length > 0 
                        ? (completedItems.length / (pendingItems.length + completedItems.length)) * 100 
                        : 0
                      } 
                      className="w-full"
                    />
                    
                    <div className="text-xs text-muted-foreground text-center">
                      {completedItems.length > 0 
                        ? t('calendar.focusMode.keepGoing')
                        : t('calendar.focusMode.startFocusing')
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
