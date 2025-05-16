import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Reminder } from '../types';
import { reminders } from '../services/mockData';
import { useUser } from './UserContext';
import { useToast } from '@/hooks/use-toast';

export interface RemindersContextType {
  userReminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id' | 'userId' | 'isCompleted'>) => void;
  updateReminder: (id: string, reminder: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  markAsComplete: (id: string) => void;
}

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
  
  const addReminder = (reminderData: Omit<Reminder, 'id' | 'userId' | 'isCompleted'>) => {
    if (!currentUser) return;
    
    const newReminder: Reminder = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      isCompleted: false,
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
  
  const updateReminder = (id: string, reminder: Partial<Reminder>) => {
    setUserReminders(prev => prev.map(r => 
      r.id === id ? { ...r, ...reminder } : r
    ));
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
  
  const markAsComplete = (id: string) => {
    setUserReminders(prev => prev.map(r => 
      r.id === id ? { ...r, completed: true } : r
    ));
  };
  
  return (
    <RemindersContext.Provider 
      value={{ 
        userReminders, 
        addReminder, 
        updateReminder,
        deleteReminder,
        markAsComplete,
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
