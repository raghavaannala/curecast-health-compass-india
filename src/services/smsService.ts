import { 
  SMSMessage, 
  ChatbotMessage, 
  ChatbotSession, 
  Language 
} from '../types';
import { multilingualChatbotService } from './multilingualChatbotService';
import { languageService } from './languageService';
import axios from 'axios';

/**
 * SMS Gateway Integration Service
 * Handles SMS messaging for rural populations with feature phones
 */
export class SMSService {
  private static instance: SMSService;
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly senderId: string;
  private activeSessions: Map<string, string> = new Map(); // phoneNumber -> sessionId
  private readonly maxSMSLength = 160; // Standard SMS length
  private readonly maxConcatenatedSMS = 3; // Maximum parts for long messages

  public static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService();
    }
    return SMSService.instance;
  }

  constructor() {
    // Configure SMS gateway (using Twilio as example, can be adapted for Indian providers like TextLocal, MSG91, etc.)
    this.apiUrl = process.env.REACT_APP_SMS_API_URL || 'https://api.twilio.com/2010-04-01';
    this.apiKey = process.env.REACT_APP_SMS_API_KEY || '';
    this.senderId = process.env.REACT_APP_SMS_SENDER_ID || 'HEALTH';
  }

  /**
   * Process incoming SMS message
   */
  async processIncomingSMS(
    phoneNumber: string,
    messageBody: string,
    messageId?: string
  ): Promise<void> {
    try {
      // Clean and normalize phone number
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      
      // Get or create session
      let sessionId = this.activeSessions.get(normalizedPhone);
      
      // Process message through chatbot
      const result = await multilingualChatbotService.processMessage(
        normalizedPhone,
        messageBody,
        'sms',
        sessionId
      );

      // Update session mapping
      this.activeSessions.set(normalizedPhone, result.session.id);

      // Send response via SMS
      await this.sendResponse(normalizedPhone, result.response);

      // Handle escalation
      if (result.escalated) {
        await this.handleEscalation(normalizedPhone, result.session);
      }

    } catch (error) {
      console.error('Error processing incoming SMS:', error);
      
      // Send fallback message
      await this.sendSMS(
        phoneNumber,
        'Sorry, we are experiencing technical difficulties. Please try again later or call our helpline: 104'
      );
    }
  }

  /**
   * Send SMS response
   */
  private async sendResponse(phoneNumber: string, response: ChatbotMessage): Promise<void> {
    try {
      let messageText = response.content;

      // Add options for buttons/quick replies in SMS format
      if (response.buttons && response.buttons.length > 0) {
        messageText += '\n\nOptions:';
        response.buttons.forEach((button, index) => {
          messageText += `\n${index + 1}. ${button.title}`;
        });
        messageText += '\n\nReply with option number (1, 2, etc.)';
      } else if (response.quickReplies && response.quickReplies.length > 0) {
        messageText += '\n\nQuick replies:';
        response.quickReplies.forEach((reply, index) => {
          messageText += `\n${index + 1}. ${reply.title}`;
        });
        messageText += '\n\nReply with option number';
      }

      await this.sendSMS(phoneNumber, messageText);

    } catch (error) {
      console.error('Error sending SMS response:', error);
    }
  }

  /**
   * Send SMS message
   */
  async sendSMS(
    phoneNumber: string,
    message: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      
      // Split long messages if necessary
      const messageParts = this.splitMessage(message);
      
      if (messageParts.length > this.maxConcatenatedSMS) {
        // Message too long, truncate
        const truncatedMessage = message.substring(0, this.maxSMSLength * this.maxConcatenatedSMS - 50) + '... (continued)';
        messageParts.splice(0, messageParts.length, truncatedMessage);
      }

      const results = [];
      
      for (let i = 0; i < messageParts.length; i++) {
        const part = messageParts[i];
        const partMessage = messageParts.length > 1 ? `(${i + 1}/${messageParts.length}) ${part}` : part;
        
        const result = await this.sendSingleSMS(normalizedPhone, partMessage, priority);
        results.push(result);
        
        // Add delay between parts to ensure proper delivery order
        if (i < messageParts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const allSuccessful = results.every(r => r.success);
      return {
        success: allSuccessful,
        messageId: results[0].messageId,
        error: allSuccessful ? undefined : 'Some message parts failed to send'
      };

    } catch (error) {
      console.error('Error sending SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send single SMS message
   */
  private async sendSingleSMS(
    phoneNumber: string,
    message: string,
    priority: 'low' | 'medium' | 'high'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Example implementation for Twilio
      // Adapt this for Indian SMS providers like TextLocal, MSG91, etc.
      
      const response = await axios.post(
        `${this.apiUrl}/Accounts/${process.env.REACT_APP_TWILIO_ACCOUNT_SID}/Messages.json`,
        new URLSearchParams({
          To: phoneNumber,
          From: this.senderId,
          Body: message
        }),
        {
          auth: {
            username: process.env.REACT_APP_TWILIO_ACCOUNT_SID || '',
            password: this.apiKey
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.sid
      };

    } catch (error: any) {
      console.error('Error sending single SMS:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Send health alert via SMS
   */
  async sendHealthAlert(
    phoneNumbers: string[],
    alert: {
      title: string;
      message: string;
      language: Language;
      urgency: 'low' | 'medium' | 'high' | 'critical';
    }
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    try {
      const alertMessage = `🚨 HEALTH ALERT\n${alert.title}\n\n${alert.message}\n\nFor more info call: 104`;
      
      for (const phoneNumber of phoneNumbers) {
        try {
          const result = await this.sendSMS(phoneNumber, alertMessage, 'high');
          if (result.success) {
            sent++;
          } else {
            failed++;
          }
          
          // Rate limiting - delay between messages
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.error(`Failed to send alert to ${phoneNumber}:`, error);
          failed++;
        }
      }

    } catch (error) {
      console.error('Error sending health alerts:', error);
    }

    return { sent, failed };
  }

  /**
   * Send vaccination reminder via SMS
   */
  async sendVaccinationReminder(
    phoneNumber: string,
    reminder: {
      childName?: string;
      vaccineName: string;
      dueDate: string;
      location: string;
      language: Language;
    }
  ): Promise<boolean> {
    try {
      const message = await this.formatVaccinationReminder(reminder);
      const result = await this.sendSMS(phoneNumber, message, 'medium');
      return result.success;
    } catch (error) {
      console.error('Error sending vaccination reminder:', error);
      return false;
    }
  }

  /**
   * Format vaccination reminder message
   */
  private async formatVaccinationReminder(reminder: any): Promise<string> {
    const templates = {
      english: `💉 VACCINATION REMINDER\n${reminder.childName ? `Child: ${reminder.childName}\n` : ''}Vaccine: ${reminder.vaccineName}\nDue: ${reminder.dueDate}\nLocation: ${reminder.location}\n\nPlease visit on time. Reply STOP to unsubscribe.`,
      
      hindi: `💉 टीकाकरण अनुस्मारक\n${reminder.childName ? `बच्चा: ${reminder.childName}\n` : ''}टीका: ${reminder.vaccineName}\nतारीख: ${reminder.dueDate}\nस्थान: ${reminder.location}\n\nकृपया समय पर जाएं। STOP भेजकर बंद करें।`,
      
      telugu: `💉 వ్యాక్సినేషన్ రిమైండర్\n${reminder.childName ? `పిల్లవాడు: ${reminder.childName}\n` : ''}వ్యాక్సిన్: ${reminder.vaccineName}\nతేదీ: ${reminder.dueDate}\nస్థలం: ${reminder.location}\n\nసమయానికి వెళ్లండి। STOP పంపి ఆపండి।`,
      
      tamil: `💉 தடுப்பூசி நினைவூட்டல்\n${reminder.childName ? `குழந்தை: ${reminder.childName}\n` : ''}தடுப்பூசி: ${reminder.vaccineName}\nதேதி: ${reminder.dueDate}\nஇடம்: ${reminder.location}\n\nசரியான நேரத்தில் வாருங்கள். STOP அனுப்பி நிறுத்துங்கள்।`,
      
      bengali: `💉 টিকাদান অনুস্মারক\n${reminder.childName ? `শিশু: ${reminder.childName}\n` : ''}টিকা: ${reminder.vaccineName}\nতারিখ: ${reminder.dueDate}\nস্থান: ${reminder.location}\n\nসময়মতো যান। STOP পাঠিয়ে বন্ধ করুন।`
    };

    return templates[reminder.language] || templates.english;
  }

  /**
   * Handle opt-out requests (STOP, UNSUBSCRIBE, etc.)
   */
  async handleOptOut(phoneNumber: string, message: string): Promise<boolean> {
    const optOutKeywords = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'];
    const messageUpper = message.toUpperCase().trim();
    
    if (optOutKeywords.includes(messageUpper)) {
      try {
        // Update user preferences in database
        await this.updateUserPreferences(phoneNumber, { smsNotifications: false });
        
        // Send confirmation
        await this.sendSMS(
          phoneNumber,
          'You have been unsubscribed from health notifications. Reply START to resubscribe. For emergencies, call 108.'
        );
        
        return true;
      } catch (error) {
        console.error('Error handling opt-out:', error);
      }
    }
    
    return false;
  }

  /**
   * Handle opt-in requests (START, SUBSCRIBE, etc.)
   */
  async handleOptIn(phoneNumber: string, message: string): Promise<boolean> {
    const optInKeywords = ['START', 'SUBSCRIBE', 'YES', 'JOIN'];
    const messageUpper = message.toUpperCase().trim();
    
    if (optInKeywords.includes(messageUpper)) {
      try {
        // Update user preferences in database
        await this.updateUserPreferences(phoneNumber, { smsNotifications: true });
        
        // Send welcome message
        await this.sendSMS(
          phoneNumber,
          'Welcome to Health SMS service! You will receive important health updates. Reply STOP to unsubscribe. For help, reply HELP.'
        );
        
        return true;
      } catch (error) {
        console.error('Error handling opt-in:', error);
      }
    }
    
    return false;
  }

  /**
   * Send help information
   */
  async sendHelpInfo(phoneNumber: string, language: Language = 'english'): Promise<void> {
    const helpMessages = {
      english: `HEALTH SMS HELP\n\nCommands:\n• HELP - This message\n• STOP - Unsubscribe\n• START - Subscribe\n• VACCINE - Vaccination info\n• SYMPTOMS - Check symptoms\n\nEmergency: 108\nHealthline: 104`,
      
      hindi: `स्वास्थ्य SMS सहायता\n\nकमांड:\n• HELP - यह संदेश\n• STOP - बंद करें\n• START - शुरू करें\n• VACCINE - टीकाकरण जानकारी\n• SYMPTOMS - लक्षण जांच\n\nआपातकाल: 108\nहेल्पलाइन: 104`,
      
      telugu: `హెల్త్ SMS సహాయం\n\nకమాండ్స్:\n• HELP - ఈ సందేశం\n• STOP - ఆపండి\n• START - ప్రారంభించండి\n• VACCINE - వ్యాక్సిన్ సమాచారం\n• SYMPTOMS - లక్షణాలు తనిఖీ\n\nఅత్యవసరం: 108\nహెల్ప్‌లైన్: 104`
    };

    const message = helpMessages[language] || helpMessages.english;
    await this.sendSMS(phoneNumber, message);
  }

  /**
   * Handle escalation to human health worker
   */
  private async handleEscalation(phoneNumber: string, session: ChatbotSession): Promise<void> {
    try {
      const escalationMessage = await this.getEscalationMessage(session.language);
      await this.sendSMS(phoneNumber, escalationMessage);
      
      // Notify health worker (implementation depends on system)
      if (session.healthWorkerAssigned) {
        await this.notifyHealthWorker(session.healthWorkerAssigned, session);
      }
      
    } catch (error) {
      console.error('Error handling SMS escalation:', error);
    }
  }

  /**
   * Get escalation message in user's language
   */
  private async getEscalationMessage(language: Language): Promise<string> {
    const messages = {
      english: 'Connecting you with health professional. You may receive a call shortly. For immediate help: 108',
      hindi: 'स्वास्थ्य पेशेवर से जोड़ रहे हैं। जल्द ही कॉल आ सकती है। तत्काल सहायता: 108',
      telugu: 'ఆరోగ్య నిపుణుడితో కనెక్ట్ చేస్తున్నాం। త్వరలో కాల్ రావచ్చు। తక్షణ సహాయం: 108',
      tamil: 'சுகாதார நிபுணருடன் இணைக்கிறோம். விரைவில் அழைப்பு வரலாம். உடனடி உதவி: 108',
      bengali: 'স্বাস্থ্য পেশাদারের সাথে সংযোগ করছি। শীঘ্রই কল আসতে পারে। তাৎক্ষণিক সাহায্য: 108'
    };

    return messages[language] || messages.english;
  }

  /**
   * Notify health worker about escalation
   */
  private async notifyHealthWorker(workerId: string, session: ChatbotSession): Promise<void> {
    // This would integrate with health worker notification system
    console.log(`SMS escalation notification sent to health worker ${workerId} for session ${session.id}`);
  }

  /**
   * Split long message into SMS-sized parts
   */
  private splitMessage(message: string): string[] {
    if (message.length <= this.maxSMSLength) {
      return [message];
    }

    const parts: string[] = [];
    let remaining = message;

    while (remaining.length > 0) {
      let part = remaining.substring(0, this.maxSMSLength);
      
      // Try to break at word boundary
      if (remaining.length > this.maxSMSLength) {
        const lastSpace = part.lastIndexOf(' ');
        if (lastSpace > this.maxSMSLength * 0.8) { // Only break at word if it's not too far back
          part = part.substring(0, lastSpace);
        }
      }
      
      parts.push(part);
      remaining = remaining.substring(part.length).trim();
    }

    return parts;
  }

  /**
   * Normalize phone number format
   */
  private normalizePhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let normalized = phoneNumber.replace(/\D/g, '');
    
    // Add country code if missing (assuming India +91)
    if (normalized.length === 10) {
      normalized = '91' + normalized;
    }
    
    // Add + prefix
    if (!normalized.startsWith('+')) {
      normalized = '+' + normalized;
    }
    
    return normalized;
  }

  /**
   * Update user preferences (placeholder - would integrate with database)
   */
  private async updateUserPreferences(phoneNumber: string, preferences: any): Promise<void> {
    // This would update user preferences in the database
    console.log(`Updated preferences for ${phoneNumber}:`, preferences);
  }

  /**
   * Get delivery status of SMS
   */
  async getDeliveryStatus(messageId: string): Promise<{
    status: 'sent' | 'delivered' | 'failed' | 'unknown';
    timestamp?: string;
  }> {
    try {
      // Implementation depends on SMS provider
      // This is a placeholder
      return { status: 'delivered', timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('Error getting delivery status:', error);
      return { status: 'unknown' };
    }
  }

  /**
   * Send bulk SMS for campaigns
   */
  async sendBulkSMS(
    recipients: Array<{ phoneNumber: string; message: string; language?: Language }>,
    campaignName: string
  ): Promise<{ sent: number; failed: number; results: Array<{ phoneNumber: string; success: boolean; error?: string }> }> {
    let sent = 0;
    let failed = 0;
    const results: Array<{ phoneNumber: string; success: boolean; error?: string }> = [];

    for (const recipient of recipients) {
      try {
        const result = await this.sendSMS(recipient.phoneNumber, recipient.message, 'low');
        
        results.push({
          phoneNumber: recipient.phoneNumber,
          success: result.success,
          error: result.error
        });

        if (result.success) {
          sent++;
        } else {
          failed++;
        }

        // Rate limiting for bulk sends
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Bulk SMS failed for ${recipient.phoneNumber}:`, error);
        results.push({
          phoneNumber: recipient.phoneNumber,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        failed++;
      }
    }

    console.log(`Bulk SMS campaign "${campaignName}" completed: ${sent} sent, ${failed} failed`);
    
    return { sent, failed, results };
  }

  /**
   * Get active session for phone number
   */
  getActiveSession(phoneNumber: string): string | undefined {
    return this.activeSessions.get(this.normalizePhoneNumber(phoneNumber));
  }

  /**
   * End session for phone number
   */
  endSession(phoneNumber: string): void {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    const sessionId = this.activeSessions.get(normalizedPhone);
    if (sessionId) {
      multilingualChatbotService.endSession(sessionId);
      this.activeSessions.delete(normalizedPhone);
    }
  }
}

export const smsService = SMSService.getInstance();
