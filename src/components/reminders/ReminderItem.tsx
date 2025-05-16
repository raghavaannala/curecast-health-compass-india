import React from 'react';
import { format } from 'date-fns';
import { Bell, Check, Clock, Edit, MoreVertical, Pill, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Reminder } from '@/types/health';
import { useReminders } from '@/contexts/RemindersContext';

interface ReminderItemProps {
  reminder: Reminder;
  onEdit?: (reminder: Reminder) => void;
}

const ReminderItem: React.FC<ReminderItemProps> = ({ reminder, onEdit }) => {
  const { updateReminder, deleteReminder } = useReminders();

  const handleMarkComplete = () => {
    updateReminder(reminder.id, {
      completed: true,
      adherenceLog: [
        ...(reminder.adherenceLog || []),
        {
          date: new Date().toISOString(),
          taken: true,
        },
      ],
    });
  };

  const handleDelete = () => {
    deleteReminder(reminder.id);
  };

  const getRecurrenceText = (recurrence?: string) => {
    switch (recurrence) {
      case 'daily':
        return 'Every day';
      case 'weekly':
        return 'Every week';
      case 'monthly':
        return 'Every month';
      default:
        return 'One time';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medication':
        return <Pill className="h-4 w-4" />;
      case 'followup':
        return <Clock className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn(
      'transition-colors',
      reminder.completed ? 'bg-muted' : 'hover:bg-accent/5'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              {getTypeIcon(reminder.type)}
              <h4 className={cn(
                'font-medium',
                reminder.completed && 'text-muted-foreground line-through'
              )}>
                {reminder.title}
              </h4>
              {reminder.recurrence !== 'none' && (
                <Badge variant="outline" className="ml-2">
                  {getRecurrenceText(reminder.recurrence)}
                </Badge>
              )}
            </div>
            
            {reminder.description && (
              <p className="text-sm text-muted-foreground">
                {reminder.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(`${reminder.date}T${reminder.time}`), 'PPp')}
              </span>
              
              {reminder.medication && (
                <span className="flex items-center gap-1">
                  <Pill className="h-3 w-3" />
                  {reminder.medication.dosage}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!reminder.completed && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleMarkComplete}
                title="Mark as complete"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(reminder)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReminderItem;
