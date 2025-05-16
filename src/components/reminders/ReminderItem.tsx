
import { useState } from 'react';
import { Reminder } from '@/types';
import { useReminders } from '@/contexts/RemindersContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MoreVertical, Repeat, Pill, CalendarClock, AlertCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface ReminderItemProps {
  reminder: Reminder;
}

const ReminderItem = ({ reminder }: ReminderItemProps) => {
  const { toggleReminderComplete, deleteReminder } = useReminders();
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const typeIcons = {
    medication: <Pill className="h-4 w-4" />,
    appointment: <CalendarClock className="h-4 w-4" />,
    'follow-up': <AlertCircle className="h-4 w-4" />,
  };
  
  const dateTimeString = `${format(new Date(reminder.date), 'MMM d, yyyy')} at ${reminder.time}`;
  
  const recurrenceLabels = {
    daily: 'Every day',
    weekly: 'Every week',
    monthly: 'Every month',
    none: 'One time',
  };
  
  return (
    <div className={cn(
      "glass-morphism rounded-lg p-4 transition-all",
      reminder.completed && "opacity-70"
    )}>
      <div className="flex items-start gap-3">
        <Checkbox 
          checked={reminder.completed} 
          onCheckedChange={() => toggleReminderComplete(reminder.id)}
          className="mt-1"
        />
        
        <div className="flex-1">
          <h4 className={cn(
            "font-medium",
            reminder.completed && "line-through"
          )}>
            {reminder.title}
          </h4>
          
          {reminder.description && (
            <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>
          )}
          
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{dateTimeString}</span>
            </div>
            
            {reminder.recurrence !== 'none' && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Repeat className="h-3 w-3 mr-1" />
                <span>{recurrenceLabels[reminder.recurrence || 'none']}</span>
              </div>
            )}
            
            <div className="flex items-center text-xs text-muted-foreground">
              {typeIcons[reminder.type]}
              <span className="ml-1 capitalize">{reminder.type}</span>
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => toggleReminderComplete(reminder.id)}
              className="cursor-pointer"
            >
              {reminder.completed ? 'Mark as incomplete' : 'Mark as complete'}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive cursor-pointer"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Reminder</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this reminder? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                deleteReminder(reminder.id);
                setConfirmDelete(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReminderItem;
