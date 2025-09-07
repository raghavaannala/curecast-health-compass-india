/**
 * Firebase Reminder Service
 * Handles CRUD operations for user reminders with Firebase Firestore
 */

import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description: string;
  date_time: string; // ISO string
  created_at: string; // ISO string
}

export interface ReminderFormData {
  title: string;
  description: string;
  date_time: string; // ISO string from datetime-local input
}

class FirebaseReminderService {
  private collectionName = 'reminders';

  /**
   * Create a new reminder for the user
   */
  async createReminder(userId: string, reminderData: ReminderFormData): Promise<Reminder> {
    try {
      if (!userId) {
        throw new Error('User must be logged in to create reminders');
      }

      // Validate required fields
      if (!reminderData.title.trim()) {
        throw new Error('Reminder title is required');
      }

      if (!reminderData.date_time) {
        throw new Error('Reminder date and time is required');
      }

      // Validate date is not in the past
      const reminderDate = new Date(reminderData.date_time);
      const now = new Date();
      if (reminderDate < now) {
        throw new Error('Reminder date cannot be in the past');
      }

      const docRef = await addDoc(collection(db, this.collectionName), {
        user_id: userId,
        title: reminderData.title.trim(),
        description: reminderData.description.trim(),
        date_time: reminderData.date_time,
        created_at: serverTimestamp()
      });

      // Return the created reminder with the generated ID
      const newReminder: Reminder = {
        id: docRef.id,
        user_id: userId,
        title: reminderData.title.trim(),
        description: reminderData.description.trim(),
        date_time: reminderData.date_time,
        created_at: new Date().toISOString()
      };

      console.log('Reminder created successfully:', newReminder);
      return newReminder;
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw error;
    }
  }

  /**
   * Get all reminders for a specific user, sorted by date_time
   */
  async getUserReminders(userId: string): Promise<Reminder[]> {
    try {
      if (!userId) {
        console.log('No user ID provided, returning empty reminders');
        return [];
      }

      const q = query(
        collection(db, this.collectionName),
        where('user_id', '==', userId),
        orderBy('date_time', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const reminders: Reminder[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Convert Firestore Timestamp to ISO string if needed
        let createdAt = data.created_at;
        if (createdAt && typeof createdAt.toDate === 'function') {
          createdAt = createdAt.toDate().toISOString();
        } else if (createdAt && typeof createdAt === 'object' && createdAt.seconds) {
          createdAt = new Date(createdAt.seconds * 1000).toISOString();
        } else if (!createdAt) {
          createdAt = new Date().toISOString();
        }

        reminders.push({
          id: doc.id,
          user_id: data.user_id,
          title: data.title,
          description: data.description || '',
          date_time: data.date_time,
          created_at: createdAt
        });
      });

      console.log(`Loaded ${reminders.length} reminders for user ${userId}`);
      return reminders;
    } catch (error) {
      console.error('Error fetching user reminders:', error);
      throw new Error('Failed to load reminders. Please try again.');
    }
  }

  /**
   * Update an existing reminder
   */
  async updateReminder(reminderId: string, userId: string, reminderData: ReminderFormData): Promise<Reminder> {
    try {
      if (!userId) {
        throw new Error('User must be logged in to update reminders');
      }

      if (!reminderData.title.trim()) {
        throw new Error('Reminder title is required');
      }

      if (!reminderData.date_time) {
        throw new Error('Reminder date and time is required');
      }

      // Validate date is not in the past
      const reminderDate = new Date(reminderData.date_time);
      const now = new Date();
      if (reminderDate < now) {
        throw new Error('Reminder date cannot be in the past');
      }

      const reminderRef = doc(db, this.collectionName, reminderId);
      
      await updateDoc(reminderRef, {
        title: reminderData.title.trim(),
        description: reminderData.description.trim(),
        date_time: reminderData.date_time
      });

      // Return updated reminder
      const updatedReminder: Reminder = {
        id: reminderId,
        user_id: userId,
        title: reminderData.title.trim(),
        description: reminderData.description.trim(),
        date_time: reminderData.date_time,
        created_at: new Date().toISOString() // This would be the original created_at in real scenario
      };

      console.log('Reminder updated successfully:', updatedReminder);
      return updatedReminder;
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  }

  /**
   * Delete a reminder
   */
  async deleteReminder(reminderId: string, userId: string): Promise<void> {
    try {
      if (!userId) {
        throw new Error('User must be logged in to delete reminders');
      }

      const reminderRef = doc(db, this.collectionName, reminderId);
      await deleteDoc(reminderRef);

      console.log('Reminder deleted successfully:', reminderId);
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw new Error('Failed to delete reminder. Please try again.');
    }
  }

  /**
   * Get upcoming reminders (next 7 days)
   */
  async getUpcomingReminders(userId: string): Promise<Reminder[]> {
    try {
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);

      const allReminders = await this.getUserReminders(userId);
      
      return allReminders.filter(reminder => {
        const reminderDate = new Date(reminder.date_time);
        return reminderDate >= now && reminderDate <= nextWeek;
      });
    } catch (error) {
      console.error('Error fetching upcoming reminders:', error);
      throw new Error('Failed to load upcoming reminders.');
    }
  }

  /**
   * Get overdue reminders
   */
  async getOverdueReminders(userId: string): Promise<Reminder[]> {
    try {
      const now = new Date();
      const allReminders = await this.getUserReminders(userId);
      
      return allReminders.filter(reminder => {
        const reminderDate = new Date(reminder.date_time);
        return reminderDate < now;
      });
    } catch (error) {
      console.error('Error fetching overdue reminders:', error);
      throw new Error('Failed to load overdue reminders.');
    }
  }

  /**
   * Format date for display
   */
  formatReminderDate(dateTimeString: string): { date: string; time: string; isOverdue: boolean } {
    try {
      const date = new Date(dateTimeString);
      const now = new Date();
      
      const dateOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      };
      
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };

      return {
        date: date.toLocaleDateString('en-IN', dateOptions),
        time: date.toLocaleTimeString('en-IN', timeOptions),
        isOverdue: date < now
      };
    } catch (error) {
      console.error('Error formatting date:', error);
      return {
        date: 'Invalid Date',
        time: 'Invalid Time',
        isOverdue: false
      };
    }
  }

  /**
   * Get reminder statistics for user
   */
  async getReminderStats(userId: string): Promise<{
    total: number;
    upcoming: number;
    overdue: number;
    today: number;
  }> {
    try {
      const allReminders = await this.getUserReminders(userId);
      const now = new Date();
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const upcoming = allReminders.filter(r => new Date(r.date_time) > now).length;
      const overdue = allReminders.filter(r => new Date(r.date_time) < now).length;
      const todayCount = allReminders.filter(r => {
        const reminderDate = new Date(r.date_time);
        return reminderDate >= todayStart && reminderDate <= today;
      }).length;

      return {
        total: allReminders.length,
        upcoming,
        overdue,
        today: todayCount
      };
    } catch (error) {
      console.error('Error getting reminder stats:', error);
      return { total: 0, upcoming: 0, overdue: 0, today: 0 };
    }
  }
}

export const firebaseReminderService = new FirebaseReminderService();
export default firebaseReminderService;
