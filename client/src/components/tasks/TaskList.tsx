import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useAppStore } from '@/lib/store';
import { Task } from '@shared/schema';
import { formatDate, isDueToday, isOverdue } from '@/utils/dateUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Check,
  Calendar,
  MapPin,
  Tag,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TaskListProps {
  tasks: Task[];
  title: string;
  emptyMessage: string;
  showProgress?: boolean;
}

export function TaskList({ tasks, title, emptyMessage, showProgress = false }: TaskListProps) {
  const { t } = useTranslation();
  const { toggleTaskCompletion, updateTask, deleteTask, projects } = useAppStore();
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (expandedTasks.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1': return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
      case 'P2': return 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10';
      case 'P3': return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
      case 'P4': return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10';
      default: return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'P1': return 'bg-red-100 text-red-800 border-red-200';
      case 'P2': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'P3': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'P4': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getProject = (projectId?: string) => {
    if (!projectId) return undefined;
    return projects.find(p => p.id === projectId);
  };

  const calculateSubtaskProgress = (subtasks: any[]) => {
    if (!subtasks || subtasks.length === 0) return 0;
    const completed = subtasks.filter(s => s.completed).length;
    return Math.round((completed / subtasks.length) * 100);
  };

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg flex items-center space-x-2">
        <span>{title}</span>
        <Badge variant="outline" className="ml-2">
          {tasks.length}
        </Badge>
      </h3>

      {tasks.map((task) => {
        const isExpanded = expandedTasks.has(task.id);
        const project = getProject(task.project);
        const subtaskProgress = calculateSubtaskProgress(task.subtasks);
        const hasSubtasks = task.subtasks && task.subtasks.length > 0;

        return (
          <Card 
            key={task.id} 
            className={`border-l-4 transition-all duration-200 hover:shadow-md ${getPriorityColor(task.priority)} ${
              task.completed ? 'opacity-60' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                {/* Completion Checkbox */}
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTaskCompletion(task.id)}
                  className="mt-1"
                />

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h4>
                        
                        {/* Priority Badge */}
                        <Badge variant="outline" className={getPriorityBadgeColor(task.priority)}>
                          {task.priority}
                        </Badge>

                        {/* Overdue/Due Indicators */}
                        {task.dueDate && !task.completed && (
                          <>
                            {isOverdue(task.dueDate) && (
                              <Badge variant="destructive" className="flex items-center space-x-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>{t('tasks.overdue')}</span>
                              </Badge>
                            )}
                            {isDueToday(task.dueDate) && !isOverdue(task.dueDate) && (
                              <Badge variant="secondary" className="flex items-center space-x-1 bg-orange-100 text-orange-800">
                                <Clock className="w-3 h-3" />
                                <span>{t('tasks.due_today')}</span>
                              </Badge>
                            )}
                          </>
                        )}

                        {/* Expand/Collapse Button */}
                        {(task.description || hasSubtasks || task.tags.length > 0) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(task.id)}
                            className="h-6 w-6 p-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Meta Information */}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                        {project && (
                          <div className="flex items-center space-x-1">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: project.color || '#6b7280' }}
                            />
                            <span>{project.name}</span>
                          </div>
                        )}

                        {task.dueDate && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{format(task.dueDate, 'MMM d, yyyy')}</span>
                            {task.startDate && (
                              <span className="text-xs">
                                ({format(task.startDate, 'HH:mm')})
                              </span>
                            )}
                          </div>
                        )}

                        {task.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate max-w-32">{task.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {/* Edit task */}}>
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteTask(task.id)}
                          className="text-destructive"
                        >
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-4 space-y-3 border-t pt-3">
                      {/* Description */}
                      {task.description && (
                        <div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {task.description}
                          </p>
                        </div>
                      )}

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <Tag className="w-4 h-4 text-muted-foreground" />
                          <div className="flex flex-wrap gap-1">
                            {task.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Subtasks */}
                      {hasSubtasks && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{t('tasks.subtasks')}</span>
                            <div className="flex items-center space-x-2">
                              <Progress value={subtaskProgress} className="w-20 h-2" />
                              <span className="text-xs text-muted-foreground">
                                {subtaskProgress}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-1 pl-4">
                            {task.subtasks.map((subtask) => (
                              <div key={subtask.id} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={subtask.completed}
                                  onCheckedChange={(checked) => {
                                    const updatedSubtasks = task.subtasks.map(s =>
                                      s.id === subtask.id ? { ...s, completed: !!checked } : s
                                    );
                                    updateTask(task.id, { subtasks: updatedSubtasks });
                                  }}
                                  className="h-4 w-4"
                                />
                                <span className={`text-sm ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
                                  {subtask.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recurrence */}
                      {task.recurrence && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>Repeats {task.recurrence.type}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}