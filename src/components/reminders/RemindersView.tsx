
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            Reminders
          </h2>
          <Button 
            onClick={() => setOpenDialog(true)} 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-2.5"
            size="lg"
          >
            <Plus className="h-4 w-4" />
            Add Reminder
          </Button>
        </div>
        
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Active Reminders
              {activeReminders.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                  {activeReminders.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {activeReminders.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg mb-2">No active reminders</p>
                <p className="text-gray-400 text-sm">Add a new reminder to get started with your health management.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeReminders.map(reminder => (
                  <ReminderItem key={reminder.id} reminder={reminder} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {completedReminders.length > 0 && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                Completed
                <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                  {completedReminders.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {completedReminders.map(reminder => (
                  <ReminderItem key={reminder.id} reminder={reminder} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <ReminderDialog open={openDialog} onOpenChange={setOpenDialog} />
      </div>
    </div>
  );
};

export default RemindersView;
