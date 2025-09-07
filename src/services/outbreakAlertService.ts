/**
 * Real-time Outbreak Alert System
 * Monitors disease outbreaks and sends alerts to rural populations
 */

interface OutbreakData {
  id: string;
  disease: string;
  location: {
    state: string;
    district: string;
    coordinates: { lat: number; lng: number };
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedCount: number;
  description: string;
  symptoms: string[];
  preventiveMeasures: string[];
  timestamp: string;
  source: 'government' | 'who' | 'local_health' | 'community';
  isActive: boolean;
}

interface AlertSubscription {
  userId: string;
  phoneNumber: string;
  whatsappNumber?: string;
  location: { state: string; district: string };
  preferredLanguage: string;
  communicationMethod: 'sms' | 'whatsapp' | 'both';
  alertTypes: string[];
}

class OutbreakAlertService {
  private outbreaks: Map<string, OutbreakData> = new Map();
  private subscriptions: Map<string, AlertSubscription> = new Map();
  private alertHistory: OutbreakData[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeMonitoring();
    this.loadMockOutbreakData();
  }

  /**
   * Initialize real-time monitoring
   */
  private initializeMonitoring(): void {
    // Monitor every 30 minutes for new outbreaks
    this.monitoringInterval = setInterval(() => {
      this.checkForNewOutbreaks();
    }, 30 * 60 * 1000);
  }

  /**
   * Load mock outbreak data for demonstration
   */
  private loadMockOutbreakData(): void {
    const mockOutbreaks: OutbreakData[] = [
      {
        id: 'outbreak_001',
        disease: 'Dengue',
        location: {
          state: 'Maharashtra',
          district: 'Mumbai',
          coordinates: { lat: 19.0760, lng: 72.8777 }
        },
        severity: 'high',
        affectedCount: 150,
        description: 'Dengue outbreak reported in Mumbai with increasing cases',
        symptoms: ['High fever', 'Headache', 'Body ache', 'Nausea'],
        preventiveMeasures: [
          'Remove stagnant water',
          'Use mosquito nets',
          'Wear full-sleeve clothes',
          'Seek medical help for fever'
        ],
        timestamp: new Date().toISOString(),
        source: 'government',
        isActive: true
      },
      {
        id: 'outbreak_002',
        disease: 'Chikungunya',
        location: {
          state: 'Karnataka',
          district: 'Bangalore',
          coordinates: { lat: 12.9716, lng: 77.5946 }
        },
        severity: 'medium',
        affectedCount: 75,
        description: 'Chikungunya cases rising in Bangalore urban areas',
        symptoms: ['Joint pain', 'Fever', 'Rash', 'Muscle pain'],
        preventiveMeasures: [
          'Eliminate breeding sites',
          'Use repellents',
          'Maintain cleanliness',
          'Consult doctor for joint pain'
        ],
        timestamp: new Date().toISOString(),
        source: 'local_health',
        isActive: true
      }
    ];

    mockOutbreaks.forEach(outbreak => {
      this.outbreaks.set(outbreak.id, outbreak);
    });
  }

  /**
   * Subscribe user for outbreak alerts
   */
  async subscribeToAlerts(subscription: AlertSubscription): Promise<boolean> {
    try {
      this.subscriptions.set(subscription.userId, subscription);
      
      // Send welcome message
      const welcomeMessage = subscription.preferredLanguage === 'hi'
        ? 'डॉ.क्योरकास्ट प्रकोप अलर्ट सेवा में आपका स्वागत है। आपको स्वास्थ्य अलर्ट मिलते रहेंगे।'
        : 'Welcome to Dr.CureCast Outbreak Alert Service. You will receive health alerts for your area.';

      if (subscription.communicationMethod === 'whatsapp' || subscription.communicationMethod === 'both') {
        const { whatsappService } = await import('./whatsappService');
        await whatsappService.sendMessage(subscription.whatsappNumber || subscription.phoneNumber, welcomeMessage, subscription.preferredLanguage);
      }

      if (subscription.communicationMethod === 'sms' || subscription.communicationMethod === 'both') {
        const { smsService } = await import('./smsService');
        await smsService.sendSMS(subscription.phoneNumber, welcomeMessage, subscription.preferredLanguage);
      }

      return true;
    } catch (error) {
      console.error('Failed to subscribe to alerts:', error);
      return false;
    }
  }

  /**
   * Check for new outbreaks from various sources
   */
  private async checkForNewOutbreaks(): Promise<void> {
    try {
      // In production, integrate with:
      // 1. Government health APIs
      // 2. WHO disease surveillance
      // 3. Local health department feeds
      // 4. News monitoring systems

      await Promise.all([
        this.checkGovernmentSources(),
        this.checkWHOSources(),
        this.checkLocalHealthSources()
      ]);
    } catch (error) {
      console.error('Error checking for outbreaks:', error);
    }
  }

  /**
   * Check government health sources
   */
  private async checkGovernmentSources(): Promise<void> {
    // Mock implementation - integrate with actual government APIs
    console.log('Checking government health sources for outbreaks...');
  }

  /**
   * Check WHO sources
   */
  private async checkWHOSources(): Promise<void> {
    // Mock implementation - integrate with WHO disease surveillance
    console.log('Checking WHO sources for outbreaks...');
  }

  /**
   * Check local health sources
   */
  private async checkLocalHealthSources(): Promise<void> {
    // Mock implementation - integrate with local health departments
    console.log('Checking local health sources for outbreaks...');
  }

  /**
   * Add new outbreak and trigger alerts
   */
  async addOutbreak(outbreak: OutbreakData): Promise<void> {
    try {
      this.outbreaks.set(outbreak.id, outbreak);
      this.alertHistory.push(outbreak);

      // Send alerts to subscribed users in affected area
      await this.sendOutbreakAlerts(outbreak);

      console.log(`New outbreak added: ${outbreak.disease} in ${outbreak.location.district}`);
    } catch (error) {
      console.error('Failed to add outbreak:', error);
    }
  }

  /**
   * Send outbreak alerts to subscribed users
   */
  private async sendOutbreakAlerts(outbreak: OutbreakData): Promise<void> {
    const affectedUsers = Array.from(this.subscriptions.values()).filter(sub =>
      sub.location.state === outbreak.location.state &&
      (sub.location.district === outbreak.location.district || outbreak.severity === 'critical')
    );

    const alertPromises = affectedUsers.map(async (user) => {
      const alertMessage = this.formatOutbreakAlert(outbreak, user.preferredLanguage);

      if (user.communicationMethod === 'whatsapp' || user.communicationMethod === 'both') {
        const { whatsappService } = await import('./whatsappService');
        await whatsappService.sendMessage(
          user.whatsappNumber || user.phoneNumber,
          alertMessage,
          user.preferredLanguage
        );
      }

      if (user.communicationMethod === 'sms' || user.communicationMethod === 'both') {
        const { smsService } = await import('./smsService');
        await smsService.sendOutbreakAlert(
          user.phoneNumber,
          outbreak.disease,
          outbreak.location.district,
          outbreak.preventiveMeasures.join(', '),
          user.preferredLanguage
        );
      }
    });

    await Promise.all(alertPromises);
    console.log(`Outbreak alerts sent to ${affectedUsers.length} users`);
  }

  /**
   * Format outbreak alert message
   */
  private formatOutbreakAlert(outbreak: OutbreakData, language: string): string {
    if (language === 'hi') {
      return `🚨 स्वास्थ्य चेतावनी 🚨\n\n` +
             `रोग: ${outbreak.disease}\n` +
             `स्थान: ${outbreak.location.district}, ${outbreak.location.state}\n` +
             `गंभीरता: ${this.getSeverityText(outbreak.severity, 'hi')}\n` +
             `प्रभावित: ${outbreak.affectedCount} लोग\n\n` +
             `लक्षण: ${outbreak.symptoms.join(', ')}\n\n` +
             `बचाव के उपाय:\n${outbreak.preventiveMeasures.map(m => `• ${m}`).join('\n')}\n\n` +
             `तुरंत डॉक्टर से मिलें यदि लक्षण दिखें। आपातकाल: 108\n\n` +
             `डॉ.क्योरकास्ट`;
    } else {
      return `🚨 HEALTH ALERT 🚨\n\n` +
             `Disease: ${outbreak.disease}\n` +
             `Location: ${outbreak.location.district}, ${outbreak.location.state}\n` +
             `Severity: ${this.getSeverityText(outbreak.severity, 'en')}\n` +
             `Affected: ${outbreak.affectedCount} people\n\n` +
             `Symptoms: ${outbreak.symptoms.join(', ')}\n\n` +
             `Prevention:\n${outbreak.preventiveMeasures.map(m => `• ${m}`).join('\n')}\n\n` +
             `Seek immediate medical help if symptoms appear. Emergency: 108\n\n` +
             `Dr.CureCast`;
    }
  }

  /**
   * Get severity text in specified language
   */
  private getSeverityText(severity: string, language: string): string {
    const severityMap = {
      en: { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' },
      hi: { low: 'कम', medium: 'मध्यम', high: 'उच्च', critical: 'गंभीर' }
    };

    return severityMap[language as keyof typeof severityMap]?.[severity as keyof typeof severityMap.en] || severity;
  }

  /**
   * Get active outbreaks for a location
   */
  getActiveOutbreaks(state?: string, district?: string): OutbreakData[] {
    return Array.from(this.outbreaks.values()).filter(outbreak => {
      if (!outbreak.isActive) return false;
      if (state && outbreak.location.state !== state) return false;
      if (district && outbreak.location.district !== district) return false;
      return true;
    });
  }

  /**
   * Update outbreak status
   */
  async updateOutbreakStatus(outbreakId: string, isActive: boolean): Promise<boolean> {
    const outbreak = this.outbreaks.get(outbreakId);
    if (!outbreak) return false;

    outbreak.isActive = isActive;
    this.outbreaks.set(outbreakId, outbreak);

    if (!isActive) {
      // Send resolution alert
      await this.sendResolutionAlert(outbreak);
    }

    return true;
  }

  /**
   * Send outbreak resolution alert
   */
  private async sendResolutionAlert(outbreak: OutbreakData): Promise<void> {
    const affectedUsers = Array.from(this.subscriptions.values()).filter(sub =>
      sub.location.state === outbreak.location.state &&
      sub.location.district === outbreak.location.district
    );

    const resolutionMessage = (language: string) => {
      return language === 'hi'
        ? `✅ अच्छी खबर! ${outbreak.location.district} में ${outbreak.disease} का प्रकोप नियंत्रण में है। सावधानी बरतते रहें। डॉ.क्योरकास्ट`
        : `✅ Good News! ${outbreak.disease} outbreak in ${outbreak.location.district} is now under control. Continue preventive measures. Dr.CureCast`;
    };

    const alertPromises = affectedUsers.map(async (user) => {
      const message = resolutionMessage(user.preferredLanguage);

      if (user.communicationMethod === 'whatsapp' || user.communicationMethod === 'both') {
        const { whatsappService } = await import('./whatsappService');
        await whatsappService.sendMessage(user.whatsappNumber || user.phoneNumber, message, user.preferredLanguage);
      }

      if (user.communicationMethod === 'sms' || user.communicationMethod === 'both') {
        const { smsService } = await import('./smsService');
        await smsService.sendSMS(user.phoneNumber, message, user.preferredLanguage);
      }
    });

    await Promise.all(alertPromises);
  }

  /**
   * Get outbreak statistics
   */
  getOutbreakStatistics(): {
    active: number;
    resolved: number;
    totalAffected: number;
    byState: Record<string, number>;
    bySeverity: Record<string, number>;
  } {
    const outbreaks = Array.from(this.outbreaks.values());
    
    return {
      active: outbreaks.filter(o => o.isActive).length,
      resolved: outbreaks.filter(o => !o.isActive).length,
      totalAffected: outbreaks.reduce((sum, o) => sum + o.affectedCount, 0),
      byState: outbreaks.reduce((acc, o) => {
        acc[o.location.state] = (acc[o.location.state] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: outbreaks.reduce((acc, o) => {
        acc[o.severity] = (acc[o.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  /**
   * Cleanup monitoring
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

export const outbreakAlertService = new OutbreakAlertService();
export default outbreakAlertService;
