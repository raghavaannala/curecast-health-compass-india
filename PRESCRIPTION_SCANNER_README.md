# 💊 Prescription Scanner - Dr.CureCast

## Overview

The Prescription Scanner is a comprehensive medical prescription assistant that helps users extract medicines from scanned prescriptions and find them at nearby pharmacies with real-time availability and pricing information.

## Features

### 1. 🔍 OCR Medicine Extraction
- **Smart Text Recognition**: Uses advanced OCR to extract text from prescription images
- **Medicine Identification**: Automatically identifies medicine names, dosages, and forms
- **Structured Data Output**: Converts prescription text into structured JSON format
- **Multi-language Support**: Supports English and Hindi text recognition

### 2. 🏥 Pharmacy Network Integration
- **Location-based Search**: Finds pharmacies within configurable radius (default 5km)
- **Real-time Availability**: Checks medicine stock across multiple pharmacy chains
- **Price Comparison**: Shows competitive pricing across different pharmacies
- **Operating Hours**: Displays current status (open/closed) for each pharmacy

### 3. 💰 Smart Recommendations
- **Best Price Finder**: Highlights the most affordable options
- **Nearest Pharmacy**: Shows closest available pharmacy
- **24/7 Availability**: Identifies round-the-clock pharmacies
- **Home Delivery**: Flags pharmacies offering delivery services

### 4. 🔄 Alternative Medicine Suggestions
- **Generic Substitutes**: Suggests generic alternatives for branded medicines
- **Unavailable Medicine Alternatives**: Provides substitutes when medicines are out of stock
- **Safety Ratings**: Shows safety and efficacy ratings for alternatives
- **Composition Matching**: Ensures alternatives have the same active ingredients

### 5. 📱 User-Friendly Interface
- **Drag & Drop Upload**: Easy prescription image upload
- **Real-time Processing**: Live status updates during scanning
- **Clear Results Display**: Organized presentation of findings
- **Reserve & Buy Options**: Direct reservation at pharmacies
- **Google Maps Integration**: Navigation to pharmacy locations

## Technical Implementation

### Core Components

#### 1. OCRService (`src/services/ocrService.ts`)
```typescript
// Extract medicines from prescription images
const scanResult = await ocrService.processPrescriptionScan(imageFile, userId);
```

**Features:**
- Image preprocessing and enhancement
- Medicine name pattern recognition
- Dosage and instruction extraction
- Confidence scoring for OCR results

#### 2. PharmacyService (`src/services/pharmacyService.ts`)
```typescript
// Find nearby pharmacies and check availability
const pharmacies = await pharmacyService.getNearbyPharmacies(lat, lng, radius);
const availability = await pharmacyService.checkMedicineAvailability(medicines, pharmacies);
```

**Features:**
- Geolocation-based pharmacy search
- Real-time inventory checking
- Distance calculation and sorting
- Operating hours validation

#### 3. PrescriptionScanner Component (`src/components/PrescriptionScanner.tsx`)
```typescript
<PrescriptionScanner userId={userId} language={language} />
```

**Features:**
- File upload and preview
- Processing status indicators
- Results visualization
- Reservation functionality

### Data Models

#### ExtractedMedicine
```typescript
interface ExtractedMedicine {
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
  confidence: number;
}
```

#### PharmacyLocation
```typescript
interface PharmacyLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number;
  phone?: string;
  openingHours?: { [key: string]: string };
  rating?: number;
  verified: boolean;
}
```

#### MedicineAvailability
```typescript
interface MedicineAvailability {
  medicineId: string;
  medicineName: string;
  pharmacy: PharmacyLocation;
  available: boolean;
  price?: number;
  currency: string;
  inStock: number;
  lastUpdated: string;
  requiresPrescription: boolean;
}
```

## Usage Workflow

### 1. Upload Prescription
```typescript
// User uploads prescription image
const file = event.target.files[0];
setSelectedFile(file);
```

### 2. Process with OCR
```typescript
// Extract medicines using OCR
const scanResult = await ocrService.processPrescriptionScan(file, userId);
```

### 3. Find Pharmacies
```typescript
// Get user location and find nearby pharmacies
const location = await pharmacyService.getCurrentLocation();
const pharmacies = await pharmacyService.getNearbyPharmacies(
  location.latitude, 
  location.longitude, 
  5
);
```

### 4. Check Availability
```typescript
// Check medicine availability across pharmacies
const availability = await pharmacyService.checkMedicineAvailability(
  scanResult.extractedMedicines,
  pharmacies
);
```

### 5. Display Results
```typescript
// Show organized results with pricing and availability
<PrescriptionResults 
  medicines={medicines}
  availability={availability}
  alternatives={alternatives}
/>
```

## Integration with Dr.CureCast

The Prescription Scanner is integrated into the main Dr.CureCast application as a new tab in the navigation:

```typescript
// Added to VaccinationReminderApp.tsx
{activeView === 'prescription' && (
  <PrescriptionScanner
    userId={userId}
    language={currentLanguage}
  />
)}
```

## Sample Output Format

```
✅ Prescription Medicines

1. Paracetamol 500mg (10 tablets)
   📋 1 tab TID x 5 days, After meals
   
   Apollo Pharmacy – 1.2 km – ✅ In stock – ₹25
   [Reserve] [📍 Map]
   
   MedPlus – 2.5 km – ✅ In stock – ₹23 (Best Price)
   [Reserve] [📍 Map]

2. Amoxicillin 250mg (20 capsules)
   📋 1 cap BID x 7 days, Before meals
   
   Apollo Pharmacy – ❌ Not available
   
   MedStore Online – Available for delivery in 2 days – ₹120
   [Reserve] [📍 Map]
   
   💡 Alternatives Available:
   • Novamox (Generic) - ₹85
   • Amoxil (Brand) - ₹110

💡 Recommendations:
💰 Best Price: MedPlus offers the most affordable options
📍 Nearest: City Medical Store is only 0.8km away
🚚 Home Delivery: Netmeds delivers to your location

📊 Summary:
2 Medicines Found | 4 Pharmacies Nearby | ₹148 Estimated Total
```

## Future Enhancements

### 1. Advanced OCR Integration
- **Tesseract.js**: Client-side OCR processing
- **Google Vision API**: Cloud-based OCR with higher accuracy
- **Azure Computer Vision**: Enterprise-grade text recognition

### 2. Real Pharmacy APIs
- **Apollo Pharmacy API**: Direct integration with Apollo's inventory
- **Netmeds API**: Real-time medicine availability
- **1mg API**: Price comparison and availability
- **PharmEasy API**: Delivery and reservation services

### 3. Enhanced Features
- **Insurance Integration**: Check coverage and copay amounts
- **Prescription Validation**: Verify doctor credentials and prescription authenticity
- **Drug Interaction Checker**: Alert for potential medicine interactions
- **Refill Reminders**: Automatic reminders for prescription refills

### 4. Mobile Optimization
- **Camera Integration**: Direct camera capture for prescriptions
- **Offline OCR**: Process prescriptions without internet
- **Push Notifications**: Real-time availability alerts
- **Voice Commands**: Accessibility features for visually impaired users

## Security & Privacy

### Data Protection
- **Image Encryption**: Prescription images encrypted at rest
- **Secure Transmission**: HTTPS for all API communications
- **Data Retention**: Configurable retention policies
- **User Consent**: Explicit consent for data processing

### Compliance
- **HIPAA Compliance**: Healthcare data protection standards
- **GDPR Compliance**: European data protection regulations
- **Indian Data Protection**: Compliance with local privacy laws

## API Dependencies

### Required Environment Variables
```env
REACT_APP_PHARMACY_API_URL=https://api.pharmacynetwork.in
REACT_APP_OCR_API_KEY=your_ocr_api_key
REACT_APP_MAPS_API_KEY=your_google_maps_key
```

### Mock Data
Currently uses mock data for demonstration. In production:
- Replace with actual pharmacy APIs
- Integrate real OCR services
- Connect to live inventory systems

## Installation & Setup

1. **Install Dependencies**
```bash
npm install tesseract.js  # For OCR functionality
npm install @google-cloud/vision  # For Google Vision API
```

2. **Configure APIs**
- Set up Google Maps API key
- Configure pharmacy network APIs
- Set up OCR service credentials

3. **Test with Sample Prescriptions**
- Use provided sample prescription images
- Verify OCR extraction accuracy
- Test pharmacy availability responses

## Support & Documentation

For technical support and detailed API documentation:
- 📧 Email: dev-support@drcurecast.in
- 📞 Phone: +91-80-XXXXXXXX
- 🌐 Documentation: https://docs.drcurecast.in/prescription-scanner
- 🐛 Issues: https://github.com/drcurecast/issues

---

*Built with ❤️ for better healthcare access in India*
