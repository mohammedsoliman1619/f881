import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, Save, X, Upload, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { TimeBlock, NewTimeBlock, Task, Event, Goal, Reminder } from '@/types';
import { validateTimeBlock } from '@/utils/calendarHelpers';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TimeBlockFormProps {
  timeBlock?: TimeBlock;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewTimeBlock) => Promise<void>;
  tasks?: Task[];
  events?: Event[];
  goals?: Goal[];
  reminders?: Reminder[];
  initialDate?: Date;
  initialStartTime?: string;
  initialEndTime?: string;
}

export const TimeBlockForm: React.FC<TimeBlockFormProps> = ({
  timeBlock,
  isOpen,
  onClose,
  onSave,
  tasks = [],
  events = [],
  goals = [],
  reminders = [],
  initialDate,
  initialStartTime,
  initialEndTime,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<NewTimeBlock>>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    duration: 60,
    color: '#3b82f6',
    project: '',
    group: '',
    notes: '',
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [linkedEntity, setLinkedEntity] = useState<{ type: string; id: string } | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (timeBlock) {
      setFormData({
        title: timeBlock.title,
        description: timeBlock.description || '',
        startTime: format(new Date(timeBlock.startTime), "HH:mm"),
        endTime: format(new Date(timeBlock.endTime), "HH:mm"),
        duration: timeBlock.duration,
        color: timeBlock.color || '#3b82f6',
        project: timeBlock.project || '',
        group: timeBlock.group || '',
        notes: timeBlock.notes || '',
        taskId: timeBlock.taskId,
        eventId: timeBlock.eventId,
        goalId: timeBlock.goalId,
        reminderId: timeBlock.reminderId,
      });
      setSelectedDate(new Date(timeBlock.startTime));
    } else {
      if (initialDate) setSelectedDate(initialDate);
      if (initialStartTime) setFormData(prev => ({ ...prev, startTime: initialStartTime }));
      if (initialEndTime) setFormData(prev => ({ ...prev, endTime: initialEndTime }));
    }
  }, [timeBlock, initialDate, initialStartTime, initialEndTime]);

  const calculateDuration = () => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      const duration = Math.round((end.getTime() - start.getTime()) / 60000);

      if (duration > 0) {
        setFormData(prev => ({ ...prev, duration }));
      }
    }
  };

  useEffect(() => {
    calculateDuration();
  }, [formData.startTime, formData.endTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const startDateTime = new Date(selectedDate);
    const endDateTime = new Date(selectedDate);

    if (formData.startTime) {
      const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
      startDateTime.setHours(startHours, startMinutes, 0, 0);
    }

    if (formData.endTime) {
      const [endHours, endMinutes] = formData.endTime.split(':').map(Number);
      endDateTime.setHours(endHours, endMinutes, 0, 0);
    }

    const blockData: NewTimeBlock = {
      ...formData,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      duration: formData.duration || 60,
    } as NewTimeBlock;

    const validationErrors = validateTimeBlock(blockData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await onSave(blockData);
      toast({
        title: t('actions.success'),
        description: timeBlock ? t('calendar.timeBlockUpdated') : t('calendar.timeBlockCreated'),
      });
      onClose();
    } catch (error) {
      toast({
        title: t('actions.error'),
        description: t('calendar.saveError'),
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024); // 5MB limit

    if (validFiles.length !== files.length) {
      toast({
        title: t('actions.warning'),
        description: t('calendar.attachments.maxSize'),
        variant: 'destructive',
      });
    }

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const linkToEntity = (type: string, id: string) => {
    setLinkedEntity({ type, id });
    setFormData(prev => ({
      ...prev,
      taskId: type === 'task' ? id : undefined,
      eventId: type === 'event' ? id : undefined,
      goalId: type === 'goal' ? id : undefined,
      reminderId: type === 'reminder' ? id : undefined,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {timeBlock ? t('calendar.editTimeBlock') : t('calendar.createTimeBlock')}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">{t('tasks.title')}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={t('calendar.timeBlock')}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">{t('tasks.description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('tasks.descriptionPlaceholder')}
                  rows={3}
                />
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>{t('tasks.date')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, 'MMM dd, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="startTime">{t('tasks.startTime')}</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="endTime">{t('tasks.endTime')}</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Duration Display */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{t('calendar.duration')}: {formData.duration} {t('calendar.minutes')}</span>
            </div>

            {/* Project and Color */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project">{t('tasks.project')}</Label>
                <Input
                  id="project"
                  value={formData.project}
                  onChange={(e) => setFormData(prev => ({ ...prev, project: e.target.value }))}
                  placeholder={t('tasks.projectPlaceholder')}
                />
              </div>

              <div>
                <Label htmlFor="color">{t('tasks.color')}</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-10"
                  />
                  <Badge style={{ backgroundColor: formData.color }} className="text-white">
                    {t('calendar.preview')}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Link to Entity */}
            <div>
              <Label>{t('calendar.linkToEntity')}</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                <Select onValueChange={(value) => {
                  const [type, id] = value.split(':');
                  linkToEntity(type, id);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('tasks.title')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(tasks || []).map(task => (
                      <SelectItem key={task.id} value={`task:${task.id}`}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => {
                  const [type, id] = value.split(':');
                  linkToEntity(type, id);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('events.title')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(events || []).map(event => (
                      <SelectItem key={event.id} value={`event:${event.id}`}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => {
                  const [type, id] = value.split(':');
                  linkToEntity(type, id);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('goals.title')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(goals || []).map(goal => (
                      <SelectItem key={goal.id} value={`goal:${goal.id}`}>
                        {goal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => {
                  const [type, id] = value.split(':');
                  linkToEntity(type, id);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('reminders.title')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(reminders || []).map(reminder => (
                      <SelectItem key={reminder.id} value={`reminder:${reminder.id}`}>
                        {reminder.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">{t('calendar.notes.title')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t('calendar.notes.addNote')}
                rows={2}
              />
            </div>

            {/* Attachments */}
            <div>
              <Label>{t('calendar.attachments.title')}</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept="image/*,application/pdf,.doc,.docx,.txt"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {t('calendar.attachments.addFile')}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {t('calendar.attachments.maxSize')}
                  </span>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-1">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <ul className="text-sm text-destructive space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                {t('actions.cancel')}
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                {t('actions.save')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};