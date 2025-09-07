/**
 * SMS Gateway Integration Service
 * Provides SMS communication for rural populations without internet access
 */

interface SMSMessage {
  id: string;
  to: string;
  message: string;
  timestamp: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  language?: string;
}

interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  language: string;
}

class SMSService {
  private apiKey: string;
  private senderId: string;
  private baseUrl: string = 'https://api.textlocal.in/send/';
  private templates: Map<string, SMSTemplate> = new Map();

  constructor() {
    this.apiKey = process.env.REACT_APP_SMS_API_KEY || '';
    this.senderId = process.env.REACT_APP_SMS_SENDER_ID || 'DRCURE';
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Health Education Templates
    this.templates.set('health_tip_en', {
      id: 'health_tip_en',
      name: 'Health Tip English',
      content: 'Dr.CureCast Health Tip: {tip}. For more info, call 1800-XXX-XXXX or visit nearest health center.',
      variables: ['tip'],
      language: 'en'
    });

    this.templates.set('health_tip_hi', {
      id: 'health_tip_hi',
      name: 'Health Tip Hindi',
      content: 'डॉ.क्योरकास्ट स्वास्थ्य सुझाव: {tip}। अधिक जानकारी के लिए 1800-XXX-XXXX पर कॉल करें।',
      variables: ['tip'],
      language: 'hi'
    });

    // Vaccination Reminders
    this.templates.set('vaccine_reminder_en', {
      id: 'vaccine_reminder_en',
      name: 'Vaccination Reminder English',
      content: 'Vaccination Reminder: {vaccine} due on {date} at {location}. Please visit on time. Dr.CureCast',
      variables: ['vaccine', 'date', 'location'],
      language: 'en'
    });

    this.templates.set('vaccine_reminder_hi', {
      id: 'vaccine_reminder_hi',
      name: 'Vaccination Reminder Hindi',
      content: 'टीकाकरण अनुस्मारक: {vaccine} {date} को {location} पर देय है। कृपया समय पर पहुंचें। डॉ.क्योरकास्ट',
      variables: ['vaccine', 'date', 'location'],
      language: 'hi'
    });

    // Outbreak Alerts
    this.templates.set('outbreak_alert_en', {
      id: 'outbreak_alert_en',
      name: 'Outbreak Alert English',
      content: 'HEALTH ALERT: {disease} outbreak in {location}. Prevention: {measures}. Seek medical help if symptoms appear. Dr.CureCast',
      variables: ['disease', 'location', 'measures'],
      language: 'en'
    });

    this.templates.set('outbreak_alert_hi', {
      id: 'outbreak_alert_hi',
      name: 'Outbreak Alert Hindi',
      content: 'स्वास्थ्य चेतावनी: {location} में {disease} का प्रकोप। बचाव: {measures}। लक्षण दिखने पर तुरंत डॉक्टर से मिलें।',
      variables: ['disease', 'location', 'measures'],
      language: 'hi'
    });

    // Appointment Reminders
    this.templates.set('appointment_reminder_en', {
      id: 'appointment_reminder_en',
      name: 'Appointment Reminder English',
      content: 'Appointment Reminder: Visit {facility} on {date} at {time}. Bring ID and previous reports. Dr.CureCast',
      variables: ['facility', 'date', 'time'],
      language: 'en'
    });

    // Emergency Alerts
    this.templates.set('emergency_alert_en', {
      id: 'emergency_alert_en',
      name: 'Emergency Alert English',
      content: 'EMERGENCY: {message}. Dial 108 for ambulance. Nearest hospital: {hospital}. Dr.CureCast',
      variables: ['message', 'hospital'],
      language: 'en'
    });
  }

  /**
   * Send SMS message
   */
  async sendSMS(to: string, message: string, language: string = 'en'): Promise<boolean> {
    try {
      // Remove country code if present and format phone number
      const phoneNumber = this.formatPhoneNumber(to);
      
      const formData = new FormData();
      formData.append('apikey', this.apiKey);
      formData.append('numbers', phoneNumber);
      formData.append('message', message);
      formData.append('sender', this.senderId);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`SMS API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        console.log('SMS sent successfully:', result);
        return true;
      } else {
        console.error('SMS sending failed:', result);
        return false;
      }
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }

  /**
   * Send templated SMS
   */
  async sendTemplatedSMS(to: string, templateId: string, variables: Record<string, string>): Promise<boolean> {
    const template = this.templates.get(templateId);
    if (!template) {
      console.error(`Template ${templateId} not found`);
      return false;
    }

    let message = template.content;
    
    // Replace variables in template
    template.variables.forEach(variable => {
      const value = variables[variable] || '';
      message = message.replace(`{${variable}}`, value);
    });

    return await this.sendSMS(to, message, template.language);
  }

  /**
   * Send health education SMS
   */
  async sendHealthEducation(to: string, tip: string, language: string = 'en'): Promise<boolean> {
    const templateId = `health_tip_${language}`;
    return await this.sendTemplatedSMS(to, templateId, { tip });
  }

  /**
   * Send vaccination reminder
   */
  async sendVaccinationReminder(to: string, vaccine: string, date: string, location: string, language: string = 'en'): Promise<boolean> {
    const templateId = `vaccine_reminder_${language}`;
    return await this.sendTemplatedSMS(to, templateId, { vaccine, date, location });
  }

  /**
   * Send outbreak alert
   */
  async sendOutbreakAlert(to: string, disease: string, location: string, measures: string, language: string = 'en'): Promise<boolean> {
    const templateId = `outbreak_alert_${language}`;
    return await this.sendTemplatedSMS(to, templateId, { disease, location, measures });
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(to: string, facility: string, date: string, time: string, language: string = 'en'): Promise<boolean> {
    const templateId = `appointment_reminder_${language}`;
    return await this.sendTemplatedSMS(to, templateId, { facility, date, time });
  }

  /**
   * Send emergency alert
   */
  async sendEmergencyAlert(to: string, message: string, hospital: string, language: string = 'en'): Promise<boolean> {
    const templateId = `emergency_alert_${language}`;
    return await this.sendTemplatedSMS(to, templateId, { message, hospital });
  }

  /**
   * Send bulk SMS to multiple recipients
   */
  async sendBulkSMS(phoneNumbers: string[], message: string, language: string = 'en'): Promise<{ success: number; failed: number }> {
    const results = await Promise.allSettled(
      phoneNumbers.map(phone => this.sendSMS(phone, message, language))
    );

    const success = results.filter(result => result.status === 'fulfilled' && result.value === true).length;
    const failed = results.length - success;

    console.log(`Bulk SMS results: ${success} successful, ${failed} failed`);
    return { success, failed };
  }

  /**
   * Send health survey SMS
   */
  async sendHealthSurvey(to: string, surveyUrl: string, language: string = 'en'): Promise<boolean> {
    const message = language === 'hi'
      ? `डॉ.क्योरकास्ट स्वास्थ्य सर्वेक्षण: कृपया इस लिंक पर जाकर सर्वेक्षण भरें: ${surveyUrl} आपकी जानकारी गोपनीय रहेगी।`
      : `Dr.CureCast Health Survey: Please fill out this survey to help us serve you better: ${surveyUrl} Your information will remain confidential.`;

    return await this.sendSMS(to, message, language);
  }

  /**
   * Send medication reminder
   */
  async sendMedicationReminder(to: string, medication: string, dosage: string, time: string, language: string = 'en'): Promise<boolean> {
    const message = language === 'hi'
      ? `दवा अनुस्मारक: ${medication} ${dosage} ${time} बजे लें। नियमित सेवन जरूरी है। डॉ.क्योरकास्ट`
      : `Medication Reminder: Take ${medication} ${dosage} at ${time}. Regular intake is important. Dr.CureCast`;

    return await this.sendSMS(to, message, language);
  }

  /**
   * Format phone number for SMS gateway
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with country code, remove it
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = cleaned.substring(2);
    }
    
    // Ensure it's a valid 10-digit Indian mobile number
    if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
      return cleaned;
    }
    
    throw new Error(`Invalid phone number format: ${phone}`);
  }

  /**
   * Get SMS delivery status
   */
  async getSMSStatus(messageId: string): Promise<string> {
    try {
      const response = await fetch(`https://api.textlocal.in/get_delivery_receipt.php?apikey=${this.apiKey}&msgid=${messageId}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.status || 'unknown';
      }
      
      return 'failed';
    } catch (error) {
      console.error('Failed to get SMS status:', error);
      return 'error';
    }
  }

  /**
   * Send interactive SMS with options
   */
  async sendInteractiveSMS(to: string, question: string, options: string[], language: string = 'en'): Promise<boolean> {
    const optionsList = options.map((option, index) => `${index + 1}. ${option}`).join('\n');
    
    const message = language === 'hi'
      ? `${question}\n\n${optionsList}\n\nउत्तर के लिए संख्या भेजें। डॉ.क्योरकास्ट`
      : `${question}\n\n${optionsList}\n\nReply with the number of your choice. Dr.CureCast`;

    return await this.sendSMS(to, message, language);
  }

  /**
   * Send health facility information
   */
  async sendHealthFacilityInfo(to: string, facilities: Array<{name: string, distance: string, phone: string}>, language: string = 'en'): Promise<boolean> {
    const facilityList = facilities.map(f => `${f.name} (${f.distance}) - ${f.phone}`).join('\n');
    
    const message = language === 'hi'
      ? `नजदीकी स्वास्थ्य केंद्र:\n${facilityList}\nआपातकाल: 108 डायल करें। डॉ.क्योरकास्ट`
      : `Nearby Health Facilities:\n${facilityList}\nEmergency: Dial 108. Dr.CureCast`;

    return await this.sendSMS(to, message, language);
  }

  /**
   * Get available templates
   */
  getAvailableTemplates(): SMSTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Add custom template
   */
  addTemplate(template: SMSTemplate): void {
    this.templates.set(template.id, template);
  }
}

export const smsService = new SMSService();
export default smsService;
