export interface HealthRecord {
  id: string;
  timestamp: string;
  symptoms: string[];
  severity: 'low' | 'medium' | 'high';
  diagnosis?: string;
  medications?: Medication[];
  followUpDate?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
  startDate: string;
  endDate?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phone?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  location?: string;
  language?: 'english' | 'hindi' | 'tamil' | 'telugu';
  healthHistory: HealthRecord[];
  reminders: Reminder[];
  notificationPreferences: NotificationPreferences;
}

export interface NotificationPreferences {
  enablePush: boolean;
  enableSMS: boolean;
  enableEmail: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  reminderAdvanceNotice: number; // minutes
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: 'medication' | 'followup' | 'vaccination';
  date: string;
  time: string;
  recurring?: boolean;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  completed: boolean;
  medication?: {
    name: string;
    dosage: string;
    instructions?: string;
  };
  adherenceLog: {
    date: string;
    taken: boolean;
    notes?: string;
  }[];
  notificationSettings: {
    enablePush: boolean;
    enableSMS: boolean;
    enableEmail: boolean;
    advanceNotice: number; // minutes
  };
}

export interface HealthMyth {
  id: string;
  myth: {
    english: string;
    hindi?: string;
    tamil?: string;
    telugu?: string;
  };
  fact: {
    english: string;
    hindi?: string;
    tamil?: string;
    telugu?: string;
  };
  category: 'medicine' | 'diet' | 'lifestyle' | 'treatment';
  sources?: string[];
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  regionData: {
    [region: string]: {
      userCount: number;
      commonSymptoms: string[];
      mythConsultations: number;
    };
  };
  recentConsultations: HealthRecord[];
} 