import { 
  Language, 
  VaccinationRecord, 
  HealthAlert 
} from '../types';
import { languageService } from './languageService';

// Government health database integration service for Dr.Curecast
export class GovernmentHealthService {
  private static instance: GovernmentHealthService;
  private apiEndpoints = {
    cowin: 'https://cdn-api.co-vin.in/api',
    ayushman: 'https://beneficiary.nha.gov.in/api',
    statePortal: 'https://state-health-portal.gov.in/api',
    ihip: 'https://ihip.nhp.gov.in/api',
    idsp: 'https://idsp.nic.in/api',
    who: 'https://disease-outbreak-news.who.int/api'
  };

  private apiKeys = {
    cowin: process.env.REACT_APP_COWIN_API_KEY,
    ayushman: process.env.REACT_APP_AYUSHMAN_API_KEY,
    statePortal: process.env.REACT_APP_STATE_PORTAL_API_KEY,
    ihip: process.env.REACT_APP_IHIP_API_KEY
  };

  private wsConnection: WebSocket | null = null;
  private alertSubscribers: Array<(alerts: HealthAlert[]) => void> = [];

  public static getInstance(): GovernmentHealthService {
    if (!GovernmentHealthService.instance) {
      GovernmentHealthService.instance = new GovernmentHealthService();
    }
    return GovernmentHealthService.instance;
  }

  /**
   * Initialize WebSocket connection for real-time health alerts
   */
  public initializeRealTimeAlerts(): void {
    try {
      this.wsConnection = new WebSocket('wss://health-alerts.gov.in/ws/');
      
      this.wsConnection.onopen = () => {
        console.log('Connected to health alerts WebSocket');
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const alertData = JSON.parse(event.data);
          this.handleRealTimeAlert(alertData);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.wsConnection.onclose = () => {
        console.log('WebSocket connection closed, attempting to reconnect...');
        setTimeout(() => this.initializeRealTimeAlerts(), 5000);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket connection:', error);
    }
  }

  /**
   * Handle incoming real-time health alerts
   */
  private async handleRealTimeAlert(alertData: any): Promise<void> {
    try {
      const healthAlert: HealthAlert = {
        id: alertData.id || `alert_${Date.now()}`,
        type: alertData.type || 'general',
        title: alertData.title,
        description: alertData.description,
        severity: alertData.severity || 'medium',
        location: alertData.location,
        language: 'english',
        issuedBy: alertData.source || 'Government Health Authority',
        issuedAt: alertData.timestamp || new Date().toISOString(),
        actionRequired: alertData.actionRequired,
        contactInfo: alertData.contactInfo
      };

      // Notify all subscribers
      this.alertSubscribers.forEach(callback => {
        callback([healthAlert]);
      });
    } catch (error) {
      console.error('Error handling real-time alert:', error);
    }
  }

  /**
   * Subscribe to real-time health alerts
   */
  public subscribeToAlerts(callback: (alerts: HealthAlert[]) => void): void {
    this.alertSubscribers.push(callback);
  }

  /**
   * Unsubscribe from real-time health alerts
   */
  public unsubscribeFromAlerts(callback: (alerts: HealthAlert[]) => void): void {
    const index = this.alertSubscribers.indexOf(callback);
    if (index > -1) {
      this.alertSubscribers.splice(index, 1);
    }
  }

  /**
   * Get comprehensive health alerts from multiple government sources
   */
  async getHealthAlerts(
    location: { state: string; district?: string },
    language: Language = 'english'
  ): Promise<HealthAlert[]> {
    try {
      const alerts: HealthAlert[] = [];

      // Fetch from multiple sources in parallel
      const [cowinAlerts, idspAlerts, ihipAlerts, stateAlerts, whoAlerts] = await Promise.allSettled([
        this.getCowinAlerts(location),
        this.getIDSPAlerts(location),
        this.getIHIPAlerts(location),
        this.getStateHealthAlerts(location),
        this.getWHOAlerts(location)
      ]);

      // Collect successful results
      if (cowinAlerts.status === 'fulfilled') alerts.push(...cowinAlerts.value);
      if (idspAlerts.status === 'fulfilled') alerts.push(...idspAlerts.value);
      if (ihipAlerts.status === 'fulfilled') alerts.push(...ihipAlerts.value);
      if (stateAlerts.status === 'fulfilled') alerts.push(...stateAlerts.value);
      if (whoAlerts.status === 'fulfilled') alerts.push(...whoAlerts.value);

      // Translate alerts if needed
      const translatedAlerts = await Promise.all(
        alerts.map(alert => this.translateAlert(alert, language))
      );

      // Sort by severity and date
      return translatedAlerts.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
      });

    } catch (error) {
      console.error('Error fetching health alerts:', error);
      return [];
    }
  }

  /**
   * Get CoWIN alerts for vaccination campaigns
   */
  private async getCowinAlerts(location: { state: string; district?: string }): Promise<HealthAlert[]> {
    try {
      const response = await fetch(`${this.apiEndpoints.cowin}/v2/admin/location/districts/${location.state}`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.districts?.map((district: any) => ({
        id: `cowin_${district.district_id}`,
        type: 'vaccination_campaign' as const,
        title: `Vaccination Drive in ${district.district_name}`,
        description: `COVID-19 vaccination available at centers in ${district.district_name}`,
        severity: 'medium' as const,
        location: {
          state: location.state,
          district: district.district_name
        },
        language: 'english' as Language,
        issuedBy: 'CoWIN Portal',
        issuedAt: new Date().toISOString(),
        contactInfo: {
          phone: '1075',
          website: 'https://cowin.gov.in'
        }
      })) || [];
    } catch (error) {
      console.error('CoWIN alerts error:', error);
      return [];
    }
  }

  /**
   * Get IDSP alerts for disease surveillance
   */
  private async getIDSPAlerts(location: { state: string; district?: string }): Promise<HealthAlert[]> {
    try {
      // IDSP (Integrated Disease Surveillance Programme) mock data
      return [
        {
          id: 'idsp_001',
          type: 'outbreak' as const,
          title: 'Seasonal Flu Surveillance Alert',
          description: 'Increased influenza activity reported in the region',
          severity: 'medium' as const,
          location: {
            state: location.state,
            district: location.district
          },
          language: 'english' as Language,
          issuedBy: 'IDSP - NCDC',
          issuedAt: new Date().toISOString(),
          actionRequired: 'Monitor flu symptoms, get vaccinated if eligible',
          contactInfo: {
            phone: '104',
            website: 'https://ncdc.gov.in'
          }
        }
      ];
    } catch (error) {
      console.error('IDSP alerts error:', error);
      return [];
    }
  }

  /**
   * Get IHIP alerts for integrated health information
   */
  private async getIHIPAlerts(location: { state: string; district?: string }): Promise<HealthAlert[]> {
    try {
      // Mock IHIP data
      return [
        {
          id: 'ihip_001',
          type: 'health_advisory' as const,
          title: 'Monsoon Health Advisory',
          description: 'Preventive measures for monsoon-related diseases',
          severity: 'low' as const,
          location: {
            state: location.state,
            district: location.district
          },
          language: 'english' as Language,
          issuedBy: 'IHIP - NHP',
          issuedAt: new Date().toISOString(),
          actionRequired: 'Follow hygiene practices, avoid waterlogging',
          contactInfo: {
            phone: '104',
            website: 'https://ihip.nhp.gov.in'
          }
        }
      ];
    } catch (error) {
      console.error('IHIP alerts error:', error);
      return [];
    }
  }

  /**
   * Get state health portal alerts
   */
  private async getStateHealthAlerts(location: { state: string; district?: string }): Promise<HealthAlert[]> {
    try {
      // Mock state health data
      return [
        {
          id: `state_${location.state}_001`,
          type: 'public_health' as const,
          title: `${location.state} Health Department Notice`,
          description: 'Regular health checkup camps scheduled in the district',
          severity: 'low' as const,
          location: {
            state: location.state,
            district: location.district
          },
          language: 'english' as Language,
          issuedBy: `${location.state} Health Department`,
          issuedAt: new Date().toISOString(),
          actionRequired: 'Attend nearby health camps for free checkups',
          contactInfo: {
            phone: '108',
            website: `https://${location.state.toLowerCase()}-health.gov.in`
          }
        }
      ];
    } catch (error) {
      console.error('State health alerts error:', error);
      return [];
    }
  }

  /**
   * Get WHO international health alerts
   */
  private async getWHOAlerts(location: { state: string; district?: string }): Promise<HealthAlert[]> {
    try {
      // Mock WHO data
      return [
        {
          id: 'who_001',
          type: 'international_alert' as const,
          title: 'WHO Global Health Advisory',
          description: 'Latest international health recommendations and guidelines',
          severity: 'medium' as const,
          location: {
            state: location.state,
            district: location.district
          },
          language: 'english' as Language,
          issuedBy: 'World Health Organization',
          issuedAt: new Date().toISOString(),
          actionRequired: 'Follow WHO recommended health protocols',
          contactInfo: {
            phone: '+41 22 791 21 11',
            website: 'https://who.int'
          }
        }
      ];
    } catch (error) {
      console.error('WHO alerts error:', error);
      return [];
    }
  }

  /**
   * Translate health alert to specified language
   */
  private async translateAlert(alert: HealthAlert, language: Language): Promise<HealthAlert> {
    if (language === 'english') return alert;
    
    try {
      const translatedTitle = await languageService.translateText(alert.title, 'english', language);
      const translatedDescription = await languageService.translateText(alert.description, 'english', language);
      const translatedAction = alert.actionRequired 
        ? await languageService.translateText(alert.actionRequired, 'english', language)
        : undefined;

      return {
        ...alert,
        title: translatedTitle,
        description: translatedDescription,
        actionRequired: translatedAction,
        language
      };
    } catch (error) {
      console.error('Alert translation error:', error);
      return alert;
    }
  }

  /**
   * Get vaccination records from CoWIN
   */
  async getCowinRecords(userId: string): Promise<VaccinationRecord[]> {
    try {
      const response = await fetch(`${this.apiEndpoints.cowin}/v2/registration/certificate/public/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ beneficiary_reference_id: userId })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CoWIN records');
      }

      const data = await response.json();
      return this.transformCoWINData(data);
    } catch (error) {
      console.error('CoWIN records fetch failed:', error);
      return [];
    }
  }

  /**
   * Get Ayushman Bharat records
   */
  async getAyushmanRecords(userId: string): Promise<VaccinationRecord[]> {
    try {
      const response = await fetch(`${this.apiEndpoints.ayushman}/v1/beneficiary/${userId}/health-records`, {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.ayushman}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Ayushman records');
      }

      const data = await response.json();
      return this.transformAyushmanData(data);
    } catch (error) {
      console.error('Ayushman records fetch failed:', error);
      return [];
    }
  }

  /**
   * Get state health portal records
   */
  async getStateHealthRecords(userId: string): Promise<VaccinationRecord[]> {
    try {
      const response = await fetch(`${this.apiEndpoints.statePortal}/v1/citizen/${userId}/health-records`, {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.statePortal}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch state health records');
      }

      const data = await response.json();
      return this.transformStateData(data);
    } catch (error) {
      console.error('State health records fetch failed:', error);
      return [];
    }
  }

  /**
   * Transform CoWIN API data to VaccinationRecord format
   */
  private transformCoWINData(data: any): VaccinationRecord[] {
    if (!data.certificate) return [];

    return [{
      id: data.certificate.certificate_id,
      vaccineType: data.certificate.vaccine,
      manufacturer: data.certificate.manufacturer || 'Unknown',
      batchNumber: data.certificate.batch || 'N/A',
      doseNumber: data.certificate.dose || 1,
      dateAdministered: data.certificate.date || new Date().toISOString(),
      administeredBy: data.certificate.vaccination_center || 'Government Center',
      location: data.certificate.district || 'Unknown',
      certificateId: data.certificate.certificate_id,
      qrCode: data.certificate.qr_code,
      isVerified: true,
      source: 'cowin'
    }];
  }

  /**
   * Transform Ayushman Bharat data to VaccinationRecord format
   */
  private transformAyushmanData(data: any): VaccinationRecord[] {
    if (!data.health_records) return [];

    return data.health_records
      .filter((record: any) => record.type === 'vaccination')
      .map((record: any) => ({
        id: record.record_id,
        vaccineType: record.vaccine_name,
        manufacturer: record.manufacturer || 'Unknown',
        batchNumber: record.batch_number || 'N/A',
        doseNumber: record.dose_number || 1,
        dateAdministered: record.administered_date,
        administeredBy: record.healthcare_provider,
        location: record.location,
        certificateId: record.certificate_id,
        isVerified: record.is_verified || false,
        source: 'ayushman'
      }));
  }

  /**
   * Transform state portal data to VaccinationRecord format
   */
  private transformStateData(data: any): VaccinationRecord[] {
    if (!data.records) return [];

    return data.records
      .filter((record: any) => record.category === 'vaccination')
      .map((record: any) => ({
        id: record.id,
        vaccineType: record.vaccine,
        manufacturer: record.manufacturer || 'Unknown',
        batchNumber: record.batch || 'N/A',
        doseNumber: record.dose || 1,
        dateAdministered: record.date,
        administeredBy: record.provider,
        location: record.location,
        certificateId: record.certificate,
        isVerified: record.verified || false,
        source: 'state_portal'
      }));
  }

  /**
   * Sync user health data from all government sources
   */
  async syncUserHealthData(userId: string): Promise<{
    success: boolean;
    syncedRecords: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let syncedRecords = 0;

    try {
      // Sync CoWIN vaccination records
      const cowinData = await this.getCowinRecords(userId);
      if (cowinData.length > 0) {
        syncedRecords += cowinData.length;
      }

      // Sync Ayushman Bharat records
      const ayushmanData = await this.getAyushmanRecords(userId);
      if (ayushmanData.length > 0) {
        syncedRecords += ayushmanData.length;
      }

      // Sync state health portal data
      const stateData = await this.getStateHealthRecords(userId);
      if (stateData.length > 0) {
        syncedRecords += stateData.length;
      }

      return {
        success: errors.length === 0,
        syncedRecords,
        errors
      };

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown sync error');
      return {
        success: false,
        syncedRecords,
        errors
      };
    }
  }

  /**
   * Get vaccination guidelines from government sources
   */
  async getVaccinationGuidelines(
    vaccineType: string,
    ageGroup: string,
    language: Language = 'english'
  ): Promise<{
    guidelines: string;
    schedule: any[];
    contraindications: string[];
    sideEffects: string[];
  }> {
    try {
      const response = await fetch(`${this.apiEndpoints.cowin}/v2/admin/location/states`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vaccination guidelines');
      }

      // Mock guidelines data - in real implementation would come from API
      const guidelines = {
        guidelines: `Vaccination guidelines for ${vaccineType} (${ageGroup})`,
        schedule: [
          {
            dose: 1,
            timing: 'Initial dose',
            ageGroup
          },
          {
            dose: 2,
            timing: '4-12 weeks after first dose',
            ageGroup
          }
        ],
        contraindications: [
          'Severe allergic reaction to previous dose',
          'Active fever or illness',
          'Immunocompromised conditions (consult doctor)'
        ],
        sideEffects: [
          'Pain at injection site',
          'Mild fever',
          'Fatigue',
          'Headache'
        ]
      };

      // Translate to requested language
      if (language !== 'english') {
        guidelines.guidelines = await languageService.translateText(
          guidelines.guidelines,
          'english',
          language
        );
      }

      return guidelines;

    } catch (error) {
      console.error('Vaccination guidelines fetch failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const governmentHealthService = GovernmentHealthService.getInstance();
