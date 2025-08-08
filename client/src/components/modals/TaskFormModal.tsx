import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { nanoid } from 'nanoid';
import { useAppStore } from '@/lib/store';
import { insertTaskSchema, type InsertTask, type Task } from '@shared/schema';
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
  Trash,
  X
} from 'lucide-react';
import { format } from 'date-fns';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  onSubmit: (task: InsertTask) => Promise<void>;
}

export function TaskFormModal({ isOpen, onClose, task, onSubmit }: TaskFormModalProps) {
  const { t } = useTranslation();
  const { projects } = useAppStore();
  const [newTag, setNewTag] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [subtasks, setSubtasks] = useState<Array<{ id: string; title: string; completed: boolean }>>([]);

  const form = useForm<InsertTask>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'P3',
      tags: [],
      subtasks: [],
      recurrence: undefined,
    }
  });

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        dueDate: task.dueDate,
        startDate: task.startDate,
        project: task.project || '',
        tags: task.tags,
        location: task.location || '',
        recurrence: task.recurrence,
      });
      setSubtasks(task.subtasks);
    } else {
      form.reset({
        title: '',
        description: '',
        priority: 'P3',
        tags: [],
        subtasks: [],
        recurrence: undefined,
      });
      setSubtasks([]);
    }
  }, [task, form]);

  const handleSubmit = async (data: InsertTask) => {
    try {
      // Prepare comprehensive task data with all fields
      const taskData: InsertTask = {
        ...data,
        subtasks: subtasks,
        linkedItems: data.linkedItems || { tasks: [], goals: [], reminders: [], events: [] }
      };
      
      await onSubmit(taskData);
      
      // Create automatic calendar event if task has due date
      if (taskData.dueDate) {
        const { createCalendarEvent } = useAppStore.getState();
        await createCalendarEvent({
          title: taskData.title,
          description: taskData.description,
          startDate: taskData.startDate || taskData.dueDate,
          endDate: taskData.dueDate,
          isAllDay: !taskData.startDate,
          color: getPriorityColor(taskData.priority),
          priority: taskData.priority,
          tags: taskData.tags,
          location: taskData.location,
          linkedItems: { tasks: [], goals: [], reminders: [], events: [] }
        });
      }
      
      // Reset form state
      form.reset();
      setSubtasks([]);
      setNewTag('');
      setNewSubtask('');
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1': return '#ef4444';
      case 'P2': return '#f59e0b';
      case 'P3': return '#3b82f6';
      case 'P4': return '#6b7280';
      default: return '#3b82f6';
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

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, {
        id: nanoid(),
        title: newSubtask.trim(),
        completed: false
      }]);
      setNewSubtask('');
    }
  };

  const removeSubtask = (subtaskId: string) => {
    setSubtasks(subtasks.filter(s => s.id !== subtaskId));
  };

  const toggleSubtask = (subtaskId: string) => {
    setSubtasks(subtasks.map(s => 
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task ? t('tasks.edit_task') : t('tasks.add_task')}
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
                      <Input placeholder={t('tasks.task_title_placeholder')} {...field} />
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
                        placeholder={t('tasks.task_description_placeholder')}
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

            {/* Priority and Project */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.priority')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('tasks.select_priority')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="P1">{t('tasks.priority_p1')}</SelectItem>
                        <SelectItem value="P2">{t('tasks.priority_p2')}</SelectItem>
                        <SelectItem value="P3">{t('tasks.priority_p3')}</SelectItem>
                        <SelectItem value="P4">{t('tasks.priority_p4')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="project"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.project')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('tasks.select_project')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">{t('tasks.no_project')}</SelectItem>
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('common.start_date')}</FormLabel>
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
                                {t('tasks.select_start_date')}
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
                                {t('tasks.select_due_date')}
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
                    <Input placeholder={t('tasks.location_placeholder')} {...field} />
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
                  placeholder={t('tasks.add_tag_placeholder')}
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

            {/* Subtasks */}
            <div className="space-y-3">
              <FormLabel>{t('common.subtasks')}</FormLabel>
              
              <div className="flex space-x-2">
                <Input
                  placeholder={t('tasks.add_subtask_placeholder')}
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                />
                <Button type="button" size="sm" onClick={addSubtask}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {subtasks.length > 0 && (
                <div className="space-y-2">
                  {subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center space-x-2 p-2 rounded border">
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => toggleSubtask(subtask.id)}
                        className="w-4 h-4"
                      />
                      <span className={`flex-1 ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {subtask.title}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubtask(subtask.id)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
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
                {task ? t('actions.update') : t('actions.create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}