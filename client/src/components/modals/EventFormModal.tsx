import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/lib/store';
import { insertCalendarEventSchema, type InsertCalendarEvent, type CalendarEvent } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Repeat, 
  Tag, 
  Plus, 
  X,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent;
  onSubmit: (event: InsertCalendarEvent) => Promise<void>;
}

export function EventFormModal({ isOpen, onClose, event, onSubmit }: EventFormModalProps) {
  const { t } = useTranslation();
  const [newTag, setNewTag] = useState('');

  const form = useForm<InsertCalendarEvent>({
    resolver: zodResolver(insertCalendarEventSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'P3',
      tags: [],
      color: '#3b82f6',
      isAllDay: false,
    }
  });

  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        description: event.description || '',
        startDate: event.startDate,
        endDate: event.endDate,
        isAllDay: event.isAllDay,
        priority: event.priority,
        tags: event.tags,
        location: event.location || '',
        color: event.color,
        reminders: event.reminders,
      });
    } else {
      form.reset({
        title: '',
        description: '',
        priority: 'P3',
        tags: [],
        color: '#3b82f6',
        isAllDay: false,
      });
    }
  }, [event, form]);

  const handleSubmit = async (data: InsertCalendarEvent) => {
    try {
      // Prepare comprehensive event data
      const eventData: InsertCalendarEvent = {
        ...data,
        linkedItems: data.linkedItems || { tasks: [], goals: [], reminders: [], events: [] }
      };
      
      await onSubmit(eventData);
      
      // Reset form state
      form.reset();
      setNewTag('');
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !form.getValues('tags').includes(newTag.trim())) {
      const currentTags = form.getValues('tags');
      form.setValue('tags', [...currentTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags');
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1': return 'border-red-500 text-red-700 bg-red-50';
      case 'P2': return 'border-amber-500 text-amber-700 bg-amber-50';
      case 'P3': return 'border-blue-500 text-blue-700 bg-blue-50';
      case 'P4': return 'border-gray-500 text-gray-700 bg-gray-50';
      default: return 'border-blue-500 text-blue-700 bg-blue-50';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {event ? t('calendar.edit_event') : t('calendar.add_event')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.title')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('calendar.event_title_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.description')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t('calendar.event_description_placeholder')} 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.priority')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem 
                            value="P1" 
                            className="border-l-4 border-red-500"
                          >
                            P1 - {t('priorities.urgent')}
                          </SelectItem>
                          <SelectItem 
                            value="P2" 
                            className="border-l-4 border-amber-500"
                          >
                            P2 - {t('priorities.high')}
                          </SelectItem>
                          <SelectItem 
                            value="P3" 
                            className="border-l-4 border-blue-500"
                          >
                            P3 - {t('priorities.medium')}
                          </SelectItem>
                          <SelectItem 
                            value="P4" 
                            className="border-l-4 border-gray-500"
                          >
                            P4 - {t('priorities.low')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.color')}</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Input 
                            type="color" 
                            className="w-12 h-10"
                            {...field} 
                          />
                          <Input 
                            placeholder="#3b82f6"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Date and Time */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="isAllDay"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t('calendar.all_day')}</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        {t('calendar.all_day_description')}
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t('calendar.start_date')}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span className="text-muted-foreground">
                                  {t('calendar.select_start_date')}
                                </span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date('1900-01-01')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t('calendar.end_date')}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span className="text-muted-foreground">
                                  {t('calendar.select_end_date')}
                                </span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date('1900-01-01')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!form.watch('isAllDay') && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{t('calendar.start_time')}</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{t('calendar.end_time')}</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{t('common.location')}</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t('calendar.location_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <div className="space-y-3">
              <FormLabel className="flex items-center space-x-2">
                <Tag className="w-4 h-4" />
                <span>{t('common.tags')}</span>
              </FormLabel>
              
              <div className="flex space-x-2">
                <Input
                  placeholder={t('calendar.add_tag_placeholder')}
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" size="sm" onClick={addTag} disabled={!newTag.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {form.watch('tags').length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.watch('tags').map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center space-x-1"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                {event ? t('common.update') : t('common.create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}