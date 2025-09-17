import { geminiService } from './geminiService';
import { API_CONFIG } from '@/config/api';

// Initialize Gemini AI using the same configuration as DrCureCast
// const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface MedicineDetails {
  medicineName: string;
  dosage: string;
  duration: string;
  purpose?: string;
  instructions?: string;
  frequency: string;
}

export interface PrescriptionData {
  medicines: MedicineDetails[];
  doctorName?: string;
  patientName?: string;
  date?: string;
  diagnosis?: string;
  additionalNotes?: string;
}

export class PrescriptionOCRService {
  // private model = genAI.getGenerativeModel({ model: API_CONFIG.model });

  /**
   * Extract text and medicine details from prescription image
   */
  async processPrescriptionImage(imageFile: File): Promise<PrescriptionData> {
    try {
      // Convert file to base64
      const imageBase64 = await this.fileToBase64(imageFile);
      
      // Create the prompt for medicine extraction
      const prompt = `
        Analyze this prescription image and extract the following information in JSON format:
        
        {
          "medicines": [
            {
              "medicineName": "Name of the medicine/tablet",
              "dosage": "Dosage information (e.g., 500mg, 10ml)",
              "frequency": "How often to take (e.g., 1-0-1, twice daily, morning-evening)",
              "duration": "How many days/weeks (e.g., 7 days, 2 weeks)",
              "purpose": "What condition it treats (if mentioned)",
              "instructions": "Special instructions (e.g., after meals, before sleep)"
            }
          ],
          "doctorName": "Doctor's name if visible",
          "patientName": "Patient's name if visible",
          "date": "Prescription date if visible",
          "diagnosis": "Medical condition/diagnosis if mentioned",
          "additionalNotes": "Any other important notes"
        }
        
        Important guidelines:
        - Extract medicine names accurately, including brand names and generic names
        - For frequency, use common formats like "1-0-1" (morning-afternoon-evening), "twice daily", "every 8 hours"
        - Duration should be clear (e.g., "7 days", "2 weeks", "1 month")
        - If dosage is unclear, mention "As prescribed" or "Consult doctor"
        - Only include information that is clearly visible in the prescription
        - If any field is not available, use null or empty string
        
        IMPORTANT: Return ONLY the JSON object without any markdown formatting, code blocks, or additional text. Start directly with { and end with }.
      `;

      // Use geminiService with fallback support
      const response = await geminiService.generateContentWithImage(
        prompt,
        {
          data: imageBase64,
          mimeType: imageFile.type
        },
        {
          maxTokens: 1000,
          temperature: 0.3 // Lower temperature for more consistent JSON output
        }
      );

      console.log(`Prescription OCR processed using model: ${response.modelUsed} (${response.attemptCount} attempts)`);
      
      // Parse the JSON response
      try {
        // Clean the response text to remove markdown formatting
        const cleanedText = this.cleanAIResponse(response.text);
        const prescriptionData = JSON.parse(cleanedText);
        return this.validateAndCleanData(prescriptionData);
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.error('Raw response:', response.text);
        // Fallback: try to extract basic information
        return this.extractBasicInfo(response.text);
      }
    } catch (error) {
      console.error('Error processing prescription:', error);
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('No available models')) {
          throw new Error('AI service temporarily unavailable. All models are experiencing issues. Please try again later.');
        } else if (error.message.includes('All available models failed')) {
          throw new Error('Service temporarily overloaded. Please try again in a few minutes.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again.');
        }
      }
      throw new Error('Failed to process prescription. The image may be unclear or the text may be difficult to read. Please try with a clearer image.');
    }
  }

  /**
   * Process prescription from camera capture
   */
  async processCameraCapture(imageDataUrl: string): Promise<PrescriptionData> {
    try {
      // Convert data URL to base64
      const base64Data = imageDataUrl.split(',')[1];
      
      const prompt = `
        Analyze this prescription photo and extract medicine information in JSON format:
        
        {
          "medicines": [
            {
              "medicineName": "Medicine name",
              "dosage": "Dosage (mg/ml)",
              "frequency": "Frequency (1-0-1, twice daily, etc.)",
              "duration": "Duration (days/weeks)",
              "purpose": "Purpose if mentioned",
              "instructions": "Special instructions"
            }
          ],
          "doctorName": "Doctor name if visible",
          "date": "Date if visible",
          "diagnosis": "Diagnosis if mentioned"
        }
        
        Focus on extracting clear, accurate medicine information. Return only JSON.
        
        IMPORTANT: Return ONLY the JSON object without any markdown formatting, code blocks, or additional text. Start directly with { and end with }.
      `;

      // Use geminiService with fallback support
      const response = await geminiService.generateContentWithImage(
        prompt,
        {
          data: base64Data,
          mimeType: 'image/jpeg'
        },
        {
          maxTokens: 1000,
          temperature: 0.3 // Lower temperature for more consistent JSON output
        }
      );

      console.log(`Camera OCR processed using model: ${response.modelUsed} (${response.attemptCount} attempts)`);
      
      try {
        // Clean the response text to remove markdown formatting
        const cleanedText = this.cleanAIResponse(response.text);
        const prescriptionData = JSON.parse(cleanedText);
        return this.validateAndCleanData(prescriptionData);
      } catch (parseError) {
        return this.extractBasicInfo(response.text);
      }
    } catch (error) {
      console.error('Error processing camera capture:', error);
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('No available models')) {
          throw new Error('AI service temporarily unavailable. All models are experiencing issues. Please try again later.');
        } else if (error.message.includes('All available models failed')) {
          throw new Error('Service temporarily overloaded. Please try again in a few minutes.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again.');
        }
      }
      throw new Error('Failed to process camera image. The image may be unclear or the text may be difficult to read. Please try with a clearer image.');
    }
  }

  /**
   * Get mock prescription data for demo purposes
   */
  private getMockPrescriptionData(): PrescriptionData {
    return {
      medicines: [
        {
          medicineName: "Paracetamol",
          dosage: "500mg",
          frequency: "1-0-1 (Morning-Afternoon-Evening)",
          duration: "5 days",
          purpose: "Fever and pain relief",
          instructions: "Take after meals"
        },
        {
          medicineName: "Amoxicillin",
          dosage: "250mg",
          frequency: "Twice daily",
          duration: "7 days",
          purpose: "Bacterial infection",
          instructions: "Complete the full course"
        },
        {
          medicineName: "Cetirizine",
          dosage: "10mg",
          frequency: "Once daily",
          duration: "3 days",
          purpose: "Allergy relief",
          instructions: "Take at bedtime"
        }
      ],
      doctorName: "Dr. Sample Doctor",
      patientName: "Demo Patient",
      date: new Date().toLocaleDateString(),
      diagnosis: "Upper respiratory tract infection",
      additionalNotes: "This is demo data. In production, real prescription data would be extracted from your uploaded image using AI."
    };
  }

  /**
   * Convert file to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get just the base64 data
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate and clean the extracted data
   */
  private validateAndCleanData(data: any): PrescriptionData {
    const cleanedData: PrescriptionData = {
      medicines: [],
      doctorName: data.doctorName || '',
      patientName: data.patientName || '',
      date: data.date || '',
      diagnosis: data.diagnosis || '',
      additionalNotes: data.additionalNotes || ''
    };

    // Validate and clean medicines array
    if (Array.isArray(data.medicines)) {
      cleanedData.medicines = data.medicines.map((medicine: any) => ({
        medicineName: medicine.medicineName || 'Unknown Medicine',
        dosage: medicine.dosage || 'As prescribed',
        frequency: medicine.frequency || 'As directed',
        duration: medicine.duration || 'As prescribed',
        purpose: medicine.purpose || '',
        instructions: medicine.instructions || ''
      }));
    }

    return cleanedData;
  }

  /**
   * Fallback method to extract basic info when JSON parsing fails
   */
  private extractBasicInfo(text: string): PrescriptionData {
    // Basic pattern matching for common prescription elements
    const medicinePatterns = [
      /([A-Za-z]+(?:\s+[A-Za-z]+)*)\s*(\d+(?:\.\d+)?\s*(?:mg|ml|g|tablets?))/gi,
      /Tab\.?\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)\s*(\d+(?:\.\d+)?\s*(?:mg|ml|g))/gi
    ];

    const medicines: MedicineDetails[] = [];
    
    for (const pattern of medicinePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        medicines.push({
          medicineName: match[1].trim(),
          dosage: match[2].trim(),
          frequency: 'As directed',
          duration: 'As prescribed',
          purpose: '',
          instructions: ''
        });
      }
    }

    return {
      medicines: medicines.length > 0 ? medicines : [{
        medicineName: 'Could not extract medicine names',
        dosage: 'Please consult original prescription',
        frequency: 'As directed by doctor',
        duration: 'As prescribed',
        purpose: '',
        instructions: 'Please verify with original prescription'
      }],
      doctorName: '',
      patientName: '',
      date: '',
      diagnosis: '',
      additionalNotes: 'Automatic extraction may not be 100% accurate. Please verify with original prescription.'
    };
  }

  /**
   * Clean AI response to remove markdown formatting and extract JSON
   */
  private cleanAIResponse(text: string): string {
    // First, try to extract JSON from markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }
    
    // If no code blocks, try to find JSON-like content
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0].trim();
    }
    
    // If nothing found, return cleaned text
    return text.replace(/```[\w]*\n?/g, '').replace(/```/g, '').trim();
  }

  /**
   * Validate image file
   */
  validateImageFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'];
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Please upload a valid image file (JPEG, PNG, WebP, BMP, or TIFF)'
      };
    }

    // Check file size (max 20MB - increased limit)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Image file size should be less than 20MB'
      };
    }

    // Check minimum file size (avoid empty files)
    const minSize = 1024; // 1KB
    if (file.size < minSize) {
      return {
        isValid: false,
        error: 'Image file appears to be corrupted or empty'
      };
    }

    return { isValid: true };
  }

  /**
   * Get medicine interaction warnings (mock implementation)
   */
  async getMedicineInteractions(medicines: MedicineDetails[]): Promise<string[]> {
    // This is a mock implementation. In a real app, you'd integrate with a drug interaction API
    const warnings: string[] = [];
    
    const medicineNames = medicines.map(m => m.medicineName.toLowerCase());
    
    // Common interaction warnings (simplified)
    if (medicineNames.some(name => name.includes('aspirin')) && 
        medicineNames.some(name => name.includes('warfarin'))) {
      warnings.push('⚠️ Aspirin and Warfarin may increase bleeding risk. Consult your doctor.');
    }
    
    if (medicineNames.some(name => name.includes('paracetamol')) && 
        medicineNames.some(name => name.includes('alcohol'))) {
      warnings.push('⚠️ Avoid alcohol while taking Paracetamol to prevent liver damage.');
    }

    return warnings;
  }
}

export const prescriptionOCRService = new PrescriptionOCRService();
