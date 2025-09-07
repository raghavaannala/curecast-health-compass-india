import { 
  VaccinationRecord, 
  VaccinationSchedule, 
  VaccinationReminder, 
  Language,
  HealthAlert 
} from '../types';
import { languageService } from './languageService';
import { voiceService } from './voiceService';

// Vaccination management and reminder service for Dr.Curecast
export class VaccinationService {
  private static instance: VaccinationService;
  private reminderIntervals: Map<string, NodeJS.Timeout> = new Map();

  // National vaccination schedules for India
  private nationalSchedules: VaccinationSchedule[] = [
    {
      id: 'bcg',
      vaccineName: 'BCG',
      ageGroup: 'infant',
      schedule: [
        { dose: 1, ageInMonths: 0, description: 'At birth or as early as possible till one year of age' }
      ],
      isNational: true,
      countryCode: 'IN'
    },
    {
      id: 'hepatitis_b',
      vaccineName: 'Hepatitis B',
      ageGroup: 'infant',
      schedule: [
        { dose: 1, ageInMonths: 0, description: 'At birth (within 24 hours)' },
        { dose: 2, ageInMonths: 6, description: 'At 6 weeks' },
        { dose: 3, ageInMonths: 10, description: 'At 10 weeks' },
        { dose: 4, ageInMonths: 14, description: 'At 14 weeks' }
      ],
      isNational: true,
      countryCode: 'IN'
    },
    {
      id: 'opv',
      vaccineName: 'OPV (Oral Polio Vaccine)',
      ageGroup: 'infant',
      schedule: [
        { dose: 0, ageInMonths: 0, description: 'At birth' },
        { dose: 1, ageInMonths: 6, description: 'At 6 weeks' },
        { dose: 2, ageInMonths: 10, description: 'At 10 weeks' },
        { dose: 3, ageInMonths: 14, description: 'At 14 weeks' }
      ],
      isNational: true,
      countryCode: 'IN'
    },
    {
      id: 'dpt',
      vaccineName: 'DPT (Diphtheria, Pertussis, Tetanus)',
      ageGroup: 'infant',
      schedule: [
        { dose: 1, ageInMonths: 6, description: 'At 6 weeks' },
        { dose: 2, ageInMonths: 10, description: 'At 10 weeks' },
        { dose: 3, ageInMonths: 14, description: 'At 14 weeks' }
      ],
      isNational: true,
      countryCode: 'IN'
    },
    {
      id: 'measles',
      vaccineName: 'Measles',
      ageGroup: 'infant',
      schedule: [
        { dose: 1, ageInMonths: 9, description: 'At 9-12 months' },
        { dose: 2, ageInMonths: 16, description: 'At 16-24 months (MMR)' }
      ],
      isNational: true,
      countryCode: 'IN'
    },
    {
      id: 'vitamin_a',
      vaccineName: 'Vitamin A',
      ageGroup: 'infant',
      schedule: [
        { dose: 1, ageInMonths: 9, description: 'At 9 months with Measles' },
        { dose: 2, ageInMonths: 18, description: 'At 18 months' }
      ],
      isNational: true,
      countryCode: 'IN'
    },
    {
      id: 'dpt_booster',
      vaccineName: 'DPT Booster',
      ageGroup: 'child',
      schedule: [
        { dose: 1, ageInMonths: 18, description: 'At 16-24 months' },
        { dose: 2, ageInMonths: 60, description: 'At 5-6 years' }
      ],
      isNational: true,
      countryCode: 'IN'
    },
    {
      id: 'tt_booster',
      vaccineName: 'TT (Tetanus Toxoid)',
      ageGroup: 'child',
      schedule: [
        { dose: 1, ageInMonths: 120, description: 'At 10 years' },
        { dose: 2, ageInMonths: 192, description: 'At 16 years' }
      ],
      isNational: true,
      countryCode: 'IN'
    }
  ];

  public static getInstance(): VaccinationService {
    if (!VaccinationService.instance) {
      VaccinationService.instance = new VaccinationService();
    }
    return VaccinationService.instance;
  }

  /**
   * Get vaccination schedule based on age and country
   */
  getVaccinationSchedule(
    birthDate: string,
    countryCode: string = 'IN'
  ): VaccinationSchedule[] {
    return this.nationalSchedules.filter(schedule => 
      schedule.countryCode === countryCode
    );
  }

  /**
   * Calculate due vaccinations based on user's age
   */
  calculateDueVaccinations(
    birthDate: string,
    existingRecords: VaccinationRecord[] = []
  ): Array<{
    schedule: VaccinationSchedule;
    dose: number;
    dueDate: Date;
    overdue: boolean;
  }> {
    const birth = new Date(birthDate);
    const now = new Date();
    const ageInMonths = this.calculateAgeInMonths(birth, now);

    const dueVaccinations: Array<{
      schedule: VaccinationSchedule;
      dose: number;
      dueDate: Date;
      overdue: boolean;
    }> = [];

    for (const schedule of this.nationalSchedules) {
      for (const dose of schedule.schedule) {
        // Check if this dose is already administered
        const existingRecord = existingRecords.find(record => 
          record.vaccineName === schedule.vaccineName && 
          record.dateAdministered
        );

        if (!existingRecord && dose.ageInMonths <= ageInMonths + 2) { // 2 months buffer
          const dueDate = new Date(birth);
          dueDate.setMonth(dueDate.getMonth() + dose.ageInMonths);

          dueVaccinations.push({
            schedule,
            dose: dose.dose,
            dueDate,
            overdue: now > dueDate
          });
        }
      }
    }

    return dueVaccinations.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  /**
   * Create vaccination reminder
   */
  async createVaccinationReminder(
    userId: string,
    vaccinationRecordId: string,
    reminderDate: Date,
    language: Language = 'english',
    customMessage?: string
  ): Promise<VaccinationReminder> {
    const reminder: VaccinationReminder = {
      id: this.generateId(),
      userId,
      vaccinationRecordId,
      reminderDate: reminderDate.toISOString(),
      reminderTime: reminderDate.toTimeString().slice(0, 5),
      message: customMessage || await this.generateReminderMessage(vaccinationRecordId, language),
      language,
      sent: false,
      acknowledged: false
    };

    // Schedule the reminder
    await this.scheduleReminder(reminder);

    return reminder;
  }

  /**
   * Schedule reminder notification
   */
  private async scheduleReminder(reminder: VaccinationReminder): Promise<void> {
    const reminderTime = new Date(reminder.reminderDate);
    const now = new Date();
    const delay = reminderTime.getTime() - now.getTime();

    if (delay > 0) {
      const timeoutId = setTimeout(async () => {
        await this.sendReminderNotification(reminder);
        this.reminderIntervals.delete(reminder.id);
      }, delay);

      this.reminderIntervals.set(reminder.id, timeoutId);
    }
  }

  /**
   * Send reminder notification (chat + voice)
   */
  private async sendReminderNotification(reminder: VaccinationReminder): Promise<void> {
    try {
      // Send voice notification
      await voiceService.createHealthcareVoiceResponse(
        reminder.message,
        reminder.language,
        'vaccination'
      );

      // Mark as sent
      reminder.sent = true;

      // You would also send push notification, SMS, or email here
      console.log(`Vaccination reminder sent: ${reminder.message}`);

    } catch (error) {
      console.error('Failed to send vaccination reminder:', error);
    }
  }

  /**
   * Generate reminder message in specified language
   */
  private async generateReminderMessage(
    vaccinationRecordId: string,
    language: Language
  ): Promise<string> {
    // This would typically fetch the vaccination details from database
    const baseMessage = "It's time for your vaccination. Please visit your healthcare provider.";
    
    if (language === 'english') {
      return baseMessage;
    }

    try {
      return await languageService.translateText(baseMessage, 'english', language);
    } catch (error) {
      console.error('Translation failed for reminder message:', error);
      return baseMessage;
    }
  }

  /**
   * Add custom vaccination to user's schedule
   */
  async addCustomVaccination(
    userId: string,
    vaccineName: string,
    scheduleDate: Date,
    vaccineType: 'travel' | 'booster' | 'emergency' = 'travel',
    language: Language = 'english'
  ): Promise<VaccinationRecord> {
    const record: VaccinationRecord = {
      id: this.generateId(),
      userId,
      vaccineName,
      vaccineType,
      dateAdministered: '', // Not yet administered
      nextDueDate: scheduleDate.toISOString(),
      verified: false
    };

    // Create reminder for the custom vaccination
    const reminderDate = new Date(scheduleDate);
    reminderDate.setDate(reminderDate.getDate() - 7); // Remind 7 days before

    await this.createVaccinationReminder(
      userId,
      record.id,
      reminderDate,
      language,
      await this.generateCustomVaccinationMessage(vaccineName, scheduleDate, language)
    );

    return record;
  }

  /**
   * Generate custom vaccination reminder message
   */
  private async generateCustomVaccinationMessage(
    vaccineName: string,
    scheduleDate: Date,
    language: Language
  ): Promise<string> {
    const dateStr = scheduleDate.toLocaleDateString();
    const baseMessage = `Reminder: Your ${vaccineName} vaccination is scheduled for ${dateStr}. Please make arrangements to visit your healthcare provider.`;

    if (language === 'english') {
      return baseMessage;
    }

    try {
      return await languageService.translateText(baseMessage, 'english', language);
    } catch (error) {
      return baseMessage;
    }
  }

  /**
   * Process vaccination completion
   */
  async markVaccinationComplete(
    recordId: string,
    dateAdministered: Date,
    administeredBy?: string,
    location?: string,
    batchNumber?: string,
    sideEffects?: string[]
  ): Promise<VaccinationRecord> {
    // This would typically update the database
    const updatedRecord: Partial<VaccinationRecord> = {
      dateAdministered: dateAdministered.toISOString(),
      administeredBy,
      location,
      batchNumber,
      sideEffects,
      verified: true
    };

    console.log(`Vaccination completed: ${recordId}`, updatedRecord);

    // Cancel any pending reminders for this vaccination
    this.cancelReminder(recordId);

    return updatedRecord as VaccinationRecord;
  }

  /**
   * Cancel scheduled reminder
   */
  private cancelReminder(recordId: string): void {
    const timeoutId = this.reminderIntervals.get(recordId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.reminderIntervals.delete(recordId);
    }
  }

  /**
   * Get vaccination history for user
   */
  getVaccinationHistory(userId: string): Promise<VaccinationRecord[]> {
    // This would typically fetch from database
    // For now, return empty array
    return Promise.resolve([]);
  }

  /**
   * Generate vaccination certificate
   */
  async generateVaccinationCertificate(
    userId: string,
    recordId: string,
    language: Language = 'english'
  ): Promise<{
    certificateId: string;
    qrCode: string;
    downloadUrl: string;
  }> {
    // This would generate an official vaccination certificate
    // with QR code for verification
    const certificateId = `CERT_${this.generateId()}`;
    
    return {
      certificateId,
      qrCode: `https://verify.drCurecast.com/cert/${certificateId}`,
      downloadUrl: `https://certificates.drCurecast.com/${certificateId}.pdf`
    };
  }

  /**
   * Create health alerts for vaccination campaigns
   */
  async createVaccinationAlert(
    alertType: 'outbreak' | 'vaccination_due' | 'health_advisory',
    title: string,
    message: string,
    targetRegion?: string,
    targetAgeGroup?: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<HealthAlert> {
    const alert: HealthAlert = {
      id: this.generateId(),
      alertType,
      title,
      message,
      severity,
      targetRegion,
      targetAgeGroup,
      translations: {}
    };

    // Generate translations for major Indian languages
    const majorLanguages: Language[] = ['hindi', 'telugu', 'tamil', 'bengali'];
    
    for (const lang of majorLanguages) {
      try {
        const translatedTitle = await languageService.translateText(title, 'english', lang);
        const translatedMessage = await languageService.translateText(message, 'english', lang);
        
        alert.translations[lang] = {
          title: translatedTitle,
          message: translatedMessage
        };
      } catch (error) {
        console.error(`Translation failed for ${lang}:`, error);
      }
    }

    return alert;
  }

  /**
   * Calculate age in months
   */
  private calculateAgeInMonths(birthDate: Date, currentDate: Date): number {
    const yearDiff = currentDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = currentDate.getMonth() - birthDate.getMonth();
    return yearDiff * 12 + monthDiff;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `vacc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get upcoming reminders for user
   */
  getUpcomingReminders(userId: string, days: number = 30): Promise<VaccinationReminder[]> {
    // This would typically fetch from database
    // Return empty array for now
    return Promise.resolve([]);
  }

  /**
   * Bulk schedule reminders for multiple users
   */
  async bulkScheduleReminders(
    userIds: string[],
    vaccineName: string,
    reminderDate: Date,
    language: Language = 'english'
  ): Promise<VaccinationReminder[]> {
    const reminders: VaccinationReminder[] = [];

    for (const userId of userIds) {
      try {
        const reminder = await this.createVaccinationReminder(
          userId,
          `bulk_${vaccineName}_${Date.now()}`,
          reminderDate,
          language
        );
        reminders.push(reminder);
      } catch (error) {
        console.error(`Failed to create reminder for user ${userId}:`, error);
      }
    }

    return reminders;
  }
}

export const vaccinationService = VaccinationService.getInstance();
