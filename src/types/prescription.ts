// Prescription Scanner Types

export interface ExtractedMedicine {
  id: string;
  name: string;
  brandName?: string;
  genericName?: string;
  dosage: string;
  strength: string;
  form: 'tablet' | 'capsule' | 'syrup' | 'injection' | 'cream' | 'drops' | 'inhaler' | 'other';
  quantity?: string;
  duration?: string;
  frequency?: string;
  instructions?: string;
  confidence: number; // OCR confidence score
}

export interface PrescriptionScanResult {
  id: string;
  userId: string;
  scanDate: string;
  prescriptionImage: string; // Base64 or URL
  extractedMedicines: ExtractedMedicine[];
  doctorName?: string;
  hospitalName?: string;
  prescriptionDate?: string;
  patientName?: string;
  ocrConfidence: number;
  processingStatus: 'processing' | 'completed' | 'failed';
}

export interface PharmacyLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number; // in km
  phone?: string;
  email?: string;
  website?: string;
  openingHours?: {
    [key: string]: string; // day: hours
  };
  rating?: number;
  verified: boolean;
}

export interface MedicineAvailability {
  medicineId: string;
  medicineName: string;
  pharmacy: PharmacyLocation;
  available: boolean;
  price?: number;
  currency: string;
  inStock: number;
  lastUpdated: string;
  alternativeNames?: string[];
  requiresPrescription: boolean;
}

export interface MedicineAlternative {
  id: string;
  name: string;
  genericName: string;
  composition: string;
  strength: string;
  form: string;
  manufacturer: string;
  price?: number;
  availability: MedicineAvailability[];
  substitutionReason: 'generic' | 'brand' | 'unavailable' | 'cheaper';
  safetyRating: number; // 1-5 scale
}

export interface PrescriptionAnalysisResult {
  scanResult: PrescriptionScanResult;
  medicineAvailability: MedicineAvailability[];
  alternatives: {
    [medicineId: string]: MedicineAlternative[];
  };
  nearbyPharmacies: PharmacyLocation[];
  totalEstimatedCost: number;
  currency: string;
  analysisDate: string;
  recommendations: string[];
}

export interface PharmacyInventoryQuery {
  medicines: string[];
  location: {
    latitude: number;
    longitude: number;
  };
  radius: number; // in km
  sortBy: 'distance' | 'price' | 'availability' | 'rating';
  filters?: {
    openNow?: boolean;
    acceptsInsurance?: boolean;
    homeDelivery?: boolean;
    minRating?: number;
  };
}

export interface ReservationRequest {
  userId: string;
  pharmacyId: string;
  medicines: {
    medicineId: string;
    quantity: number;
  }[];
  reservationDate: string;
  contactPhone: string;
  notes?: string;
}

export interface ReservationResponse {
  reservationId: string;
  status: 'confirmed' | 'pending' | 'rejected';
  estimatedTotal: number;
  currency: string;
  pickupTime?: string;
  expiresAt: string;
  pharmacyContact: string;
  instructions?: string;
}

export interface OCRConfig {
  language: string[];
  confidence: number;
  preprocessImage: boolean;
  enhanceText: boolean;
  detectMedicineNames: boolean;
  extractDosage: boolean;
  extractInstructions: boolean;
}

export interface PrescriptionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  doctorVerified: boolean;
  prescriptionExpired: boolean;
}
