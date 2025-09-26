import { 
  WhatsAppMessage, 
  ChatbotMessage, 
  ChatbotSession, 
  Language,
  ChatbotButton,
  QuickReply 
} from '../types';
import { multilingualChatbotService } from './multilingualChatbotService';
import { languageService } from './languageService';
import axios from 'axios';

/**
 * WhatsApp Business API Integration Service
 * Handles WhatsApp messaging for the multilingual health chatbot
 */
export class WhatsAppService {
  private static instance: WhatsAppService;
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;
  private readonly verifyToken: string;
  private activeSessions: Map<string, string> = new Map(); // phoneNumber -> sessionId

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  constructor() {
    this.baseUrl = process.env.REACT_APP_WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
    this.accessToken = process.env.REACT_APP_WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.REACT_APP_WHATSAPP_PHONE_NUMBER_ID || '';
    this.verifyToken = process.env.REACT_APP_WHATSAPP_VERIFY_TOKEN || 'health_chatbot_verify_token';
  }

  /**
   * Handle incoming WhatsApp webhook
   */
  async handleWebhook(body: any): Promise<void> {
    try {
      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            if (change.field === 'messages') {
              await this.processIncomingMessage(change.value);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error handling WhatsApp webhook:', error);
    }
  }

  /**
   * Verify webhook
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.verifyToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Process incoming WhatsApp message
   */
  private async processIncomingMessage(value: any): Promise<void> {
    try {
      if (!value.messages || value.messages.length === 0) return;

      for (const message of value.messages) {
        const phoneNumber = message.from;
        const messageText = this.extractMessageText(message);
        
        if (!messageText) continue;

        // Mark message as read
        await this.markMessageAsRead(message.id);

        // Get or create session
        let sessionId = this.activeSessions.get(phoneNumber);
        
        // Process message through chatbot
        const result = await multilingualChatbotService.processMessage(
          phoneNumber,
          messageText,
          'whatsapp',
          sessionId
        );

        // Update session mapping
        this.activeSessions.set(phoneNumber, result.session.id);

        // Send response
        await this.sendResponse(phoneNumber, result.response);

        // Handle escalation
        if (result.escalated) {
          await this.handleEscalation(phoneNumber, result.session);
        }
      }
    } catch (error) {
      console.error('Error processing incoming WhatsApp message:', error);
    }
  }

  /**
   * Extract text from WhatsApp message
   */
  private extractMessageText(message: any): string | null {
    if (message.type === 'text') {
      return message.text.body;
    } else if (message.type === 'interactive') {
      if (message.interactive.type === 'button_reply') {
        return message.interactive.button_reply.title;
      } else if (message.interactive.type === 'list_reply') {
        return message.interactive.list_reply.title;
      }
    } else if (message.type === 'audio') {
      // Handle voice messages (would need speech-to-text integration)
      return '[Voice message received - please type your message]';
    }
    
    return null;
  }

  /**
   * Send response to WhatsApp user
   */
  private async sendResponse(phoneNumber: string, response: ChatbotMessage): Promise<void> {
    try {
      let messageData: any;

      if (response.buttons && response.buttons.length > 0) {
        // Send interactive button message
        messageData = this.createButtonMessage(phoneNumber, response);
      } else if (response.quickReplies && response.quickReplies.length > 0) {
        // Send interactive list message
        messageData = this.createListMessage(phoneNumber, response);
      } else {
        // Send simple text message
        messageData = this.createTextMessage(phoneNumber, response.content);
      }

      await this.sendMessage(messageData);

    } catch (error) {
      console.error('Error sending WhatsApp response:', error);
    }
  }

  /**
   * Create text message
   */
  private createTextMessage(phoneNumber: string, text: string): any {
    return {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: {
        body: text
      }
    };
  }

  /**
   * Create interactive button message
   */
  private createButtonMessage(phoneNumber: string, response: ChatbotMessage): any {
    const buttons = response.buttons!.slice(0, 3).map((button, index) => ({
      type: 'reply',
      reply: {
        id: button.id || `btn_${index}`,
        title: button.title.substring(0, 20) // WhatsApp limit
      }
    }));

    return {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: response.content
        },
        action: {
          buttons: buttons
        }
      }
    };
  }

  /**
   * Create interactive list message
   */
  private createListMessage(phoneNumber: string, response: ChatbotMessage): any {
    const rows = response.quickReplies!.slice(0, 10).map((reply, index) => ({
      id: reply.id || `option_${index}`,
      title: reply.title.substring(0, 24), // WhatsApp limit
      description: reply.title.length > 24 ? reply.title.substring(24, 72) : undefined
    }));

    return {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: {
          text: response.content
        },
        action: {
          button: 'Choose Option',
          sections: [
            {
              title: 'Options',
              rows: rows
            }
          ]
        }
      }
    };
  }

  /**
   * Send message via WhatsApp API
   */
  private async sendMessage(messageData: any): Promise<void> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status !== 200) {
        throw new Error(`WhatsApp API error: ${response.status}`);
      }

    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  private async markMessageAsRead(messageId: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  /**
   * Handle escalation to human health worker
   */
  private async handleEscalation(phoneNumber: string, session: ChatbotSession): Promise<void> {
    try {
      // Send escalation notification to health worker
      if (session.healthWorkerAssigned) {
        await this.notifyHealthWorker(session.healthWorkerAssigned, session);
      }

      // Send confirmation to user
      const escalationMessage = await this.getEscalationMessage(session.language);
      await this.sendMessage(this.createTextMessage(phoneNumber, escalationMessage));

    } catch (error) {
      console.error('Error handling escalation:', error);
    }
  }

  /**
   * Notify health worker about escalation
   */
  private async notifyHealthWorker(workerId: string, session: ChatbotSession): Promise<void> {
    // This would integrate with health worker notification system
    // For now, we'll log the escalation
    console.log(`Escalation notification sent to health worker ${workerId} for session ${session.id}`);
  }

  /**
   * Get escalation message in user's language
   */
  private async getEscalationMessage(language: Language): Promise<string> {
    const messages = {
      english: 'I\'m connecting you with a health professional who can better assist you. Please wait a moment.',
      hindi: 'मैं आपको एक स्वास्थ्य पेशेवर से जोड़ रहा हूं जो आपकी बेहतर सहायता कर सकते हैं। कृपया थोड़ा इंतजार करें।',
      telugu: 'నేను మిమ్మల్ని మంచి సహायం చేయగల ఆరోగ్య నిపుణుడితో కనెక్ట్ చేస్తున్నాను. దయచేసి కొద్దిసేపు వేచి ఉండండి।',
      tamil: 'உங்களுக்கு சிறந்த உதவி செய்யக்கூடிய ஒரு சுகாதார நிபுணருடன் உங்களை இணைக்கிறேன். தயவுசெய்து சிறிது காத்திருங்கள்.',
      bengali: 'আমি আপনাকে একজন স্বাস্থ্য পেশাদারের সাথে সংযুক্ত করছি যিনি আপনাকে আরও ভাল সহায়তা করতে পারবেন। দয়া করে একটু অপেক্ষা করুন।'
    };

    return messages[language] || messages.english;
  }

  /**
   * Send health alert to users
   */
  async sendHealthAlert(
    phoneNumbers: string[],
    alert: {
      title: string;
      message: string;
      language: Language;
      urgency: 'low' | 'medium' | 'high' | 'critical';
    }
  ): Promise<void> {
    try {
      for (const phoneNumber of phoneNumbers) {
        const messageData = this.createTextMessage(
          phoneNumber,
          `🚨 ${alert.title}\n\n${alert.message}`
        );

        await this.sendMessage(messageData);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error sending health alerts:', error);
    }
  }

  /**
   * Send vaccination reminder
   */
  async sendVaccinationReminder(
    phoneNumber: string,
    reminder: {
      vaccineName: string;
      dueDate: string;
      location: string;
      language: Language;
    }
  ): Promise<void> {
    try {
      const message = await this.formatVaccinationReminder(reminder);
      const messageData = this.createTextMessage(phoneNumber, message);
      await this.sendMessage(messageData);
    } catch (error) {
      console.error('Error sending vaccination reminder:', error);
    }
  }

  /**
   * Format vaccination reminder message
   */
  private async formatVaccinationReminder(reminder: any): Promise<string> {
    const templates = {
      english: `💉 Vaccination Reminder\n\nVaccine: ${reminder.vaccineName}\nDue Date: ${reminder.dueDate}\nLocation: ${reminder.location}\n\nPlease visit the vaccination center on time.`,
      hindi: `💉 टीकाकरण अनुस्मारक\n\nटीका: ${reminder.vaccineName}\nनियत तारीख: ${reminder.dueDate}\nस्थान: ${reminder.location}\n\nकृपया समय पर टीकाकरण केंद्र पर जाएं।`,
      telugu: `💉 వ్యాక్సినేషన్ రిమైండర్\n\nవ్యాక్సిన్: ${reminder.vaccineName}\nడ్యూ డేట్: ${reminder.dueDate}\nలొకేషన్: ${reminder.location}\n\nదయచేసి సమయానికి వ్యాక్సినేషన్ సెంటర్‌కు వెళ్లండి।`
    };

    return templates[reminder.language] || templates.english;
  }

  /**
   * Send media message (images, audio, etc.)
   */
  async sendMediaMessage(
    phoneNumber: string,
    mediaUrl: string,
    mediaType: 'image' | 'audio' | 'video' | 'document',
    caption?: string
  ): Promise<void> {
    try {
      const messageData = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: mediaType,
        [mediaType]: {
          link: mediaUrl,
          caption: caption
        }
      };

      await this.sendMessage(messageData);
    } catch (error) {
      console.error('Error sending media message:', error);
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(phoneNumber: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${phoneNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Send template message (for notifications)
   */
  async sendTemplateMessage(
    phoneNumber: string,
    templateName: string,
    languageCode: string,
    parameters?: string[]
  ): Promise<void> {
    try {
      const messageData = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          components: parameters ? [
            {
              type: 'body',
              parameters: parameters.map(param => ({
                type: 'text',
                text: param
              }))
            }
          ] : undefined
        }
      };

      await this.sendMessage(messageData);
    } catch (error) {
      console.error('Error sending template message:', error);
    }
  }

  /**
   * Handle opt-in/opt-out for notifications
   */
  async handleOptInOut(phoneNumber: string, action: 'opt_in' | 'opt_out'): Promise<void> {
    try {
      // This would update user preferences in database
      console.log(`User ${phoneNumber} ${action} for notifications`);

      const message = action === 'opt_in' 
        ? 'You have successfully opted in for health notifications.'
        : 'You have successfully opted out of health notifications.';

      await this.sendMessage(this.createTextMessage(phoneNumber, message));
    } catch (error) {
      console.error('Error handling opt-in/out:', error);
    }
  }

  /**
   * Get active session for phone number
   */
  getActiveSession(phoneNumber: string): string | undefined {
    return this.activeSessions.get(phoneNumber);
  }

  /**
   * End session for phone number
   */
  endSession(phoneNumber: string): void {
    const sessionId = this.activeSessions.get(phoneNumber);
    if (sessionId) {
      multilingualChatbotService.endSession(sessionId);
      this.activeSessions.delete(phoneNumber);
    }
  }

  /**
   * Get webhook URL for setup
   */
  getWebhookUrl(): string {
    return `${process.env.REACT_APP_BASE_URL}/api/whatsapp/webhook`;
  }

  /**
   * Validate webhook setup
   */
  async validateWebhookSetup(): Promise<boolean> {
    try {
      // This would test the webhook configuration
      return true;
    } catch (error) {
      console.error('Webhook validation failed:', error);
      return false;
    }
  }
}

export const whatsappService = WhatsAppService.getInstance();
