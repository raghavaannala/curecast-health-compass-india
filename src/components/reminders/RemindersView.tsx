
import { useState } from 'react';
import { useReminders } from '@/contexts/RemindersContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Plus } from 'lucide-react';
import ReminderItem from './ReminderItem';
import ReminderDialog from './ReminderDialog';

const RemindersView = () => {
  const { userReminders } = useReminders();
  const [openDialog, setOpenDialog] = useState(false);
  
  const activeReminders = userReminders.filter(r => !r.completed);
  const completedReminders = userReminders.filter(r => r.completed);

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Reminders
        </h2>
        <Button onClick={() => setOpenDialog(true)} className="flex items-center gap-1">
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Active Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          {activeReminders.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No active reminders. Add a new reminder to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {activeReminders.map(reminder => (
                <ReminderItem key={reminder.id} reminder={reminder} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {completedReminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedReminders.map(reminder => (
                <ReminderItem key={reminder.id} reminder={reminder} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <ReminderDialog open={openDialog} onOpenChange={setOpenDialog} />
    </div>
  );
};

export default RemindersView;
