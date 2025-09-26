import { 
  PharmacyLocation, 
  MedicineAvailability, 
  MedicineAlternative, 
  PharmacyInventoryQuery,
  ReservationRequest,
  ReservationResponse,
  ExtractedMedicine
} from '../types/prescription';

export class PharmacyService {
  private apiBaseUrl = process.env.REACT_APP_PHARMACY_API_URL || 'https://api.pharmacynetwork.in';

  /**
   * Get nearby pharmacies within specified radius
   */
  async getNearbyPharmacies(
    latitude: number, 
    longitude: number, 
    radius: number = 5
  ): Promise<PharmacyLocation[]> {
    // Mock data - In production, integrate with actual pharmacy APIs
    const mockPharmacies: PharmacyLocation[] = [
      {
        id: 'apollo_001',
        name: 'Apollo Pharmacy',
        address: 'Shop No. 12, MG Road, Bangalore - 560001',
        latitude: latitude + 0.01,
        longitude: longitude + 0.01,
        distance: 0, // Will be calculated
        phone: '+91-80-12345678',
        email: 'mgroad@apollopharmacy.in',
        website: 'https://apollopharmacy.in',
        openingHours: {
          'Monday': '8:00 AM - 10:00 PM',
          'Tuesday': '8:00 AM - 10:00 PM',
          'Wednesday': '8:00 AM - 10:00 PM',
          'Thursday': '8:00 AM - 10:00 PM',
          'Friday': '8:00 AM - 10:00 PM',
          'Saturday': '8:00 AM - 10:00 PM',
          'Sunday': '9:00 AM - 9:00 PM'
        },
        rating: 4.5,
        verified: true
      },
      {
        id: 'medplus_002',
        name: 'MedPlus Pharmacy',
        address: 'Plot 45, Brigade Road, Bangalore - 560025',
        latitude: latitude + 0.02,
        longitude: longitude + 0.015,
        distance: 0, // Will be calculated
        phone: '+91-80-87654321',
        email: 'brigade@medplus.in',
        website: 'https://medplus.in',
        openingHours: {
          'Monday': '7:00 AM - 11:00 PM',
          'Tuesday': '7:00 AM - 11:00 PM',
          'Wednesday': '7:00 AM - 11:00 PM',
          'Thursday': '7:00 AM - 11:00 PM',
          'Friday': '7:00 AM - 11:00 PM',
          'Saturday': '7:00 AM - 11:00 PM',
          'Sunday': '8:00 AM - 10:00 PM'
        },
        rating: 4.2,
        verified: true
      },
      {
        id: 'netmeds_003',
        name: 'Netmeds (Delivery Only)',
        address: 'Online Pharmacy - Home Delivery Available',
        latitude: latitude,
        longitude: longitude,
        distance: 0,
        phone: '+91-44-71777777',
        email: 'support@netmeds.com',
        website: 'https://netmeds.com',
        openingHours: {
          'Monday': '24 Hours',
          'Tuesday': '24 Hours',
          'Wednesday': '24 Hours',
          'Thursday': '24 Hours',
          'Friday': '24 Hours',
          'Saturday': '24 Hours',
          'Sunday': '24 Hours'
        },
        rating: 4.0,
        verified: true
      },
      {
        id: 'local_004',
        name: 'City Medical Store',
        address: '78, Commercial Street, Bangalore - 560001',
        latitude: latitude + 0.005,
        longitude: longitude + 0.008,
        distance: 0, // Will be calculated
        phone: '+91-80-98765432',
        openingHours: {
          'Monday': '8:00 AM - 9:00 PM',
          'Tuesday': '8:00 AM - 9:00 PM',
          'Wednesday': '8:00 AM - 9:00 PM',
          'Thursday': '8:00 AM - 9:00 PM',
          'Friday': '8:00 AM - 9:00 PM',
          'Saturday': '8:00 AM - 9:00 PM',
          'Sunday': 'Closed'
        },
        rating: 3.8,
        verified: false
      }
    ];

    // Calculate actual distances and filter by radius
    const pharmaciesWithDistance = mockPharmacies.map(pharmacy => ({
      ...pharmacy,
      distance: pharmacy.id === 'netmeds_003' ? 0 : this.calculateDistance(
        latitude,
        longitude,
        pharmacy.latitude,
        pharmacy.longitude
      )
    }));

    console.log('User location:', { latitude, longitude });
    console.log('Pharmacies with calculated distances:', pharmaciesWithDistance);

    // Filter by radius and sort by distance
    return pharmaciesWithDistance
      .filter(pharmacy => pharmacy.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Check medicine availability across pharmacies
   */
  async checkMedicineAvailability(
    medicines: ExtractedMedicine[],
    pharmacies: PharmacyLocation[]
  ): Promise<MedicineAvailability[]> {
    const availability: MedicineAvailability[] = [];

    // Enhanced mock pricing data with more medicines
    const mockPrices: { [key: string]: { min: number; max: number; availability: number } } = {
      'Paracetamol': { min: 15, max: 35, availability: 0.9 },
      'Crocin': { min: 18, max: 28, availability: 0.85 },
      'Dolo': { min: 12, max: 25, availability: 0.8 },
      'Amoxicillin': { min: 80, max: 150, availability: 0.7 },
      'Amoxil': { min: 95, max: 165, availability: 0.6 },
      'Novamox': { min: 75, max: 135, availability: 0.75 },
      'Omeprazole': { min: 45, max: 85, availability: 0.8 },
      'Prilosec': { min: 55, max: 95, availability: 0.65 },
      'Cough Relief': { min: 65, max: 120, availability: 0.6 },
      'Metformin': { min: 25, max: 55, availability: 0.85 },
      'Glucophage': { min: 35, max: 65, availability: 0.7 },
      'Atorvastatin': { min: 120, max: 200, availability: 0.75 },
      'Lipitor': { min: 150, max: 250, availability: 0.6 }
    };

    for (const medicine of medicines) {
      for (const pharmacy of pharmacies) {
        // Use medicine name or brand name for lookup
        const lookupName = medicine.brandName || medicine.name.split(' ')[0];
        const priceData = mockPrices[lookupName] || { min: 20, max: 100, availability: 0.5 };
        
        // Determine availability based on medicine and pharmacy type
        let availabilityChance = priceData.availability;
        if (pharmacy.name.toLowerCase().includes('online') || pharmacy.name.toLowerCase().includes('delivery')) {
          availabilityChance = Math.min(availabilityChance + 0.2, 0.95); // Online pharmacies have better availability
        }
        
        const isAvailable = Math.random() < availabilityChance;
        const price = isAvailable ? 
          Math.floor(Math.random() * (priceData.max - priceData.min) + priceData.min) : 
          undefined;

        availability.push({
          medicineId: medicine.id,
          medicineName: medicine.name,
          pharmacy,
          available: isAvailable,
          price,
          currency: 'INR',
          inStock: isAvailable ? Math.floor(Math.random() * 50) + 10 : 0,
          lastUpdated: new Date().toISOString(),
          alternativeNames: [medicine.genericName, medicine.brandName].filter(Boolean) as string[],
          requiresPrescription: true
        });
      }
    }

    return availability;
  }

  /**
   * Get alternative medicines for unavailable ones
   */
  async getMedicineAlternatives(
    unavailableMedicines: ExtractedMedicine[]
  ): Promise<{ [medicineId: string]: MedicineAlternative[] }> {
    const alternatives: { [medicineId: string]: MedicineAlternative[] } = {};

    // Mock alternative data
    const mockAlternatives = {
      'Paracetamol': [
        { name: 'Crocin', generic: 'Paracetamol', manufacturer: 'GSK' },
        { name: 'Dolo', generic: 'Paracetamol', manufacturer: 'Micro Labs' },
        { name: 'Calpol', generic: 'Paracetamol', manufacturer: 'Johnson & Johnson' }
      ],
      'Amoxicillin': [
        { name: 'Novamox', generic: 'Amoxicillin', manufacturer: 'Cipla' },
        { name: 'Amoxil', generic: 'Amoxicillin', manufacturer: 'GSK' },
        { name: 'Moxikind', generic: 'Amoxicillin', manufacturer: 'Mankind' }
      ]
    };

    for (const medicine of unavailableMedicines) {
      const medicineName = medicine.name.split(' ')[0];
      const alts = mockAlternatives[medicineName as keyof typeof mockAlternatives] || [];
      
      alternatives[medicine.id] = alts.map((alt, index) => ({
        id: `alt_${medicine.id}_${index}`,
        name: alt.name,
        genericName: alt.generic,
        composition: `${alt.generic} ${medicine.strength}`,
        strength: medicine.strength,
        form: medicine.form,
        manufacturer: alt.manufacturer,
        price: Math.floor(Math.random() * 50) + 20,
        availability: [], // Would be populated with actual availability
        substitutionReason: 'generic' as const,
        safetyRating: 4 + Math.random()
      }));
    }

    return alternatives;
  }

  /**
   * Reserve medicines at pharmacy
   */
  async reserveMedicines(request: ReservationRequest): Promise<ReservationResponse> {
    // Mock reservation process
    await new Promise(resolve => setTimeout(resolve, 1000));

    const estimatedTotal = request.medicines.reduce((total, med) => {
      return total + (Math.random() * 100 + 20) * med.quantity;
    }, 0);

    return {
      reservationId: `res_${Date.now()}`,
      status: Math.random() > 0.1 ? 'confirmed' : 'pending',
      estimatedTotal: Math.round(estimatedTotal),
      currency: 'INR',
      pickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      pharmacyContact: '+91-80-12345678',
      instructions: 'Please bring a valid ID and the original prescription for pickup.'
    };
  }

  /**
   * Get user's current location
   */
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          // Fallback to Bangalore coordinates
          console.warn('Location access denied, using default location');
          resolve({
            latitude: 12.9716,
            longitude: 77.5946
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Calculate distance between two coordinates
   */
  calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Generate Google Maps link for pharmacy
   */
  generateMapsLink(pharmacy: PharmacyLocation): string {
    const encodedAddress = encodeURIComponent(pharmacy.address);
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  }

  /**
   * Check if pharmacy is currently open
   */
  isPharmacyOpen(pharmacy: PharmacyLocation): boolean {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const todayHours = pharmacy.openingHours?.[currentDay];
    if (!todayHours || todayHours === 'Closed') return false;
    if (todayHours === '24 Hours') return true;

    // Parse opening hours (e.g., "8:00 AM - 10:00 PM")
    const hoursMatch = todayHours.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/);
    if (!hoursMatch) return false;

    const [, openHour, openMin, openPeriod, closeHour, closeMin, closePeriod] = hoursMatch;
    
    const openTime = this.convertTo24Hour(parseInt(openHour), parseInt(openMin), openPeriod);
    const closeTime = this.convertTo24Hour(parseInt(closeHour), parseInt(closeMin), closePeriod);
    
    return currentTime >= openTime && currentTime <= closeTime;
  }

  private convertTo24Hour(hour: number, minute: number, period: string): string {
    let hour24 = hour;
    if (period === 'PM' && hour !== 12) hour24 += 12;
    if (period === 'AM' && hour === 12) hour24 = 0;
    
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }
}

export const pharmacyService = new PharmacyService();
