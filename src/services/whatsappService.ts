/**
 * WhatsApp Business API Integration Service
 * Enables chatbot communication via WhatsApp for rural populations
 */

interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: string;
  type: 'text' | 'image' | 'audio' | 'document';
  language?: string;
  messageId?: string;
}

interface WhatsAppTemplate {
  name: string;
  language: string;
  components: Array<{
    type: 'header' | 'body' | 'footer' | 'button';
    parameters?: Array<{ type: string; text: string }>;
  }>;
}

interface OutbreakAlert {
  id: string;
  disease: string;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  preventiveMeasures: string[];
  timestamp: string;
}

class WhatsAppService {
  private accessToken: string;
  private phoneNumberId: string;
  private baseUrl: string = 'https://graph.facebook.com/v18.0';
  private webhookVerifyToken: string;

  constructor() {
    this.accessToken = process.env.REACT_APP_WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.REACT_APP_WHATSAPP_PHONE_NUMBER_ID || '';
    this.webhookVerifyToken = process.env.REACT_APP_WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'dr_curecast_webhook_2024';
  }

  /**
   * Send text message via WhatsApp
   */
  async sendMessage(to: string, message: string, language: string = 'en'): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: {
            body: message,
            preview_url: false
          }
        })
      });

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('WhatsApp message sent:', result);
      return true;
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      return false;
    }
  }

  /**
   * Send template message (for outbreak alerts)
   */
  async sendTemplateMessage(to: string, template: WhatsAppTemplate): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'template',
          template: template
        })
      });

      if (!response.ok) {
        throw new Error(`WhatsApp template API error: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to send WhatsApp template:', error);
      return false;
    }
  }

  /**
   * Send outbreak alert to multiple users
   */
  async sendOutbreakAlert(alert: OutbreakAlert, phoneNumbers: string[]): Promise<void> {
    const template: WhatsAppTemplate = {
      name: 'outbreak_alert',
      language: 'en',
      components: [
        {
          type: 'header',
          parameters: [{ type: 'text', text: `🚨 ${alert.disease} Alert` }]
        },
        {
          type: 'body',
          parameters: [
            { type: 'text', text: alert.location },
            { type: 'text', text: alert.description },
            { type: 'text', text: alert.preventiveMeasures.join(', ') }
          ]
        }
      ]
    };

    const promises = phoneNumbers.map(phone => 
      this.sendTemplateMessage(phone, template)
    );

    try {
      await Promise.all(promises);
      console.log(`Outbreak alert sent to ${phoneNumbers.length} users`);
    } catch (error) {
      console.error('Failed to send outbreak alerts:', error);
    }
  }

  /**
   * Send health education content
   */
  async sendHealthEducation(to: string, topic: string, content: string, language: string = 'en'): Promise<boolean> {
    const educationMessage = `🏥 *Health Education: ${topic}*\n\n${content}\n\n📞 For more information, reply with "HELP" or visit your nearest health center.`;
    
    return await this.sendMessage(to, educationMessage, language);
  }

  /**
   * Send vaccination reminder
   */
  async sendVaccinationReminder(to: string, vaccineName: string, dueDate: string, location: string, language: string = 'en'): Promise<boolean> {
    const reminderMessage = `💉 *Vaccination Reminder*\n\nVaccine: ${vaccineName}\nDue Date: ${dueDate}\nLocation: ${location}\n\nPlease visit the vaccination center on time. Reply "RESCHEDULE" if you need to change the date.`;
    
    return await this.sendMessage(to, reminderMessage, language);
  }

  /**
   * Process incoming webhook messages
   */
  async processIncomingMessage(webhookData: any): Promise<WhatsAppMessage | null> {
    try {
      const entry = webhookData.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages;

      if (!messages || messages.length === 0) {
        return null;
      }

      const message = messages[0];
      
      return {
        id: message.id,
        from: message.from,
        to: value.metadata?.phone_number_id || '',
        text: message.text?.body || '',
        timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
        type: message.type || 'text',
        messageId: message.id
      };
    } catch (error) {
      console.error('Failed to process incoming WhatsApp message:', error);
      return null;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.webhookVerifyToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Send interactive button message
   */
  async sendInteractiveMessage(to: string, bodyText: string, buttons: Array<{id: string, title: string}>): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: {
              text: bodyText
            },
            action: {
              buttons: buttons.map(btn => ({
                type: 'reply',
                reply: {
                  id: btn.id,
                  title: btn.title
                }
              }))
            }
          }
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send interactive WhatsApp message:', error);
      return false;
    }
  }

  /**
   * Send health assessment questionnaire
   */
  async sendHealthAssessment(to: string, language: string = 'en'): Promise<boolean> {
    const buttons = [
      { id: 'symptoms_fever', title: '🤒 Fever' },
      { id: 'symptoms_cough', title: '😷 Cough' },
      { id: 'symptoms_other', title: '🏥 Other Symptoms' }
    ];

    const bodyText = language === 'hi' 
      ? 'आपको कौन से लक्षण हैं? कृपया नीचे से चुनें:'
      : 'What symptoms are you experiencing? Please select from below:';

    return await this.sendInteractiveMessage(to, bodyText, buttons);
  }

  /**
   * Get message delivery status
   */
  async getMessageStatus(messageId: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.status || 'unknown';
      }
      
      return 'failed';
    } catch (error) {
      console.error('Failed to get message status:', error);
      return 'error';
    }
  }

  /**
   * Send location-based health facility information
   */
  async sendNearbyHealthFacilities(to: string, latitude: number, longitude: number, language: string = 'en'): Promise<boolean> {
    // Mock data - in production, integrate with Google Maps API or government health facility database
    const facilities = [
      { name: 'Primary Health Center', distance: '2.5 km', phone: '+91-XXXXXXXXXX' },
      { name: 'Community Health Center', distance: '5.1 km', phone: '+91-XXXXXXXXXX' },
      { name: 'District Hospital', distance: '12.3 km', phone: '+91-XXXXXXXXXX' }
    ];

    const facilityList = facilities.map(f => 
      `📍 ${f.name}\n   Distance: ${f.distance}\n   Phone: ${f.phone}`
    ).join('\n\n');

    const message = language === 'hi'
      ? `🏥 *आपके नजदीकी स्वास्थ्य केंद्र:*\n\n${facilityList}\n\nआपातकाल के लिए 108 डायल करें।`
      : `🏥 *Nearby Health Facilities:*\n\n${facilityList}\n\nFor emergencies, dial 108.`;

    return await this.sendMessage(to, message, language);
  }
}

export const whatsappService = new WhatsAppService();
export default whatsappService;
