
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addMonths,
  subMonths
} from 'date-fns';
import { CalendarItem, calculateWorkload, getWorkloadColor } from '@/utils/calendarHelpers';
import { cn } from '@/lib/utils';

interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  items: CalendarItem[];
  showWorkload?: boolean;
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  selectedDate,
  onDateSelect,
  items,
  showWorkload = false,
}) => {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = React.useState(selectedDate);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const navigateToPrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const navigateToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const navigateToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
  };

  const getDayItems = (date: Date): CalendarItem[] => {
    return items.filter(item => isSameDay(item.startTime, date));
  };

  const getDayWorkload = (date: Date): number => {
    return calculateWorkload(items, date);
  };

  const hasItems = (date: Date): boolean => {
    return getDayItems(date).length > 0;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4" />
            <span>{t('calendar.miniCalendar')}</span>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={navigateToToday}>
            {t('calendar.today')}
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={navigateToPrevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <h3 className="font-medium">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          
          <Button variant="ghost" size="sm" onClick={navigateToNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-2">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground p-2"
            >
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map(day => {
            const dayItems = getDayItems(day);
            const workload = getDayWorkload(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = isSameDay(day, selectedDate);
            const isDayToday = isToday(day);
            const hasScheduledItems = hasItems(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => onDateSelect(day)}
                className={cn(
                  'relative p-1 text-sm rounded-md transition-colors min-h-[36px] flex flex-col items-center justify-center',
                  'hover:bg-muted',
                  {
                    'text-muted-foreground': !isCurrentMonth,
                    'text-foreground': isCurrentMonth,
                    'bg-primary text-primary-foreground': isSelected,
                    'bg-primary/10 text-primary': isDayToday && !isSelected,
                    [getWorkloadColor(workload)]: showWorkload && workload > 0 && !isSelected,
                  }
                )}
              >
                <span className="relative z-10">{format(day, 'd')}</span>
                
                {/* Item Indicators */}
                {hasScheduledItems && !showWorkload && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
                    {dayItems.slice(0, 3).map((item, index) => (
                      <div
                        key={index}
                        className={cn(
                          'w-1 h-1 rounded-full',
                          item.color || 'bg-primary',
                          { 'bg-primary-foreground': isSelected }
                        )}
                        style={!isSelected && item.color ? { backgroundColor: item.color } : {}}
                      />
                    ))}
                    {dayItems.length > 3 && (
                      <div className={cn(
                        'w-1 h-1 rounded-full bg-muted-foreground',
                        { 'bg-primary-foreground': isSelected }
                      )} />
                    )}
                  </div>
                )}

                {/* Workload Badge */}
                {showWorkload && workload > 0 && (
                  <div className="absolute -top-1 -right-1">
                    <Badge 
                      variant="secondary" 
                      className="text-xs h-4 px-1 min-w-[16px] flex items-center justify-center"
                    >
                      {Math.round(workload / 60)}
                    </Badge>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 space-y-2">
          {showWorkload && (
            <div className="text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>{t('calendar.workloadHeatmap')}</span>
                <span>{t('calendar.hours')}</span>
              </div>
              <div className="flex items-center space-x-1 mt-1">
                <div className="w-3 h-3 rounded bg-gray-100"></div>
                <div className="w-3 h-3 rounded bg-green-200"></div>
                <div className="w-3 h-3 rounded bg-yellow-200"></div>
                <div className="w-3 h-3 rounded bg-orange-200"></div>
                <div className="w-3 h-3 rounded bg-red-200"></div>
                <span className="text-xs ml-2">0-6h+</span>
              </div>
            </div>
          )}
          
          {!showWorkload && (
            <div className="text-xs text-muted-foreground text-center">
              {t('calendar.dotIndicatesItems')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
