import React, { useState, useEffect } from 'react';
import { 
  VaccinationNotification, 
  CustomVaccinationReminder,
  Language 
} from '../types';
import { vaccinationReminderService } from '../services/vaccinationReminderService';
import { communicationService } from '../services/communicationService';

interface VaccinationNotificationSystemProps {
  userId: string;
  language: Language;
}

interface NotificationToast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  duration: number;
  actions?: Array<{
    label: string;
    action: () => void;
    style: 'primary' | 'secondary';
  }>;
}

/**
 * Comprehensive Notification System for Vaccination Reminders
 * Features: Browser notifications, toast messages, notification center
 */
export const VaccinationNotificationSystem: React.FC<VaccinationNotificationSystemProps> = ({
  userId,
  language
}) => {
  const [notifications, setNotifications] = useState<VaccinationNotification[]>([]);
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    initializeNotificationSystem();
    loadNotifications();
    
    // Check for notifications every minute
    const interval = setInterval(checkForDueNotifications, 60000);
    
    return () => clearInterval(interval);
  }, [userId]);

  const initializeNotificationSystem = async () => {
    // Request browser notification permission
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
    }

    // Register service worker for background notifications (if available)
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (error) {
        console.log('Service worker registration failed:', error);
      }
    }
  };

  const loadNotifications = async () => {
    try {
      // In a real implementation, this would fetch from the service
      const userNotifications = JSON.parse(
        localStorage.getItem(`notifications_${userId}`) || '[]'
      );
      setNotifications(userNotifications);
      
      const unread = userNotifications.filter((n: VaccinationNotification) => n.status !== 'read').length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const checkForDueNotifications = async () => {
    try {
      const upcomingReminders = await vaccinationReminderService.getUpcomingReminders(userId, 30);
      const overdueReminders = await vaccinationReminderService.getOverdueReminders(userId);
      
      // Check for reminders due today
      const today = new Date().toISOString().split('T')[0];
      const todayReminders = upcomingReminders.filter(r => r.scheduledDate === today);
      
      // Show notifications for today's reminders
      todayReminders.forEach(reminder => {
        showVaccinationReminder(reminder);
      });

      // Show overdue notifications
      overdueReminders.forEach(reminder => {
        showOverdueReminder(reminder);
      });

    } catch (error) {
      console.error('Error checking for due notifications:', error);
    }
  };

  const showVaccinationReminder = (reminder: CustomVaccinationReminder) => {
    const toast: NotificationToast = {
      id: `reminder_${reminder.id}`,
      title: '💉 Vaccination Reminder',
      message: `${reminder.name} is scheduled for today at ${reminder.scheduledTime}`,
      type: reminder.priority === 'critical' ? 'error' : 
            reminder.priority === 'high' ? 'warning' : 'info',
      duration: 10000,
      actions: [
        {
          label: 'Mark Complete',
          action: () => markReminderComplete(reminder.id),
          style: 'primary'
        },
        {
          label: 'Snooze',
          action: () => snoozeReminder(reminder.id),
          style: 'secondary'
        }
      ]
    };

    addToast(toast);
    
    // Show browser notification if permission granted
    if (permissionStatus === 'granted') {
      showBrowserNotification(toast.title, toast.message, {
        icon: '/favicon.png',
        badge: '/badge.png',
        tag: reminder.id,
        requireInteraction: reminder.priority === 'critical'
      });
    }
  };

  const showOverdueReminder = (reminder: CustomVaccinationReminder) => {
    const daysPast = Math.floor(
      (new Date().getTime() - new Date(reminder.scheduledDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const toast: NotificationToast = {
      id: `overdue_${reminder.id}`,
      title: '⚠️ Overdue Vaccination',
      message: `${reminder.name} was due ${daysPast} day${daysPast > 1 ? 's' : ''} ago`,
      type: 'error',
      duration: 15000,
      actions: [
        {
          label: 'Mark Complete',
          action: () => markReminderComplete(reminder.id),
          style: 'primary'
        },
        {
          label: 'Reschedule',
          action: () => rescheduleReminder(reminder.id),
          style: 'secondary'
        }
      ]
    };

    addToast(toast);
  };

  const addToast = (toast: NotificationToast) => {
    setToasts(prev => [...prev, toast]);
    
    // Auto-remove toast after duration
    setTimeout(() => {
      removeToast(toast.id);
    }, toast.duration);
  };

  const removeToast = (toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  };

  const showBrowserNotification = (title: string, body: string, options: NotificationOptions = {}) => {
    if (permissionStatus === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.png',
        badge: '/badge.png',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    }
  };

  const markReminderComplete = async (reminderId: string) => {
    try {
      await vaccinationReminderService.markCompleted(reminderId);
      
      // Remove related toasts
      setToasts(prev => prev.filter(t => !t.id.includes(reminderId)));
      
      // Show success toast
      addToast({
        id: `complete_${reminderId}`,
        title: '✅ Vaccination Completed',
        message: 'Vaccination marked as completed successfully',
        type: 'success',
        duration: 5000
      });
      
    } catch (error) {
      console.error('Error marking reminder complete:', error);
      addToast({
        id: `error_${Date.now()}`,
        title: '❌ Error',
        message: 'Failed to mark vaccination as complete',
        type: 'error',
        duration: 5000
      });
    }
  };

  const snoozeReminder = async (reminderId: string) => {
    try {
      const reminder = await vaccinationReminderService.getUserReminders(userId);
      const targetReminder = reminder.find(r => r.id === reminderId);
      
      if (targetReminder) {
        // Snooze for 1 hour
        const newTime = new Date();
        newTime.setHours(newTime.getHours() + 1);
        
        await vaccinationReminderService.updateReminder(reminderId, {
          scheduledTime: newTime.toTimeString().slice(0, 5)
        });
        
        // Remove related toasts
        setToasts(prev => prev.filter(t => !t.id.includes(reminderId)));
        
        addToast({
          id: `snooze_${reminderId}`,
          title: '⏰ Reminder Snoozed',
          message: 'Reminder snoozed for 1 hour',
          type: 'info',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error snoozing reminder:', error);
    }
  };

  const rescheduleReminder = async (reminderId: string) => {
    // This would typically open a reschedule modal
    // For now, we'll reschedule to tomorrow
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await vaccinationReminderService.updateReminder(reminderId, {
        scheduledDate: tomorrow.toISOString().split('T')[0],
        status: 'pending'
      });
      
      setToasts(prev => prev.filter(t => !t.id.includes(reminderId)));
      
      addToast({
        id: `reschedule_${reminderId}`,
        title: '📅 Reminder Rescheduled',
        message: 'Vaccination rescheduled to tomorrow',
        type: 'success',
        duration: 5000
      });
      
    } catch (error) {
      console.error('Error rescheduling reminder:', error);
    }
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, status: 'read' as const } : n
      )
    );
    
    // Update unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // Save to localStorage
    const updatedNotifications = notifications.map(n => 
      n.id === notificationId ? { ...n, status: 'read' as const } : n
    );
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(updatedNotifications));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem(`notifications_${userId}`);
  };

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const getToastColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500 border-green-600';
      case 'error': return 'bg-red-500 border-red-600';
      case 'warning': return 'bg-yellow-500 border-yellow-600';
      default: return 'bg-blue-500 border-blue-600';
    }
  };

  return (
    <>
      {/* Notification Bell Icon */}
      <div className="relative">
        <button
          onClick={() => setShowNotificationCenter(!showNotificationCenter)}
          className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6.334C5.597 19 5 18.403 5 17.666V4.334C5 3.597 5.597 3 6.334 3h11.332C18.403 3 19 3.597 19 4.334V11" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Center Dropdown */}
        {showNotificationCenter && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => markNotificationAsRead(notification.id)}
                    className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                      notification.status === 'read' ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{notification.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.scheduledFor).toLocaleString()}
                        </p>
                      </div>
                      {notification.status !== 'read' && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-2"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`
              max-w-sm w-full bg-white border-l-4 rounded-lg shadow-lg p-4 transform transition-all duration-300
              ${getToastColor(toast.type)}
            `}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-xl">{getToastIcon(toast.type)}</span>
              </div>
              <div className="ml-3 flex-1">
                <h4 className="font-medium text-gray-900">{toast.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{toast.message}</p>
                
                {toast.actions && (
                  <div className="mt-3 flex space-x-2">
                    {toast.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={action.action}
                        className={`
                          px-3 py-1 text-xs rounded font-medium
                          ${action.style === 'primary' 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                          }
                        `}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Permission Request Banner */}
      {permissionStatus === 'default' && (
        <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-40">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Enable Notifications</h4>
              <p className="text-sm opacity-90">Get timely reminders for your vaccinations</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={initializeNotificationSystem}
                className="px-4 py-2 bg-white text-blue-600 rounded font-medium hover:bg-gray-100"
              >
                Enable
              </button>
              <button
                onClick={() => setPermissionStatus('denied')}
                className="px-4 py-2 text-white border border-white rounded hover:bg-blue-700"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VaccinationNotificationSystem;
