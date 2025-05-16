
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Reminder } from '../types';
import { reminders } from '../services/mockData';
import { useUser } from './UserContext';
import { useToast } from '@/hooks/use-toast';

type RemindersContextType = {
  userReminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id' | 'userId' | 'completed'>) => void;
  toggleReminderComplete: (id: string) => void;
  deleteReminder: (id: string) => void;
};

const RemindersContext = createContext<RemindersContextType | undefined>(undefined);

export const RemindersProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useUser();
  const [userReminders, setUserReminders] = useState<Reminder[]>([]);
  const { toast } = useToast();
  
  // Load user's reminders when user changes
  useEffect(() => {
    if (!currentUser) {
      setUserReminders([]);
      return;
    }
    
    const loadedReminders = reminders.filter(reminder => reminder.userId === currentUser.id);
    setUserReminders(loadedReminders);
    
    // Check for reminders due today for notifications
    const today = new Date().toISOString().split('T')[0];
    const dueReminders = loadedReminders.filter(
      r => r.date === today && !r.completed
    );
    
    // Show toast notification for each due reminder
    if (dueReminders.length > 0) {
      toast({
        title: `You have ${dueReminders.length} reminder${dueReminders.length > 1 ? 's' : ''} today`,
        description: "Check your reminders tab to view them.",
      });
    }
    
  }, [currentUser, toast]);
  
  const addReminder = (reminderData: Omit<Reminder, 'id' | 'userId' | 'completed'>) => {
    if (!currentUser) return;
    
    const newReminder: Reminder = {
      id: `r${reminders.length + 1}`,
      userId: currentUser.id,
      completed: false,
      ...reminderData,
    };
    
    // In a real app, this would be an API call
    reminders.push(newReminder);
    setUserReminders(prev => [...prev, newReminder]);
    
    toast({
      title: "Reminder created",
      description: "Your reminder has been set successfully.",
    });
  };
  
  const toggleReminderComplete = (id: string) => {
    const updatedReminders = userReminders.map(reminder => {
      if (reminder.id === id) {
        return { ...reminder, completed: !reminder.completed };
      }
      return reminder;
    });
    
    // Update local state
    setUserReminders(updatedReminders);
    
    // In a real app, this would be an API call to update the reminder
    const reminderIndex = reminders.findIndex(r => r.id === id);
    if (reminderIndex !== -1) {
      reminders[reminderIndex] = {
        ...reminders[reminderIndex],
        completed: !reminders[reminderIndex].completed
      };
    }
  };
  
  const deleteReminder = (id: string) => {
    // Update local state
    setUserReminders(prev => prev.filter(reminder => reminder.id !== id));
    
    // In a real app, this would be an API call to delete the reminder
    const reminderIndex = reminders.findIndex(r => r.id === id);
    if (reminderIndex !== -1) {
      reminders.splice(reminderIndex, 1);
    }
    
    toast({
      title: "Reminder deleted",
      description: "Your reminder has been removed.",
    });
  };
  
  return (
    <RemindersContext.Provider 
      value={{ 
        userReminders, 
        addReminder, 
        toggleReminderComplete,
        deleteReminder
      }}
    >
      {children}
    </RemindersContext.Provider>
  );
};

export const useReminders = () => {
  const context = useContext(RemindersContext);
  if (context === undefined) {
    throw new Error('useReminders must be used within a RemindersProvider');
  }
  return context;
};
