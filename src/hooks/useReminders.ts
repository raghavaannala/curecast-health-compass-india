/**
 * React hooks for Reminders functionality
 * Provides easy integration with existing CureCast components
 */

import { useState, useEffect, useCallback } from 'react';
import { remindersApi } from '../services/remindersApi';
import {
  Reminder,
  ReminderInput,
  ReminderQueryOptions,
  ReminderStats,
  ReminderStatus
} from '../types/mongodb';

// Hook for managing reminders
export const useReminders = (userId: string, options?: ReminderQueryOptions) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchReminders = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await remindersApi.getReminders(userId, options);
      if (response.success) {
        setReminders(response.reminders);
        setTotalCount(response.totalCount);
      } else {
        setError(response.error || 'Failed to fetch reminders');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId, options]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const addReminder = useCallback(async (reminderData: ReminderInput) => {
    setLoading(true);
    setError(null);

    try {
      const response = await remindersApi.addReminder(reminderData);
      if (response.success && response.reminder) {
        setReminders(prev => [response.reminder!, ...prev]);
        setTotalCount(prev => prev + 1);
        return response.reminder;
      } else {
        setError(response.error || 'Failed to add reminder');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReminder = useCallback(async (reminderId: string, updateData: Partial<ReminderInput>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await remindersApi.updateReminder(userId, reminderId, updateData);
      if (response.success) {
        setReminders(prev => 
          prev.map(reminder => 
            reminder._id === reminderId 
              ? { ...reminder, ...updateData, updatedAt: new Date() } 
              : reminder
          )
        );
        return true;
      } else {
        setError(response.error || 'Failed to update reminder');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateReminderStatus = useCallback(async (reminderId: string, status: ReminderStatus) => {
    setLoading(true);
    setError(null);

    try {
      const response = await remindersApi.updateReminderStatus(userId, reminderId, status);
      if (response.success) {
        setReminders(prev => 
          prev.map(reminder => 
            reminder._id === reminderId 
              ? { 
                  ...reminder, 
                  status, 
                  updatedAt: new Date(),
                  completedAt: status === 'completed' ? new Date() : reminder.completedAt
                } 
              : reminder
          )
        );
        return true;
      } else {
        setError(response.error || 'Failed to update reminder status');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const deleteReminder = useCallback(async (reminderId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await remindersApi.deleteReminder(userId, reminderId);
      if (response.success) {
        setReminders(prev => prev.filter(reminder => reminder._id !== reminderId));
        setTotalCount(prev => prev - 1);
        return true;
      } else {
        setError(response.error || 'Failed to delete reminder');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const searchReminders = useCallback(async (searchTerm: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await remindersApi.searchReminders(userId, searchTerm, options);
      if (response.success) {
        setReminders(response.reminders);
        setTotalCount(response.totalCount);
      } else {
        setError(response.error || 'Failed to search reminders');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId, options]);

  // Convenience methods
  const completeReminder = useCallback((reminderId: string) => {
    return updateReminderStatus(reminderId, 'completed');
  }, [updateReminderStatus]);

  const missReminder = useCallback((reminderId: string) => {
    return updateReminderStatus(reminderId, 'missed');
  }, [updateReminderStatus]);

  const cancelReminder = useCallback((reminderId: string) => {
    return updateReminderStatus(reminderId, 'cancelled');
  }, [updateReminderStatus]);

  const reactivateReminder = useCallback((reminderId: string) => {
    return updateReminderStatus(reminderId, 'pending');
  }, [updateReminderStatus]);

  return {
    reminders,
    loading,
    error,
    totalCount,
    addReminder,
    updateReminder,
    updateReminderStatus,
    deleteReminder,
    searchReminders,
    completeReminder,
    missReminder,
    cancelReminder,
    reactivateReminder,
    refetch: fetchReminders
  };
};

// Hook for upcoming reminders
export const useUpcomingReminders = (userId: string, days: number = 7) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUpcomingReminders = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await remindersApi.getUpcomingReminders(userId, days);
      if (response.success) {
        setReminders(response.reminders);
      } else {
        setError(response.error || 'Failed to fetch upcoming reminders');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId, days]);

  useEffect(() => {
    fetchUpcomingReminders();
  }, [fetchUpcomingReminders]);

  return {
    reminders,
    loading,
    error,
    refetch: fetchUpcomingReminders
  };
};

// Hook for overdue reminders
export const useOverdueReminders = (userId: string) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverdueReminders = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await remindersApi.getOverdueReminders(userId);
      if (response.success) {
        setReminders(response.reminders);
      } else {
        setError(response.error || 'Failed to fetch overdue reminders');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchOverdueReminders();
  }, [fetchOverdueReminders]);

  return {
    reminders,
    loading,
    error,
    refetch: fetchOverdueReminders
  };
};

// Hook for today's reminders
export const useTodayReminders = (userId: string) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTodayReminders = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await remindersApi.getTodayReminders(userId);
      if (response.success) {
        setReminders(response.reminders);
      } else {
        setError(response.error || 'Failed to fetch today\'s reminders');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTodayReminders();
  }, [fetchTodayReminders]);

  return {
    reminders,
    loading,
    error,
    refetch: fetchTodayReminders
  };
};

// Hook for reminder statistics
export const useReminderStats = (userId: string) => {
  const [stats, setStats] = useState<ReminderStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await remindersApi.getReminderStats(userId);
      if (response.success) {
        setStats(response.stats);
      } else {
        setError(response.error || 'Failed to fetch stats');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};

// Hook for single reminder
export const useReminder = (userId: string, reminderId: string) => {
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReminder = useCallback(async () => {
    if (!userId || !reminderId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await remindersApi.getReminderById(userId, reminderId);
      if (response.success && response.reminder) {
        setReminder(response.reminder);
      } else {
        setError(response.error || 'Failed to fetch reminder');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId, reminderId]);

  useEffect(() => {
    fetchReminder();
  }, [fetchReminder]);

  return {
    reminder,
    loading,
    error,
    refetch: fetchReminder
  };
};
