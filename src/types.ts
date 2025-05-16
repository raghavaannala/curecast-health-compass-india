// Define supported languages
export type Language = 'english' | 'hindi' | 'telugu';

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

// Reminder type
export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: 'medication' | 'appointment' | 'other';
  date: string;
  time: string;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
  completed: boolean;
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
  sender: 'user' | 'assistant';
  timestamp: string;
}

// Symptom mapping type
export interface SymptomMapping {
  possibleConditions: string[];
  severity: 'low' | 'medium' | 'high';
  recommendation: 'self-care' | 'clinic' | 'emergency';
}
