import { ExtractedMedicine, PrescriptionScanResult, OCRConfig } from '../types/prescription';

// Mock OCR service - In production, integrate with Tesseract.js, Google Vision API, or Azure Computer Vision
export class OCRService {
  private config: OCRConfig;

  constructor(config: Partial<OCRConfig> = {}) {
    this.config = {
      language: ['eng', 'hin'],
      confidence: 0.7,
      preprocessImage: true,
      enhanceText: true,
      detectMedicineNames: true,
      extractDosage: true,
      extractInstructions: true,
      ...config
    };
  }

  /**
   * Extract text from prescription image using OCR
   */
  async extractTextFromImage(imageFile: File): Promise<string> {
    // In production, use actual OCR library
    // For demo purposes, return mock extracted text
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockExtractedText = `
          Dr. Rajesh Kumar
          MBBS, MD (Medicine)
          City Hospital, Mumbai
          
          Patient: John Doe
          Age: 35 Years
          Date: ${new Date().toLocaleDateString()}
          
          Rx:
          1. Tab Crocin 500mg (10 tablets)
             1 tab TID x 5 days
             After meals
          
          2. Cap Amoxicillin 250mg (20 capsules)
             1 cap BID x 7 days
             Before meals
          
          3. Tab Omeprazole 20mg (14 tablets)
             1 tab OD x 14 days
             Before breakfast
          
          4. Syp Cough Relief 100ml
             5ml TID x 3 days
             As needed for cough
          
          Follow up after 1 week
          
          Dr. Rajesh Kumar
          Reg. No: MH12345
        `;
        resolve(mockExtractedText);
      }, 2000);
    });
  }

  /**
   * Parse extracted text to identify medicines
   */
  parseMedicinesFromText(extractedText: string): ExtractedMedicine[] {
    const medicines: ExtractedMedicine[] = [];
    const lines = extractedText.split('\n').map(line => line.trim()).filter(line => line);
    
    let currentMedicine: Partial<ExtractedMedicine> | null = null;
    let isInRxSection = false;
    
    for (const line of lines) {
      // Check if we're in the prescription section
      if (line.toLowerCase().includes('rx:') || line.toLowerCase().includes('prescription:')) {
        isInRxSection = true;
        continue;
      }
      
      // Skip header information
      if (this.isHeaderLine(line) && !isInRxSection) continue;
      
      // Check if line contains medicine information
      const medicineMatch = this.extractMedicineInfo(line);
      if (medicineMatch) {
        // Save previous medicine if exists
        if (currentMedicine && currentMedicine.name) {
          medicines.push(this.completeMedicine(currentMedicine));
        }
        
        currentMedicine = medicineMatch;
      } else if (currentMedicine) {
        // Check for dosage instructions or quantity
        const instructionMatch = this.extractInstructions(line);
        if (instructionMatch) {
          currentMedicine.instructions = instructionMatch;
          
          // Extract quantity and duration from instructions
          const quantityMatch = line.match(/(\d+)\s*(tab|cap|ml|drops?|tablets?|capsules?)/i);
          if (quantityMatch) {
            currentMedicine.quantity = `${quantityMatch[1]} ${quantityMatch[2]}`;
          }
          
          const durationMatch = line.match(/x\s*(\d+)\s*(days?|weeks?|months?)/i);
          if (durationMatch) {
            currentMedicine.duration = `${durationMatch[1]} ${durationMatch[2]}`;
          }
          
          const frequencyMatch = line.match(/(TID|BID|OD|QID|PRN|once daily|twice daily|thrice daily)/i);
          if (frequencyMatch) {
            currentMedicine.frequency = frequencyMatch[1];
          }
        }
      }
    }
    
    // Add the last medicine
    if (currentMedicine && currentMedicine.name) {
      medicines.push(this.completeMedicine(currentMedicine));
    }
    
    return medicines;
  }

  /**
   * Complete medicine object with default values
   */
  private completeMedicine(partial: Partial<ExtractedMedicine>): ExtractedMedicine {
    return {
      id: this.generateId(),
      name: partial.name || '',
      brandName: partial.brandName,
      genericName: partial.genericName,
      dosage: partial.dosage || '',
      strength: partial.strength || '',
      form: partial.form || 'tablet',
      quantity: partial.quantity,
      duration: partial.duration,
      frequency: partial.frequency,
      instructions: partial.instructions,
      confidence: partial.confidence || 0.8
    };
  }

  /**
   * Check if line is header information
   */
  private isHeaderLine(line: string): boolean {
    const headerPatterns = [
      /^Dr\./i,
      /MBBS|MD|MS|BDS/i,
      /Hospital|Clinic|Medical/i,
      /Patient:|Age:|Date:/i,
      /Reg\. No:/i,
      /Follow up/i
    ];
    
    return headerPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Extract medicine information from line
   */
  private extractMedicineInfo(line: string): Partial<ExtractedMedicine> | null {
    // Enhanced medicine patterns with brand/generic recognition
    const patterns = [
      // Tab/Cap Medicine Name Strength with optional generic
      /^(?:Tab|Cap|Syp|Inj)\.?\s+([A-Za-z\s]+?)\s+(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|iu)(?:\s*\(([A-Za-z\s]+)\))?/i,
      // Medicine Name Strength Form with optional generic
      /^([A-Za-z\s]+?)\s+(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|iu)\s+(tablet|capsule|syrup|injection)(?:\s*\(([A-Za-z\s]+)\))?/i,
      // Simple medicine name with strength and optional generic
      /^([A-Za-z\s]+?)\s+(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|iu)(?:\s*\(([A-Za-z\s]+)\))?/i,
      // Numbered medicine entries (1. Medicine Name Strength)
      /^\d+\.\s*([A-Za-z\s]+?)\s+(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|iu)(?:\s*\(([A-Za-z\s]+)\))?/i
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const [, name, strength, unit, generic] = match;
        const cleanName = name.trim();
        
        // Determine if the name is likely a brand or generic
        const { brandName, genericName } = this.identifyBrandGeneric(cleanName, generic);
        
        return {
          name: cleanName,
          brandName,
          genericName,
          strength: `${strength}${unit}`,
          form: this.determineForm(line),
          confidence: 0.85
        };
      }
    }

    return null;
  }

  /**
   * Identify brand and generic names
   */
  private identifyBrandGeneric(name: string, explicitGeneric?: string): { brandName?: string; genericName?: string } {
    // Common generic-to-brand mappings
    const genericToBrand: { [key: string]: string } = {
      'paracetamol': 'Crocin',
      'acetaminophen': 'Tylenol',
      'amoxicillin': 'Amoxil',
      'omeprazole': 'Prilosec',
      'metformin': 'Glucophage',
      'atorvastatin': 'Lipitor',
      'amlodipine': 'Norvasc',
      'losartan': 'Cozaar'
    };

    const brandToGeneric: { [key: string]: string } = {
      'crocin': 'Paracetamol',
      'dolo': 'Paracetamol',
      'calpol': 'Paracetamol',
      'tylenol': 'Acetaminophen',
      'amoxil': 'Amoxicillin',
      'novamox': 'Amoxicillin',
      'prilosec': 'Omeprazole',
      'glucophage': 'Metformin',
      'lipitor': 'Atorvastatin',
      'norvasc': 'Amlodipine',
      'cozaar': 'Losartan'
    };

    const lowerName = name.toLowerCase();
    
    if (explicitGeneric) {
      return {
        brandName: name,
        genericName: explicitGeneric.trim()
      };
    }
    
    // Check if it's a known brand name
    if (brandToGeneric[lowerName]) {
      return {
        brandName: name,
        genericName: brandToGeneric[lowerName]
      };
    }
    
    // Check if it's a known generic name
    if (genericToBrand[lowerName]) {
      return {
        brandName: genericToBrand[lowerName],
        genericName: name
      };
    }
    
    // Default: assume it's a brand name if capitalized, generic if lowercase
    if (name[0] === name[0].toUpperCase()) {
      return { brandName: name };
    } else {
      return { genericName: name };
    }
  }

  /**
   * Determine medicine form from text
   */
  private determineForm(text: string): ExtractedMedicine['form'] {
    const formPatterns = {
      tablet: /tab|tablet/i,
      capsule: /cap|capsule/i,
      syrup: /syp|syrup|liquid/i,
      injection: /inj|injection/i,
      cream: /cream|ointment|gel/i,
      drops: /drops|eye drops|ear drops/i,
      inhaler: /inhaler|puff/i
    };

    for (const [form, pattern] of Object.entries(formPatterns)) {
      if (pattern.test(text)) {
        return form as ExtractedMedicine['form'];
      }
    }

    return 'tablet';
  }

  /**
   * Extract dosage instructions
   */
  private extractInstructions(line: string): string | null {
    const instructionPatterns = [
      /(\d+)\s+(tab|cap|ml|drops?)\s+(TID|BID|OD|QID|PRN)/i,
      /(before|after)\s+(meals?|food|breakfast|lunch|dinner)/i,
      /x\s*(\d+)\s*(days?|weeks?|months?)/i,
      /(as needed|when required|if required)/i
    ];

    for (const pattern of instructionPatterns) {
      if (pattern.test(line)) {
        return line.trim();
      }
    }

    return null;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate structured JSON output for extracted medicines
   */
  generateStructuredJSON(medicines: ExtractedMedicine[]): string {
    const structuredData = {
      extractedMedicines: medicines.map(medicine => ({
        name: medicine.name,
        brandName: medicine.brandName || null,
        genericName: medicine.genericName || null,
        dosage: medicine.strength,
        form: medicine.form,
        quantity: medicine.quantity || null,
        duration: medicine.duration || null,
        frequency: medicine.frequency || null,
        instructions: medicine.instructions || null,
        confidence: medicine.confidence
      })),
      extractionTimestamp: new Date().toISOString(),
      totalMedicinesFound: medicines.length
    };

    return JSON.stringify(structuredData, null, 2);
  }

  /**
   * Process complete prescription scan
   */
  async processPrescriptionScan(
    imageFile: File, 
    userId: string
  ): Promise<PrescriptionScanResult> {
    try {
      // Convert image to base64
      const imageBase64 = await this.fileToBase64(imageFile);
      
      // Extract text using OCR
      const extractedText = await this.extractTextFromImage(imageFile);
      
      // Parse medicines from text
      const extractedMedicines = this.parseMedicinesFromText(extractedText);
      
      // Calculate overall confidence
      const ocrConfidence = extractedMedicines.length > 0 
        ? extractedMedicines.reduce((sum, med) => sum + med.confidence, 0) / extractedMedicines.length
        : 0;

      const result: PrescriptionScanResult = {
        id: `scan_${Date.now()}`,
        userId,
        scanDate: new Date().toISOString(),
        prescriptionImage: imageBase64,
        extractedMedicines,
        ocrConfidence,
        processingStatus: 'completed'
      };

      return result;
    } catch (error) {
      throw new Error(`OCR processing failed: ${error}`);
    }
  }

  /**
   * Convert file to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
}

export const ocrService = new OCRService();
