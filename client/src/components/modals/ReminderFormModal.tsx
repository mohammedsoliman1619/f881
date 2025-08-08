import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/lib/store';
import { insertReminderSchema, type InsertReminder, type Reminder } from '@shared/schema';
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
import { Separator } from '@/components/ui/separator';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Tag, 
  Plus, 
  X,
  Bell
} from 'lucide-react';
import { format } from 'date-fns';

interface ReminderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminder?: Reminder;
  onSubmit: (reminder: InsertReminder) => Promise<void>;
}

export function ReminderFormModal({ isOpen, onClose, reminder, onSubmit }: ReminderFormModalProps) {
  const { t } = useTranslation();
  const { tasks, goals, calendarEvents } = useAppStore();
  const [newTag, setNewTag] = useState('');

  const form = useForm<InsertReminder>({
    resolver: zodResolver(insertReminderSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'P3',
      tags: [],
      completed: false,
      linkedItems: { tasks: [], goals: [], reminders: [], events: [] },
    }
  });

  useEffect(() => {
    if (reminder) {
      form.reset({
        title: reminder.title,
        description: reminder.description || '',
        dueDate: reminder.dueDate,
        endDate: reminder.endDate,
        priority: reminder.priority,
        tags: reminder.tags,
        location: reminder.location || '',
        recurrence: reminder.recurrence,
        linkedItems: reminder.linkedItems,
      });
    } else {
      form.reset({
        title: '',
        description: '',
        priority: 'P3',
        tags: [],
        completed: false,
        linkedItems: { tasks: [], goals: [], reminders: [], events: [] },
      });
    }
  }, [reminder, form]);

  const handleSubmit = async (data: InsertReminder) => {
    try {
      await onSubmit(data);
      form.reset();
      setNewTag('');
      onClose();
    } catch (error) {
      console.error('Error saving reminder:', error);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>{reminder ? t('reminders.edit_reminder') : t('reminders.add_reminder')}</span>
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
                      <Input placeholder={t('reminders.reminder_title_placeholder')} {...field} />
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
                        placeholder={t('reminders.reminder_description_placeholder')}
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.priority')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('reminders.select_priority')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="P1">{t('reminders.priority_p1')}</SelectItem>
                      <SelectItem value="P2">{t('reminders.priority_p2')}</SelectItem>
                      <SelectItem value="P3">{t('reminders.priority_p3')}</SelectItem>
                      <SelectItem value="P4">{t('reminders.priority_p4')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('common.due_date')}</FormLabel>
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
                                {t('reminders.select_due_date')}
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
                    <FormLabel>{t('common.end_date')}</FormLabel>
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
                                {t('reminders.select_end_date')}
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
                    <Input placeholder={t('reminders.location_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Tags */}
            <div className="space-y-3">
              <FormLabel className="flex items-center space-x-2">
                <Tag className="w-4 h-4" />
                <span>{t('common.tags')}</span>
              </FormLabel>
              
              <div className="flex space-x-2">
                <Input
                  placeholder={t('reminders.add_tag_placeholder')}
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" size="sm" onClick={addTag}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {form.watch('tags').length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.watch('tags').map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                {t('actions.cancel')}
              </Button>
              <Button type="submit" className="flex-1">
                {reminder ? t('actions.update') : t('actions.create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}