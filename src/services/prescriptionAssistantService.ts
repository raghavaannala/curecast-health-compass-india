import { ExtractedMedicine } from '../types/prescription';
import { ocrService } from './ocrService';

// Enhanced types for the structured workflow
export interface MedicineQuery {
  name: string;
  strength: string;
  form: string;
  quantity?: number;
  duration?: string;
}

export interface PharmacyAvailabilityRequest {
  medicine: MedicineQuery;
  location: {
    latitude?: number;
    longitude?: number;
    pincode?: string;
  };
  radius: number; // in km
}

export interface PharmacyAvailabilityResponse {
  name: string;
  address: string;
  distance_km: number;
  availability: 'In stock' | 'Not available' | 'Limited stock';
  price?: number;
  delivery_option?: {
    available: boolean;
    delivery_time?: string;
    delivery_fee?: number;
  };
  contact?: {
    phone?: string;
    website?: string;
  };
}

export interface MedicineAlternative {
  name: string;
  pharmacy: string;
  delivery_time?: string;
  price?: number;
  generic_composition: string;
  substitution_reason: string;
}

export interface PrescriptionAnalysisJSON {
  medicines: {
    name: string;
    strength: string;
    form: string;
    quantity?: number;
    pharmacies: PharmacyAvailabilityResponse[];
    alternatives: MedicineAlternative[];
  }[];
  analysis_metadata: {
    extraction_timestamp: string;
    location_used: string;
    radius_km: number;
    total_medicines: number;
    total_pharmacies_checked: number;
  };
}

export class PrescriptionAssistantService {
  private apiBaseUrl = process.env.REACT_APP_PHARMACY_API_URL || 'https://api.pharmacynetwork.in';
  private defaultRadius = 5; // km

  /**
   * Step 1: Extract Medicines using OCR
   */
  async extractMedicinesFromPrescription(imageFile: File): Promise<ExtractedMedicine[]> {
    console.log('Step 1: Extracting medicines from prescription...');
    
    // Use existing OCR service
    const scanResult = await ocrService.processPrescriptionScan(imageFile, 'user_id');
    
    // Verify and validate extracted medicines
    const validatedMedicines = this.validateExtractedMedicines(scanResult.extractedMedicines);
    
    console.log(`✅ Extracted ${validatedMedicines.length} medicines successfully`);
    return validatedMedicines;
  }

  /**
   * Step 2: Call Pharmacy Availability API for each medicine
   */
  async queryPharmacyAvailability(
    medicine: MedicineQuery,
    location: { latitude?: number; longitude?: number; pincode?: string },
    radius: number = this.defaultRadius
  ): Promise<PharmacyAvailabilityResponse[]> {
    console.log(`Step 2: Querying pharmacy availability for ${medicine.name} ${medicine.strength}...`);

    // Mock API call - In production, replace with actual pharmacy API
    const request: PharmacyAvailabilityRequest = {
      medicine,
      location,
      radius
    };

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get actual location-based pharmacies using the pharmacy service
    const { pharmacyService } = await import('./pharmacyService');
    
    let actualPharmacies;
    try {
      actualPharmacies = await pharmacyService.getNearbyPharmacies(
        location.latitude || 12.9716,
        location.longitude || 77.5946,
        radius
      );
      console.log('Found pharmacies:', actualPharmacies);
    } catch (error) {
      console.error('Error getting pharmacies:', error);
      actualPharmacies = [];
    }

    // Convert to our response format
    const mockResponses: PharmacyAvailabilityResponse[] = actualPharmacies.map(pharmacy => ({
      name: pharmacy.name,
      address: pharmacy.address,
      distance_km: pharmacy.distance,
      availability: Math.random() > 0.3 ? 'In stock' : 'Not available',
      price: this.getMedicinePrice(medicine.name, pharmacy.name.toLowerCase().split(' ')[0]),
      delivery_option: {
        available: pharmacy.name.toLowerCase().includes('online') || pharmacy.name.toLowerCase().includes('delivery'),
        delivery_time: pharmacy.name.toLowerCase().includes('online') ? '24-48 hours' : '2-4 hours',
        delivery_fee: pharmacy.name.toLowerCase().includes('online') ? 0 : 50
      },
      contact: {
        phone: pharmacy.phone,
        website: pharmacy.website
      }
    }));

    console.log(`✅ Found ${mockResponses.length} pharmacies within ${radius}km`);
    return mockResponses;
  }

  /**
   * Step 3: Process API responses and extract required data
   */
  processPharmacyResponses(responses: PharmacyAvailabilityResponse[]): PharmacyAvailabilityResponse[] {
    console.log('Step 3: Processing pharmacy API responses...');
    
    // Sort by availability first, then by distance, then by price
    const processed = responses
      .sort((a, b) => {
        // Prioritize available medicines
        if (a.availability === 'In stock' && b.availability !== 'In stock') return -1;
        if (b.availability === 'In stock' && a.availability !== 'In stock') return 1;
        
        // Then sort by distance
        if (a.distance_km !== b.distance_km) return a.distance_km - b.distance_km;
        
        // Finally by price
        const priceA = a.price || 999999;
        const priceB = b.price || 999999;
        return priceA - priceB;
      });

    console.log('✅ Processed and sorted pharmacy responses');
    return processed;
  }

  /**
   * Step 4: Suggest alternatives for unavailable medicines
   */
  async suggestAlternatives(
    medicine: MedicineQuery,
    unavailablePharmacies: PharmacyAvailabilityResponse[]
  ): Promise<MedicineAlternative[]> {
    console.log(`Step 4: Finding alternatives for ${medicine.name}...`);

    const alternatives: MedicineAlternative[] = [];
    
    // Get generic composition for the medicine
    const genericComposition = this.getGenericComposition(medicine.name);
    
    // Find alternative medicines with same composition
    const alternativeMedicines = this.findAlternativesByComposition(genericComposition);
    
    for (const altMedicine of alternativeMedicines) {
      // Check if alternative is available in online pharmacies
      alternatives.push({
        name: `${altMedicine.name} ${medicine.strength}`,
        pharmacy: 'MedStore Online',
        delivery_time: '2 days',
        price: this.getMedicinePrice(altMedicine.name, 'online'),
        generic_composition: genericComposition,
        substitution_reason: altMedicine.reason
      });
    }

    console.log(`✅ Found ${alternatives.length} alternatives`);
    return alternatives;
  }

  /**
   * Step 5: Generate structured JSON output
   */
  async generateStructuredJSON(
    medicines: ExtractedMedicine[],
    location: { latitude?: number; longitude?: number; pincode?: string },
    radius: number = this.defaultRadius
  ): Promise<PrescriptionAnalysisJSON> {
    console.log('Step 5: Generating structured JSON output...');

    const analysisResult: PrescriptionAnalysisJSON = {
      medicines: [],
      analysis_metadata: {
        extraction_timestamp: new Date().toISOString(),
        location_used: location.pincode || `${location.latitude},${location.longitude}` || 'Default location',
        radius_km: radius,
        total_medicines: medicines.length,
        total_pharmacies_checked: 0
      }
    };

    let totalPharmaciesChecked = 0;

    for (const medicine of medicines) {
      const medicineQuery: MedicineQuery = {
        name: medicine.name,
        strength: medicine.strength,
        form: medicine.form,
        quantity: medicine.quantity ? parseInt(medicine.quantity.split(' ')[0]) : undefined,
        duration: medicine.duration
      };

      // Step 2: Query pharmacy availability
      const pharmacyResponses = await this.queryPharmacyAvailability(medicineQuery, location, radius);
      totalPharmaciesChecked += pharmacyResponses.length;

      // Step 3: Process responses
      const processedPharmacies = this.processPharmacyResponses(pharmacyResponses);

      // Step 4: Get alternatives for unavailable medicines
      const unavailablePharmacies = processedPharmacies.filter(p => p.availability === 'Not available');
      const alternatives = unavailablePharmacies.length > 0 ? 
        await this.suggestAlternatives(medicineQuery, unavailablePharmacies) : [];

      analysisResult.medicines.push({
        name: medicine.name,
        strength: medicine.strength,
        form: medicine.form,
        quantity: medicineQuery.quantity,
        pharmacies: processedPharmacies,
        alternatives
      });
    }

    analysisResult.analysis_metadata.total_pharmacies_checked = totalPharmaciesChecked;
    
    console.log('✅ Generated structured JSON output');
    return analysisResult;
  }

  /**
   * Step 6: Generate user-friendly display format
   */
  generateHumanReadableSummary(jsonResult: PrescriptionAnalysisJSON): string {
    console.log('Step 6: Generating human-readable summary...');

    let summary = '✅ Prescription Medicines\n\n';

    jsonResult.medicines.forEach((medicine, index) => {
      summary += `${index + 1}. ${medicine.name} ${medicine.strength}`;
      if (medicine.quantity) {
        summary += ` (${medicine.quantity} ${medicine.form}s)`;
      }
      summary += '\n\n';

      // Available pharmacies
      const availablePharmacies = medicine.pharmacies.filter(p => p.availability === 'In stock');
      availablePharmacies.forEach(pharmacy => {
        const distanceText = pharmacy.distance_km === 0 ? 'Online' : `${pharmacy.distance_km} km`;
        summary += `   ${pharmacy.name} – ${distanceText} – ✅ ${pharmacy.availability}`;
        if (pharmacy.price) {
          summary += ` – ₹${pharmacy.price}`;
        }
        summary += '\n';
      });

      // Unavailable pharmacies
      const unavailablePharmacies = medicine.pharmacies.filter(p => p.availability === 'Not available');
      unavailablePharmacies.forEach(pharmacy => {
        summary += `   ${pharmacy.name} – ${pharmacy.distance_km} km – ❌ ${pharmacy.availability}\n`;
      });

      // Alternatives
      if (medicine.alternatives.length > 0) {
        summary += '\n   💡 Alternatives:\n';
        medicine.alternatives.forEach(alt => {
          summary += `   • ${alt.name} – ${alt.pharmacy}`;
          if (alt.delivery_time) {
            summary += ` – Available in ${alt.delivery_time}`;
          }
          if (alt.price) {
            summary += ` – ₹${alt.price}`;
          }
          summary += '\n';
        });
      }

      summary += '\n';
    });

    console.log('✅ Generated human-readable summary');
    return summary;
  }

  /**
   * Complete prescription analysis workflow
   */
  async analyzePrescription(
    imageFile: File,
    location: { latitude?: number; longitude?: number; pincode?: string },
    radius: number = 5
  ): Promise<{ json: PrescriptionAnalysisJSON; summary: string }> {
    console.log('🔍 Starting complete prescription analysis...');

    try {
      // Step 1: Extract medicines
      const extractedMedicines = await this.extractMedicinesFromPrescription(imageFile);

      // Step 5: Generate structured JSON
      const jsonResult = await this.generateStructuredJSON(extractedMedicines, location, radius);

      // Step 6: Generate human-readable summary
      const summary = this.generateHumanReadableSummary(jsonResult);

      console.log('✅ Prescription analysis completed successfully');
      
      return { json: jsonResult, summary };
    } catch (error) {
      console.error('❌ Prescription analysis failed:', error);
      throw error;
    }
  }

  // Helper methods
  private validateExtractedMedicines(medicines: ExtractedMedicine[]): ExtractedMedicine[] {
    return medicines.filter(medicine => {
      // Basic validation
      if (!medicine.name || !medicine.strength) return false;
      
      // Verify medicine name against known database
      const isValidMedicine = this.verifyMedicineName(medicine.name);
      
      return isValidMedicine;
    });
  }

  private verifyMedicineName(name: string): boolean {
    // Mock medicine verification - in production, use actual medicine database
    const knownMedicines = [
      'paracetamol', 'crocin', 'dolo', 'amoxicillin', 'amoxil', 'novamox',
      'omeprazole', 'prilosec', 'metformin', 'glucophage', 'atorvastatin',
      'lipitor', 'amlodipine', 'norvasc', 'losartan', 'cozaar'
    ];
    
    return knownMedicines.some(known => 
      name.toLowerCase().includes(known) || known.includes(name.toLowerCase())
    );
  }

  private getMedicinePrice(medicineName: string, pharmacy: string): number {
    const basePrices: { [key: string]: number } = {
      'paracetamol': 20, 'crocin': 25, 'dolo': 18,
      'amoxicillin': 85, 'amoxil': 95, 'novamox': 80,
      'omeprazole': 65, 'prilosec': 75,
      'metformin': 35, 'glucophage': 45
    };

    const pharmacyMultipliers: { [key: string]: number } = {
      'apollo': 1.1, 'medplus': 0.95, 'netmeds': 1.0, 'local': 0.9, 'online': 1.05
    };

    const medicineLower = medicineName.toLowerCase();
    const basePrice = Object.keys(basePrices).find(key => 
      medicineLower.includes(key)
    );

    const price = basePrice ? basePrices[basePrice] : 50;
    const multiplier = pharmacyMultipliers[pharmacy] || 1.0;

    return Math.round(price * multiplier);
  }

  private getGenericComposition(medicineName: string): string {
    const compositions: { [key: string]: string } = {
      'paracetamol': 'Acetaminophen',
      'crocin': 'Acetaminophen',
      'dolo': 'Acetaminophen',
      'amoxicillin': 'Amoxicillin Trihydrate',
      'amoxil': 'Amoxicillin Trihydrate',
      'novamox': 'Amoxicillin Trihydrate',
      'omeprazole': 'Omeprazole',
      'prilosec': 'Omeprazole'
    };

    const medicineLower = medicineName.toLowerCase();
    return Object.keys(compositions).find(key => 
      medicineLower.includes(key)
    ) ? compositions[Object.keys(compositions).find(key => 
      medicineLower.includes(key)
    )!] : 'Unknown composition';
  }

  private findAlternativesByComposition(composition: string): { name: string; reason: string }[] {
    const alternatives: { [key: string]: { name: string; reason: string }[] } = {
      'Acetaminophen': [
        { name: 'Crocin', reason: 'Same active ingredient' },
        { name: 'Dolo', reason: 'Generic equivalent' },
        { name: 'Calpol', reason: 'Brand alternative' }
      ],
      'Amoxicillin Trihydrate': [
        { name: 'Novamox', reason: 'Generic equivalent' },
        { name: 'Cipmox', reason: 'Same composition' },
        { name: 'Amoxil', reason: 'Brand alternative' }
      ],
      'Omeprazole': [
        { name: 'Prilosec', reason: 'Brand equivalent' },
        { name: 'Omez', reason: 'Generic alternative' }
      ]
    };

    return alternatives[composition] || [];
  }
}

export const prescriptionAssistantService = new PrescriptionAssistantService();
