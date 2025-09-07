import { Language, DrCurecastUser, VaccinationReminder } from '../types';
import { languageService } from './languageService';

// Communication service for WhatsApp, SMS, and other messaging platforms
export class CommunicationService {
  private static instance: CommunicationService;
  private whatsappApiUrl = 'https://graph.facebook.com/v18.0';
  private smsApiUrl = 'https://api.textlocal.in/send/';
  
  public static getInstance(): CommunicationService {
    if (!CommunicationService.instance) {
      CommunicationService.instance = new CommunicationService();
    }
    return CommunicationService.instance;
  }

  /**
   * Send WhatsApp message for health reminders
   */
  async sendWhatsAppHealthReminder(
    phoneNumber: string,
    message: string,
    language: Language,
    templateType: 'vaccination' | 'checkup' | 'medication' | 'emergency' = 'vaccination'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const accessToken = process.env.REACT_APP_WHATSAPP_ACCESS_TOKEN;
      const phoneNumberId = process.env.REACT_APP_WHATSAPP_PHONE_NUMBER_ID;

      if (!accessToken || !phoneNumberId) {
        throw new Error('WhatsApp API credentials not configured');
      }

      // Format phone number (remove + and ensure country code)
      const formattedPhone = phoneNumber.replace(/\+/g, '').replace(/\s/g, '');

      // Get template based on type and language
      const template = await this.getWhatsAppTemplate(templateType, language);
      
      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: template.name,
          language: {
            code: this.getWhatsAppLanguageCode(language)
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: message
                }
              ]
            }
          ]
        }
      };

      const response = await fetch(`${this.whatsappApiUrl}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          messageId: result.messages[0].id
        };
      } else {
        throw new Error(result.error?.message || 'WhatsApp API error');
      }

    } catch (error) {
      console.error('WhatsApp send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send SMS for health reminders
   */
  async sendSMSHealthReminder(
    phoneNumber: string,
    message: string,
    language: Language
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const apiKey = process.env.REACT_APP_SMS_API_KEY;
      const senderId = process.env.REACT_APP_SMS_SENDER_ID || 'DRCURE';

      if (!apiKey) {
        throw new Error('SMS API credentials not configured');
      }

      // Translate message if needed
      const translatedMessage = language !== 'english' 
        ? await languageService.translateText(message, 'english', language)
        : message;

      // Format phone number for Indian SMS
      const formattedPhone = phoneNumber.startsWith('+91') 
        ? phoneNumber.substring(3) 
        : phoneNumber.replace(/\+/g, '');

      const payload = new URLSearchParams({
        apikey: apiKey,
        numbers: formattedPhone,
        message: translatedMessage,
        sender: senderId,
        unicode: this.requiresUnicode(language) ? '1' : '0'
      });

      const response = await fetch(this.smsApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: payload
      });

      const result = await response.json();

      if (result.status === 'success') {
        return {
          success: true,
          messageId: result.batch_id
        };
      } else {
        throw new Error(result.errors?.[0]?.message || 'SMS API error');
      }

    } catch (error) {
      console.error('SMS send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send vaccination reminder via preferred communication method
   */
  async sendVaccinationReminder(
    user: DrCurecastUser,
    reminder: VaccinationReminder,
    method: 'whatsapp' | 'sms' | 'both' = 'both'
  ): Promise<{ whatsapp?: any; sms?: any }> {
    const results: any = {};

    const message = await this.formatVaccinationMessage(reminder, user.language);

    if (method === 'whatsapp' || method === 'both') {
      results.whatsapp = await this.sendWhatsAppHealthReminder(
        user.phoneNumber,
        message,
        user.language,
        'vaccination'
      );
    }

    if (method === 'sms' || method === 'both') {
      results.sms = await this.sendSMSHealthReminder(
        user.phoneNumber,
        message,
        user.language
      );
    }

    return results;
  }

  /**
   * Send emergency health alert
   */
  async sendEmergencyAlert(
    phoneNumber: string,
    alertMessage: string,
    language: Language,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<{ success: boolean; channels: string[] }> {
    const results = [];
    const channels = [];

    // For critical alerts, use both WhatsApp and SMS
    if (severity === 'critical') {
      const whatsappResult = await this.sendWhatsAppHealthReminder(
        phoneNumber,
        alertMessage,
        language,
        'emergency'
      );
      
      const smsResult = await this.sendSMSHealthReminder(
        phoneNumber,
        alertMessage,
        language
      );

      results.push(whatsappResult.success, smsResult.success);
      if (whatsappResult.success) channels.push('WhatsApp');
      if (smsResult.success) channels.push('SMS');
    } else {
      // For other alerts, prefer WhatsApp
      const whatsappResult = await this.sendWhatsAppHealthReminder(
        phoneNumber,
        alertMessage,
        language,
        'emergency'
      );

      results.push(whatsappResult.success);
      if (whatsappResult.success) channels.push('WhatsApp');
    }

    return {
      success: results.some(result => result),
      channels
    };
  }

  /**
   * Setup WhatsApp webhook for receiving messages
   */
  async setupWhatsAppWebhook(): Promise<{ success: boolean; webhookUrl?: string }> {
    // This would typically be done on the server side
    const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`;
    
    return {
      success: true,
      webhookUrl
    };
  }

  /**
   * Handle incoming WhatsApp messages
   */
  async handleIncomingWhatsAppMessage(webhookData: any): Promise<void> {
    try {
      const message = webhookData.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      
      if (message) {
        const phoneNumber = message.from;
        const messageText = message.text?.body;
        const messageType = message.type;

        // Process the incoming message
        console.log('Incoming WhatsApp message:', {
          from: phoneNumber,
          text: messageText,
          type: messageType
        });

        // In a real implementation, this would:
        // 1. Identify the user
        // 2. Process the message through Dr.Curecast
        // 3. Send appropriate response
      }
    } catch (error) {
      console.error('Error handling WhatsApp message:', error);
    }
  }

  /**
   * Get WhatsApp template for different message types
   */
  private async getWhatsAppTemplate(
    type: 'vaccination' | 'checkup' | 'medication' | 'emergency',
    language: Language
  ): Promise<{ name: string; category: string }> {
    const templates = {
      vaccination: {
        name: 'vaccination_reminder',
        category: 'UTILITY'
      },
      checkup: {
        name: 'health_checkup_reminder',
        category: 'UTILITY'
      },
      medication: {
        name: 'medication_reminder',
        category: 'UTILITY'
      },
      emergency: {
        name: 'emergency_health_alert',
        category: 'UTILITY'
      }
    };

    return templates[type];
  }

  /**
   * Get WhatsApp language code
   */
  private getWhatsAppLanguageCode(language: Language): string {
    const languageCodes: Record<Language, string> = {
      english: 'en',
      hindi: 'hi',
      bengali: 'bn',
      telugu: 'te',
      tamil: 'ta',
      marathi: 'mr',
      kannada: 'kn',
      malayalam: 'ml',
      gujarati: 'gu',
      punjabi: 'pa',
      urdu: 'ur',
      odia: 'or',
      assamese: 'as',
      spanish: 'es',
      french: 'fr',
      german: 'de',
      arabic: 'ar',
      chinese: 'zh',
      japanese: 'ja',
      russian: 'ru',
      portuguese: 'pt'
    };

    return languageCodes[language] || 'en';
  }

  /**
   * Check if language requires Unicode encoding for SMS
   */
  private requiresUnicode(language: Language): boolean {
    const unicodeLanguages: Language[] = [
      'hindi', 'bengali', 'telugu', 'tamil', 'marathi', 
      'kannada', 'malayalam', 'gujarati', 'punjabi', 
      'urdu', 'odia', 'assamese', 'arabic', 'chinese', 
      'japanese', 'russian'
    ];

    return unicodeLanguages.includes(language);
  }

  /**
   * Format vaccination reminder message
   */
  private async formatVaccinationMessage(
    reminder: VaccinationReminder,
    language: Language
  ): Promise<string> {
    const baseMessage = `🏥 Dr.Curecast Vaccination Reminder

📅 Date: ${new Date(reminder.reminderDate).toLocaleDateString()}
💉 Vaccine: ${reminder.message}

Please visit your nearest healthcare center for vaccination.

For more info: Call 104 or visit https://cowin.gov.in

Stay healthy! 🌟`;

    if (language !== 'english') {
      return await languageService.translateText(baseMessage, 'english', language);
    }

    return baseMessage;
  }

  /**
   * Get communication preferences for user
   */
  async getCommunicationPreferences(userId: string): Promise<{
    whatsappEnabled: boolean;
    smsEnabled: boolean;
    preferredMethod: 'whatsapp' | 'sms' | 'both';
    emergencyOnly: boolean;
  }> {
    // In a real implementation, this would fetch from user preferences
    return {
      whatsappEnabled: true,
      smsEnabled: true,
      preferredMethod: 'whatsapp',
      emergencyOnly: false
    };
  }

  /**
   * Update communication preferences
   */
  async updateCommunicationPreferences(
    userId: string,
    preferences: {
      whatsappEnabled?: boolean;
      smsEnabled?: boolean;
      preferredMethod?: 'whatsapp' | 'sms' | 'both';
      emergencyOnly?: boolean;
    }
  ): Promise<{ success: boolean }> {
    // In a real implementation, this would update user preferences in database
    console.log('Updating communication preferences for user:', userId, preferences);
    return { success: true };
  }
}

export const communicationService = CommunicationService.getInstance();
