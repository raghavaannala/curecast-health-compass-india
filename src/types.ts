// Define supported languages - Extended for Dr.Curecast
export type Language = 
  // Indian languages
  | 'english' | 'hindi' | 'telugu' | 'tamil' | 'bengali' | 'marathi' 
  | 'kannada' | 'malayalam' | 'gujarati' | 'punjabi' | 'urdu' 
  | 'odia' | 'assamese'
  // International languages
  | 'spanish' | 'french' | 'german' | 'arabic' | 'chinese' 
  | 'japanese' | 'russian' | 'portuguese';

// User types
export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  language: Language;
  location: string;
  createdAt: string;
}

// Admin user type
export interface AdminUser {
  id: string;
  name: string;
  phoneNumber: string;
  language: Language;
  role: 'admin';
  adminId: string;
  region: string;
  createdAt: string;
}

// Medical record type
export interface MedicalRecord {
  id: string;
  userId: string;
  symptoms: string[];
  diagnosis: string;
  recommendation: 'self-care' | 'clinic' | 'emergency';
  notes: string;
  date: string;
}

// Custom Vaccination Reminder System Types
export interface CustomVaccinationReminder {
  id: string;
  userId: string;
  name: string;
  description: string;
  scheduledDate: string;
  scheduledTime: string;
  notes?: string;
  isCustom: boolean;
  vaccineType: VaccineType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'completed' | 'overdue' | 'cancelled';
  reminderSettings: ReminderSettings;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  nextDueDate?: string;
  completedDate?: string;
  governmentMandated: boolean;
  educationalInfo: VaccineEducationalInfo;
  createdAt: string;
  updatedAt: string;
}

export interface VaccineType {
  id: string;
  name: string;
  category: 'routine' | 'travel' | 'occupational' | 'emergency' | 'custom';
  ageGroup: string[];
  standardSchedule?: StandardSchedule[];
  contraindications: string[];
  sideEffects: string[];
}

export interface StandardSchedule {
  doseNumber: number;
  ageInMonths: number;
  description: string;
  isBooster: boolean;
}

export interface ReminderSettings {
  enableNotifications: boolean;
  notificationMethods: ('website' | 'email' | 'sms' | 'whatsapp')[];
  advanceNotificationDays: number[];
  timeOfDay: string;
}

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number;
  endDate?: string;
  maxOccurrences?: number;
}

export interface VaccineEducationalInfo {
  importance: string;
  description: string;
  benefits: string[];
  risks: string[];
  preparation: string[];
  afterCare: string[];
  sources: string[];
}

export interface VaccinationCalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'vaccination' | 'booster' | 'checkup';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'completed' | 'overdue' | 'cancelled';
  reminder: CustomVaccinationReminder;
}

export interface VaccinationNotification {
  id: string;
  userId: string;
  reminderId: string;
  type: 'upcoming' | 'overdue' | 'completed';
  title: string;
  message: string;
  scheduledFor: string;
  sentAt?: string;
  method: 'website' | 'email' | 'sms' | 'whatsapp';
  status: 'pending' | 'sent' | 'failed' | 'read';
}

export interface GovernmentVaccineSchedule {
  id: string;
  vaccineName: string;
  ageGroup: string;
  doses: number;
  intervalBetweenDoses: number;
  boosterRequired: boolean;
  boosterInterval: number;
  mandatoryFor: string[];
  source: string;
  lastUpdated: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  schedule?: {
    dose: number;
    ageInMonths: number;
    description: string;
  }[];
  mandatory?: boolean;
  region?: string;
}

// Enhanced Reminder System Types
export interface Reminder {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  type: 'medication' | 'followup' | 'vaccination';
  date: string;
  time: string;
  dueDateTime: string;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
  tags: string[];
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  isOverdue?: boolean;
  medication?: {
    name?: string;
    dosage?: string;
    instructions?: string;
  };
  notificationSettings?: {
    enablePush?: boolean;
    enableSMS?: boolean;
    enableEmail?: boolean;
    advanceNotice?: number;
  };
  adherenceLog?: {
    date: string;
    taken: boolean;
  }[];
}

export interface ReminderFormData {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  tags: string[];
}

export interface ReminderFilter {
  searchQuery: string;
  selectedTags: string[];
  showCompleted: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Translation interface
export interface TranslatedStrings {
  [key: string]: {
    [language in Language]?: string;
  };
}

// Health myth type
export interface Myth {
  id: string;
  title: string;
  myth: string;
  reality: string;
  category: 'treatments' | 'illness' | 'vaccines' | 'nutrition' | 'other';
  source: string;
  translations?: {
    [language in Language]?: {
      title: string;
      myth: string;
      reality: string;
    };
  };
}

// Chat message type
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

// Voice message type
export interface VoiceMessage {
  id: string;
  userId: string;
  audioBlob?: Blob;
  transcription: string;
  language: Language;
  confidence: number;
  timestamp: string;
}

// Chat session type
export interface ChatSession {
  id: string;
  userId: string;
  language: Language;
  messages: ChatMessage[];
  voiceEnabled: boolean;
  startTime: string;
  endTime?: string;
  context: 'general' | 'vaccination' | 'emergency' | 'reminder';
}

// Vaccination record type
export interface VaccinationRecord {
  id: string;
  userId: string;
  vaccineName: string;
  vaccineType: 'routine' | 'travel' | 'booster' | 'emergency';
  dateAdministered: string;
  nextDueDate?: string;
  batchNumber?: string;
  administeredBy?: string;
  location?: string;
  sideEffects?: string[];
  governmentRecordId?: string;
  verified: boolean;
}

// Vaccination reminder type
export interface VaccinationReminder {
  id: string;
  userId: string;
  vaccinationRecordId: string;
  reminderDate: string;
  reminderTime: string;
  message: string;
  language: Language;
  sent: boolean;
  acknowledged: boolean;
}

// Enhanced user profile for Dr.Curecast
export interface DrCurecastUser extends User {
  preferredLanguages: Language[];
  voicePreferences: {
    enabled: boolean;
    voiceId?: string;
    speed: number;
    pitch: number;
  };
  vaccinationProfile: {
    records: VaccinationRecord[];
    reminders: VaccinationReminder[];
    governmentId?: string;
  };
  healthProfile: {
    chronicConditions?: string[];
    allergies?: string[];
    medications?: string[];
    emergencyContacts?: {
      name: string;
      phone: string;
      relation: string;
    }[];
  };
  privacySettings: {
    shareWithGovernment: boolean;
    dataRetentionPeriod: number;
    allowVoiceRecording: boolean;
  };
}

// Symptom mapping type
export interface SymptomMapping {
  possibleConditions: string[];
  severity: 'low' | 'medium' | 'high';
  recommendation: 'self-care' | 'clinic' | 'emergency';
}

// Health alert type for government health notifications
export interface HealthAlert {
  id: string;
  type: 'outbreak' | 'vaccination_campaign' | 'health_advisory' | 'emergency';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    state: string;
    district?: string;
    pincode?: string;
  };
  language: Language;
  issuedBy: string;
  issuedAt: string;
  expiresAt?: string;
  actionRequired?: string;
  contactInfo?: {
    phone?: string;
    website?: string;
    email?: string;
  };
}
