import { 
  DrCurecastUser, 
  VaccinationRecord, 
  VaccinationReminder, 
  Language,
  ChatSession,
  VoiceMessage 
} from '../types';
import { vaccinationService } from './vaccinationService';
import { governmentHealthService } from './governmentHealthService';
import { languageService } from './languageService';

// User profile and data management service for Dr.Curecast
export class UserProfileService {
  private static instance: UserProfileService;
  private userProfiles: Map<string, DrCurecastUser> = new Map();

  public static getInstance(): UserProfileService {
    if (!UserProfileService.instance) {
      UserProfileService.instance = new UserProfileService();
    }
    return UserProfileService.instance;
  }

  /**
   * Create new user profile with privacy-compliant defaults
   */
  async createUserProfile(
    userData: {
      name: string;
      phoneNumber?: string;
      age?: number;
      gender?: 'male' | 'female' | 'other';
      preferredLanguages: Language[];
      location?: string;
    }
  ): Promise<DrCurecastUser> {
    const userId = this.generateUserId();
    
    const user: DrCurecastUser = {
      id: userId,
      name: userData.name,
      phoneNumber: userData.phoneNumber,
      age: userData.age,
      gender: userData.gender,
      language: userData.preferredLanguages[0] || 'english',
      location: userData.location,
      createdAt: new Date().toISOString(),
      
      // Dr.Curecast specific fields
      preferredLanguages: userData.preferredLanguages,
      voicePreferences: {
        enabled: false, // User must explicitly enable
        speed: 1.0,
        pitch: 1.0
      },
      vaccinationProfile: {
        records: [],
        reminders: [],
        governmentId: undefined
      },
      healthProfile: {
        chronicConditions: [],
        allergies: [],
        medications: [],
        emergencyContacts: []
      },
      privacySettings: {
        shareWithGovernment: false, // Must be explicitly opted in
        dataRetentionPeriod: 365, // Days
        allowVoiceRecording: false
      }
    };

    this.userProfiles.set(userId, user);
    await this.saveUserProfile(user);
    
    return user;
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<DrCurecastUser | null> {
    // Try to get from cache first
    let user = this.userProfiles.get(userId);
    
    if (!user) {
      // Load from persistent storage
      user = await this.loadUserProfile(userId);
      if (user) {
        this.userProfiles.set(userId, user);
      }
    }
    
    return user || null;
  }

  /**
   * Update user profile with validation
   */
  async updateUserProfile(
    userId: string, 
    updates: Partial<DrCurecastUser>
  ): Promise<DrCurecastUser> {
    const existingUser = await this.getUserProfile(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Validate critical updates
    if (updates.privacySettings) {
      this.validatePrivacySettings(updates.privacySettings);
    }

    if (updates.preferredLanguages) {
      this.validateLanguages(updates.preferredLanguages);
    }

    const updatedUser: DrCurecastUser = {
      ...existingUser,
      ...updates,
      // Ensure nested objects are properly merged
      voicePreferences: {
        ...existingUser.voicePreferences,
        ...(updates.voicePreferences || {})
      },
      vaccinationProfile: {
        ...existingUser.vaccinationProfile,
        ...(updates.vaccinationProfile || {})
      },
      healthProfile: {
        ...existingUser.healthProfile,
        ...(updates.healthProfile || {})
      },
      privacySettings: {
        ...existingUser.privacySettings,
        ...(updates.privacySettings || {})
      }
    };

    this.userProfiles.set(userId, updatedUser);
    await this.saveUserProfile(updatedUser);
    
    return updatedUser;
  }

  /**
   * Add vaccination record to user profile
   */
  async addVaccinationRecord(
    userId: string, 
    record: Omit<VaccinationRecord, 'userId'>
  ): Promise<VaccinationRecord> {
    const user = await this.getUserProfile(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const vaccinationRecord: VaccinationRecord = {
      ...record,
      userId
    };

    user.vaccinationProfile.records.push(vaccinationRecord);
    await this.updateUserProfile(userId, { vaccinationProfile: user.vaccinationProfile });

    // Sync with government database if user has opted in
    if (user.privacySettings.shareWithGovernment && user.vaccinationProfile.governmentId) {
      try {
        await this.syncWithGovernmentDB(userId);
      } catch (error) {
        console.error('Government DB sync failed:', error);
      }
    }

    return vaccinationRecord;
  }

  /**
   * Set up vaccination reminders based on user's age and existing records
   */
  async setupVaccinationReminders(userId: string): Promise<VaccinationReminder[]> {
    const user = await this.getUserProfile(userId);
    if (!user || !user.age) {
      throw new Error('User not found or age not specified');
    }

    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - user.age);

    const dueVaccinations = vaccinationService.calculateDueVaccinations(
      birthDate.toISOString(),
      user.vaccinationProfile.records
    );

    const reminders: VaccinationReminder[] = [];

    for (const due of dueVaccinations) {
      const reminderDate = new Date(due.dueDate);
      reminderDate.setDate(reminderDate.getDate() - 7); // Remind 7 days before

      const reminder = await vaccinationService.createVaccinationReminder(
        userId,
        `schedule_${due.schedule.id}_${due.dose}`,
        reminderDate,
        user.language
      );

      reminders.push(reminder);
    }

    // Update user profile with new reminders
    user.vaccinationProfile.reminders.push(...reminders);
    await this.updateUserProfile(userId, { vaccinationProfile: user.vaccinationProfile });

    return reminders;
  }

  /**
   * Update language preferences and retranslate existing content
   */
  async updateLanguagePreferences(
    userId: string, 
    newLanguages: Language[]
  ): Promise<void> {
    const user = await this.getUserProfile(userId);
    if (!user) {
      throw new Error('User not found');
    }

    this.validateLanguages(newLanguages);

    const oldPrimaryLanguage = user.language;
    const newPrimaryLanguage = newLanguages[0];

    await this.updateUserProfile(userId, {
      preferredLanguages: newLanguages,
      language: newPrimaryLanguage
    });

    // Retranslate existing reminders if primary language changed
    if (oldPrimaryLanguage !== newPrimaryLanguage) {
      await this.retranslateUserContent(userId, oldPrimaryLanguage, newPrimaryLanguage);
    }
  }

  /**
   * Enable voice features with proper consent
   */
  async enableVoiceFeatures(
    userId: string,
    voicePreferences: {
      enabled: boolean;
      voiceId?: string;
      speed?: number;
      pitch?: number;
    },
    consentToRecording: boolean
  ): Promise<void> {
    const user = await this.getUserProfile(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await this.updateUserProfile(userId, {
      voicePreferences: {
        ...user.voicePreferences,
        ...voicePreferences
      },
      privacySettings: {
        ...user.privacySettings,
        allowVoiceRecording: consentToRecording
      }
    });
  }

  /**
   * Add emergency contact
   */
  async addEmergencyContact(
    userId: string,
    contact: {
      name: string;
      phone: string;
      relation: string;
    }
  ): Promise<void> {
    const user = await this.getUserProfile(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.healthProfile.emergencyContacts) {
      user.healthProfile.emergencyContacts = [];
    }

    user.healthProfile.emergencyContacts.push(contact);
    await this.updateUserProfile(userId, { healthProfile: user.healthProfile });
  }

  /**
   * Sync user data with government health databases
   */
  async syncWithGovernmentDB(userId: string): Promise<{
    success: boolean;
    syncedRecords: number;
    errors: string[];
  }> {
    const user = await this.getUserProfile(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.privacySettings.shareWithGovernment) {
      throw new Error('User has not consented to government data sharing');
    }

    try {
      // This would typically involve authentication with government systems
      const syncResult = await governmentHealthService.syncVaccinationRecords(
        userId,
        {
          // These would be obtained through proper authentication flow
          cowin: user.vaccinationProfile.governmentId ? {
            beneficiaryId: user.vaccinationProfile.governmentId,
            token: 'auth_token' // Would be obtained from auth flow
          } : undefined
        }
      );

      // Update user profile with synced records
      if (syncResult.synced.length > 0) {
        user.vaccinationProfile.records.push(...syncResult.synced);
        await this.updateUserProfile(userId, { vaccinationProfile: user.vaccinationProfile });
      }

      return {
        success: syncResult.errors.length === 0,
        syncedRecords: syncResult.synced.length,
        errors: syncResult.errors
      };

    } catch (error) {
      console.error('Government DB sync failed:', error);
      return {
        success: false,
        syncedRecords: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get user's health summary in their preferred language
   */
  async getHealthSummary(userId: string): Promise<{
    vaccinationStatus: string;
    upcomingReminders: VaccinationReminder[];
    healthAlerts: any[];
    recommendations: string[];
  }> {
    const user = await this.getUserProfile(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const upcomingReminders = user.vaccinationProfile.reminders
      .filter(reminder => !reminder.sent && new Date(reminder.reminderDate) > new Date())
      .slice(0, 5);

    // Get health alerts for user's location
    const healthAlerts = user.location ? 
      await governmentHealthService.checkOutbreakAlerts(
        { state: user.location, district: user.location },
        user.language
      ) : [];

    const vaccinationStatus = this.calculateVaccinationStatus(user);
    const recommendations = await this.generateHealthRecommendations(user);

    return {
      vaccinationStatus,
      upcomingReminders,
      healthAlerts,
      recommendations
    };
  }

  /**
   * Delete user profile with proper data cleanup
   */
  async deleteUserProfile(userId: string): Promise<void> {
    const user = await this.getUserProfile(userId);
    if (!user) {
      return; // Already deleted or never existed
    }

    // Cancel all pending reminders
    for (const reminder of user.vaccinationProfile.reminders) {
      if (!reminder.sent) {
        // Cancel reminder scheduling
        console.log(`Cancelling reminder: ${reminder.id}`);
      }
    }

    // Remove from cache
    this.userProfiles.delete(userId);

    // Remove from persistent storage
    await this.deleteUserFromStorage(userId);

    console.log(`User profile deleted: ${userId}`);
  }

  // Private helper methods

  private validatePrivacySettings(settings: any): void {
    if (typeof settings.shareWithGovernment !== 'boolean') {
      throw new Error('Invalid shareWithGovernment setting');
    }
    if (typeof settings.allowVoiceRecording !== 'boolean') {
      throw new Error('Invalid allowVoiceRecording setting');
    }
    if (typeof settings.dataRetentionPeriod !== 'number' || settings.dataRetentionPeriod < 30) {
      throw new Error('Data retention period must be at least 30 days');
    }
  }

  private validateLanguages(languages: Language[]): void {
    if (!Array.isArray(languages) || languages.length === 0) {
      throw new Error('At least one language must be specified');
    }

    for (const lang of languages) {
      if (!languageService.isLanguageSupported(lang)) {
        throw new Error(`Unsupported language: ${lang}`);
      }
    }
  }

  private async retranslateUserContent(
    userId: string, 
    fromLang: Language, 
    toLang: Language
  ): Promise<void> {
    const user = await this.getUserProfile(userId);
    if (!user) return;

    // Retranslate vaccination reminders
    for (const reminder of user.vaccinationProfile.reminders) {
      if (reminder.language === fromLang && !reminder.sent) {
        try {
          reminder.message = await languageService.translateText(
            reminder.message,
            fromLang,
            toLang
          );
          reminder.language = toLang;
        } catch (error) {
          console.error('Failed to retranslate reminder:', error);
        }
      }
    }

    await this.updateUserProfile(userId, { vaccinationProfile: user.vaccinationProfile });
  }

  private calculateVaccinationStatus(user: DrCurecastUser): string {
    const totalRecords = user.vaccinationProfile.records.length;
    const verifiedRecords = user.vaccinationProfile.records.filter(r => r.verified).length;
    
    if (totalRecords === 0) {
      return 'No vaccination records found';
    }

    const percentage = Math.round((verifiedRecords / totalRecords) * 100);
    return `${percentage}% vaccination records verified (${verifiedRecords}/${totalRecords})`;
  }

  private async generateHealthRecommendations(user: DrCurecastUser): Promise<string[]> {
    const recommendations: string[] = [];

    // Check for overdue vaccinations
    if (user.age && user.age < 18) {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - user.age);
      
      const dueVaccinations = vaccinationService.calculateDueVaccinations(
        birthDate.toISOString(),
        user.vaccinationProfile.records
      );

      const overdue = dueVaccinations.filter(v => v.overdue);
      if (overdue.length > 0) {
        recommendations.push(`You have ${overdue.length} overdue vaccination(s). Please consult your healthcare provider.`);
      }
    }

    // Check for missing emergency contacts
    if (!user.healthProfile.emergencyContacts || user.healthProfile.emergencyContacts.length === 0) {
      recommendations.push('Add emergency contacts to your profile for better healthcare coordination.');
    }

    // Recommend government data sync
    if (!user.privacySettings.shareWithGovernment) {
      recommendations.push('Consider syncing with government health databases for comprehensive vaccination tracking.');
    }

    return recommendations;
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveUserProfile(user: DrCurecastUser): Promise<void> {
    // In a real implementation, this would save to Firebase/database
    // For now, we'll use localStorage as a demo
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(`drCurecast_user_${user.id}`, JSON.stringify(user));
    }
  }

  private async loadUserProfile(userId: string): Promise<DrCurecastUser | null> {
    // In a real implementation, this would load from Firebase/database
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(`drCurecast_user_${userId}`);
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  }

  private async deleteUserFromStorage(userId: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(`drCurecast_user_${userId}`);
    }
  }

  /**
   * Get all users (admin function)
   */
  async getAllUsers(): Promise<DrCurecastUser[]> {
    return Array.from(this.userProfiles.values());
  }

  /**
   * Search users by criteria
   */
  async searchUsers(criteria: {
    name?: string;
    location?: string;
    language?: Language;
    ageRange?: { min: number; max: number };
  }): Promise<DrCurecastUser[]> {
    const users = Array.from(this.userProfiles.values());
    
    return users.filter(user => {
      if (criteria.name && !user.name.toLowerCase().includes(criteria.name.toLowerCase())) {
        return false;
      }
      if (criteria.location && user.location !== criteria.location) {
        return false;
      }
      if (criteria.language && !user.preferredLanguages.includes(criteria.language)) {
        return false;
      }
      if (criteria.ageRange && user.age) {
        if (user.age < criteria.ageRange.min || user.age > criteria.ageRange.max) {
          return false;
        }
      }
      return true;
    });
  }
}

export const userProfileService = UserProfileService.getInstance();
