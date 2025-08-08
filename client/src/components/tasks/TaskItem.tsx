import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Task } from '@shared/schema';
import { useAppStore } from '@/lib/store';
import { formatDate, isDueToday, isOverdue, isDueTomorrow } from '@/utils/dateUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Check,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  Clock,
  MapPin,
  Folder,
  Tag,
  CheckCircle2,
  Circle,
  Play
} from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  showProject?: boolean;
  compact?: boolean;
}

const priorityConfig = {
  P1: { label: 'High', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: AlertCircle },
  P2: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
  P3: { label: 'Normal', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Circle },
  P4: { label: 'Low', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: Circle },
};

const statusConfig = {
  'todo': { label: 'To Do', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', icon: Circle },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Play },
  'done': { label: 'Done', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle2 },
};

export function TaskItem({ task, onEdit, showProject = true, compact = false }: TaskItemProps) {
  const { t } = useTranslation();
  const { toggleTaskCompletion, deleteTask, projects } = useAppStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const project = projects.find(p => p.id === task.project);
  const priority = priorityConfig[task.priority] || priorityConfig.P3;
  const status = statusConfig[task.status] || statusConfig.todo;
  const PriorityIcon = priority.icon;
  const StatusIcon = status.icon;

  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const hasSubtasks = totalSubtasks > 0;

  const getDueDateStatus = () => {
    if (!task.dueDate) return null;
    
    if (isOverdue(task.dueDate)) {
      return { label: t('tasks.overdue'), color: 'text-red-600 dark:text-red-400' };
    } else if (isDueToday(task.dueDate)) {
      return { label: t('tasks.dueToday'), color: 'text-orange-600 dark:text-orange-400' };
    } else if (isDueTomorrow(task.dueDate)) {
      return { label: t('tasks.dueTomorrow'), color: 'text-yellow-600 dark:text-yellow-400' };
    }
    return null;
  };

  const dueDateStatus = getDueDateStatus();

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
    } catch (error) {
      setIsDeleting(false);
    }
  };

  const handleToggleComplete = () => {
    toggleTaskCompletion(task.id);
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors group">
        <Checkbox
          checked={task.completed}
          onCheckedChange={handleToggleComplete}
          aria-label={task.completed ? t('tasks.markIncomplete') : t('tasks.markComplete')}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </span>
            
            {task.status !== 'todo' && (
              <Badge className={`${status.color} text-xs`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
            )}
            
            {task.priority !== 'P3' && (
              <Badge className={`${priority.color} text-xs`}>
                <PriorityIcon className="w-3 h-3 mr-1" />
                {priority.label}
              </Badge>
            )}
          </div>
          
          {task.dueDate && (
            <div className={`text-xs mt-1 ${dueDateStatus?.color || 'text-muted-foreground'}`}>
              <Calendar className="w-3 h-3 inline mr-1" />
              {dueDateStatus?.label || formatDate(task.dueDate)}
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Edit className="w-4 h-4 mr-2" />
              {t('common.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="text-red-600 dark:text-red-400"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? t('common.deleting') : t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            checked={task.completed}
            onCheckedChange={handleToggleComplete}
            className="mt-1"
            aria-label={task.completed ? t('tasks.markIncomplete') : t('tasks.markComplete')}
          />
          
          <div className="flex-1 min-w-0 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold leading-tight ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className={`text-sm mt-1 ${task.completed ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                    {task.description}
                  </p>
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Edit className="w-4 h-4 mr-2" />
                    {t('common.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDelete} 
                    disabled={isDeleting}
                    className="text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isDeleting ? t('common.deleting') : t('common.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Metadata Row */}
            <div className="flex items-center gap-3 flex-wrap text-sm">
              {/* Status */}
              <Badge className={status.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>

              {/* Priority */}
              <Badge className={priority.color}>
                <PriorityIcon className="w-3 h-3 mr-1" />
                {priority.label}
              </Badge>

              {/* Project */}
              {showProject && project && (
                <Badge variant="outline" className="text-xs">
                  <Folder className="w-3 h-3 mr-1" />
                  {project.name}
                </Badge>
              )}

              {/* Group */}
              {task.group && (
                <Badge variant="outline" className="text-xs">
                  {task.group}
                </Badge>
              )}

              {/* Location */}
              {task.location && (
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span className="text-xs">{task.location}</span>
                </div>
              )}
            </div>

            {/* Due Date */}
            {task.dueDate && (
              <div className={`flex items-center text-sm ${dueDateStatus?.color || 'text-muted-foreground'}`}>
                <Calendar className="w-4 h-4 mr-2" />
                <span>
                  {dueDateStatus?.label || `${t('tasks.due')} ${formatDate(task.dueDate)}`}
                </span>
                {task.recurrence !== 'none' && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {t(`tasks.recurrence.${task.recurrence}`)}
                  </Badge>
                )}
              </div>
            )}

            {/* Start Date */}
            {task.startDate && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-2" />
                <span>{t('tasks.starts')} {formatDate(task.startDate)}</span>
              </div>
            )}

            {/* Subtasks Progress */}
            {hasSubtasks && (
              <div className="flex items-center text-sm">
                <CheckCircle2 className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {t('tasks.subtasksProgress', { completed: completedSubtasks, total: totalSubtasks })}
                </span>
                <div className="ml-2 flex-1 max-w-24">
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <Tag className="w-4 h-4 text-muted-foreground" />
                {task.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}