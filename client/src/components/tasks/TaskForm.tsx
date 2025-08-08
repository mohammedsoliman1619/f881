import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { insertTaskSchema, InsertTask, Subtask } from '@shared/schema';
import { useAppStore } from '@/lib/store';
import { nanoid } from 'nanoid';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { 
  CalendarIcon, 
  PlusIcon, 
  X, 
  AlertCircle,
  Clock,
  MapPin,
  Folder,
  Tag
} from 'lucide-react';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  task?: any;
  isEditing?: boolean;
}

// Dynamic options that use translation keys
const getPriorityOptions = (t: any) => [
  { value: 'P1', label: t('tasks.priority.P1'), color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  { value: 'P2', label: t('tasks.priority.P2'), color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { value: 'P3', label: t('tasks.priority.P3'), color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'P4', label: t('tasks.priority.P4'), color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
];

const getStatusOptions = (t: any) => [
  { value: 'todo', label: t('tasks.status.todo'), color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
  { value: 'in-progress', label: t('tasks.status.in-progress'), color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'done', label: t('tasks.status.done'), color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
];

const getRecurrenceOptions = (t: any) => [
  { value: 'none', label: t('tasks.recurrence.none') },
  { value: 'daily', label: t('tasks.recurrence.daily') },
  { value: 'weekly', label: t('tasks.recurrence.weekly') },
  { value: 'monthly', label: t('tasks.recurrence.monthly') },
  { value: 'yearly', label: t('tasks.recurrence.yearly') },
];

export function TaskForm({ isOpen, onClose, task, isEditing = false }: TaskFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { createTask, updateTask, projects } = useAppStore();
  const [newTag, setNewTag] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);

  // Get localized options
  const priorityOptions = getPriorityOptions(t);
  const statusOptions = getStatusOptions(t);
  const recurrenceOptions = getRecurrenceOptions(t);

  // Clean form defaults - always reset when task is undefined
  const getFormDefaults = () => ({
    title: isEditing && task ? task.title : '',
    description: isEditing && task ? task.description || '' : '',
    priority: isEditing && task ? task.priority || 'P3' : 'P3',
    status: isEditing && task ? task.status || 'todo' : 'todo',
    dueDate: isEditing && task ? task.dueDate : undefined,
    startDate: isEditing && task ? task.startDate : undefined,
    project: isEditing && task ? task.project || 'none' : 'none',
    tags: isEditing && task ? task.tags || [] : [],
    location: isEditing && task ? task.location || '' : '',
    group: isEditing && task ? task.group || '' : '',
    recurrence: isEditing && task ? task.recurrence || 'none' : 'none',
    subtasks: isEditing && task ? task.subtasks || [] : [],
    completed: isEditing && task ? task.completed || false : false,
    linkedItems: isEditing && task ? task.linkedItems || { tasks: [], goals: [], reminders: [], events: [] } : { tasks: [], goals: [], reminders: [], events: [] },
    estimatedDuration: isEditing && task ? task.estimatedDuration : undefined,
  });

  const form = useForm<InsertTask>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: getFormDefaults(),
  });

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      const defaults = getFormDefaults();
      form.reset(defaults);
      setSubtasks(defaults.subtasks);
      setNewTag('');
      setNewSubtask('');
    }
  }, [isOpen, task, isEditing, form]);

  const handleSubmit = async (data: InsertTask) => {
    try {
      // Enhanced validation
      if (data.dueDate && data.startDate && new Date(data.dueDate) <= new Date(data.startDate)) {
        toast({
          title: t('actions.error'),
          description: 'Due date must be after start date',
          variant: 'destructive',
        });
        return;
      }

      // Sanitize inputs for security
      const sanitizedData = {
        ...data,
        title: data.title.trim(),
        description: data.description?.trim() || '',
        location: data.location?.trim() || '',
        group: data.group?.trim() || '',
        project: data.project === 'none' ? undefined : data.project,
        tags: data.tags?.map(tag => tag.trim()).filter(Boolean) || [],
        subtasks: subtasks,
        estimatedDuration: data.estimatedDuration ? Number(data.estimatedDuration) : undefined,
      };

      if (isEditing && task) {
        await updateTask(task.id, sanitizedData);
        toast({
          title: t('actions.update'),
          description: t('tasks.taskUpdatedMessage'),
        });
      } else {
        await createTask(sanitizedData);
        toast({
          title: t('actions.create'),
          description: t('tasks.taskCreatedMessage'),
        });
      }

      onClose();
    } catch (error) {
      toast({
        title: t('actions.error'),
        description: t('tasks.saveError'),
        variant: 'destructive',
      });
    }
  };

  const addTag = () => {
    if (newTag.trim() && !form.getValues('tags')?.includes(newTag.trim())) {
      const currentTags = form.getValues('tags') || [];
      form.setValue('tags', [...currentTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      const newSubtaskObj: Subtask = {
        id: nanoid(),
        title: newSubtask.trim(),
        completed: false,
      };
      const updatedSubtasks = [...subtasks, newSubtaskObj];
      setSubtasks(updatedSubtasks);
      form.setValue('subtasks', updatedSubtasks);
      setNewSubtask('');
    }
  };

  const removeSubtask = (subtaskId: string) => {
    const updatedSubtasks = subtasks.filter(subtask => subtask.id !== subtaskId);
    setSubtasks(updatedSubtasks);
    form.setValue('subtasks', updatedSubtasks);
  };

  const toggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = subtasks.map(subtask =>
      subtask.id === subtaskId
        ? { ...subtask, completed: !subtask.completed }
        : subtask
    );
    setSubtasks(updatedSubtasks);
    form.setValue('subtasks', updatedSubtasks);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {isEditing ? t('tasks.editTask') : t('tasks.createTask')}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? t('tasks.editTaskDescription')
              : t('tasks.createTaskDescription')
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="required">{t('tasks.title')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('tasks.titlePlaceholder')} 
                      {...field} 
                      aria-label={t('tasks.title')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('tasks.description')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('tasks.descriptionPlaceholder')}
                      className="min-h-[80px]"
                      {...field}
                      aria-label={t('tasks.description')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority and Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('tasks.priority')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger aria-label={t('tasks.priority')}>
                          <SelectValue placeholder={t('tasks.selectPriority')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Badge className={option.color}>{option.label}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('tasks.status')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger aria-label={t('tasks.status')}>
                          <SelectValue placeholder={t('tasks.selectStatus')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Badge className={option.color}>{option.label}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dates Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('tasks.startDate')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full pl-3 text-left font-normal"
                            aria-label={t('tasks.startDate')}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>{t('tasks.selectStartDate')}</span>
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
                          disabled={(date) => date < new Date("1900-01-01")}
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
                    <FormLabel>{t('tasks.dueDate')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full pl-3 text-left font-normal"
                            aria-label={t('tasks.dueDate')}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>{t('tasks.selectDueDate')}</span>
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
                          disabled={(date) => {
                            const startDate = form.getValues('startDate');
                            if (date < new Date("1900-01-01")) return true;
                            if (startDate && date < startDate) return true;
                            return false;
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Project and Group Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormField
                control={form.control}
                name="project"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Folder className="w-4 h-4" />
                      {t('tasks.project')}
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger aria-label={t('tasks.project')}>
                          <SelectValue placeholder={t('tasks.selectProject')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{t('tasks.noProject')}</SelectItem>
                        {projects.map((project) => (
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

              <FormField
                control={form.control}
                name="group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('tasks.group')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('tasks.groupPlaceholder')} 
                        {...field} 
                        aria-label={t('tasks.group')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location and Recurrence Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {t('tasks.location')}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('tasks.locationPlaceholder')} 
                        {...field} 
                        aria-label={t('tasks.location')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recurrence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('tasks.recurrence')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger aria-label={t('tasks.recurrence')}>
                          <SelectValue placeholder={t('tasks.selectRecurrence')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {recurrenceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Estimated Duration and Tags Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Estimated Duration */}
              <div>
                <Label htmlFor="estimatedDuration">{t('calendar.estimatedDuration')}</Label>
                <FormField
                  control={form.control}
                  name="estimatedDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min="15"
                            max="480"
                            step="15"
                            placeholder="60"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                          <span className="text-sm text-muted-foreground">{t('calendar.minutes')}</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tags Section */}
              <div>
                <FormLabel className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  {t('tasks.tags')}
                </FormLabel>

                <div className="flex gap-2">
                  <Input
                    placeholder={t('tasks.addTag')}
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    aria-label={t('tasks.addTag')}
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    variant="outline"
                    size="sm"
                    aria-label={t('tasks.addTag')}
                  >
                    <PlusIcon className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {form.watch('tags')?.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => removeTag(tag)}
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>


            {/* Subtasks Section */}
            <div className="space-y-3">
              <FormLabel>{t('tasks.subtasks')}</FormLabel>

              <div className="flex gap-2">
                <Input
                  placeholder={t('tasks.addSubtask')}
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                  aria-label={t('tasks.addSubtask')}
                />
                <Button
                  type="button"
                  onClick={addSubtask}
                  variant="outline"
                  size="sm"
                  aria-label={t('tasks.addSubtask')}
                >
                  <PlusIcon className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-3 p-2 border rounded">
                    <Checkbox
                      checked={subtask.completed}
                      onCheckedChange={() => toggleSubtask(subtask.id)}
                      aria-label={`Mark subtask ${subtask.title} as ${subtask.completed ? 'incomplete' : 'complete'}`}
                    />
                    <span className={`flex-1 ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {subtask.title}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubtask(subtask.id)}
                      aria-label={`Remove subtask ${subtask.title}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="flex justify-end space-x-3 pt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 
                  t('status.saving') : 
                  isEditing ? t('actions.update') : t('actions.create')
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}