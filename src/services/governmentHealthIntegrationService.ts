import { 
  GovernmentHealthFeed, 
  VaccinationRecord, 
  HealthAlert, 
  Language 
} from '../types';
import axios from 'axios';

/**
 * Government Health Database Integration Service
 * Integrates with Indian government health systems and databases
 */
export class GovernmentHealthIntegrationService {
  private static instance: GovernmentHealthIntegrationService;
  private readonly cowinApiUrl = 'https://cdn-api.co-vin.in/api';
  private readonly mohfwApiUrl = 'https://www.mohfw.gov.in/api'; // Placeholder
  private readonly icmrApiUrl = 'https://api.icmr.gov.in'; // Placeholder
  private readonly nvbdcpApiUrl = 'https://nvbdcp.gov.in/api'; // Placeholder
  
  // Cache for frequently accessed data
  private vaccineScheduleCache: Map<string, any> = new Map();
  private outbreakAlertsCache: Map<string, HealthAlert[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly cacheTimeout = 30 * 60 * 1000; // 30 minutes

  public static getInstance(): GovernmentHealthIntegrationService {
    if (!GovernmentHealthIntegrationService.instance) {
      GovernmentHealthIntegrationService.instance = new GovernmentHealthIntegrationService();
    }
    return GovernmentHealthIntegrationService.instance;
  }

  constructor() {
    this.initializeApiKeys();
  }

  /**
   * Initialize API keys and authentication
   */
  private initializeApiKeys(): void {
    // In production, these would be loaded from secure environment variables
    // Most Indian government APIs require registration and approval
  }

  /**
   * Get vaccination schedule from government database
   */
  async getGovernmentVaccinationSchedule(
    ageGroup: 'infant' | 'child' | 'adult' | 'elderly',
    state?: string
  ): Promise<{
    schedule: Array<{
      vaccine: string;
      ageInMonths?: number;
      ageInYears?: number;
      doses: number;
      interval?: string;
      mandatory: boolean;
      description: string;
    }>;
    lastUpdated: string;
    source: string;
  }> {
    try {
      const cacheKey = `vaccine_schedule_${ageGroup}_${state || 'national'}`;
      
      // Check cache first
      if (this.isCacheValid(cacheKey)) {
        return this.vaccineScheduleCache.get(cacheKey);
      }

      // Fetch from government API (placeholder implementation)
      const schedule = await this.fetchVaccinationSchedule(ageGroup, state);
      
      // Cache the result
      this.vaccineScheduleCache.set(cacheKey, schedule);
      this.cacheExpiry.set(cacheKey, Date.now() + this.cacheTimeout);
      
      return schedule;

    } catch (error) {
      console.error('Error fetching government vaccination schedule:', error);
      return this.getFallbackVaccinationSchedule(ageGroup);
    }
  }

  /**
   * Fetch vaccination schedule from government API
   */
  private async fetchVaccinationSchedule(
    ageGroup: string, 
    state?: string
  ): Promise<any> {
    // This is a placeholder implementation
    // In reality, this would integrate with actual government APIs
    
    const schedules = {
      infant: {
        schedule: [
          {
            vaccine: 'BCG',
            ageInMonths: 0,
            doses: 1,
            mandatory: true,
            description: 'Bacillus Calmette-Guérin vaccine for tuberculosis protection'
          },
          {
            vaccine: 'Hepatitis B',
            ageInMonths: 0,
            doses: 1,
            mandatory: true,
            description: 'First dose of Hepatitis B vaccine at birth'
          },
          {
            vaccine: 'OPV',
            ageInMonths: 0,
            doses: 1,
            mandatory: true,
            description: 'Oral Polio Vaccine - birth dose'
          },
          {
            vaccine: 'DPT',
            ageInMonths: 6,
            doses: 3,
            interval: '4 weeks',
            mandatory: true,
            description: 'Diphtheria, Pertussis, Tetanus vaccine'
          },
          {
            vaccine: 'Measles',
            ageInMonths: 9,
            doses: 2,
            interval: '6 months',
            mandatory: true,
            description: 'Measles vaccine for protection against measles'
          }
        ],
        lastUpdated: new Date().toISOString(),
        source: 'Ministry of Health and Family Welfare, Government of India'
      },
      child: {
        schedule: [
          {
            vaccine: 'MMR',
            ageInYears: 1,
            doses: 2,
            interval: '6 months',
            mandatory: true,
            description: 'Measles, Mumps, Rubella vaccine'
          },
          {
            vaccine: 'Typhoid',
            ageInYears: 2,
            doses: 1,
            mandatory: false,
            description: 'Typhoid vaccine for high-risk areas'
          },
          {
            vaccine: 'Hepatitis A',
            ageInYears: 2,
            doses: 2,
            interval: '6 months',
            mandatory: false,
            description: 'Hepatitis A vaccine'
          }
        ],
        lastUpdated: new Date().toISOString(),
        source: 'Indian Academy of Pediatrics'
      },
      adult: {
        schedule: [
          {
            vaccine: 'Tetanus-Diphtheria',
            ageInYears: 18,
            doses: 1,
            interval: '10 years',
            mandatory: true,
            description: 'Tetanus-Diphtheria booster every 10 years'
          },
          {
            vaccine: 'Influenza',
            ageInYears: 18,
            doses: 1,
            interval: '1 year',
            mandatory: false,
            description: 'Annual influenza vaccine'
          },
          {
            vaccine: 'COVID-19',
            ageInYears: 18,
            doses: 2,
            interval: '4-16 weeks',
            mandatory: true,
            description: 'COVID-19 vaccination as per government guidelines'
          }
        ],
        lastUpdated: new Date().toISOString(),
        source: 'Ministry of Health and Family Welfare'
      }
    };

    return schedules[ageGroup] || schedules.adult;
  }

  /**
   * Get disease outbreak alerts from government sources
   */
  async getOutbreakAlerts(
    location: { state: string; district?: string; pincode?: string },
    language: Language = 'english'
  ): Promise<HealthAlert[]> {
    try {
      const cacheKey = `outbreak_alerts_${location.state}_${location.district || 'all'}`;
      
      // Check cache first
      if (this.isCacheValid(cacheKey)) {
        return this.outbreakAlertsCache.get(cacheKey) || [];
      }

      // Fetch from multiple government sources
      const alerts = await Promise.all([
        this.fetchMOHFWAlerts(location),
        this.fetchNVBDCPAlerts(location),
        this.fetchStateHealthAlerts(location),
        this.fetchICMRAlerts(location)
      ]);

      // Combine and deduplicate alerts
      const combinedAlerts = this.combineAlerts(alerts.flat());
      
      // Cache the result
      this.outbreakAlertsCache.set(cacheKey, combinedAlerts);
      this.cacheExpiry.set(cacheKey, Date.now() + this.cacheTimeout);
      
      return combinedAlerts;

    } catch (error) {
      console.error('Error fetching outbreak alerts:', error);
      return this.getFallbackAlerts(location, language);
    }
  }

  /**
   * Fetch alerts from Ministry of Health and Family Welfare
   */
  private async fetchMOHFWAlerts(location: any): Promise<HealthAlert[]> {
    // Placeholder implementation - would integrate with actual MOHFW API
    return [
      {
        id: 'mohfw_001',
        type: 'health_advisory',
        title: 'Seasonal Influenza Advisory',
        description: 'Increased cases of seasonal flu reported. Take preventive measures.',
        severity: 'medium',
        location: {
          state: location.state,
          district: location.district
        },
        language: 'english',
        issuedBy: 'Ministry of Health and Family Welfare',
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        actionRequired: 'Get vaccinated, maintain hygiene, avoid crowded places if symptomatic',
        contactInfo: {
          phone: '104'
        }
      }
    ];
  }

  /**
   * Fetch alerts from National Vector Borne Disease Control Programme
   */
  private async fetchNVBDCPAlerts(location: any): Promise<HealthAlert[]> {
    // Placeholder implementation - would integrate with actual NVBDCP API
    return [
      {
        id: 'nvbdcp_001',
        type: 'outbreak_alert',
        title: 'Dengue Alert',
        description: 'Increased dengue cases in monsoon season. Eliminate mosquito breeding sites.',
        severity: 'high',
        location: {
          state: location.state
        },
        language: 'english',
        issuedBy: 'NVBDCP',
        issuedAt: new Date().toISOString(),
        actionRequired: 'Remove standing water, use mosquito nets, seek medical attention for fever',
        contactInfo: {
          phone: '104'
        }
      }
    ];
  }

  /**
   * Fetch alerts from state health departments
   */
  private async fetchStateHealthAlerts(location: any): Promise<HealthAlert[]> {
    // This would integrate with individual state health department APIs
    return [];
  }

  /**
   * Fetch alerts from ICMR
   */
  private async fetchICMRAlerts(location: any): Promise<HealthAlert[]> {
    // Placeholder implementation - would integrate with actual ICMR API
    return [];
  }

  /**
   * Get vaccination centers near location
   */
  async getVaccinationCenters(
    location: { state: string; district: string; pincode?: string },
    vaccineType?: string
  ): Promise<Array<{
    id: string;
    name: string;
    address: string;
    pincode: string;
    timings: string;
    availableVaccines: string[];
    contactNumber?: string;
    distance?: number;
  }>> {
    try {
      // This would integrate with CoWIN API for COVID vaccines
      // and other government databases for routine vaccines
      
      const centers = await this.fetchVaccinationCenters(location, vaccineType);
      return centers;

    } catch (error) {
      console.error('Error fetching vaccination centers:', error);
      return this.getFallbackVaccinationCenters(location);
    }
  }

  /**
   * Fetch vaccination centers from government APIs
   */
  private async fetchVaccinationCenters(location: any, vaccineType?: string): Promise<any[]> {
    // Placeholder implementation
    return [
      {
        id: 'center_001',
        name: 'Primary Health Center - ' + location.district,
        address: `Main Road, ${location.district}, ${location.state}`,
        pincode: location.pincode || '500001',
        timings: '9:00 AM - 5:00 PM (Mon-Sat)',
        availableVaccines: ['COVID-19', 'DPT', 'Measles', 'Polio'],
        contactNumber: '+91-40-12345678',
        distance: 2.5
      },
      {
        id: 'center_002',
        name: 'Community Health Center - ' + location.district,
        address: `Hospital Road, ${location.district}, ${location.state}`,
        pincode: location.pincode || '500002',
        timings: '8:00 AM - 6:00 PM (Mon-Sun)',
        availableVaccines: ['COVID-19', 'Hepatitis B', 'Typhoid'],
        contactNumber: '+91-40-87654321',
        distance: 5.0
      }
    ];
  }

  /**
   * Submit vaccination record to government database
   */
  async submitVaccinationRecord(
    record: {
      beneficiaryId: string;
      vaccineName: string;
      dateAdministered: string;
      centerId: string;
      batchNumber: string;
      healthWorkerId: string;
    }
  ): Promise<{ success: boolean; recordId?: string; error?: string }> {
    try {
      // This would submit to appropriate government database
      // For COVID vaccines: CoWIN
      // For routine vaccines: State immunization databases
      
      const recordId = `GOV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Placeholder implementation
      console.log('Submitting vaccination record to government database:', record);
      
      return {
        success: true,
        recordId
      };

    } catch (error) {
      console.error('Error submitting vaccination record:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify vaccination certificate
   */
  async verifyVaccinationCertificate(
    certificateId: string,
    beneficiaryId: string
  ): Promise<{
    valid: boolean;
    details?: {
      name: string;
      vaccines: Array<{
        name: string;
        date: string;
        center: string;
        batchNumber: string;
      }>;
    };
    error?: string;
  }> {
    try {
      // This would verify against government databases
      // Placeholder implementation
      
      return {
        valid: true,
        details: {
          name: 'Sample Beneficiary',
          vaccines: [
            {
              name: 'COVID-19 Covishield',
              date: '2023-06-15',
              center: 'PHC Sample Center',
              batchNumber: 'COV001'
            }
          ]
        }
      };

    } catch (error) {
      console.error('Error verifying vaccination certificate:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }

  /**
   * Get health statistics for region
   */
  async getHealthStatistics(
    location: { state: string; district?: string },
    timeRange: { startDate: string; endDate: string }
  ): Promise<{
    diseases: Array<{
      name: string;
      cases: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
    vaccinations: Array<{
      vaccine: string;
      administered: number;
      target: number;
      coverage: number;
    }>;
    lastUpdated: string;
  }> {
    try {
      // This would fetch from government health statistics APIs
      // Placeholder implementation
      
      return {
        diseases: [
          { name: 'Dengue', cases: 150, trend: 'increasing' },
          { name: 'Malaria', cases: 75, trend: 'decreasing' },
          { name: 'Chikungunya', cases: 25, trend: 'stable' }
        ],
        vaccinations: [
          { vaccine: 'COVID-19', administered: 85000, target: 100000, coverage: 85 },
          { vaccine: 'Measles', administered: 4500, target: 5000, coverage: 90 },
          { vaccine: 'DPT', administered: 4800, target: 5000, coverage: 96 }
        ],
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error fetching health statistics:', error);
      throw error;
    }
  }

  /**
   * Report disease case to government surveillance system
   */
  async reportDiseaseCase(
    caseData: {
      disease: string;
      patientAge: number;
      patientGender: 'male' | 'female' | 'other';
      location: { state: string; district: string; pincode?: string };
      symptoms: string[];
      reportedBy: string;
      facilityId?: string;
    }
  ): Promise<{ success: boolean; caseId?: string; error?: string }> {
    try {
      // This would submit to disease surveillance systems like IDSP
      const caseId = `CASE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('Reporting disease case to surveillance system:', caseData);
      
      return {
        success: true,
        caseId
      };

    } catch (error) {
      console.error('Error reporting disease case:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Reporting failed'
      };
    }
  }

  /**
   * Get ABHA (Ayushman Bharat Health Account) information
   */
  async getABHAInfo(abhaId: string): Promise<{
    valid: boolean;
    profile?: {
      name: string;
      age: number;
      gender: string;
      address: string;
      healthRecords: any[];
    };
    error?: string;
  }> {
    try {
      // This would integrate with ABHA system
      // Placeholder implementation
      
      return {
        valid: true,
        profile: {
          name: 'Sample Patient',
          age: 35,
          gender: 'male',
          address: 'Sample Address, India',
          healthRecords: []
        }
      };

    } catch (error) {
      console.error('Error fetching ABHA info:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'ABHA lookup failed'
      };
    }
  }

  // Helper methods

  /**
   * Check if cache is valid
   */
  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  /**
   * Combine and deduplicate alerts
   */
  private combineAlerts(alerts: HealthAlert[]): HealthAlert[] {
    const uniqueAlerts = new Map<string, HealthAlert>();
    
    alerts.forEach(alert => {
      const key = `${alert.type}_${alert.title}_${alert.location.state}`;
      if (!uniqueAlerts.has(key) || 
          new Date(alert.issuedAt) > new Date(uniqueAlerts.get(key)!.issuedAt)) {
        uniqueAlerts.set(key, alert);
      }
    });

    return Array.from(uniqueAlerts.values())
      .sort((a, b) => {
        // Sort by severity and date
        const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
        const severityA = severityOrder[a.severity] || 0;
        const severityB = severityOrder[b.severity] || 0;
        
        if (severityA !== severityB) {
          return severityB - severityA;
        }
        
        return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
      });
  }

  /**
   * Get fallback vaccination schedule
   */
  private getFallbackVaccinationSchedule(ageGroup: string): any {
    // Return basic vaccination schedule if API fails
    return {
      schedule: [
        {
          vaccine: 'Consult healthcare provider',
          description: 'Unable to fetch current schedule. Please consult your healthcare provider.',
          mandatory: true
        }
      ],
      lastUpdated: new Date().toISOString(),
      source: 'Fallback data'
    };
  }

  /**
   * Get fallback alerts
   */
  private getFallbackAlerts(location: any, language: Language): HealthAlert[] {
    return [
      {
        id: 'fallback_001',
        type: 'health_advisory',
        title: 'General Health Advisory',
        description: 'Maintain good hygiene, get vaccinated as per schedule, and seek medical attention for any health concerns.',
        severity: 'low',
        location: {
          state: location.state
        },
        language,
        issuedBy: 'Health System',
        issuedAt: new Date().toISOString(),
        contactInfo: {
          phone: '104'
        }
      }
    ];
  }

  /**
   * Get fallback vaccination centers
   */
  private getFallbackVaccinationCenters(location: any): any[] {
    return [
      {
        id: 'fallback_center',
        name: 'Nearest Government Health Center',
        address: `Contact local health authorities in ${location.district}, ${location.state}`,
        pincode: location.pincode || '000000',
        timings: 'Contact for timings',
        availableVaccines: ['Contact for vaccine availability'],
        contactNumber: '104'
      }
    ];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.vaccineScheduleCache.clear();
    this.outbreakAlertsCache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    vaccineScheduleEntries: number;
    outbreakAlertsEntries: number;
    totalEntries: number;
  } {
    return {
      vaccineScheduleEntries: this.vaccineScheduleCache.size,
      outbreakAlertsEntries: this.outbreakAlertsCache.size,
      totalEntries: this.vaccineScheduleCache.size + this.outbreakAlertsCache.size
    };
  }
}

export const governmentHealthIntegrationService = GovernmentHealthIntegrationService.getInstance();
