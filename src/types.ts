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
  type: 'outbreak' | 'outbreak_alert' | 'vaccination_campaign' | 'health_advisory' | 'emergency';
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

// Multilingual AI Chatbot Types
export interface ChatbotMessage {
  id: string;
  sessionId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  language: Language;
  messageType: 'text' | 'voice' | 'image' | 'quick_reply' | 'button' | 'media';
  metadata?: {
    confidence?: number;
    intent?: string;
    entities?: ChatbotEntity[];
    sentiment?: 'positive' | 'negative' | 'neutral';
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    translated?: boolean;
    originalLanguage?: Language;
    // Enhanced symptom assessment metadata
    isEmpathyResponse?: boolean;
    isFollowUpQuestion?: boolean;
    isAssessment?: boolean;
    assessmentResult?: any;
  };
  quickReplies?: QuickReply[];
  buttons?: ChatbotButton[];
  mediaUrl?: string;
  escalated?: boolean;
}

export interface ChatbotSession {
  id: string;
  userId: string;
  platform: 'whatsapp' | 'sms' | 'web' | 'ivr';
  language: Language;
  messages: ChatbotMessage[];
  context: ChatbotContext;
  status: 'active' | 'waiting' | 'escalated' | 'completed' | 'timeout';
  startTime: string;
  lastActivity: string;
  endTime?: string;
  userProfile?: ChatbotUserProfile;
  escalationReason?: string;
  healthWorkerAssigned?: string;
}

export interface ChatbotContext {
  currentIntent?: string;
  entities: ChatbotEntity[];
  conversationFlow: string[];
  userState: 'greeting' | 'symptom_check' | 'vaccination_info' | 'health_education' | 'emergency' | 'escalated';
  previousQueries: string[];
  healthProfile?: {
    symptoms?: string[];
    conditions?: string[];
    medications?: string[];
    allergies?: string[];
  };
  location?: {
    state?: string;
    district?: string;
    pincode?: string;
  };
  // Enhanced symptom assessment support
  isInSymptomAssessment?: boolean;
  symptomAssessmentContext?: any; // SymptomContext from symptomAssessmentService
}

export interface ChatbotEntity {
  entity: string;
  value: string;
  confidence: number;
  start?: number;
  end?: number;
  extractor?: string;
}

export interface ChatbotIntent {
  name: string;
  confidence: number;
  examples: string[];
  responses: ChatbotResponse[];
  requiredEntities?: string[];
  followUpIntents?: string[];
  escalationTriggers?: string[];
}

export interface ChatbotResponse {
  text: string;
  language: Language;
  buttons?: ChatbotButton[];
  quickReplies?: QuickReply[];
  mediaUrl?: string;
  followUpAction?: string;
  escalate?: boolean;
}

export interface ChatbotButton {
  id: string;
  title: string;
  payload: string;
  type: 'postback' | 'url' | 'phone';
  url?: string;
  phoneNumber?: string;
}

export interface QuickReply {
  id: string;
  title: string;
  payload: string;
  imageUrl?: string;
}

export interface ChatbotUserProfile {
  userId: string;
  phoneNumber: string;
  name?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  preferredLanguage: Language;
  location?: {
    state?: string;
    district?: string;
    pincode?: string;
  };
  healthProfile?: {
    chronicConditions?: string[];
    allergies?: string[];
    currentMedications?: string[];
    vaccinationHistory?: VaccinationRecord[];
  };
  preferences: {
    notifications: boolean;
    reminderTime?: string;
    communicationMethod: 'whatsapp' | 'sms' | 'both';
  };
  consentGiven: boolean;
  registrationDate: string;
  lastInteraction: string;
}

export interface SymptomTriageRule {
  id: string;
  symptoms: string[];
  conditions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  redFlags: string[];
  recommendation: 'self_care' | 'consult_doctor' | 'urgent_care' | 'emergency';
  advice: string;
  language: Language;
  followUpQuestions?: string[];
}

export interface HealthKnowledgeBase {
  id: string;
  category: 'disease_info' | 'prevention' | 'vaccination' | 'nutrition' | 'hygiene' | 'maternal_health' | 'child_health';
  question: string;
  answer: string;
  language: Language;
  tags: string[];
  sources: string[];
  lastUpdated: string;
  accuracy: number;
  relatedQuestions?: string[];
  mediaUrls?: string[];
}

export interface GovernmentHealthFeed {
  id: string;
  type: 'outbreak_alert' | 'vaccination_drive' | 'health_advisory' | 'policy_update';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  location: {
    state: string;
    districts?: string[];
    pincodes?: string[];
  };
  targetAudience: 'all' | 'children' | 'adults' | 'elderly' | 'pregnant_women';
  language: Language;
  publishedAt: string;
  expiresAt?: string;
  actionRequired?: string;
  contactInfo?: {
    helpline?: string;
    website?: string;
    email?: string;
  };
  source: 'icmr' | 'who' | 'state_health_dept' | 'district_health_office';
}

export interface ChatbotAnalytics {
  sessionId: string;
  userId?: string;
  platform: 'whatsapp' | 'sms' | 'web' | 'ivr';
  language: Language;
  startTime: string;
  endTime?: string;
  messageCount: number;
  intentAccuracy: number;
  userSatisfaction?: number;
  escalated: boolean;
  escalationReason?: string;
  resolvedQuery: boolean;
  queryCategory: string;
  responseTime: number;
  location?: {
    state?: string;
    district?: string;
  };
}

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'interactive';
  timestamp: string;
  text?: {
    body: string;
  };
  image?: {
    id: string;
    mime_type: string;
    sha256: string;
    caption?: string;
  };
  audio?: {
    id: string;
    mime_type: string;
  };
  interactive?: {
    type: 'button' | 'list';
    button?: {
      text: string;
    };
    list?: {
      button: string;
      sections: Array<{
        title: string;
        rows: Array<{
          id: string;
          title: string;
          description?: string;
        }>;
      }>;
    };
  };
}

export interface SMSMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'failed';
  direction: 'inbound' | 'outbound';
}

export interface IVRSession {
  id: string;
  phoneNumber: string;
  language: Language;
  currentMenu: string;
  userInputs: string[];
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'disconnected';
  recordingUrl?: string;
}

export interface HealthWorker {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  specialization: string[];
  languages: Language[];
  location: {
    state: string;
    district: string;
    block?: string;
  };
  availability: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  currentLoad: number;
  maxConcurrentChats: number;
  rating: number;
  isOnline: boolean;
}

export interface EscalationRule {
  id: string;
  triggers: {
    keywords?: string[];
    intents?: string[];
    severity?: 'high' | 'critical';
    userFrustration?: boolean;
    unresolved?: boolean;
  };
  action: 'escalate_to_human' | 'provide_emergency_contacts' | 'schedule_callback';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignmentRules: {
    specialization?: string[];
    language?: Language[];
    location?: string[];
  };
}
