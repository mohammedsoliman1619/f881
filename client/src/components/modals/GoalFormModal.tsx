import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { nanoid } from 'nanoid';
import { useAppStore } from '@/lib/store';
import { insertGoalSchema, type InsertGoal, type Goal, type Milestone } from '@shared/schema';
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
  Tag, 
  Plus, 
  Trash,
  X,
  Target
} from 'lucide-react';
import { format } from 'date-fns';

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: Goal;
  onSubmit: (goal: InsertGoal) => Promise<void>;
}

export function GoalFormModal({ isOpen, onClose, goal, onSubmit }: GoalFormModalProps) {
  const { t } = useTranslation();
  const { tasks, reminders, calendarEvents } = useAppStore();
  const [newTag, setNewTag] = useState('');
  const [newMilestone, setNewMilestone] = useState('');
  const [milestoneValue, setMilestoneValue] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  const form = useForm<InsertGoal>({
    resolver: zodResolver(insertGoalSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      priority: 'P3',
      tags: [],
      currentValue: 0,
      isHabit: false,
      streakCount: 0,
      milestones: [],
      linkedItems: { tasks: [], goals: [], reminders: [], events: [] },
    }
  });

  useEffect(() => {
    if (goal) {
      form.reset({
        title: goal.title,
        description: goal.description || '',
        category: goal.category,
        targetValue: goal.targetValue,
        currentValue: goal.currentValue,
        unit: goal.unit || '',
        deadline: goal.deadline,
        startDate: goal.startDate,
        priority: goal.priority,
        tags: goal.tags,
        location: goal.location || '',
        isHabit: goal.isHabit,
        recurrence: goal.recurrence,
        linkedItems: goal.linkedItems,
      });
      setMilestones(goal.milestones);
    } else {
      form.reset({
        title: '',
        description: '',
        category: '',
        priority: 'P3',
        tags: [],
        currentValue: 0,
        isHabit: false,
        streakCount: 0,
        milestones: [],
        linkedItems: { tasks: [], goals: [], reminders: [], events: [] },
      });
      setMilestones([]);
    }
  }, [goal, form]);

  const handleSubmit = async (data: InsertGoal) => {
    try {
      await onSubmit({
        ...data,
        milestones: milestones,
      });
      form.reset();
      setMilestones([]);
      setNewTag('');
      setNewMilestone('');
      setMilestoneValue('');
      onClose();
    } catch (error) {
      console.error('Error saving goal:', error);
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

  const addMilestone = () => {
    if (newMilestone.trim() && milestoneValue.trim()) {
      setMilestones([...milestones, {
        id: nanoid(),
        title: newMilestone.trim(),
        targetValue: parseFloat(milestoneValue),
        completed: false
      }]);
      setNewMilestone('');
      setMilestoneValue('');
    }
  };

  const removeMilestone = (milestoneId: string) => {
    setMilestones(milestones.filter(m => m.id !== milestoneId));
  };

  const toggleMilestone = (milestoneId: string) => {
    setMilestones(milestones.map(m => 
      m.id === milestoneId ? { 
        ...m, 
        completed: !m.completed,
        completedAt: !m.completed ? new Date() : undefined
      } : m
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>{goal ? t('goals.edit_goal') : t('goals.add_goal')}</span>
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
                      <Input placeholder={t('goals.goal_title_placeholder')} {...field} />
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
                        placeholder={t('goals.goal_description_placeholder')}
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

            {/* Goal Type and Values */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.category')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('goals.category_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.priority')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('goals.select_priority')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="P1">{t('goals.priority_p1')}</SelectItem>
                        <SelectItem value="P2">{t('goals.priority_p2')}</SelectItem>
                        <SelectItem value="P3">{t('goals.priority_p3')}</SelectItem>
                        <SelectItem value="P4">{t('goals.priority_p4')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Target and Current Values */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="targetValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('goals.target_value')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="100"
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('goals.current_value')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0"
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('goals.unit')}</FormLabel>
                    <FormControl>
                      <Input placeholder="kg, hours, pages..." {...field} />
                    </FormControl>
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
                                {t('goals.select_start_date')}
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
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('common.deadline')}</FormLabel>
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
                                {t('goals.select_deadline')}
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

            {/* Location and Habit Toggle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <Input placeholder={t('goals.location_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isHabit"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>{t('goals.is_habit')}</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        {t('goals.habit_description')}
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
            </div>

            <Separator />

            {/* Tags */}
            <div className="space-y-3">
              <FormLabel className="flex items-center space-x-2">
                <Tag className="w-4 h-4" />
                <span>{t('common.tags')}</span>
              </FormLabel>
              
              <div className="flex space-x-2">
                <Input
                  placeholder={t('goals.add_tag_placeholder')}
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

            {/* Milestones */}
            <div className="space-y-3">
              <FormLabel>{t('goals.milestones')}</FormLabel>
              
              <div className="flex space-x-2">
                <Input
                  placeholder={t('goals.milestone_title')}
                  value={newMilestone}
                  onChange={(e) => setNewMilestone(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder={t('goals.milestone_value')}
                  value={milestoneValue}
                  onChange={(e) => setMilestoneValue(e.target.value)}
                  className="w-32"
                />
                <Button type="button" size="sm" onClick={addMilestone}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {milestones.length > 0 && (
                <div className="space-y-2">
                  {milestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center space-x-2 p-2 rounded border">
                      <input
                        type="checkbox"
                        checked={milestone.completed}
                        onChange={() => toggleMilestone(milestone.id)}
                        className="w-4 h-4"
                      />
                      <span className={`flex-1 ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {milestone.title} ({milestone.targetValue})
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMilestone(milestone.id)}
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
                {goal ? t('actions.update') : t('actions.create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}