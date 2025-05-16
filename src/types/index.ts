
export interface User {
  id: string;
  name: string;
  phoneNumber?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  language: 'english' | 'hindi' | 'telugu';
  location?: string;
  medicalHistory?: MedicalRecord[];
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  userId: string;
  symptoms: string[];
  diagnosis?: string;
  recommendation?: 'self-care' | 'clinic' | 'emergency';
  notes?: string;
  date: string;
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: 'medication' | 'appointment' | 'follow-up';
  date: string;
  time: string;
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'none';
  completed: boolean;
}

export interface Myth {
  id: string;
  title: string;
  myth: string;
  reality: string;
  category: string;
  source?: string;
  translations?: {
    hindi?: {
      title: string;
      myth: string;
      reality: string;
    };
    telugu?: {
      title: string;
      myth: string;
      reality: string;
    };
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface SymptomsMap {
  [key: string]: {
    possibleConditions: string[];
    severity: 'low' | 'medium' | 'high';
    recommendation: 'self-care' | 'clinic' | 'emergency';
  };
}

export interface AdminUser extends User {
  role: 'admin';
  adminId: string;
  region?: string;
}

export type Language = 'english' | 'hindi' | 'telugu';

export interface TranslatedStrings {
  [key: string]: {
    english: string;
    hindi: string;
    telugu: string;
  };
}
