import { Reminder, ReminderFormData } from '../types';

export class ReminderService {
  private static instance: ReminderService;
  private readonly storageKey = 'app_reminders';

  static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService();
    }
    return ReminderService.instance;
  }

  /**
   * Get all reminders from localStorage with error handling
   */
  async getReminders(): Promise<Reminder[]> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      
      const reminders: Reminder[] = JSON.parse(stored);
      
      // Add isOverdue flag and sort by due date
      const now = new Date();
      return reminders
        .map(reminder => ({
          ...reminder,
          isOverdue: !reminder.completed && new Date(reminder.dueDateTime) < now
        }))
        .sort((a, b) => {
          // Completed reminders go to bottom
          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
          }
          // Sort by due date (ascending)
          return new Date(a.dueDateTime).getTime() - new Date(b.dueDateTime).getTime();
        });
    } catch (error) {
      console.error('Failed to load reminders:', error);
      throw new Error('Unable to load reminders. Please refresh the page.');
    }
  }

  /**
   * Save reminders to localStorage with error handling
   */
  private async saveReminders(reminders: Reminder[]): Promise<void> {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(reminders));
    } catch (error) {
      console.error('Failed to save reminders:', error);
      throw new Error('Unable to save reminder. Please check your storage space.');
    }
  }

  /**
   * Create a new reminder
   */
  async createReminder(formData: ReminderFormData): Promise<Reminder> {
    try {
      const now = new Date().toISOString();
      const dueDateTime = `${formData.dueDate}T${formData.dueTime}:00`;
      
      const newReminder: Reminder = {
        id: this.generateId(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueDateTime,
        tags: formData.tags.filter(tag => tag.trim() !== ''),
        completed: false,
        createdAt: now,
        updatedAt: now
      };

      const reminders = await this.getReminders();
      reminders.push(newReminder);
      await this.saveReminders(reminders);
      
      return newReminder;
    } catch (error) {
      console.error('Failed to create reminder:', error);
      throw new Error('Unable to create reminder. Please try again.');
    }
  }

  /**
   * Update an existing reminder
   */
  async updateReminder(id: string, formData: ReminderFormData): Promise<Reminder> {
    try {
      const reminders = await this.getReminders();
      const index = reminders.findIndex(r => r.id === id);
      
      if (index === -1) {
        throw new Error('Reminder not found');
      }

      const dueDateTime = `${formData.dueDate}T${formData.dueTime}:00`;
      
      const updatedReminder: Reminder = {
        ...reminders[index],
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueDateTime,
        tags: formData.tags.filter(tag => tag.trim() !== ''),
        updatedAt: new Date().toISOString()
      };

      reminders[index] = updatedReminder;
      await this.saveReminders(reminders);
      
      return updatedReminder;
    } catch (error) {
      console.error('Failed to update reminder:', error);
      throw new Error('Unable to update reminder. Please try again.');
    }
  }

  /**
   * Delete a reminder
   */
  async deleteReminder(id: string): Promise<void> {
    try {
      const reminders = await this.getReminders();
      const filteredReminders = reminders.filter(r => r.id !== id);
      
      if (filteredReminders.length === reminders.length) {
        throw new Error('Reminder not found');
      }
      
      await this.saveReminders(filteredReminders);
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      throw new Error('Unable to delete reminder. Please try again.');
    }
  }

  /**
   * Mark reminder as completed/incomplete
   */
  async toggleReminderComplete(id: string): Promise<Reminder> {
    try {
      const reminders = await this.getReminders();
      const index = reminders.findIndex(r => r.id === id);
      
      if (index === -1) {
        throw new Error('Reminder not found');
      }

      reminders[index] = {
        ...reminders[index],
        completed: !reminders[index].completed,
        updatedAt: new Date().toISOString()
      };

      await this.saveReminders(reminders);
      return reminders[index];
    } catch (error) {
      console.error('Failed to toggle reminder:', error);
      throw new Error('Unable to update reminder status. Please try again.');
    }
  }

  /**
   * Get reminder by ID
   */
  async getReminderById(id: string): Promise<Reminder | null> {
    try {
      const reminders = await this.getReminders();
      return reminders.find(r => r.id === id) || null;
    } catch (error) {
      console.error('Failed to get reminder:', error);
      return null;
    }
  }

  /**
   * Get pending reminders count for badge
   */
  async getPendingCount(): Promise<number> {
    try {
      const reminders = await this.getReminders();
      return reminders.filter(r => !r.completed).length;
    } catch (error) {
      console.error('Failed to get pending count:', error);
      return 0;
    }
  }

  /**
   * Get overdue reminders count
   */
  async getOverdueCount(): Promise<number> {
    try {
      const reminders = await this.getReminders();
      const now = new Date();
      return reminders.filter(r => 
        !r.completed && new Date(r.dueDateTime) < now
      ).length;
    } catch (error) {
      console.error('Failed to get overdue count:', error);
      return 0;
    }
  }

  /**
   * Search and filter reminders
   */
  async searchReminders(query: string, tags: string[] = [], showCompleted = false): Promise<Reminder[]> {
    try {
      const reminders = await this.getReminders();
      
      return reminders.filter(reminder => {
        // Filter by completion status
        if (!showCompleted && reminder.completed) return false;
        
        // Filter by search query
        if (query) {
          const searchLower = query.toLowerCase();
          const matchesTitle = reminder.title.toLowerCase().includes(searchLower);
          const matchesDescription = reminder.description.toLowerCase().includes(searchLower);
          const matchesTags = reminder.tags.some(tag => 
            tag.toLowerCase().includes(searchLower)
          );
          
          if (!matchesTitle && !matchesDescription && !matchesTags) {
            return false;
          }
        }
        
        // Filter by tags
        if (tags.length > 0) {
          const hasMatchingTag = tags.some(tag => 
            reminder.tags.includes(tag)
          );
          if (!hasMatchingTag) return false;
        }
        
        return true;
      });
    } catch (error) {
      console.error('Failed to search reminders:', error);
      throw new Error('Unable to search reminders. Please try again.');
    }
  }

  /**
   * Get all unique tags
   */
  async getAllTags(): Promise<string[]> {
    try {
      const reminders = await this.getReminders();
      const allTags = reminders.flatMap(r => r.tags);
      return [...new Set(allTags)].sort();
    } catch (error) {
      console.error('Failed to get tags:', error);
      return [];
    }
  }

  /**
   * Export reminders as JSON
   */
  async exportReminders(): Promise<string> {
    try {
      const reminders = await this.getReminders();
      return JSON.stringify(reminders, null, 2);
    } catch (error) {
      console.error('Failed to export reminders:', error);
      throw new Error('Unable to export reminders. Please try again.');
    }
  }

  /**
   * Import reminders from JSON
   */
  async importReminders(jsonData: string): Promise<void> {
    try {
      const importedReminders: Reminder[] = JSON.parse(jsonData);
      
      // Validate imported data
      if (!Array.isArray(importedReminders)) {
        throw new Error('Invalid data format');
      }
      
      // Validate each reminder has required fields
      for (const reminder of importedReminders) {
        if (!reminder.id || !reminder.title || !reminder.dueDateTime) {
          throw new Error('Invalid reminder data structure');
        }
      }
      
      const existingReminders = await this.getReminders();
      const mergedReminders = [...existingReminders];
      
      // Add imported reminders with new IDs to avoid conflicts
      for (const reminder of importedReminders) {
        const existingIndex = mergedReminders.findIndex(r => r.id === reminder.id);
        if (existingIndex >= 0) {
          // Update existing reminder
          mergedReminders[existingIndex] = {
            ...reminder,
            updatedAt: new Date().toISOString()
          };
        } else {
          // Add new reminder
          mergedReminders.push({
            ...reminder,
            id: this.generateId(), // Generate new ID to avoid conflicts
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
      
      await this.saveReminders(mergedReminders);
    } catch (error) {
      console.error('Failed to import reminders:', error);
      throw new Error('Unable to import reminders. Please check the file format.');
    }
  }

  /**
   * Clear all reminders (with confirmation)
   */
  async clearAllReminders(): Promise<void> {
    try {
      await this.saveReminders([]);
    } catch (error) {
      console.error('Failed to clear reminders:', error);
      throw new Error('Unable to clear reminders. Please try again.');
    }
  }

  /**
   * Generate unique ID for reminders
   */
  private generateId(): string {
    return `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate form data
   */
  validateFormData(formData: ReminderFormData): string[] {
    const errors: string[] = [];
    
    if (!formData.title.trim()) {
      errors.push('Title is required');
    }
    
    if (formData.title.length > 100) {
      errors.push('Title must be less than 100 characters');
    }
    
    if (formData.description.length > 500) {
      errors.push('Description must be less than 500 characters');
    }
    
    if (!formData.dueDate) {
      errors.push('Due date is required');
    }
    
    if (!formData.dueTime) {
      errors.push('Due time is required');
    }
    
    // Validate date is not in the past (optional - you can remove this)
    if (formData.dueDate && formData.dueTime) {
      const dueDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`);
      const now = new Date();
      if (dueDateTime < now) {
        errors.push('Due date and time cannot be in the past');
      }
    }
    
    return errors;
  }
}

// Export singleton instance
export const reminderService = ReminderService.getInstance();
