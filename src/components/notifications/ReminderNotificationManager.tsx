import React, { useState, useEffect, useCallback } from 'react';
import { auth } from '@/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import { firebaseReminderService, Reminder } from '@/services/firebaseReminderService';
import FloatingReminderNotification from './FloatingReminderNotification';
import { useToast } from '@/components/ui/use-toast';

interface ActiveNotification {
  id: string;
  reminder: Reminder;
  shownAt: Date;
  snoozedUntil?: Date;
}

export const ReminderNotificationManager: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeNotifications, setActiveNotifications] = useState<ActiveNotification[]>([]);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const { toast } = useToast();

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setActiveNotifications([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }, []);

  // Check for due reminders
  const checkForDueReminders = useCallback(async () => {
    if (!user) return;

    try {
      console.log('Checking for due reminders...');
      const dueReminders = await firebaseReminderService.getDueReminders(user.uid);
      const now = new Date();
      
      // Find reminders that haven't been shown yet
      const newDueReminders = dueReminders.filter(reminder => {
        // Check if we've already shown this reminder
        const alreadyShown = activeNotifications.some(notif => notif.reminder.id === reminder.id);
        
        // Check if it's snoozed
        const snoozedNotification = activeNotifications.find(notif => 
          notif.reminder.id === reminder.id && notif.snoozedUntil
        );
        const isStillSnoozed = snoozedNotification && snoozedNotification.snoozedUntil! > now;
        
        return !alreadyShown && !isStillSnoozed;
      });

      console.log(`Found ${newDueReminders.length} new due reminders`);

      // Show notifications for new due reminders
      newDueReminders.forEach(reminder => {
        console.log('Showing notification for reminder:', reminder.title);
        
        const notification: ActiveNotification = {
          id: `${reminder.id}-${Date.now()}`,
          reminder,
          shownAt: now
        };

        setActiveNotifications(prev => [...prev, notification]);
        
        // Play sound for new notifications
        playNotificationSound();
        
        // Show toast notification as backup
        toast({
          title: "Reminder Due",
          description: reminder.title,
          duration: 5000,
        });

        // Request browser notification permission and show if granted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('CureCast Reminder', {
            body: reminder.title,
            icon: '/favicon.png',
            tag: reminder.id
          });
        } else if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('CureCast Reminder', {
                body: reminder.title,
                icon: '/favicon.png',
                tag: reminder.id
              });
            }
          });
        }
      });

      setLastCheck(now);
    } catch (error) {
      console.error('Error checking for due reminders:', error);
    }
  }, [user, activeNotifications, playNotificationSound, toast]);

  // Set up periodic checking
  useEffect(() => {
    if (!user) return;

    // Check immediately
    checkForDueReminders();

    // Then check every minute
    const interval = setInterval(checkForDueReminders, 60000);

    return () => clearInterval(interval);
  }, [user, checkForDueReminders]);

  // Handle notification actions
  const handleDismiss = useCallback((notificationId: string) => {
    setActiveNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    );
  }, []);

  const handleComplete = useCallback(async (notificationId: string) => {
    const notification = activeNotifications.find(notif => notif.id === notificationId);
    if (!notification || !user) return;

    try {
      // Mark reminder as completed in the database
      await firebaseReminderService.markReminderCompleted(notification.reminder.id, user.uid);
      
      console.log('Marking reminder as completed:', notification.reminder.title);
      
      toast({
        title: "Reminder Completed",
        description: `"${notification.reminder.title}" has been marked as done.`,
        duration: 3000,
      });

      handleDismiss(notificationId);
    } catch (error) {
      console.error('Error completing reminder:', error);
      toast({
        title: "Error",
        description: "Failed to mark reminder as completed.",
        variant: "destructive"
      });
    }
  }, [activeNotifications, user, toast, handleDismiss]);

  const handleSnooze = useCallback(async (notificationId: string, minutes: number) => {
    const notification = activeNotifications.find(notif => notif.id === notificationId);
    if (!notification || !user) return;

    try {
      // Snooze the reminder in the database
      await firebaseReminderService.snoozeReminder(notification.reminder.id, user.uid, minutes);
      
      console.log(`Snoozing reminder "${notification.reminder.title}" for ${minutes} minutes`);

      toast({
        title: "Reminder Snoozed",
        description: `"${notification.reminder.title}" will remind you again in ${minutes} minutes.`,
        duration: 3000,
      });

      // Remove from active notifications
      handleDismiss(notificationId);
    } catch (error) {
      console.error('Error snoozing reminder:', error);
      toast({
        title: "Error",
        description: "Failed to snooze reminder.",
        variant: "destructive"
      });
    }
  }, [activeNotifications, user, toast, handleDismiss]);

  // Clean up old notifications (remove after 10 minutes if not interacted with)
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = new Date();
      setActiveNotifications(prev => 
        prev.filter(notif => {
          const age = now.getTime() - notif.shownAt.getTime();
          const maxAge = 10 * 60 * 1000; // 10 minutes
          return age < maxAge;
        })
      );
    }, 60000); // Check every minute

    return () => clearInterval(cleanup);
  }, []);

  // Render active notifications
  return (
    <>
      {activeNotifications
        .filter(notif => !notif.snoozedUntil || notif.snoozedUntil <= new Date())
        .map(notification => (
          <FloatingReminderNotification
            key={notification.id}
            reminder={notification.reminder}
            onDismiss={() => handleDismiss(notification.id)}
            onComplete={() => handleComplete(notification.id)}
            onSnooze={(minutes) => handleSnooze(notification.id, minutes)}
          />
        ))}
    </>
  );
};

export default ReminderNotificationManager;
