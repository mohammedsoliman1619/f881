
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X, Plus } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { RecurrenceRule, NewRecurrenceRule } from '@/types';
import { cn } from '@/lib/utils';

interface RecurrenceFormProps {
  rule?: RecurrenceRule;
  onSave: (rule: NewRecurrenceRule) => void;
  onCancel: () => void;
  entityId: string;
  entityType: string;
}

type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

export const RecurrenceForm: React.FC<RecurrenceFormProps> = ({
  rule,
  onSave,
  onCancel,
  entityId,
  entityType,
}) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState<Partial<NewRecurrenceRule>>({
    entityId,
    entityType,
    frequency: 'weekly',
    interval: 1,
    daysOfWeek: null,
    dayOfMonth: null,
    weekOfMonth: null,
    monthOfYear: null,
    endDate: null,
    maxOccurrences: null,
    exceptions: null,
  });

  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [endType, setEndType] = useState<'never' | 'date' | 'count'>('never');
  const [exceptions, setExceptions] = useState<Date[]>([]);
  const [showExceptionCalendar, setShowExceptionCalendar] = useState(false);

  useEffect(() => {
    if (rule) {
      setFormData({
        entityId: rule.entityId,
        entityType: rule.entityType,
        frequency: rule.frequency as FrequencyType,
        interval: rule.interval || 1,
        daysOfWeek: rule.daysOfWeek,
        dayOfMonth: rule.dayOfMonth,
        weekOfMonth: rule.weekOfMonth,
        monthOfYear: rule.monthOfYear,
        endDate: rule.endDate,
        maxOccurrences: rule.maxOccurrences,
        exceptions: rule.exceptions,
      });

      if (rule.daysOfWeek) {
        setSelectedDays(JSON.parse(rule.daysOfWeek));
      }

      if (rule.exceptions) {
        const exceptionDates = JSON.parse(rule.exceptions).map((date: string) => new Date(date));
        setExceptions(exceptionDates);
      }

      if (rule.endDate) {
        setEndType('date');
      } else if (rule.maxOccurrences) {
        setEndType('count');
      }
    }
  }, [rule]);

  const handleFrequencyChange = (frequency: FrequencyType) => {
    setFormData(prev => ({ ...prev, frequency }));
    
    // Reset specific fields when frequency changes
    if (frequency !== 'weekly') {
      setSelectedDays([]);
      setFormData(prev => ({ ...prev, daysOfWeek: null }));
    }
    if (frequency !== 'monthly') {
      setFormData(prev => ({ ...prev, dayOfMonth: null, weekOfMonth: null }));
    }
    if (frequency !== 'yearly') {
      setFormData(prev => ({ ...prev, monthOfYear: null }));
    }
  };

  const handleDayToggle = (day: number) => {
    const newSelectedDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day].sort();
    
    setSelectedDays(newSelectedDays);
    setFormData(prev => ({
      ...prev,
      daysOfWeek: newSelectedDays.length > 0 ? JSON.stringify(newSelectedDays) : null,
    }));
  };

  const addException = (date: Date) => {
    const newExceptions = [...exceptions, date];
    setExceptions(newExceptions);
    setFormData(prev => ({
      ...prev,
      exceptions: JSON.stringify(newExceptions.map(d => format(d, 'yyyy-MM-dd'))),
    }));
    setShowExceptionCalendar(false);
  };

  const removeException = (index: number) => {
    const newExceptions = exceptions.filter((_, i) => i !== index);
    setExceptions(newExceptions);
    setFormData(prev => ({
      ...prev,
      exceptions: newExceptions.length > 0 
        ? JSON.stringify(newExceptions.map(d => format(d, 'yyyy-MM-dd')))
        : null,
    }));
  };

  const handleEndTypeChange = (type: 'never' | 'date' | 'count') => {
    setEndType(type);
    
    if (type === 'never') {
      setFormData(prev => ({ ...prev, endDate: null, maxOccurrences: null }));
    } else if (type === 'date') {
      setFormData(prev => ({ ...prev, maxOccurrences: null }));
    } else if (type === 'count') {
      setFormData(prev => ({ ...prev, endDate: null }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as NewRecurrenceRule);
  };

  const getRecurrencePreview = (): string => {
    const { frequency, interval } = formData;
    
    switch (frequency) {
      case 'daily':
        return interval === 1 
          ? t('calendar.recurrence.daily')
          : t('calendar.recurrence.every') + ` ${interval} ` + t('calendar.recurrence.days');
      
      case 'weekly':
        if (selectedDays.length === 0) {
          return interval === 1 
            ? t('calendar.recurrence.weekly')
            : t('calendar.recurrence.every') + ` ${interval} ` + t('calendar.recurrence.weeks');
        } else if (selectedDays.length === 5 && !selectedDays.includes(0) && !selectedDays.includes(6)) {
          return t('calendar.recurrence.weekdays');
        } else if (selectedDays.length === 2 && selectedDays.includes(0) && selectedDays.includes(6)) {
          return t('calendar.recurrence.weekends');
        } else {
          const dayNames = selectedDays.map(day => DAYS_OF_WEEK[day].short).join(', ');
          return `${t('calendar.recurrence.every')} ${dayNames}`;
        }
      
      case 'monthly':
        return interval === 1 
          ? t('calendar.recurrence.monthly')
          : t('calendar.recurrence.every') + ` ${interval} ` + t('calendar.recurrence.months');
      
      case 'yearly':
        return interval === 1 
          ? t('calendar.recurrence.yearly')
          : t('calendar.recurrence.every') + ` ${interval} ` + t('calendar.recurrence.years');
      
      default:
        return t('calendar.recurrence.custom');
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{t('calendar.recurrence.title')}</CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Frequency Selection */}
          <div className="space-y-3">
            <Label>{t('calendar.recurrence.frequency')}</Label>
            <Select 
              value={formData.frequency} 
              onValueChange={(value) => handleFrequencyChange(value as FrequencyType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t('calendar.recurrence.daily')}</SelectItem>
                <SelectItem value="weekly">{t('calendar.recurrence.weekly')}</SelectItem>
                <SelectItem value="monthly">{t('calendar.recurrence.monthly')}</SelectItem>
                <SelectItem value="yearly">{t('calendar.recurrence.yearly')}</SelectItem>
                <SelectItem value="custom">{t('calendar.recurrence.custom')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Interval */}
          <div className="space-y-3">
            <Label htmlFor="interval">
              {t('calendar.recurrence.every')} {formData.frequency === 'daily' && t('calendar.recurrence.days')}
              {formData.frequency === 'weekly' && t('calendar.recurrence.weeks')}
              {formData.frequency === 'monthly' && t('calendar.recurrence.months')}
              {formData.frequency === 'yearly' && t('calendar.recurrence.years')}
            </Label>
            <Input
              id="interval"
              type="number"
              min={1}
              max={52}
              value={formData.interval}
              onChange={(e) => setFormData(prev => ({ ...prev, interval: Number(e.target.value) }))}
            />
          </div>

          {/* Days of Week (for weekly) */}
          {formData.frequency === 'weekly' && (
            <div className="space-y-3">
              <Label>{t('calendar.recurrence.daysOfWeek')}</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={selectedDays.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDayToggle(day.value)}
                  >
                    {day.short}
                  </Button>
                ))}
              </div>
              
              {/* Quick Presets */}
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const weekdays = [1, 2, 3, 4, 5];
                    setSelectedDays(weekdays);
                    setFormData(prev => ({ ...prev, daysOfWeek: JSON.stringify(weekdays) }));
                  }}
                >
                  {t('calendar.recurrence.weekdays')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const weekends = [0, 6];
                    setSelectedDays(weekends);
                    setFormData(prev => ({ ...prev, daysOfWeek: JSON.stringify(weekends) }));
                  }}
                >
                  {t('calendar.recurrence.weekends')}
                </Button>
              </div>
            </div>
          )}

          {/* Day of Month (for monthly) */}
          {formData.frequency === 'monthly' && (
            <div className="space-y-3">
              <Label htmlFor="dayOfMonth">{t('calendar.recurrence.dayOfMonth')}</Label>
              <Input
                id="dayOfMonth"
                type="number"
                min={1}
                max={31}
                value={formData.dayOfMonth || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  dayOfMonth: e.target.value ? Number(e.target.value) : null 
                }))}
                placeholder="1-31"
              />
            </div>
          )}

          {/* Month and Day (for yearly) */}
          {formData.frequency === 'yearly' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="monthOfYear">{t('calendar.recurrence.month')}</Label>
                <Select 
                  value={formData.monthOfYear?.toString()}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    monthOfYear: Number(value) 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('calendar.recurrence.selectMonth')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {format(new Date(2000, i, 1), 'MMMM')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="yearlyDayOfMonth">{t('calendar.recurrence.dayOfMonth')}</Label>
                <Input
                  id="yearlyDayOfMonth"
                  type="number"
                  min={1}
                  max={31}
                  value={formData.dayOfMonth || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    dayOfMonth: e.target.value ? Number(e.target.value) : null 
                  }))}
                  placeholder="1-31"
                />
              </div>
            </div>
          )}

          {/* End Condition */}
          <div className="space-y-3">
            <Label>{t('calendar.recurrence.endCondition')}</Label>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="never"
                  checked={endType === 'never'}
                  onCheckedChange={() => handleEndTypeChange('never')}
                />
                <Label htmlFor="never">{t('calendar.recurrence.never')}</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="endDate"
                  checked={endType === 'date'}
                  onCheckedChange={() => handleEndTypeChange('date')}
                />
                <Label htmlFor="endDate">{t('calendar.recurrence.until')}</Label>
                {endType === 'date' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate ? format(new Date(formData.endDate), 'MMM dd, yyyy') : t('calendar.recurrence.selectDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.endDate ? new Date(formData.endDate) : undefined}
                        onSelect={(date) => setFormData(prev => ({ 
                          ...prev, 
                          endDate: date?.toISOString() || null 
                        }))}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="maxOccurrences"
                  checked={endType === 'count'}
                  onCheckedChange={() => handleEndTypeChange('count')}
                />
                <Label htmlFor="maxOccurrences">{t('calendar.recurrence.after')}</Label>
                {endType === 'count' && (
                  <>
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={formData.maxOccurrences || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        maxOccurrences: e.target.value ? Number(e.target.value) : null 
                      }))}
                      className="w-20"
                    />
                    <Label>{t('calendar.recurrence.occurrences')}</Label>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Exceptions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t('calendar.recurrence.exceptions')}</Label>
              <Popover open={showExceptionCalendar} onOpenChange={setShowExceptionCalendar}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('calendar.recurrence.addException')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    onSelect={(date) => date && addException(date)}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {exceptions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {exceptions.map((exception, index) => (
                  <Badge key={index} variant="outline" className="flex items-center space-x-1">
                    <span>{format(exception, 'MMM dd, yyyy')}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => removeException(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="bg-muted p-3 rounded-lg">
            <Label className="text-sm font-medium">{t('calendar.recurrence.preview')}</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {getRecurrencePreview()}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit">
              {t('actions.save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
