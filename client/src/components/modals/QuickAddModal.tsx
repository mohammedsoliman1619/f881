import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/lib/store';
import { QuickAddType } from '@/types';
import { parseNaturalDate } from '@/utils/dateUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CheckSquare,
  Calendar,
  Target,
  X
} from 'lucide-react';

const quickAddTypes: { type: QuickAddType; icon: any; label: string }[] = [
  { type: 'task', icon: CheckSquare, label: 'Task' },
  { type: 'event', icon: Calendar, label: 'Event' },
  { type: 'goal', icon: Target, label: 'Goal' }
];

export function QuickAddModal() {
  const { t } = useTranslation();
  const { isQuickAddOpen, setQuickAddOpen, handleQuickAdd } = useAppStore();
  const [text, setText] = useState('');
  const [selectedType, setSelectedType] = useState<QuickAddType>('task');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    // Parse natural date from text
    const dueDate = parseNaturalDate(text);

    await handleQuickAdd({
      type: selectedType,
      text: text.trim(),
      dueDate: dueDate || undefined,
      priority: 'medium'
    });

    setText('');
    setSelectedType('task');
  };

  const handleClose = () => {
    setText('');
    setSelectedType('task');
    setQuickAddOpen(false);
  };

  return (
    <Dialog open={isQuickAddOpen} onOpenChange={setQuickAddOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {t('actions.quick_add')}
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="What do you want to add?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full"
              autoFocus
            />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {quickAddTypes.map(({ type, icon: Icon, label }) => (
              <Button
                key={type}
                type="button"
                variant={selectedType === type ? 'default' : 'outline'}
                size="sm"
                className="flex items-center justify-center"
                onClick={() => setSelectedType(type)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </Button>
            ))}
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              {t('actions.cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={!text.trim()}>
              {t('actions.add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
