import { 
  CustomVaccinationReminder, 
  VaccineType, 
  VaccinationCalendarEvent, 
  VaccinationNotification,
  GovernmentVaccineSchedule,
  Language,
  ReminderSettings,
  RecurringPattern,
  VaccineEducationalInfo
} from '../types';
import { languageService } from './languageService';
import { communicationService } from './communicationService';

/**
 * Comprehensive Vaccination Reminder Service
 * Handles CRUD operations, notifications, and government database sync
 */
export class VaccinationReminderService {
  private static instance: VaccinationReminderService;
  private reminders: Map<string, CustomVaccinationReminder> = new Map();
  private notifications: Map<string, VaccinationNotification> = new Map();
  private standardVaccines: Map<string, VaccineType> = new Map();
  private governmentSchedules: Map<string, GovernmentVaccineSchedule> = new Map();

  public static getInstance(): VaccinationReminderService {
    if (!VaccinationReminderService.instance) {
      VaccinationReminderService.instance = new VaccinationReminderService();
    }
    return VaccinationReminderService.instance;
  }

  constructor() {
    this.initializeStandardVaccines();
    this.loadRemindersFromStorage();
    this.startNotificationScheduler();
  }

  /**
   * Initialize standard vaccine types with educational information
   */
  private initializeStandardVaccines(): void {
    const standardVaccines: VaccineType[] = [
      {
        id: 'polio',
        name: 'Polio Vaccine (OPV/IPV)',
        category: 'routine',
        ageGroup: ['0-2 years', '4-6 years'],
        standardSchedule: [
          { doseNumber: 1, ageInMonths: 2, description: 'First dose at 2 months', isBooster: false },
          { doseNumber: 2, ageInMonths: 4, description: 'Second dose at 4 months', isBooster: false },
          { doseNumber: 3, ageInMonths: 6, description: 'Third dose at 6 months', isBooster: false },
          { doseNumber: 4, ageInMonths: 48, description: 'Booster at 4-6 years', isBooster: true }
        ],
        contraindications: ['Severe illness', 'Immunocompromised state'],
        sideEffects: ['Mild fever', 'Soreness at injection site']
      },
      {
        id: 'measles',
        name: 'Measles, Mumps, Rubella (MMR)',
        category: 'routine',
        ageGroup: ['12-15 months', '4-6 years'],
        standardSchedule: [
          { doseNumber: 1, ageInMonths: 12, description: 'First dose at 12-15 months', isBooster: false },
          { doseNumber: 2, ageInMonths: 48, description: 'Second dose at 4-6 years', isBooster: true }
        ],
        contraindications: ['Pregnancy', 'Severe immunodeficiency', 'Active tuberculosis'],
        sideEffects: ['Mild rash', 'Fever', 'Joint pain']
      },
      {
        id: 'tetanus',
        name: 'Tetanus Toxoid (TT)',
        category: 'routine',
        ageGroup: ['All ages'],
        standardSchedule: [
          { doseNumber: 1, ageInMonths: 2, description: 'Primary series', isBooster: false },
          { doseNumber: 2, ageInMonths: 120, description: 'Booster every 10 years', isBooster: true }
        ],
        contraindications: ['Previous severe reaction'],
        sideEffects: ['Pain at injection site', 'Mild fever']
      },
      {
        id: 'hepatitis_b',
        name: 'Hepatitis B Vaccine',
        category: 'routine',
        ageGroup: ['Birth', '1-2 months', '6-18 months'],
        standardSchedule: [
          { doseNumber: 1, ageInMonths: 0, description: 'At birth', isBooster: false },
          { doseNumber: 2, ageInMonths: 1, description: 'At 1-2 months', isBooster: false },
          { doseNumber: 3, ageInMonths: 6, description: 'At 6-18 months', isBooster: false }
        ],
        contraindications: ['Severe illness', 'Yeast allergy'],
        sideEffects: ['Soreness', 'Low-grade fever']
      },
      {
        id: 'covid19',
        name: 'COVID-19 Vaccine',
        category: 'emergency',
        ageGroup: ['12+ years'],
        standardSchedule: [
          { doseNumber: 1, ageInMonths: 144, description: 'First dose', isBooster: false },
          { doseNumber: 2, ageInMonths: 145, description: 'Second dose (4-12 weeks after first)', isBooster: false },
          { doseNumber: 3, ageInMonths: 150, description: 'Booster (6 months after second)', isBooster: true }
        ],
        contraindications: ['Severe allergic reaction to previous dose'],
        sideEffects: ['Pain at injection site', 'Fatigue', 'Headache', 'Muscle pain']
      }
    ];

    standardVaccines.forEach(vaccine => {
      this.standardVaccines.set(vaccine.id, vaccine);
    });
  }

  /**
   * Create a new vaccination reminder
   */
  async createReminder(reminderData: Partial<CustomVaccinationReminder>): Promise<CustomVaccinationReminder> {
    try {
      const id = `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const reminder: CustomVaccinationReminder = {
        id,
        userId: reminderData.userId!,
        name: reminderData.name!,
        description: reminderData.description!,
        scheduledDate: reminderData.scheduledDate!,
        scheduledTime: reminderData.scheduledTime!,
        notes: reminderData.notes || '',
        isCustom: reminderData.isCustom || true,
        vaccineType: reminderData.vaccineType || this.createCustomVaccineType(reminderData.name!),
        priority: reminderData.priority || 'medium',
        status: 'pending',
        reminderSettings: reminderData.reminderSettings || this.getDefaultReminderSettings(),
        isRecurring: reminderData.isRecurring || false,
        recurringPattern: reminderData.recurringPattern,
        governmentMandated: reminderData.governmentMandated || false,
        educationalInfo: reminderData.educationalInfo || this.getDefaultEducationalInfo(reminderData.name!),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Calculate next due date if recurring
      if (reminder.isRecurring && reminder.recurringPattern) {
        reminder.nextDueDate = this.calculateNextDueDate(reminder.scheduledDate, reminder.recurringPattern);
      }

      this.reminders.set(id, reminder);
      await this.saveRemindersToStorage();
      
      // Schedule notifications
      await this.scheduleNotifications(reminder);

      return reminder;
    } catch (error) {
      console.error('Error creating vaccination reminder:', error);
      throw new Error('Failed to create vaccination reminder');
    }
  }

  /**
   * Get all reminders for a user
   */
  async getUserReminders(userId: string): Promise<CustomVaccinationReminder[]> {
    try {
      const userReminders = Array.from(this.reminders.values())
        .filter(reminder => reminder.userId === userId)
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

      // Update overdue status
      const now = new Date();
      userReminders.forEach(reminder => {
        const scheduledDateTime = new Date(`${reminder.scheduledDate}T${reminder.scheduledTime}`);
        if (scheduledDateTime < now && reminder.status === 'pending') {
          reminder.status = 'overdue';
          this.reminders.set(reminder.id, reminder);
        }
      });

      await this.saveRemindersToStorage();
      return userReminders;
    } catch (error) {
      console.error('Error fetching user reminders:', error);
      return [];
    }
  }

  /**
   * Update an existing reminder
   */
  async updateReminder(id: string, updates: Partial<CustomVaccinationReminder>): Promise<CustomVaccinationReminder> {
    try {
      const existingReminder = this.reminders.get(id);
      if (!existingReminder) {
        throw new Error('Reminder not found');
      }

      const updatedReminder: CustomVaccinationReminder = {
        ...existingReminder,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Recalculate next due date if recurring pattern changed
      if (updates.recurringPattern || updates.scheduledDate) {
        if (updatedReminder.isRecurring && updatedReminder.recurringPattern) {
          updatedReminder.nextDueDate = this.calculateNextDueDate(
            updatedReminder.scheduledDate, 
            updatedReminder.recurringPattern
          );
        }
      }

      this.reminders.set(id, updatedReminder);
      await this.saveRemindersToStorage();

      // Reschedule notifications if needed
      if (updates.scheduledDate || updates.scheduledTime || updates.reminderSettings) {
        await this.scheduleNotifications(updatedReminder);
      }

      return updatedReminder;
    } catch (error) {
      console.error('Error updating vaccination reminder:', error);
      throw error;
    }
  }

  /**
   * Delete a reminder
   */
  async deleteReminder(id: string): Promise<boolean> {
    try {
      const reminder = this.reminders.get(id);
      if (!reminder) {
        return false;
      }

      this.reminders.delete(id);
      await this.saveRemindersToStorage();

      // Cancel scheduled notifications
      await this.cancelNotifications(id);

      return true;
    } catch (error) {
      console.error('Error deleting vaccination reminder:', error);
      return false;
    }
  }

  /**
   * Mark reminder as completed
   */
  async markCompleted(id: string, completedDate?: string): Promise<CustomVaccinationReminder> {
    try {
      const reminder = this.reminders.get(id);
      if (!reminder) {
        throw new Error('Reminder not found');
      }

      reminder.status = 'completed';
      reminder.completedDate = completedDate || new Date().toISOString();
      reminder.updatedAt = new Date().toISOString();

      // If recurring, create next reminder
      if (reminder.isRecurring && reminder.recurringPattern && reminder.nextDueDate) {
        await this.createRecurringReminder(reminder);
      }

      this.reminders.set(id, reminder);
      await this.saveRemindersToStorage();

      return reminder;
    } catch (error) {
      console.error('Error marking reminder as completed:', error);
      throw error;
    }
  }

  /**
   * Get calendar events for a date range
   */
  async getCalendarEvents(userId: string, startDate: string, endDate: string): Promise<VaccinationCalendarEvent[]> {
    try {
      const userReminders = await this.getUserReminders(userId);
      const start = new Date(startDate);
      const end = new Date(endDate);

      const events: VaccinationCalendarEvent[] = [];

      userReminders.forEach(reminder => {
        const reminderDate = new Date(reminder.scheduledDate);
        
        if (reminderDate >= start && reminderDate <= end) {
          events.push({
            id: `event_${reminder.id}`,
            title: reminder.name,
            date: reminder.scheduledDate,
            time: reminder.scheduledTime,
            type: reminder.vaccineType.category === 'routine' ? 'vaccination' : 
                  reminder.vaccineType.standardSchedule?.some(s => s.isBooster) ? 'booster' : 'vaccination',
            priority: reminder.priority,
            status: reminder.status,
            reminder
          });
        }

        // Add recurring events
        if (reminder.isRecurring && reminder.recurringPattern) {
          const recurringEvents = this.generateRecurringEvents(reminder, start, end);
          events.push(...recurringEvents);
        }
      });

      return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }

  /**
   * Get overdue reminders
   */
  async getOverdueReminders(userId: string): Promise<CustomVaccinationReminder[]> {
    try {
      const userReminders = await this.getUserReminders(userId);
      return userReminders.filter(reminder => reminder.status === 'overdue');
    } catch (error) {
      console.error('Error fetching overdue reminders:', error);
      return [];
    }
  }

  /**
   * Get upcoming reminders (next 30 days)
   */
  async getUpcomingReminders(userId: string, days: number = 30): Promise<CustomVaccinationReminder[]> {
    try {
      const userReminders = await this.getUserReminders(userId);
      const now = new Date();
      const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));

      return userReminders.filter(reminder => {
        const scheduledDate = new Date(reminder.scheduledDate);
        return scheduledDate >= now && scheduledDate <= futureDate && reminder.status === 'pending';
      });
    } catch (error) {
      console.error('Error fetching upcoming reminders:', error);
      return [];
    }
  }

  /**
   * Sync with government vaccination schedules
   */
  async syncWithGovernmentSchedules(userId: string, userAge: number, region: string): Promise<CustomVaccinationReminder[]> {
    try {
      const governmentSchedules = await this.fetchGovernmentSchedules(region);
      const createdReminders: CustomVaccinationReminder[] = [];

      for (const schedule of governmentSchedules) {
        if (this.isScheduleApplicable(schedule, userAge)) {
          for (const dose of schedule.schedule) {
            const existingReminder = Array.from(this.reminders.values()).find(r => 
              r.userId === userId && 
              r.vaccineType.name.includes(schedule.vaccineName) &&
              r.description.includes(`Dose ${dose.dose}`)
            );

            if (!existingReminder) {
              const scheduledDate = this.calculateScheduleDate(userAge, dose.ageInMonths);
              
              const reminder = await this.createReminder({
                userId,
                name: `${schedule.vaccineName} - Dose ${dose.dose}`,
                description: dose.description,
                scheduledDate: scheduledDate.toISOString().split('T')[0],
                scheduledTime: '09:00',
                isCustom: false,
                governmentMandated: schedule.mandatory,
                priority: schedule.mandatory ? 'high' : 'medium',
                vaccineType: this.standardVaccines.get(schedule.id.toLowerCase()) || 
                           this.createCustomVaccineType(schedule.vaccineName)
              });

              createdReminders.push(reminder);
            }
          }
        }
      }

      return createdReminders;
    } catch (error) {
      console.error('Error syncing with government schedules:', error);
      return [];
    }
  }

  /**
   * Search reminders by name or vaccine type
   */
  async searchReminders(userId: string, query: string): Promise<CustomVaccinationReminder[]> {
    try {
      const userReminders = await this.getUserReminders(userId);
      const lowerQuery = query.toLowerCase();

      return userReminders.filter(reminder => 
        reminder.name.toLowerCase().includes(lowerQuery) ||
        reminder.description.toLowerCase().includes(lowerQuery) ||
        reminder.vaccineType.name.toLowerCase().includes(lowerQuery) ||
        reminder.notes?.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Error searching reminders:', error);
      return [];
    }
  }

  /**
   * Create reminder from government schedule
   */
  async createReminderFromGovernmentSchedule(
    userId: string,
    schedule: GovernmentVaccineSchedule
  ): Promise<CustomVaccinationReminder> {
    const reminder: Partial<CustomVaccinationReminder> = {
      userId,
      name: schedule.vaccineName,
      description: schedule.description,
      scheduledDate: new Date().toISOString().split('T')[0], // Today by default
      scheduledTime: '10:00',
      isCustom: false,
      priority: schedule.priority as any,
      governmentMandated: true,
      vaccineType: {
        id: schedule.id,
        name: schedule.vaccineName,
        category: 'routine',
        ageGroup: [schedule.ageGroup],
        contraindications: [],
        sideEffects: []
      },
      reminderSettings: {
        enableNotifications: true,
        notificationMethods: ['website', 'email'],
        advanceNotificationDays: [30, 7, 1],
        timeOfDay: '10:00'
      },
      educationalInfo: {
        importance: `${schedule.vaccineName} is mandated by ${schedule.source} for your safety and public health.`,
        description: schedule.description,
        benefits: ['Disease prevention', 'Health protection', 'Compliance with regulations'],
        risks: ['Mild side effects possible'],
        preparation: ['Consult healthcare provider', 'Bring vaccination records'],
        afterCare: ['Monitor for side effects', 'Keep records updated'],
        sources: [schedule.source, 'Ministry of Health and Family Welfare']
      }
    };

    return this.createReminder(reminder);
  }

  /**
   * Integration with Dr.CureCast main application
   */
  async integrateWithDrCureCast(userId: string, sessionId: string): Promise<void> {
    try {
      // Get upcoming reminders for chat integration
      const upcomingReminders = await this.getUpcomingReminders(userId, 7);
      const overdueReminders = await this.getOverdueReminders(userId);

      // Store integration data for chat context
      const integrationData = {
        userId,
        sessionId,
        upcomingCount: upcomingReminders.length,
        overdueCount: overdueReminders.length,
        nextReminder: upcomingReminders[0] || null,
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem(`vaccination_integration_${userId}`, JSON.stringify(integrationData));

      // Register service worker for background notifications
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Schedule periodic sync if supported
        if ('periodicSync' in registration) {
          await (registration as any).periodicSync.register('vaccination-reminder-check', {
            minInterval: 24 * 60 * 60 * 1000 // 24 hours
          });
        }
      }

    } catch (error) {
      console.error('Error integrating with Dr.CureCast:', error);
    }
  }

  /**
   * Get vaccination context for chat integration
   */
  getVaccinationContext(userId: string): any {
    try {
      const integrationData = localStorage.getItem(`vaccination_integration_${userId}`);
      return integrationData ? JSON.parse(integrationData) : null;
    } catch (error) {
      console.error('Error getting vaccination context:', error);
      return null;
    }
  }

  // Private helper methods

  private createCustomVaccineType(name: string): VaccineType {
    return {
      id: `custom_${Date.now()}`,
      name,
      category: 'custom',
      ageGroup: ['All ages'],
      contraindications: [],
      sideEffects: []
    };
  }

  private getDefaultReminderSettings(): ReminderSettings {
    return {
      enableNotifications: true,
      notificationMethods: ['website', 'email'],
      advanceNotificationDays: [7, 1],
      timeOfDay: '09:00'
    };
  }

  private getDefaultEducationalInfo(vaccineName: string): VaccineEducationalInfo {
    return {
      importance: `${vaccineName} is important for preventing serious diseases and maintaining public health.`,
      description: `Vaccination helps build immunity against specific diseases.`,
      benefits: ['Disease prevention', 'Community immunity', 'Reduced healthcare costs'],
      risks: ['Mild side effects possible', 'Rare allergic reactions'],
      preparation: ['Consult healthcare provider', 'Inform about allergies', 'Bring vaccination records'],
      afterCare: ['Monitor for side effects', 'Keep vaccination record updated', 'Follow up as needed'],
      sources: ['WHO', 'CDC', 'Ministry of Health']
    };
  }

  private calculateNextDueDate(currentDate: string, pattern: RecurringPattern): string {
    const date = new Date(currentDate);
    
    switch (pattern.type) {
      case 'daily':
        date.setDate(date.getDate() + pattern.interval);
        break;
      case 'weekly':
        date.setDate(date.getDate() + (pattern.interval * 7));
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + pattern.interval);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + pattern.interval);
        break;
    }

    return date.toISOString().split('T')[0];
  }

  private async scheduleNotifications(reminder: CustomVaccinationReminder): Promise<void> {
    if (!reminder.reminderSettings.enableNotifications) return;

    for (const days of reminder.reminderSettings.advanceNotificationDays) {
      const notificationDate = new Date(reminder.scheduledDate);
      notificationDate.setDate(notificationDate.getDate() - days);

      for (const method of reminder.reminderSettings.notificationMethods) {
        const notification: VaccinationNotification = {
          id: `notif_${reminder.id}_${days}_${method}`,
          userId: reminder.userId,
          reminderId: reminder.id,
          type: 'upcoming',
          title: `Vaccination Reminder: ${reminder.name}`,
          message: `Your ${reminder.name} is scheduled for ${reminder.scheduledDate} at ${reminder.scheduledTime}`,
          scheduledFor: notificationDate.toISOString(),
          method,
          status: 'pending'
        };

        this.notifications.set(notification.id, notification);
      }
    }
  }

  private async cancelNotifications(reminderId: string): Promise<void> {
    const notificationsToCancel = Array.from(this.notifications.values())
      .filter(notif => notif.reminderId === reminderId);

    notificationsToCancel.forEach(notif => {
      this.notifications.delete(notif.id);
    });
  }

  private async createRecurringReminder(originalReminder: CustomVaccinationReminder): Promise<void> {
    if (!originalReminder.nextDueDate || !originalReminder.recurringPattern) return;

    await this.createReminder({
      ...originalReminder,
      id: undefined, // Will be generated
      scheduledDate: originalReminder.nextDueDate,
      status: 'pending',
      completedDate: undefined
    });
  }

  private generateRecurringEvents(
    reminder: CustomVaccinationReminder, 
    startDate: Date, 
    endDate: Date
  ): VaccinationCalendarEvent[] {
    const events: VaccinationCalendarEvent[] = [];
    
    if (!reminder.recurringPattern) return events;

    let currentDate = new Date(reminder.scheduledDate);
    
    while (currentDate <= endDate) {
      if (currentDate >= startDate) {
        events.push({
          id: `recurring_${reminder.id}_${currentDate.getTime()}`,
          title: `${reminder.name} (Recurring)`,
          date: currentDate.toISOString().split('T')[0],
          time: reminder.scheduledTime,
          type: 'vaccination',
          priority: reminder.priority,
          status: 'pending',
          reminder
        });
      }

      currentDate = new Date(this.calculateNextDueDate(
        currentDate.toISOString().split('T')[0], 
        reminder.recurringPattern
      ));
    }

    return events;
  }

  private async fetchGovernmentSchedules(region: string): Promise<GovernmentVaccineSchedule[]> {
    // Mock government schedules - in production, this would fetch from actual APIs
    return [
      {
        id: 'polio',
        vaccineName: 'Polio',
        ageGroup: '0-6 years',
        doses: 4,
        intervalBetweenDoses: 60,
        boosterRequired: true,
        boosterInterval: 1460, // 4 years in days
        mandatoryFor: ['All children'],
        source: 'National Immunization Program',
        priority: 'high',
        description: 'Polio vaccination as per national schedule',
        schedule: [
          { dose: 1, ageInMonths: 2, description: 'First dose at 2 months' },
          { dose: 2, ageInMonths: 4, description: 'Second dose at 4 months' },
          { dose: 3, ageInMonths: 6, description: 'Third dose at 6 months' },
          { dose: 4, ageInMonths: 48, description: 'Booster at 4 years' }
        ],
        mandatory: true,
        region,
        lastUpdated: new Date().toISOString()
      }
    ];
  }

  private isScheduleApplicable(schedule: GovernmentVaccineSchedule, userAge: number): boolean {
    // Simple age check - in production, this would be more sophisticated
    return userAge <= 72; // 6 years in months
  }

  private calculateScheduleDate(userAge: number, targetAgeInMonths: number): Date {
    const birthDate = new Date();
    birthDate.setMonth(birthDate.getMonth() - userAge);
    
    const scheduledDate = new Date(birthDate);
    scheduledDate.setMonth(scheduledDate.getMonth() + targetAgeInMonths);
    
    return scheduledDate;
  }

  private async saveRemindersToStorage(): Promise<void> {
    try {
      const remindersArray = Array.from(this.reminders.values());
      localStorage.setItem('vaccination_reminders', JSON.stringify(remindersArray));
    } catch (error) {
      console.error('Error saving reminders to storage:', error);
    }
  }

  private loadRemindersFromStorage(): void {
    try {
      const stored = localStorage.getItem('vaccination_reminders');
      if (stored) {
        const remindersArray: CustomVaccinationReminder[] = JSON.parse(stored);
        remindersArray.forEach(reminder => {
          this.reminders.set(reminder.id, reminder);
        });
      }
    } catch (error) {
      console.error('Error loading reminders from storage:', error);
    }
  }

  private startNotificationScheduler(): void {
    // Check for due notifications every minute
    setInterval(async () => {
      await this.processScheduledNotifications();
    }, 60000);
  }

  private async processScheduledNotifications(): Promise<void> {
    const now = new Date();
    const dueNotifications = Array.from(this.notifications.values())
      .filter(notif => 
        notif.status === 'pending' && 
        new Date(notif.scheduledFor) <= now
      );

    for (const notification of dueNotifications) {
      try {
        await this.sendNotification(notification);
        notification.status = 'sent';
        notification.sentAt = now.toISOString();
        this.notifications.set(notification.id, notification);
      } catch (error) {
        console.error('Error sending notification:', error);
        notification.status = 'failed';
        this.notifications.set(notification.id, notification);
      }
    }
  }

  private async sendNotification(notification: VaccinationNotification): Promise<void> {
    switch (notification.method) {
      case 'website':
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.png'
          });
        }
        break;
      
      case 'sms':
        // Use communication service to send SMS
        await communicationService.sendSMSHealthReminder(
          '+1234567890', // User phone number would be retrieved from user profile
          notification.message,
          'english'
        );
        break;
      
      case 'whatsapp':
        // Use communication service to send WhatsApp message
        await communicationService.sendWhatsAppHealthReminder(
          '+1234567890', // User phone number would be retrieved from user profile
          notification.message,
          'english',
          'vaccination'
        );
        break;
      
      case 'email':
        // Email sending would be implemented here
        console.log('Email notification:', notification);
        break;
    }
  }
}

// Export singleton instance
export const vaccinationReminderService = VaccinationReminderService.getInstance();
