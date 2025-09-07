import { Language, DrCurecastUser, HealthAlert } from '../types';
import { languageService } from './languageService';

// Rural and semi-urban healthcare service for Dr.Curecast
export class RuralHealthService {
  private static instance: RuralHealthService;
  private offlineQueue: any[] = [];
  private isOnline: boolean = navigator.onLine;

  public static getInstance(): RuralHealthService {
    if (!RuralHealthService.instance) {
      RuralHealthService.instance = new RuralHealthService();
    }
    return RuralHealthService.instance;
  }

  constructor() {
    // Monitor connectivity for rural areas
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Get healthcare services available in rural/semi-urban areas
   */
  async getRuralHealthcareServices(location: string, language: Language): Promise<{
    primaryHealthCenters: any[];
    communityHealthCenters: any[];
    ashaWorkers: any[];
    telemedicineServices: any[];
    emergencyContacts: any[];
  }> {
    const services = {
      primaryHealthCenters: [
        {
          name: 'Primary Health Centre',
          distance: '2.5 km',
          services: ['Basic treatment', 'Vaccination', 'Maternal care'],
          phone: '108',
          availability: '24/7'
        }
      ],
      communityHealthCenters: [
        {
          name: 'Community Health Centre',
          distance: '8 km',
          services: ['Surgery', 'X-ray', 'Laboratory', 'Emergency care'],
          phone: '102',
          availability: '24/7'
        }
      ],
      ashaWorkers: [
        {
          name: 'ASHA Worker - Local Area',
          phone: '+91-9876543210',
          services: ['Health education', 'Immunization support', 'Basic treatment'],
          availability: 'Mon-Sat 9AM-6PM'
        }
      ],
      telemedicineServices: [
        {
          name: 'eSanjeevani Telemedicine',
          url: 'https://esanjeevani.in',
          services: ['Doctor consultation', 'Prescription', 'Follow-up'],
          languages: ['Hindi', 'English', 'Local languages']
        }
      ],
      emergencyContacts: [
        {
          service: 'Ambulance',
          number: '108',
          description: 'Free emergency ambulance service'
        },
        {
          service: 'Medical Emergency',
          number: '102',
          description: '24/7 medical emergency helpline'
        }
      ]
    };

    // Translate services to local language
    if (language !== 'english') {
      // In a real implementation, this would translate all service descriptions
      console.log(`Translating services to ${language}`);
    }

    return services;
  }

  /**
   * Get health information optimized for rural populations
   */
  async getRuralHealthInfo(topic: string, language: Language): Promise<{
    basicInfo: string;
    preventiveMeasures: string[];
    whenToSeekHelp: string;
    localRemedies: string[];
    governmentSchemes: string[];
  }> {
    const healthInfo = {
      basicInfo: `Basic information about ${topic} in simple, understandable terms.`,
      preventiveMeasures: [
        'Maintain personal hygiene',
        'Drink clean water',
        'Eat nutritious food',
        'Regular exercise'
      ],
      whenToSeekHelp: 'Seek immediate medical help if symptoms worsen or persist for more than 3 days.',
      localRemedies: [
        'Traditional remedies that are safe and effective',
        'Home-based care methods'
      ],
      governmentSchemes: [
        'Ayushman Bharat - Free healthcare up to ₹5 lakh',
        'Janani Suraksha Yojana - Maternal health support',
        'Mission Indradhanush - Immunization program'
      ]
    };

    // Translate to local language
    if (language !== 'english') {
      return await this.translateHealthInfo(healthInfo, language);
    }

    return healthInfo;
  }

  /**
   * Check for disease outbreaks and health alerts in rural areas
   */
  async checkRuralHealthAlerts(location: string, language: Language): Promise<HealthAlert[]> {
    const alerts: HealthAlert[] = [
      {
        id: 'alert_001',
        type: 'outbreak',
        title: 'Seasonal Flu Alert',
        description: 'Increased cases of seasonal flu reported in the region. Take preventive measures.',
        severity: 'medium',
        location: {
          state: location,
          district: location
        },
        language,
        issuedBy: 'District Health Office',
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        actionRequired: 'Get vaccinated, maintain hygiene, avoid crowded places if symptomatic',
        contactInfo: {
          phone: '104',
          website: 'https://mohfw.gov.in'
        }
      }
    ];

    return alerts;
  }

  /**
   * Get vaccination schedule optimized for rural areas
   */
  async getRuralVaccinationSchedule(userId: string, language: Language): Promise<{
    upcomingVaccinations: any[];
    vaccinationCenters: any[];
    transportSupport: any[];
    incentives: any[];
  }> {
    return {
      upcomingVaccinations: [
        {
          vaccine: 'COVID-19 Booster',
          dueDate: '2024-02-15',
          ageGroup: '18+',
          location: 'Primary Health Centre'
        }
      ],
      vaccinationCenters: [
        {
          name: 'PHC Vaccination Center',
          distance: '3 km',
          timings: 'Mon-Fri 10AM-4PM',
          vaccines: ['COVID-19', 'Flu', 'Hepatitis B']
        }
      ],
      transportSupport: [
        {
          service: 'Free Ambulance for Vaccination',
          phone: '108',
          availability: 'On request'
        }
      ],
      incentives: [
        {
          scheme: 'Vaccination Incentive',
          amount: '₹100',
          description: 'Cash incentive for completing vaccination'
        }
      ]
    };
  }

  /**
   * Offline functionality for areas with poor connectivity
   */
  async saveForOfflineSync(data: any): Promise<void> {
    if (!this.isOnline) {
      this.offlineQueue.push({
        data,
        timestamp: new Date().toISOString(),
        type: 'health_data'
      });
      
      // Store in localStorage for persistence
      localStorage.setItem('dr_curecast_offline_queue', JSON.stringify(this.offlineQueue));
    }
  }

  /**
   * Process offline queue when connectivity is restored
   */
  private async processOfflineQueue(): Promise<void> {
    const storedQueue = localStorage.getItem('dr_curecast_offline_queue');
    if (storedQueue) {
      this.offlineQueue = JSON.parse(storedQueue);
    }

    for (const item of this.offlineQueue) {
      try {
        // Process each offline item
        console.log('Processing offline item:', item);
        // In a real implementation, this would sync with the server
      } catch (error) {
        console.error('Failed to process offline item:', error);
      }
    }

    // Clear queue after processing
    this.offlineQueue = [];
    localStorage.removeItem('dr_curecast_offline_queue');
  }

  /**
   * Get community health worker information
   */
  async getCommunityHealthWorkers(location: string, language: Language): Promise<{
    ashaWorkers: any[];
    anganwadiWorkers: any[];
    auxiliaryNurseMidwives: any[];
  }> {
    return {
      ashaWorkers: [
        {
          name: 'Sunita Devi',
          phone: '+91-9876543210',
          area: 'Ward 1-3',
          services: ['Immunization', 'Maternal care', 'Health education'],
          availability: 'Mon-Sat 9AM-5PM'
        }
      ],
      anganwadiWorkers: [
        {
          name: 'Meera Sharma',
          phone: '+91-9876543211',
          center: 'Anganwadi Center #1',
          services: ['Child nutrition', 'Pre-school education', 'Health checkups'],
          availability: 'Mon-Fri 9AM-4PM'
        }
      ],
      auxiliaryNurseMidwives: [
        {
          name: 'Nurse Priya',
          phone: '+91-9876543212',
          facility: 'Sub-center',
          services: ['Delivery care', 'Family planning', 'Immunization'],
          availability: '24/7 on-call'
        }
      ]
    };
  }

  /**
   * Translate health information to local language
   */
  private async translateHealthInfo(healthInfo: any, language: Language): Promise<any> {
    // In a real implementation, this would use the language service
    return {
      ...healthInfo,
      basicInfo: await languageService.translateText(healthInfo.basicInfo, 'english', language),
      whenToSeekHelp: await languageService.translateText(healthInfo.whenToSeekHelp, 'english', language)
    };
  }

  /**
   * Get connectivity status
   */
  getConnectivityStatus(): { isOnline: boolean; offlineQueueSize: number } {
    return {
      isOnline: this.isOnline,
      offlineQueueSize: this.offlineQueue.length
    };
  }
}

export const ruralHealthService = RuralHealthService.getInstance();
