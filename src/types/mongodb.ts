/**
 * TypeScript types for MongoDB integration
 * These types match the backend MongoDB collections and API responses
 */

// Base response interface for all API calls
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  error?: string;
  data?: T;
}

// Health Vault Types
export interface HealthDocument {
  _id: string;
  userId: string;
  documentType: 'prescription' | 'lab_report' | 'medical_record' | 'insurance' | 'vaccination' | 'other';
  fileUrl: string;
  fileName?: string;
  description?: string;
  metadata?: {
    doctorName?: string;
    hospitalName?: string;
    prescriptionDate?: string;
    testDate?: string;
    notes?: string;
    [key: string]: any;
  };
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthDocumentInput {
  userId: string;
  documentType: HealthDocument['documentType'];
  fileUrl: string;
  fileName?: string;
  description?: string;
  metadata?: HealthDocument['metadata'];
}

export interface HealthDocumentResponse extends ApiResponse {
  document?: HealthDocument;
  documentId?: string;
}

export interface HealthDocumentsResponse extends ApiResponse {
  documents: HealthDocument[];
  totalCount: number;
}

export interface HealthDocumentStats {
  totalDocuments: number;
  byType: Array<{
    _id: string;
    count: number;
    latestUpload: Date;
  }>;
  lastActivity: Date | null;
}

export interface HealthDocumentStatsResponse extends ApiResponse {
  stats: HealthDocumentStats;
}

// Reminder Types
export type ReminderStatus = 'pending' | 'completed' | 'cancelled' | 'missed';
export type ReminderPriority = 'low' | 'medium' | 'high';
export type ReminderType = 'medication' | 'appointment' | 'checkup' | 'exercise' | 'diet' | 'general';

export interface Reminder {
  _id: string;
  userId: string;
  title: string;
  description: string;
  reminderDate: Date;
  status: ReminderStatus;
  type: ReminderType;
  priority: ReminderPriority;
  metadata?: {
    medicationName?: string;
    dosage?: string;
    frequency?: string;
    doctorName?: string;
    hospitalName?: string;
    notes?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
}

export interface ReminderInput {
  userId: string;
  title: string;
  description: string;
  reminderDate: Date | string;
  status?: ReminderStatus;
  type?: ReminderType;
  priority?: ReminderPriority;
  metadata?: Reminder['metadata'];
}

export interface ReminderResponse extends ApiResponse {
  reminder?: Reminder;
  reminderId?: string;
}

export interface RemindersResponse extends ApiResponse {
  reminders: Reminder[];
  totalCount: number;
}

export interface ReminderStats {
  totalReminders: number;
  byStatus: Array<{
    _id: ReminderStatus;
    count: number;
  }>;
  upcoming: number;
  overdue: number;
}

export interface ReminderStatsResponse extends ApiResponse {
  stats: ReminderStats;
}

export interface BulkReminderResponse extends ApiResponse {
  results: ReminderResponse[];
  errors: Array<{
    index: number;
    error: string;
    reminder: ReminderInput;
  }>;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
}

// Query Options Types
export interface HealthDocumentQueryOptions {
  documentType?: HealthDocument['documentType'];
  limit?: number;
  skip?: number;
  sortBy?: keyof HealthDocument;
  sortOrder?: 1 | -1;
}

export interface ReminderQueryOptions {
  status?: ReminderStatus;
  type?: ReminderType;
  priority?: ReminderPriority;
  fromDate?: Date | string;
  toDate?: Date | string;
  limit?: number;
  skip?: number;
  sortBy?: keyof Reminder;
  sortOrder?: 1 | -1;
}

// Server Health Types
export interface ServerHealth {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  database: {
    status: 'connected' | 'disconnected';
    timestamp: string;
    error?: string;
  };
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  version: string;
}
