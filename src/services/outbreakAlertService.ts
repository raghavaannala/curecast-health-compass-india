import { 
  OutbreakAlert, 
  Location, 
  OutbreakStatistics, 
  OutbreakFilter, 
  AlertNotification,
  Precaution,
  EmergencyContact,
  VaccinationInfo,
  OutbreakTrend,
  HealthFacility
} from '@/types/outbreakTypes';
import { LocationService } from './locationService';

export class OutbreakAlertService {
  private static instance: OutbreakAlertService;
  private alerts: OutbreakAlert[] = [];
  private notifications: AlertNotification[] = [];
  private lastUpdateTime: string = '';

  private constructor() {
    this.initializeMockData();
  }

  public static getInstance(): OutbreakAlertService {
    if (!OutbreakAlertService.instance) {
      OutbreakAlertService.instance = new OutbreakAlertService();
    }
    return OutbreakAlertService.instance;
  }

  /**
   * Get outbreak alerts for user's location
   */
  public async getLocationBasedAlerts(userLocation?: Location, radiusKm: number = 100): Promise<OutbreakAlert[]> {
    // Always return active alerts for demo purposes
    const activeAlerts = this.alerts.filter(alert => alert.status === 'active');
    
    if (!userLocation?.latitude || !userLocation?.longitude) {
      return activeAlerts;
    }

    // Filter by location if coordinates are available
    return activeAlerts.filter(alert => {
      return LocationService.getInstance().isWithinRadius(
        userLocation.latitude!,
        userLocation.longitude!,
        alert.location.coordinates.latitude,
        alert.location.coordinates.longitude,
        alert.location.radius + radiusKm
      );
    });
  }

  /**
   * Get all outbreak alerts with optional filtering
   */
  public async getAllAlerts(filter?: OutbreakFilter): Promise<OutbreakAlert[]> {
    let filteredAlerts = [...this.alerts];

    if (filter) {
      if (filter.severity) {
        filteredAlerts = filteredAlerts.filter(alert => 
          filter.severity!.includes(alert.severity)
        );
      }

      if (filter.status) {
        filteredAlerts = filteredAlerts.filter(alert => 
          filter.status!.includes(alert.status)
        );
      }

      if (filter.disease) {
        filteredAlerts = filteredAlerts.filter(alert => 
          filter.disease!.some(disease => 
            alert.disease.toLowerCase().includes(disease.toLowerCase())
          )
        );
      }

      if (filter.location) {
        filteredAlerts = filteredAlerts.filter(alert => 
          filter.location!.some(loc => 
            alert.location.city.toLowerCase().includes(loc.toLowerCase()) ||
            alert.location.state.toLowerCase().includes(loc.toLowerCase()) ||
            alert.location.district.toLowerCase().includes(loc.toLowerCase())
          )
        );
      }

      if (filter.dateRange) {
        const startDate = new Date(filter.dateRange.start);
        const endDate = new Date(filter.dateRange.end);
        filteredAlerts = filteredAlerts.filter(alert => {
          const alertDate = new Date(alert.dateReported);
          return alertDate >= startDate && alertDate <= endDate;
        });
      }
    }

    return filteredAlerts.sort((a, b) => {
      // Sort by severity and urgency
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aSeverity = severityOrder[a.severity];
      const bSeverity = severityOrder[b.severity];
      
      if (aSeverity !== bSeverity) {
        return bSeverity - aSeverity;
      }
      
      if (a.isUrgent !== b.isUrgent) {
        return a.isUrgent ? -1 : 1;
      }
      
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    });
  }

  /**
   * Get outbreak alert by ID
   */
  public async getAlertById(id: string): Promise<OutbreakAlert | null> {
    return this.alerts.find(alert => alert.id === id) || null;
  }

  /**
   * Get outbreak statistics
   */
  public async getOutbreakStatistics(): Promise<OutbreakStatistics> {
    const activeAlerts = this.alerts.filter(alert => alert.status === 'active');
    const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');
    
    const totalCases = this.alerts.reduce((sum, alert) => sum + alert.confirmedCases, 0);
    const totalDeaths = this.alerts.reduce((sum, alert) => sum + (alert.deaths || 0), 0);
    const totalRecoveries = this.alerts.reduce((sum, alert) => sum + (alert.recoveries || 0), 0);
    
    const affectedDistricts = new Set(this.alerts.map(alert => alert.location.district)).size;
    
    // Mock today's new cases
    const newCasesToday = Math.floor(totalCases * 0.05);
    
    const recoveryRate = totalCases > 0 ? (totalRecoveries / totalCases) * 100 : 0;
    const mortalityRate = totalCases > 0 ? (totalDeaths / totalCases) * 100 : 0;

    return {
      totalAlerts: this.alerts.length,
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
      affectedAreas: affectedDistricts,
      affectedDistricts,
      totalCases,
      newCasesToday,
      recoveredCases: totalRecoveries,
      recoveryRate: Math.round(recoveryRate * 100) / 100,
      mortalityRate: Math.round(mortalityRate * 100) / 100
    };
  }

  /**
   * Get notifications for user
   */
  public async getNotifications(): Promise<AlertNotification[]> {
    return this.notifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Mark notification as read
   */
  public async markNotificationAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  }

  /**
   * Get outbreak trends for a specific alert
   */
  public async getOutbreakTrends(alertId: string, days: number = 30): Promise<OutbreakTrend[]> {
    // Mock trend data - in production, this would come from a real database
    const trends: OutbreakTrend[] = [];
    const alert = await this.getAlertById(alertId);
    
    if (!alert) return trends;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dayProgress = i / days;
      const baseCases = Math.floor(alert.confirmedCases * dayProgress);
      const newCases = Math.floor(Math.random() * 50) + 10;
      const recoveries = Math.floor(baseCases * 0.8);
      const deaths = Math.floor(baseCases * 0.02);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        newCases,
        totalCases: baseCases + newCases,
        recoveries,
        deaths,
        activeCase: baseCases + newCases - recoveries - deaths,
        testsConducted: Math.floor((baseCases + newCases) * 10),
        positivityRate: Math.round((newCases / ((baseCases + newCases) * 10)) * 100 * 100) / 100
      });
    }

    return trends;
  }

  /**
   * Get nearby health facilities
   */
  public async getNearbyHealthFacilities(location: Location, radiusKm: number = 25): Promise<HealthFacility[]> {
    // Mock health facilities data
    const facilities: HealthFacility[] = [
      {
        id: '1',
        name: 'All India Institute of Medical Sciences (AIIMS)',
        type: 'hospital',
        address: 'Ansari Nagar, New Delhi, 110029',
        phone: '+91-11-26588500',
        coordinates: { latitude: 28.5672, longitude: 77.2100 },
        capacity: 2500,
        currentOccupancy: 2100,
        specializations: ['Cardiology', 'Neurology', 'Oncology', 'Emergency Medicine'],
        emergencyServices: true,
        covidFacility: true,
        bedAvailability: { general: 400, icu: 50, ventilator: 25 },
        timings: '24/7',
        website: 'https://www.aiims.edu'
      },
      {
        id: '2',
        name: 'Safdarjung Hospital',
        type: 'hospital',
        address: 'Ansari Nagar West, New Delhi, 110029',
        phone: '+91-11-26165060',
        coordinates: { latitude: 28.5738, longitude: 77.2065 },
        capacity: 1500,
        currentOccupancy: 1200,
        specializations: ['General Medicine', 'Surgery', 'Pediatrics', 'Gynecology'],
        emergencyServices: true,
        covidFacility: true,
        bedAvailability: { general: 300, icu: 30, ventilator: 15 },
        timings: '24/7'
      },
      {
        id: '3',
        name: 'Primary Health Center - Connaught Place',
        type: 'clinic',
        address: 'Connaught Place, New Delhi, 110001',
        phone: '+91-11-23417825',
        coordinates: { latitude: 28.6315, longitude: 77.2167 },
        capacity: 100,
        currentOccupancy: 60,
        specializations: ['General Medicine', 'Vaccination'],
        emergencyServices: false,
        covidFacility: true,
        bedAvailability: { general: 40, icu: 0, ventilator: 0 },
        timings: '9:00 AM - 5:00 PM'
      }
    ];

    if (!location.latitude || !location.longitude) {
      return facilities;
    }

    return facilities.filter(facility => 
      LocationService.getInstance().isWithinRadius(
        location.latitude!,
        location.longitude!,
        facility.coordinates.latitude,
        facility.coordinates.longitude,
        radiusKm
      )
    ).sort((a, b) => {
      const distanceA = LocationService.getInstance().calculateDistance(
        location.latitude!,
        location.longitude!,
        a.coordinates.latitude,
        a.coordinates.longitude
      );
      const distanceB = LocationService.getInstance().calculateDistance(
        location.latitude!,
        location.longitude!,
        b.coordinates.latitude,
        b.coordinates.longitude
      );
      return distanceA - distanceB;
    });
  }

  /**
   * Initialize mock data for demonstration
   */
  private initializeMockData(): void {
    const currentDate = new Date().toISOString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    this.alerts = [
      {
        id: '1',
        title: 'Dengue Outbreak Alert - Delhi NCR',
        description: 'Significant increase in dengue cases reported across Delhi NCR region. Health authorities have issued advisory for preventive measures.',
        severity: 'high',
        disease: 'Dengue Fever',
        location: {
          city: 'New Delhi',
          state: 'Delhi',
          district: 'Central Delhi',
          coordinates: { latitude: 28.6139, longitude: 77.2090 },
          radius: 50
        },
        affectedAreas: ['Central Delhi', 'South Delhi', 'East Delhi', 'Gurgaon', 'Noida'],
        reportedCases: 1250,
        confirmedCases: 980,
        deaths: 12,
        recoveries: 756,
        dateReported: yesterday.toISOString(),
        lastUpdated: currentDate,
        status: 'active',
        source: 'Delhi Health Department',
        precautions: this.getDenguePrecautions(),
        symptoms: ['High fever', 'Severe headache', 'Body aches', 'Nausea', 'Skin rash', 'Bleeding'],
        transmissionMode: ['Aedes mosquito bite', 'Stagnant water breeding'],
        riskFactors: ['Monsoon season', 'Poor sanitation', 'Water storage', 'Urban areas'],
        emergencyContacts: [
          {
            name: 'Delhi Health Helpline',
            phone: '011-22307145',
            type: 'helpline',
            available24x7: true
          },
          {
            name: 'AIIMS Emergency',
            phone: '011-26588500',
            type: 'hospital',
            available24x7: true,
            location: 'Ansari Nagar, New Delhi'
          }
        ],
        governmentGuidelines: 'Eliminate stagnant water, use mosquito nets, seek immediate medical attention for fever above 101°F',
        isUrgent: true,
        translations: {
          'hi': {
            title: 'डेंगू प्रकोप चेतावनी - दिल्ली एनसीआर',
            description: 'दिल्ली एनसीआर क्षेत्र में डेंगू के मामलों में महत्वपूर्ण वृद्धि की रिपोर्ट। स्वास्थ्य अधिकारियों ने निवारक उपायों के लिए सलाह जारी की है।',
            disease: 'डेंगू बुखार',
            symptoms: ['तेज बुखार', 'गंभीर सिरदर्द', 'शरीर में दर्द', 'मतली', 'त्वचा पर चकत्ते', 'रक्तस्राव'],
            transmissionMode: ['एडीज मच्छर का काटना', 'स्थिर पानी में प्रजनन'],
            riskFactors: ['मानसून का मौसम', 'खराब स्वच्छता', 'पानी का भंडारण', 'शहरी क्षेत्र'],
            governmentGuidelines: 'स्थिर पानी को खत्म करें, मच्छरदानी का उपयोग करें, 101°F से ऊपर बुखार के लिए तुरंत चिकित्सा सहायता लें'
          }
        }
      },
      {
        id: '2',
        title: 'Chikungunya Cases Rising - Mumbai',
        description: 'Health officials report increasing chikungunya cases in Mumbai metropolitan area, particularly in suburban regions.',
        severity: 'medium',
        disease: 'Chikungunya',
        location: {
          city: 'Mumbai',
          state: 'Maharashtra',
          district: 'Mumbai City',
          coordinates: { latitude: 19.0760, longitude: 72.8777 },
          radius: 40
        },
        affectedAreas: ['Andheri', 'Borivali', 'Thane', 'Navi Mumbai'],
        reportedCases: 680,
        confirmedCases: 520,
        deaths: 3,
        recoveries: 410,
        dateReported: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        lastUpdated: currentDate,
        status: 'active',
        source: 'Maharashtra Health Department',
        precautions: this.getChikungunyaPrecautions(),
        symptoms: ['Joint pain', 'Fever', 'Headache', 'Muscle pain', 'Joint swelling', 'Rash'],
        transmissionMode: ['Aedes mosquito bite'],
        riskFactors: ['Monsoon season', 'Urban slums', 'Poor drainage'],
        emergencyContacts: [
          {
            name: 'Mumbai Health Helpline',
            phone: '022-24937348',
            type: 'helpline',
            available24x7: true
          }
        ],
        isUrgent: false,
        translations: {
          'hi': {
            title: 'चिकनगुनिया के मामले बढ़ रहे हैं - मुंबई',
            description: 'स्वास्थ्य अधिकारियों ने मुंबई महानगरीय क्षेत्र में चिकनगुनिया के बढ़ते मामलों की रिपोर्ट दी है।',
            disease: 'चिकनगुनिया',
            symptoms: ['जोड़ों में दर्द', 'बुखार', 'सिरदर्द', 'मांसपेशियों में दर्द', 'जोड़ों में सूजन', 'चकत्ते'],
            transmissionMode: ['एडीज मच्छर का काटना'],
            riskFactors: ['मानसून का मौसम', 'शहरी झुग्गियां', 'खराब जल निकासी']
          }
        }
      },
      {
        id: '3',
        title: 'COVID-19 Variant Alert - Bangalore',
        description: 'New COVID-19 variant detected in Bangalore. Health authorities monitoring situation closely.',
        severity: 'critical',
        disease: 'COVID-19',
        location: {
          city: 'Bangalore',
          state: 'Karnataka',
          district: 'Bangalore Urban',
          coordinates: { latitude: 12.9716, longitude: 77.5946 },
          radius: 60
        },
        affectedAreas: ['Whitefield', 'Electronic City', 'Koramangala', 'Indiranagar'],
        reportedCases: 2100,
        confirmedCases: 1850,
        deaths: 45,
        recoveries: 1200,
        dateReported: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        lastUpdated: currentDate,
        status: 'active',
        source: 'Karnataka Health Department',
        precautions: this.getCovidPrecautions(),
        symptoms: ['Fever', 'Cough', 'Shortness of breath', 'Loss of taste/smell', 'Fatigue', 'Body aches'],
        transmissionMode: ['Respiratory droplets', 'Airborne transmission', 'Surface contact'],
        riskFactors: ['Close contact', 'Indoor gatherings', 'Poor ventilation', 'Immunocompromised'],
        emergencyContacts: [
          {
            name: 'Karnataka COVID Helpline',
            phone: '104',
            type: 'helpline',
            available24x7: true
          }
        ],
        vaccinationInfo: {
          isVaccineAvailable: true,
          vaccineNames: ['Covishield', 'Covaxin', 'Sputnik V'],
          eligibilityCriteria: ['18+ years', 'Healthcare workers', 'Frontline workers'],
          vaccinationCenters: [
            {
              name: 'Bangalore Medical College',
              address: 'Fort, Bangalore, Karnataka 560002',
              phone: '080-26700000',
              timings: '9:00 AM - 5:00 PM',
              availableVaccines: ['Covishield', 'Covaxin'],
              coordinates: { latitude: 12.9716, longitude: 77.5946 }
            }
          ],
          bookingUrl: 'https://cowin.gov.in'
        },
        isUrgent: true,
        translations: {
          'hi': {
            title: 'COVID-19 वेरिएंट अलर्ट - बैंगलोर',
            description: 'बैंगलोर में नया COVID-19 वेरिएंट पाया गया। स्वास्थ्य अधिकारी स्थिति पर बारीकी से नजर रख रहे हैं।',
            disease: 'COVID-19',
            symptoms: ['बुखार', 'खांसी', 'सांस लेने में कठिनाई', 'स्वाद/गंध की हानि', 'थकान', 'शरीर में दर्द'],
            transmissionMode: ['श्वसन बूंदें', 'हवाई संचरण', 'सतह संपर्क'],
            riskFactors: ['निकट संपर्क', 'इनडोर सभाएं', 'खराब वेंटिलेशन', 'कमजोर प्रतिरक्षा']
          }
        }
      }
    ];

    // Initialize notifications
    this.notifications = [
      {
        id: '1',
        outbreakId: '1',
        type: 'new_outbreak',
        title: 'New Dengue Alert in Your Area',
        message: 'A dengue outbreak has been reported in Delhi NCR. Take preventive measures.',
        timestamp: currentDate,
        isRead: false,
        priority: 'high',
        actionRequired: true,
        actionUrl: '/outbreak-alerts/1'
      },
      {
        id: '2',
        outbreakId: '3',
        type: 'severity_change',
        title: 'COVID-19 Alert Upgraded to Critical',
        message: 'COVID-19 situation in Bangalore has been upgraded to critical level.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isRead: false,
        priority: 'urgent',
        actionRequired: true,
        actionUrl: '/outbreak-alerts/3'
      }
    ];

    this.lastUpdateTime = currentDate;
  }

  private getDenguePrecautions(): Precaution[] {
    return [
      {
        id: '1',
        title: 'Eliminate Stagnant Water',
        description: 'Remove all sources of stagnant water around your home including flower pots, containers, and water storage.',
        icon: '💧',
        priority: 'high',
        category: 'prevention',
        translations: {
          'hi': {
            title: 'स्थिर पानी को खत्म करें',
            description: 'अपने घर के आसपास स्थिर पानी के सभी स्रोतों को हटा दें जिसमें फूलदान, कंटेनर और पानी का भंडारण शामिल है।'
          }
        }
      },
      {
        id: '2',
        title: 'Use Mosquito Nets',
        description: 'Sleep under mosquito nets, especially during daytime when Aedes mosquitoes are most active.',
        icon: '🛏️',
        priority: 'high',
        category: 'prevention',
        translations: {
          'hi': {
            title: 'मच्छरदानी का उपयोग करें',
            description: 'मच्छरदानी के नीचे सोएं, विशेष रूप से दिन के समय जब एडीज मच्छर सबसे अधिक सक्रिय होते हैं।'
          }
        }
      },
      {
        id: '3',
        title: 'Seek Medical Attention',
        description: 'Consult a doctor immediately if you experience high fever, severe headache, or body aches.',
        icon: '🏥',
        priority: 'high',
        category: 'treatment',
        translations: {
          'hi': {
            title: 'चिकित्सा सहायता लें',
            description: 'यदि आपको तेज बुखार, गंभीर सिरदर्द या शरीर में दर्द हो तो तुरंत डॉक्टर से सलाह लें।'
          }
        }
      }
    ];
  }

  private getChikungunyaPrecautions(): Precaution[] {
    return [
      {
        id: '1',
        title: 'Rest and Hydration',
        description: 'Get plenty of rest and drink lots of fluids to help your body recover.',
        icon: '💤',
        priority: 'high',
        category: 'treatment',
        translations: {
          'hi': {
            title: 'आराम और हाइड्रेशन',
            description: 'भरपूर आराम करें और अपने शरीर की रिकवरी में मदद के लिए बहुत सारे तरल पदार्थ पिएं।'
          }
        }
      }
    ];
  }

  private getCovidPrecautions(): Precaution[] {
    return [
      {
        id: '1',
        title: 'Wear Masks',
        description: 'Wear properly fitted masks in public places and maintain social distancing.',
        icon: '😷',
        priority: 'high',
        category: 'prevention',
        translations: {
          'hi': {
            title: 'मास्क पहनें',
            description: 'सार्वजनिक स्थानों पर उचित रूप से फिट मास्क पहनें और सामाजिक दूरी बनाए रखें।'
          }
        }
      },
      {
        id: '2',
        title: 'Get Vaccinated',
        description: 'Get fully vaccinated and booster shots as recommended by health authorities.',
        icon: '💉',
        priority: 'high',
        category: 'prevention',
        translations: {
          'hi': {
            title: 'टीकाकरण कराएं',
            description: 'स्वास्थ्य अधिकारियों की सिफारिश के अनुसार पूर्ण टीकाकरण और बूस्टर शॉट लगवाएं।'
          }
        }
      }
    ];
  }
}

export const outbreakAlertService = OutbreakAlertService.getInstance();
