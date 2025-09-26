/**
 * Reminders API Service
 * Frontend service for interacting with the Reminders MongoDB API
 */

import {
  Reminder,
  ReminderInput,
  ReminderResponse,
  RemindersResponse,
  ReminderStatsResponse,
  BulkReminderResponse,
  ReminderQueryOptions,
  ReminderStatus
} from '../types/mongodb';

export class RemindersAPI {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001/api/reminders') {
    this.baseUrl = baseUrl;
  }

  /**
   * Add a new reminder
   */
  async addReminder(data: ReminderInput): Promise<ReminderResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding reminder:', error);
      throw error;
    }
  }

  /**
   * Get all reminders for a user
   */
  async getReminders(
    userId: string,
    options?: ReminderQueryOptions
  ): Promise<RemindersResponse> {
    try {
      const params = new URLSearchParams();
      
      if (options) {
        Object.entries(options).forEach(([key, value]) => {
          if (value !== undefined) {
            if (value instanceof Date) {
              params.append(key, value.toISOString());
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      const url = `${this.baseUrl}/${userId}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching reminders:', error);
      throw error;
    }
  }

  /**
   * Get a specific reminder by ID
   */
  async getReminderById(userId: string, reminderId: string): Promise<ReminderResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/${reminderId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching reminder by ID:', error);
      throw error;
    }
  }

  /**
   * Update a reminder
   */
  async updateReminder(
    userId: string,
    reminderId: string,
    updateData: Partial<ReminderInput>
  ): Promise<ReminderResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/${reminderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  }

  /**
   * Update reminder status only
   */
  async updateReminderStatus(
    userId: string,
    reminderId: string,
    status: ReminderStatus
  ): Promise<ReminderResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/${reminderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating reminder status:', error);
      throw error;
    }
  }

  /**
   * Delete a reminder
   */
  async deleteReminder(userId: string, reminderId: string): Promise<ReminderResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/${reminderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }

  /**
   * Get upcoming reminders
   */
  async getUpcomingReminders(userId: string, days: number = 7): Promise<RemindersResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/upcoming?days=${days}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching upcoming reminders:', error);
      throw error;
    }
  }

  /**
   * Get overdue reminders
   */
  async getOverdueReminders(userId: string): Promise<RemindersResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/overdue`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching overdue reminders:', error);
      throw error;
    }
  }

  /**
   * Get reminder statistics
   */
  async getReminderStats(userId: string): Promise<ReminderStatsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/stats`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching reminder stats:', error);
      throw error;
    }
  }

  /**
   * Add multiple reminders at once
   */
  async addBulkReminders(userId: string, reminders: Omit<ReminderInput, 'userId'>[]): Promise<BulkReminderResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reminders }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding bulk reminders:', error);
      throw error;
    }
  }

  /**
   * Mark reminder as completed
   */
  async completeReminder(userId: string, reminderId: string): Promise<ReminderResponse> {
    return this.updateReminderStatus(userId, reminderId, 'completed');
  }

  /**
   * Mark reminder as missed
   */
  async missReminder(userId: string, reminderId: string): Promise<ReminderResponse> {
    return this.updateReminderStatus(userId, reminderId, 'missed');
  }

  /**
   * Cancel reminder
   */
  async cancelReminder(userId: string, reminderId: string): Promise<ReminderResponse> {
    return this.updateReminderStatus(userId, reminderId, 'cancelled');
  }

  /**
   * Reactivate reminder (set to pending)
   */
  async reactivateReminder(userId: string, reminderId: string): Promise<ReminderResponse> {
    return this.updateReminderStatus(userId, reminderId, 'pending');
  }

  /**
   * Search reminders by text
   */
  async searchReminders(
    userId: string,
    searchTerm: string,
    options?: ReminderQueryOptions
  ): Promise<RemindersResponse> {
    try {
      const allReminders = await this.getReminders(userId, options);
      
      if (!allReminders.success || !allReminders.reminders) {
        return allReminders;
      }

      // Client-side search filtering
      const filteredReminders = allReminders.reminders.filter(reminder => 
        reminder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reminder.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reminder.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(reminder.metadata).toLowerCase().includes(searchTerm.toLowerCase())
      );

      return {
        ...allReminders,
        reminders: filteredReminders,
        totalCount: filteredReminders.length,
        message: `Found ${filteredReminders.length} reminders matching "${searchTerm}"`
      };
    } catch (error) {
      console.error('Error searching reminders:', error);
      throw error;
    }
  }

  /**
   * Get reminders for today
   */
  async getTodayReminders(userId: string): Promise<RemindersResponse> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    return this.getReminders(userId, {
      status: 'pending',
      fromDate: startOfDay,
      toDate: endOfDay,
      sortBy: 'reminderDate',
      sortOrder: 1
    });
  }

  /**
   * Get reminders for this week
   */
  async getWeekReminders(userId: string): Promise<RemindersResponse> {
    const today = new Date();
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6, 23, 59, 59);

    return this.getReminders(userId, {
      status: 'pending',
      fromDate: startOfWeek,
      toDate: endOfWeek,
      sortBy: 'reminderDate',
      sortOrder: 1
    });
  }
}

// Create a singleton instance
export const remindersApi = new RemindersAPI();

// Export default instance
export default remindersApi;
