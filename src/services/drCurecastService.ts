import { 
  DrCurecastUser, 
  ChatMessage, 
  ChatSession, 
  VoiceMessage, 
  Language,
  HealthAlert 
} from '../types';
import { languageService } from './languageService';
import { voiceService } from './voiceService';
import { vaccinationService } from './vaccinationService';
import { governmentHealthService } from './governmentHealthService';
import { userProfileService } from './userProfileService';

// Main Dr.Curecast service orchestrating all healthcare chatbot features
export class DrCurecastService {
  private static instance: DrCurecastService;
  private activeSessions: Map<string, ChatSession> = new Map();
  private errorHandlers: Map<string, (error: Error) => void> = new Map();

  public static getInstance(): DrCurecastService {
    if (!DrCurecastService.instance) {
      DrCurecastService.instance = new DrCurecastService();
    }
    return DrCurecastService.instance;
  }

  /**
   * Initialize Dr.Curecast for a user
   */
  async initializeForUser(userId: string): Promise<{
    user: DrCurecastUser;
    healthSummary: any;
    supportedFeatures: {
      voice: boolean;
      multilingual: boolean;
      vaccinationReminders: boolean;
      governmentSync: boolean;
    };
  }> {
    try {
      const user = await userProfileService.getUserProfile(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const healthSummary = await userProfileService.getHealthSummary(userId);
      const voiceSupport = voiceService.isVoiceSupported();
      const apiHealth = await governmentHealthService.checkAPIHealth();

      return {
        user,
        healthSummary,
        supportedFeatures: {
          voice: voiceSupport.speechRecognition && voiceSupport.speechSynthesis,
          multilingual: true,
          vaccinationReminders: true,
          governmentSync: apiHealth.cowin || apiHealth.ayushman || apiHealth.statePortal
        }
      };

    } catch (error) {
      this.handleError('initialization', error as Error);
      throw error;
    }
  }

  /**
   * Start a new chat session
   */
  async startChatSession(
    userId: string,
    language?: Language,
    voiceEnabled: boolean = false,
    context: 'general' | 'vaccination' | 'emergency' | 'reminder' = 'general'
  ): Promise<ChatSession> {
    try {
      const user = await userProfileService.getUserProfile(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const sessionLanguage = language || user.language;
      
      // Detect language if not specified and voice is enabled
      if (!language && voiceEnabled) {
        // This would typically involve asking user to speak first
        console.log('Language detection will be performed on first voice input');
      }

      const session: ChatSession = {
        id: this.generateSessionId(),
        userId,
        language: sessionLanguage,
        messages: [],
        voiceEnabled: voiceEnabled && user.voicePreferences.enabled,
        startTime: new Date().toISOString(),
        context
      };

      this.activeSessions.set(session.id, session);

      // Send welcome message
      const welcomeMessage = await this.generateWelcomeMessage(user, sessionLanguage, context);
      await this.addMessageToSession(session.id, {
        id: this.generateMessageId(),
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date().toISOString()
      });

      // Speak welcome message if voice is enabled
      if (session.voiceEnabled) {
        await voiceService.createHealthcareVoiceResponse(
          welcomeMessage,
          sessionLanguage,
          'greeting'
        );
      }

      return session;

    } catch (error) {
      this.handleError('chat_session_start', error as Error);
      throw error;
    }
  }

  /**
   * Process user message (text or voice)
   */
  async processUserMessage(
    sessionId: string,
    input: {
      text?: string;
      voiceMessage?: VoiceMessage;
      audioBlob?: Blob;
    }
  ): Promise<{
    response: ChatMessage;
    voiceResponse?: boolean;
    actions?: Array<{
      type: 'reminder_created' | 'vaccination_scheduled' | 'emergency_alert' | 'government_sync';
      data: any;
    }>;
  }> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      let userMessage: string;
      let detectedLanguage: Language = session.language;

      // Process voice input
      if (input.voiceMessage) {
        userMessage = input.voiceMessage.transcription;
        detectedLanguage = input.voiceMessage.language;
      } else if (input.audioBlob) {
        const voiceResult = await voiceService.processVoiceInput(input.audioBlob, session.language);
        userMessage = voiceResult.transcription;
        detectedLanguage = voiceResult.language;
      } else if (input.text) {
        userMessage = input.text;
        // Detect language from text
        const detection = await languageService.detectLanguage(userMessage);
        detectedLanguage = detection.language;
      } else {
        throw new Error('No input provided');
      }

      // Update session language if different
      if (detectedLanguage !== session.language) {
        session.language = detectedLanguage;
        await userProfileService.updateUserProfile(session.userId, {
          language: detectedLanguage
        });
      }

      // Add user message to session
      const userChatMessage: ChatMessage = {
        id: this.generateMessageId(),
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      };
      await this.addMessageToSession(sessionId, userChatMessage);

      // Process the message and generate response
      const { response, actions } = await this.generateResponse(
        session,
        userMessage,
        detectedLanguage
      );

      // Add assistant response to session
      await this.addMessageToSession(sessionId, response);

      // Generate voice response if enabled
      let voiceResponse = false;
      if (session.voiceEnabled) {
        await voiceService.createHealthcareVoiceResponse(
          response.content,
          detectedLanguage,
          session.context
        );
        voiceResponse = true;
      }

      return {
        response,
        voiceResponse,
        actions
      };

    } catch (error) {
      this.handleError('message_processing', error as Error);
      throw error;
    }
  }

  /**
   * Generate intelligent response based on context and user input
   */
  private async generateResponse(
    session: ChatSession,
    userMessage: string,
    language: Language
  ): Promise<{
    response: ChatMessage;
    actions: Array<{
      type: 'reminder_created' | 'vaccination_scheduled' | 'emergency_alert' | 'government_sync';
      data: any;
    }>;
  }> {
    const actions: any[] = [];
    let responseText = '';

    // Analyze user intent
    const intent = await this.analyzeUserIntent(userMessage, language);

    switch (intent.type) {
      case 'vaccination_inquiry':
        responseText = await this.handleVaccinationInquiry(session.userId, intent.data, language);
        break;

      case 'schedule_vaccination':
        const schedulingResult = await this.handleVaccinationScheduling(
          session.userId, 
          intent.data, 
          language
        );
        responseText = schedulingResult.message;
        if (schedulingResult.reminder) {
          actions.push({
            type: 'reminder_created',
            data: schedulingResult.reminder
          });
        }
        break;

      case 'health_emergency':
        responseText = await this.handleHealthEmergency(session.userId, intent.data, language);
        actions.push({
          type: 'emergency_alert',
          data: { severity: intent.data.severity, location: intent.data.location }
        });
        break;

      case 'government_sync_request':
        const syncResult = await this.handleGovernmentSync(session.userId, language);
        responseText = syncResult.message;
        if (syncResult.success) {
          actions.push({
            type: 'government_sync',
            data: syncResult.data
          });
        }
        break;

      case 'language_change':
        responseText = await this.handleLanguageChange(session, intent.data.newLanguage);
        break;

      case 'health_query':
        responseText = await this.handleGeneralHealthQuery(userMessage, language);
        break;

      default:
        responseText = await this.handleGeneralConversation(userMessage, language);
    }

    const response: ChatMessage = {
      id: this.generateMessageId(),
      role: 'assistant',
      content: responseText,
      timestamp: new Date().toISOString()
    };

    return { response, actions };
  }

  /**
   * Analyze user intent from message
   */
  private async analyzeUserIntent(
    message: string, 
    language: Language
  ): Promise<{
    type: string;
    confidence: number;
    data: any;
  }> {
    const lowerMessage = message.toLowerCase();

    // Vaccination related keywords
    const vaccinationKeywords = ['vaccine', 'vaccination', 'immunization', 'shot', 'dose'];
    const scheduleKeywords = ['schedule', 'book', 'appointment', 'remind', 'when'];
    const emergencyKeywords = ['emergency', 'urgent', 'help', 'pain', 'fever', 'sick'];
    const syncKeywords = ['sync', 'government', 'cowin', 'ayushman', 'records'];

    // Check for vaccination inquiries
    if (vaccinationKeywords.some(keyword => lowerMessage.includes(keyword))) {
      if (scheduleKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return {
          type: 'schedule_vaccination',
          confidence: 0.8,
          data: { vaccineName: this.extractVaccineName(message) }
        };
      }
      return {
        type: 'vaccination_inquiry',
        confidence: 0.7,
        data: { query: message }
      };
    }

    // Check for emergencies
    if (emergencyKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return {
        type: 'health_emergency',
        confidence: 0.9,
        data: { 
          symptoms: this.extractSymptoms(message),
          severity: this.assessSeverity(message)
        }
      };
    }

    // Check for government sync requests
    if (syncKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return {
        type: 'government_sync_request',
        confidence: 0.8,
        data: {}
      };
    }

    // Check for language change
    const supportedLanguages = languageService.getSupportedLanguages();
    for (const lang of supportedLanguages) {
      const langName = languageService.getLanguageDisplayName(lang).toLowerCase();
      if (lowerMessage.includes(langName) && lowerMessage.includes('language')) {
        return {
          type: 'language_change',
          confidence: 0.9,
          data: { newLanguage: lang }
        };
      }
    }

    // Default to health query
    return {
      type: 'health_query',
      confidence: 0.5,
      data: { query: message }
    };
  }

  /**
   * Handle vaccination-related inquiries
   */
  private async handleVaccinationInquiry(
    userId: string, 
    data: any, 
    language: Language
  ): Promise<string> {
    const user = await userProfileService.getUserProfile(userId);
    if (!user) {
      return await this.translateResponse('User not found', language);
    }

    const healthSummary = await userProfileService.getHealthSummary(userId);
    
    let response = `Here's your vaccination status:\n\n${healthSummary.vaccinationStatus}\n\n`;
    
    if (healthSummary.upcomingReminders.length > 0) {
      response += `Upcoming reminders:\n`;
      for (const reminder of healthSummary.upcomingReminders.slice(0, 3)) {
        response += `• ${reminder.message} (${new Date(reminder.reminderDate).toLocaleDateString()})\n`;
      }
    } else {
      response += 'No upcoming vaccination reminders.';
    }

    return await this.translateResponse(response, language);
  }

  /**
   * Handle vaccination scheduling
   */
  private async handleVaccinationScheduling(
    userId: string, 
    data: any, 
    language: Language
  ): Promise<{
    message: string;
    reminder?: any;
  }> {
    try {
      const vaccineName = data.vaccineName || 'COVID-19 booster';
      const scheduleDate = new Date();
      scheduleDate.setDate(scheduleDate.getDate() + 7); // Schedule for next week

      const record = await vaccinationService.addCustomVaccination(
        userId,
        vaccineName,
        scheduleDate,
        'booster',
        language
      );

      const message = await this.translateResponse(
        `I've scheduled your ${vaccineName} vaccination for ${scheduleDate.toLocaleDateString()}. You'll receive a reminder 7 days before the appointment.`,
        language
      );

      return {
        message,
        reminder: record
      };

    } catch (error) {
      const errorMessage = await this.translateResponse(
        'Sorry, I couldn\'t schedule your vaccination. Please try again or contact your healthcare provider.',
        language
      );
      return { message: errorMessage };
    }
  }

  /**
   * Handle health emergencies
   */
  private async handleHealthEmergency(
    userId: string, 
    data: any, 
    language: Language
  ): Promise<string> {
    const user = await userProfileService.getUserProfile(userId);
    
    let response = await this.translateResponse(
      'I understand you\'re experiencing a health emergency. ',
      language
    );

    if (data.severity === 'high') {
      response += await this.translateResponse(
        'Please call emergency services immediately (108 in India) or go to the nearest hospital. ',
        language
      );
    } else {
      response += await this.translateResponse(
        'Please consult with a healthcare provider as soon as possible. ',
        language
      );
    }

    // Add emergency contacts if available
    if (user?.healthProfile.emergencyContacts && user.healthProfile.emergencyContacts.length > 0) {
      response += await this.translateResponse(
        `\n\nYour emergency contacts:\n`,
        language
      );
      
      for (const contact of user.healthProfile.emergencyContacts.slice(0, 2)) {
        response += `• ${contact.name} (${contact.relation}): ${contact.phone}\n`;
      }
    }

    return response;
  }

  /**
   * Handle government database sync
   */
  private async handleGovernmentSync(
    userId: string, 
    language: Language
  ): Promise<{
    message: string;
    success: boolean;
    data?: any;
  }> {
    try {
      const syncResult = await userProfileService.syncWithGovernmentDB(userId);
      
      if (syncResult.success) {
        const message = await this.translateResponse(
          `Successfully synced ${syncResult.syncedRecords} vaccination records from government databases.`,
          language
        );
        return {
          message,
          success: true,
          data: syncResult
        };
      } else {
        const message = await this.translateResponse(
          `Sync completed with some issues. ${syncResult.errors.join(', ')}`,
          language
        );
        return {
          message,
          success: false
        };
      }

    } catch (error) {
      const message = await this.translateResponse(
        'Unable to sync with government databases. Please check your permissions and try again.',
        language
      );
      return {
        message,
        success: false
      };
    }
  }

  /**
   * Handle language change requests
   */
  private async handleLanguageChange(
    session: ChatSession, 
    newLanguage: Language
  ): Promise<string> {
    try {
      session.language = newLanguage;
      await userProfileService.updateLanguagePreferences(session.userId, [newLanguage]);
      
      return await this.translateResponse(
        'I\'ve switched to your preferred language. How can I help you today?',
        newLanguage
      );
    } catch (error) {
      return 'Language change failed. Please try again.';
    }
  }

  /**
   * Handle general health queries
   */
  private async handleGeneralHealthQuery(
    query: string, 
    language: Language
  ): Promise<string> {
    // This would typically integrate with a medical knowledge base or AI
    const response = 'I understand you have a health question. For medical advice, please consult with a qualified healthcare provider. I can help you with vaccination schedules, reminders, and general health information.';
    
    return await this.translateResponse(response, language);
  }

  /**
   * Handle general conversation
   */
  private async handleGeneralConversation(
    message: string, 
    language: Language
  ): Promise<string> {
    const response = 'Hello! I\'m Dr.Curecast, your multilingual healthcare assistant. I can help you with vaccination schedules, health reminders, and connect you with government health services. How can I assist you today?';
    
    return await this.translateResponse(response, language);
  }

  // Helper methods

  private async generateWelcomeMessage(
    user: DrCurecastUser, 
    language: Language, 
    context: string
  ): Promise<string> {
    let message = `Hello ${user.name}! I'm Dr.Curecast, your multilingual healthcare assistant.`;
    
    switch (context) {
      case 'vaccination':
        message += ' I\'m here to help you with vaccination schedules and reminders.';
        break;
      case 'emergency':
        message += ' I understand this might be urgent. How can I help you?';
        break;
      case 'reminder':
        message += ' I have some health reminders for you.';
        break;
      default:
        message += ' How can I help you with your health today?';
    }

    return await this.translateResponse(message, language);
  }

  private async translateResponse(text: string, language: Language): Promise<string> {
    if (language === 'english') {
      return text;
    }

    try {
      return await languageService.translateText(text, 'english', language);
    } catch (error) {
      console.error('Translation failed:', error);
      return text; // Fallback to English
    }
  }

  private async addMessageToSession(sessionId: string, message: ChatMessage): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.messages.push(message);
    }
  }

  private extractVaccineName(message: string): string {
    const vaccines = ['covid', 'flu', 'hepatitis', 'measles', 'polio', 'tetanus'];
    const lowerMessage = message.toLowerCase();
    
    for (const vaccine of vaccines) {
      if (lowerMessage.includes(vaccine)) {
        return vaccine.charAt(0).toUpperCase() + vaccine.slice(1);
      }
    }
    
    return 'General';
  }

  private extractSymptoms(message: string): string[] {
    const symptoms = ['fever', 'cough', 'headache', 'pain', 'nausea', 'dizziness'];
    const lowerMessage = message.toLowerCase();
    
    return symptoms.filter(symptom => lowerMessage.includes(symptom));
  }

  private assessSeverity(message: string): 'low' | 'medium' | 'high' {
    const highSeverityKeywords = ['emergency', 'severe', 'urgent', 'can\'t breathe', 'chest pain'];
    const mediumSeverityKeywords = ['pain', 'fever', 'sick', 'help'];
    
    const lowerMessage = message.toLowerCase();
    
    if (highSeverityKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'high';
    } else if (mediumSeverityKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'medium';
    }
    
    return 'low';
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleError(context: string, error: Error): void {
    console.error(`Dr.Curecast error (${context}):`, error);
    
    const handler = this.errorHandlers.get(context);
    if (handler) {
      handler(error);
    }
  }

  /**
   * Register error handler for specific contexts
   */
  registerErrorHandler(context: string, handler: (error: Error) => void): void {
    this.errorHandlers.set(context, handler);
  }

  /**
   * Get active session
   */
  getSession(sessionId: string): ChatSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * End chat session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.endTime = new Date().toISOString();
      this.activeSessions.delete(sessionId);
    }
  }

  /**
   * Get health alerts for user
   */
  async getHealthAlerts(userId: string): Promise<HealthAlert[]> {
    const user = await userProfileService.getUserProfile(userId);
    if (!user || !user.location) {
      return [];
    }

    return await governmentHealthService.checkOutbreakAlerts(
      { state: user.location, district: user.location },
      user.language
    );
  }
}

export const drCurecastService = DrCurecastService.getInstance();
