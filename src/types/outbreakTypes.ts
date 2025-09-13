export interface Location {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  district?: string;
  pincode?: string;
}

export interface OutbreakAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  disease: string;
  location: {
    city: string;
    state: string;
    district: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    radius: number; // in kilometers
  };
  affectedAreas: string[];
  reportedCases: number;
  confirmedCases: number;
  deaths?: number;
  recoveries?: number;
  dateReported: string;
  lastUpdated: string;
  status: 'active' | 'contained' | 'resolved';
  source: string;
  precautions: Precaution[];
  symptoms: string[];
  transmissionMode: string[];
  riskFactors: string[];
  emergencyContacts: EmergencyContact[];
  governmentGuidelines?: string;
  vaccinationInfo?: VaccinationInfo;
  isUrgent: boolean;
  translations: Record<string, OutbreakTranslation>;
}

export interface Precaution {
  id: string;
  title: string;
  description: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
  category: 'prevention' | 'treatment' | 'isolation' | 'hygiene' | 'travel';
  translations: Record<string, { title: string; description: string }>;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  type: 'hospital' | 'helpline' | 'government' | 'emergency';
  available24x7: boolean;
  location?: string;
}

export interface VaccinationInfo {
  isVaccineAvailable: boolean;
  vaccineNames: string[];
  eligibilityCriteria: string[];
  vaccinationCenters: VaccinationCenter[];
  bookingUrl?: string;
}

export interface VaccinationCenter {
  name: string;
  address: string;
  phone: string;
  timings: string;
  availableVaccines: string[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface OutbreakTranslation {
  title: string;
  description: string;
  disease: string;
  symptoms: string[];
  transmissionMode: string[];
  riskFactors: string[];
  governmentGuidelines?: string;
}

export interface OutbreakStatistics {
  totalAlerts: number;
  activeAlerts: number;
  criticalAlerts: number;
  affectedAreas: number;
  affectedDistricts: number;
  totalCases: number;
  newCasesToday: number;
  recoveredCases: number;
  recoveryRate: number;
  mortalityRate: number;
}

export interface NotificationSettings {
  enableLocationAlerts: boolean;
  enablePushNotifications: boolean;
  enableSMSAlerts: boolean;
  enableWhatsAppAlerts: boolean;
  severityThreshold: 'low' | 'medium' | 'high' | 'critical';
  alertRadius: number; // in kilometers
  languages: string[];
  enableTextToSpeech: boolean;
  enableVoiceAlerts: boolean;
}

export interface UserPreferences {
  location: Location;
  notifications: NotificationSettings;
  preferredLanguage: string;
  accessibilityMode: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  reducedMotion: boolean;
}

export interface OutbreakFilter {
  severity?: ('low' | 'medium' | 'high' | 'critical')[];
  status?: ('active' | 'contained' | 'resolved')[];
  disease?: string[];
  location?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  radius?: number;
}

export interface AlertNotification {
  id: string;
  outbreakId: string;
  type: 'new_outbreak' | 'severity_change' | 'location_update' | 'resolution';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionRequired?: boolean;
  actionUrl?: string;
}

export interface GovernmentHealthData {
  source: 'mohfw' | 'icmr' | 'who' | 'state_health_dept';
  lastSyncTime: string;
  dataReliability: 'verified' | 'preliminary' | 'unverified';
  officialUrl?: string;
  contactInfo?: EmergencyContact;
}

export interface OutbreakTrend {
  date: string;
  newCases: number;
  totalCases: number;
  recoveries: number;
  deaths: number;
  activeCase: number;
  testsConducted?: number;
  positivityRate?: number;
}

export interface HealthFacility {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'testing_center' | 'isolation_center';
  address: string;
  phone: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  capacity: number;
  currentOccupancy: number;
  specializations: string[];
  emergencyServices: boolean;
  covidFacility: boolean;
  bedAvailability: {
    general: number;
    icu: number;
    ventilator: number;
  };
  timings: string;
  website?: string;
}
