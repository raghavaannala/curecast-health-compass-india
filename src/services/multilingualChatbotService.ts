import {
  ChatbotMessage,
  ChatbotSession,
  ChatbotContext,
  ChatbotIntent,
  ChatbotResponse,
  ChatbotUserProfile,
  ChatbotEntity,
  Language,
  SymptomTriageRule,
  HealthKnowledgeBase,
  EscalationRule,
  HealthWorker
} from '../types';
import { languageService } from './languageService';
import { symptomAssessmentService, SymptomContext } from './symptomAssessmentService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Multilingual AI Chatbot Service for Rural Healthcare
 * Provides NLP processing, intent recognition, and multilingual support
 */
export class MultilingualChatbotService {
  private static instance: MultilingualChatbotService;
  private sessions: Map<string, ChatbotSession> = new Map();
  private intents: Map<string, ChatbotIntent> = new Map();
  private knowledgeBase: Map<string, HealthKnowledgeBase> = new Map();
  private triageRules: Map<string, SymptomTriageRule> = new Map();
  private escalationRules: EscalationRule[] = [];
  private healthWorkers: Map<string, HealthWorker> = new Map();
  private userProfiles: Map<string, ChatbotUserProfile> = new Map();

  // NLP confidence thresholds
  private readonly INTENT_CONFIDENCE_THRESHOLD = 0.7;
  private readonly ENTITY_CONFIDENCE_THRESHOLD = 0.6;
  private readonly TRANSLATION_CONFIDENCE_THRESHOLD = 0.8;

  public static getInstance(): MultilingualChatbotService {
    if (!MultilingualChatbotService.instance) {
      MultilingualChatbotService.instance = new MultilingualChatbotService();
    }
    return MultilingualChatbotService.instance;
  }

  constructor() {
    this.initializeIntents();
    this.initializeKnowledgeBase();
    this.initializeTriageRules();
    this.initializeEscalationRules();
    this.initializeHealthWorkers();
  }

  /**
   * Process incoming message and generate response
   */
  async processMessage(
    userId: string,
    message: string,
    platform: 'whatsapp' | 'sms' | 'web' | 'ivr',
    sessionId?: string
  ): Promise<{
    response: ChatbotMessage;
    session: ChatbotSession;
    escalated?: boolean;
  }> {
    try {
      // Get or create session
      let session = sessionId ? this.sessions.get(sessionId) : null;
      if (!session) {
        session = await this.createSession(userId, platform);
      }

      // Detect language
      const languageDetection = await languageService.detectLanguage(message);
      const detectedLanguage = languageDetection.language;

      // Update session language if different
      if (session.language !== detectedLanguage) {
        session.language = detectedLanguage;
      }

      // Create user message
      const userMessage: ChatbotMessage = {
        id: uuidv4(),
        sessionId: session.id,
        content: message,
        role: 'user',
        timestamp: new Date().toISOString(),
        language: detectedLanguage,
        messageType: 'text'
      };

      // Add to session
      session.messages.push(userMessage);
      session.lastActivity = new Date().toISOString();

      // Process NLP
      const nlpResult = await this.processNLP(message, detectedLanguage, session.context);
      
      // Update context
      session.context = this.updateContext(session.context, nlpResult);

      // Check for escalation triggers
      const escalationCheck = this.checkEscalationTriggers(nlpResult, session);
      if (escalationCheck.shouldEscalate) {
        return await this.escalateToHuman(session, escalationCheck.reason);
      }

      // Generate response
      const response = await this.generateResponse(nlpResult, session);

      // Add response to session
      session.messages.push(response);
      this.sessions.set(session.id, session);

      return {
        response,
        session,
        escalated: false
      };

    } catch (error) {
      console.error('Error processing message:', error);
      
      // Fallback response
      const fallbackLanguage = 'english'; // Default fallback
      const fallbackResponse: ChatbotMessage = {
        id: uuidv4(),
        sessionId: sessionId || 'unknown',
        content: await this.getFallbackMessage(fallbackLanguage),
        role: 'assistant',
        timestamp: new Date().toISOString(),
        language: fallbackLanguage,
        messageType: 'text'
      };

      return {
        response: fallbackResponse,
        session: this.sessions.get(sessionId!) || await this.createSession(userId, platform)
      };
    }
  }

  /**
   * Enhanced message processing with symptom assessment
   */
  async processMessageWithSymptomAssessment(
    userId: string,
    message: string,
    platform: 'whatsapp' | 'sms' | 'web' | 'ivr',
    sessionId?: string,
    userAge?: number,
    userGender?: 'male' | 'female' | 'other'
  ): Promise<{
    response: ChatbotMessage;
    session: ChatbotSession;
    escalated?: boolean;
    isSymptomAssessment?: boolean;
    assessmentComplete?: boolean;
    assessmentResult?: any;
  }> {
    try {
      // Get or create session
      let session = sessionId ? this.sessions.get(sessionId) : null;
      if (!session) {
        session = await this.createSession(userId, platform);
      }

      // Detect language
      const languageDetection = await languageService.detectLanguage(message);
      const detectedLanguage = languageDetection.language;

      // Check if this is a symptom mention and we're not already in assessment
      const isSymptomMention = this.detectSymptomMention(message);
      const isInAssessment = session.context.isInSymptomAssessment || false;

      if (isSymptomMention && !isInAssessment) {
        // Start symptom assessment
        return await this.startSymptomAssessment(
          userId, 
          message, 
          session, 
          detectedLanguage,
          userAge,
          userGender
        );
      } else if (isInAssessment) {
        // Continue symptom assessment
        return await this.continueSymptomAssessment(userId, message, session, detectedLanguage);
      } else {
        // Regular chatbot processing
        return await this.processMessage(userId, message, platform, sessionId);
      }

    } catch (error) {
      console.error('Error in enhanced message processing:', error);
      return await this.processMessage(userId, message, platform, sessionId);
    }
  }

  /**
   * Start symptom assessment flow
   */
  private async startSymptomAssessment(
    userId: string,
    symptomMention: string,
    session: ChatbotSession,
    language: Language,
    userAge?: number,
    userGender?: 'male' | 'female' | 'other'
  ): Promise<any> {
    try {
      const assessment = await symptomAssessmentService.startSymptomAssessment(
        userId,
        symptomMention,
        language,
        userAge,
        userGender
      );

      // Update session context
      session.context.isInSymptomAssessment = true;
      session.context.symptomAssessmentContext = assessment.context;

      // Create empathy response message
      const empathyMessage: ChatbotMessage = {
        id: uuidv4(),
        sessionId: session.id,
        content: assessment.empathyResponse,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        language: language,
        messageType: 'text',
        metadata: {
          isEmpathyResponse: true,
          urgency: 'low'
        }
      };

      // Create follow-up question message
      const questionMessage: ChatbotMessage = {
        id: uuidv4(),
        sessionId: session.id,
        content: assessment.firstQuestion,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        language: language,
        messageType: 'text',
        metadata: {
          isFollowUpQuestion: true,
          urgency: 'low'
        }
      };

      // Add messages to session
      session.messages.push(empathyMessage, questionMessage);
      this.sessions.set(session.id, session);

      return {
        response: questionMessage, // Return the question as the main response
        session,
        isSymptomAssessment: true,
        assessmentComplete: false
      };

    } catch (error) {
      console.error('Error starting symptom assessment:', error);
      // Fallback to regular processing
      return await this.processMessage(session.userId, symptomMention, session.platform, session.id);
    }
  }

  /**
   * Continue symptom assessment flow
   */
  private async continueSymptomAssessment(
    userId: string,
    answer: string,
    session: ChatbotSession,
    language: Language
  ): Promise<any> {
    try {
      const result = await symptomAssessmentService.processAnswer(userId, answer, language);

      // Create acknowledgment message
      const acknowledgmentMessage: ChatbotMessage = {
        id: uuidv4(),
        sessionId: session.id,
        content: result.acknowledgment,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        language: language,
        messageType: 'text',
        metadata: {
          urgency: 'low'
        }
      };

      session.messages.push(acknowledgmentMessage);

      if (result.isComplete && result.assessment) {
        // Assessment complete - create comprehensive response
        const assessmentMessage = this.createAssessmentResponse(
          result.assessment,
          session,
          language
        );

        session.messages.push(assessmentMessage);
        
        // Reset assessment context
        session.context.isInSymptomAssessment = false;
        session.context.symptomAssessmentContext = undefined;

        this.sessions.set(session.id, session);

        return {
          response: assessmentMessage,
          session,
          isSymptomAssessment: true,
          assessmentComplete: true,
          assessmentResult: result.assessment
        };

      } else if (result.nextQuestion) {
        // Continue with next question
        const questionMessage: ChatbotMessage = {
          id: uuidv4(),
          sessionId: session.id,
          content: result.nextQuestion,
          role: 'assistant',
          timestamp: new Date().toISOString(),
          language: language,
          messageType: 'text',
          metadata: {
            isFollowUpQuestion: true,
            urgency: 'low'
          }
        };

        session.messages.push(questionMessage);
        this.sessions.set(session.id, session);

        return {
          response: questionMessage,
          session,
          isSymptomAssessment: true,
          assessmentComplete: false
        };
      }

    } catch (error) {
      console.error('Error continuing symptom assessment:', error);
      
      // Reset assessment and fallback to regular processing
      session.context.isInSymptomAssessment = false;
      return await this.processMessage(userId, answer, session.platform, session.id);
    }
  }

  /**
   * Create comprehensive assessment response
   */
  private createAssessmentResponse(
    assessment: any,
    session: ChatbotSession,
    language: Language
  ): ChatbotMessage {
    let content = "Based on our conversation, here's my assessment:\n\n";

    // Add possible conditions
    if (assessment.possibleConditions?.length > 0) {
      content += "**Possible Conditions:**\n";
      assessment.possibleConditions.forEach((condition: any) => {
        content += `• ${condition.condition} (${condition.probability} likelihood)\n`;
      });
      content += "\n";
    }

    // Add recommendations
    if (assessment.recommendations) {
      if (assessment.recommendations.immediate_actions?.length > 0) {
        content += "**Immediate Actions:**\n";
        assessment.recommendations.immediate_actions.forEach((action: string) => {
          content += `• ${action}\n`;
        });
        content += "\n";
      }

      content += `**Medical Advice:** ${assessment.recommendations.when_to_see_doctor}\n\n`;

      if (assessment.recommendations.home_remedies?.length > 0) {
        content += "**Home Care Tips:**\n";
        assessment.recommendations.home_remedies.forEach((remedy: string) => {
          content += `• ${remedy}\n`;
        });
        content += "\n";
      }
    }

    // Add red flags
    if (assessment.redFlags?.length > 0) {
      content += "**⚠️ Seek Immediate Medical Attention If:**\n";
      assessment.redFlags.forEach((flag: string) => {
        content += `• ${flag}\n`;
      });
      content += "\n";
    }

    content += "*Remember: This assessment is for informational purposes only. Always consult healthcare professionals for proper diagnosis and treatment.*";

    const urgency = assessment.urgencyLevel === 'immediate' ? 'critical' : 
                   assessment.urgencyLevel === 'same_day' ? 'high' : 'medium';

    return {
      id: uuidv4(),
      sessionId: session.id,
      content,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      language: language,
      messageType: 'text',
      metadata: {
        isAssessment: true,
        urgency,
        assessmentResult: assessment
      }
    };
  }

  /**
   * Detect if message mentions symptoms
   */
  private detectSymptomMention(message: string): boolean {
    const symptomKeywords = [
      'fever', 'headache', 'cough', 'pain', 'ache', 'hurt', 'sick', 'nausea',
      'vomiting', 'diarrhea', 'dizzy', 'tired', 'fatigue', 'sore', 'swollen',
      'rash', 'itchy', 'burning', 'stiff', 'weak', 'breathe', 'chest', 'stomach',
      'back', 'joint', 'muscle', 'throat', 'runny nose', 'congestion', 'chills',
      'sweating', 'blurred vision', 'numbness', 'tingling'
    ];
    
    const lowerMessage = message.toLowerCase();
    return symptomKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Process Natural Language Processing
   */
  private async processNLP(
    message: string, 
    language: Language, 
    context: ChatbotContext
  ): Promise<{
    intent: string;
    confidence: number;
    entities: ChatbotEntity[];
    sentiment: 'positive' | 'negative' | 'neutral';
    urgency: 'low' | 'medium' | 'high' | 'critical';
  }> {
    // Translate to English for processing if needed
    let processedMessage = message;
    if (language !== 'english') {
      processedMessage = await languageService.translateText(message, language, 'english');
    }

    // Intent recognition
    const intent = await this.recognizeIntent(processedMessage, context);
    
    // Entity extraction
    const entities = await this.extractEntities(processedMessage);
    
    // Sentiment analysis
    const sentiment = this.analyzeSentiment(processedMessage);
    
    // Urgency detection
    const urgency = this.detectUrgency(processedMessage, entities);

    return {
      intent: intent.name,
      confidence: intent.confidence,
      entities,
      sentiment,
      urgency
    };
  }

  /**
   * Recognize intent from message
   */
  private async recognizeIntent(
    message: string, 
    context: ChatbotContext
  ): Promise<{ name: string; confidence: number }> {
    const messageLower = message.toLowerCase();
    let bestMatch = { name: 'unknown', confidence: 0 };

    // Check against predefined intents
    for (const [intentName, intent] of this.intents) {
      let confidence = 0;
      
      // Check examples
      for (const example of intent.examples) {
        const similarity = this.calculateSimilarity(messageLower, example.toLowerCase());
        confidence = Math.max(confidence, similarity);
      }

      // Boost confidence based on context
      if (context.currentIntent === intentName) {
        confidence *= 1.2;
      }

      if (confidence > bestMatch.confidence) {
        bestMatch = { name: intentName, confidence };
      }
    }

    // Fallback to keyword matching
    if (bestMatch.confidence < this.INTENT_CONFIDENCE_THRESHOLD) {
      bestMatch = this.keywordBasedIntentRecognition(messageLower);
    }

    return bestMatch;
  }

  /**
   * Extract entities from message
   */
  private async extractEntities(message: string): Promise<ChatbotEntity[]> {
    const entities: ChatbotEntity[] = [];
    const messageLower = message.toLowerCase();

    // Medical symptoms
    const symptoms = [
      'fever', 'cough', 'headache', 'nausea', 'vomiting', 'diarrhea', 
      'chest pain', 'shortness of breath', 'fatigue', 'dizziness',
      'rash', 'sore throat', 'runny nose', 'body ache', 'chills'
    ];

    symptoms.forEach(symptom => {
      if (messageLower.includes(symptom)) {
        entities.push({
          entity: 'symptom',
          value: symptom,
          confidence: 0.9,
          start: messageLower.indexOf(symptom),
          end: messageLower.indexOf(symptom) + symptom.length,
          extractor: 'keyword_matcher'
        });
      }
    });

    // Age extraction
    const ageMatch = message.match(/(\d+)\s*(year|month|day)s?\s*old/i);
    if (ageMatch) {
      entities.push({
        entity: 'age',
        value: ageMatch[1] + ' ' + ageMatch[2] + 's',
        confidence: 0.95,
        start: ageMatch.index!,
        end: ageMatch.index! + ageMatch[0].length,
        extractor: 'regex'
      });
    }

    // Location extraction
    const locationKeywords = ['village', 'city', 'district', 'state', 'pincode'];
    locationKeywords.forEach(keyword => {
      const regex = new RegExp(`(\\w+)\\s+${keyword}`, 'i');
      const match = message.match(regex);
      if (match) {
        entities.push({
          entity: 'location',
          value: match[1],
          confidence: 0.8,
          start: match.index!,
          end: match.index! + match[0].length,
          extractor: 'regex'
        });
      }
    });

    return entities;
  }

  /**
   * Analyze sentiment of message
   */
  private analyzeSentiment(message: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'thank', 'thanks'];
    const negativeWords = ['bad', 'terrible', 'awful', 'sad', 'angry', 'frustrated', 'pain', 'hurt'];
    
    const messageLower = message.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;

    positiveWords.forEach(word => {
      if (messageLower.includes(word)) positiveScore++;
    });

    negativeWords.forEach(word => {
      if (messageLower.includes(word)) negativeScore++;
    });

    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  /**
   * Detect urgency level
   */
  private detectUrgency(message: string, entities: ChatbotEntity[]): 'low' | 'medium' | 'high' | 'critical' {
    const messageLower = message.toLowerCase();
    
    // Critical keywords
    const criticalKeywords = [
      'emergency', 'urgent', 'severe', 'critical', 'dying', 'unconscious',
      'chest pain', 'difficulty breathing', 'bleeding heavily', 'suicide'
    ];

    // High urgency keywords
    const highKeywords = [
      'pain', 'fever', 'vomiting', 'diarrhea', 'rash', 'swelling'
    ];

    // Check for critical symptoms
    for (const keyword of criticalKeywords) {
      if (messageLower.includes(keyword)) {
        return 'critical';
      }
    }

    // Check for high urgency symptoms
    for (const keyword of highKeywords) {
      if (messageLower.includes(keyword)) {
        return 'high';
      }
    }

    // Check entities for symptoms
    const symptomEntities = entities.filter(e => e.entity === 'symptom');
    if (symptomEntities.length > 2) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Generate response based on NLP results
   */
  private async generateResponse(
    nlpResult: any,
    session: ChatbotSession
  ): Promise<ChatbotMessage> {
    const intent = this.intents.get(nlpResult.intent);
    let responseText = '';
    let buttons: any[] = [];
    let quickReplies: any[] = [];

    if (intent && nlpResult.confidence >= this.INTENT_CONFIDENCE_THRESHOLD) {
      // Find appropriate response for language
      const response = intent.responses.find(r => r.language === session.language) ||
                      intent.responses.find(r => r.language === 'english');
      
      if (response) {
        responseText = response.text;
        buttons = response.buttons || [];
        quickReplies = response.quickReplies || [];
      }
    } else {
      // Handle unknown intent
      responseText = await this.handleUnknownIntent(session.language, nlpResult.entities);
    }

    // Personalize response
    responseText = await this.personalizeResponse(responseText, session);

    // Translate if needed
    if (session.language !== 'english') {
      responseText = await languageService.translateText(responseText, 'english', session.language);
    }

    return {
      id: uuidv4(),
      sessionId: session.id,
      content: responseText,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      language: session.language,
      messageType: 'text',
      buttons: buttons.length > 0 ? buttons : undefined,
      quickReplies: quickReplies.length > 0 ? quickReplies : undefined,
      metadata: {
        intent: nlpResult.intent,
        confidence: nlpResult.confidence,
        entities: nlpResult.entities,
        urgency: nlpResult.urgency
      }
    };
  }

  /**
   * Create new chat session
   */
  private async createSession(
    userId: string, 
    platform: 'whatsapp' | 'sms' | 'web' | 'ivr'
  ): Promise<ChatbotSession> {
    const sessionId = uuidv4();
    const userProfile = this.userProfiles.get(userId);
    
    const session: ChatbotSession = {
      id: sessionId,
      userId,
      platform,
      language: userProfile?.preferredLanguage || 'english',
      messages: [],
      context: {
        entities: [],
        conversationFlow: [],
        userState: 'greeting',
        previousQueries: []
      },
      status: 'active',
      startTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      userProfile
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Update conversation context
   */
  private updateContext(
    context: ChatbotContext, 
    nlpResult: any
  ): ChatbotContext {
    return {
      ...context,
      currentIntent: nlpResult.intent,
      entities: [...context.entities, ...nlpResult.entities],
      conversationFlow: [...context.conversationFlow, nlpResult.intent],
      previousQueries: [...context.previousQueries.slice(-4), nlpResult.intent]
    };
  }

  /**
   * Check if conversation should be escalated to human
   */
  private checkEscalationTriggers(
    nlpResult: any, 
    session: ChatbotSession
  ): { shouldEscalate: boolean; reason?: string } {
    // Check urgency level
    if (nlpResult.urgency === 'critical') {
      return { shouldEscalate: true, reason: 'critical_urgency' };
    }

    // Check for escalation keywords
    const escalationKeywords = ['human', 'doctor', 'help', 'speak to someone'];
    const lastMessage = session.messages[session.messages.length - 1];
    
    if (lastMessage && escalationKeywords.some(keyword => 
      lastMessage.content.toLowerCase().includes(keyword)
    )) {
      return { shouldEscalate: true, reason: 'user_request' };
    }

    // Check confidence threshold
    if (nlpResult.confidence < 0.3 && session.messages.length > 3) {
      return { shouldEscalate: true, reason: 'low_confidence' };
    }

    // Check for repeated unknown intents
    const recentIntents = session.context.conversationFlow.slice(-3);
    if (recentIntents.every(intent => intent === 'unknown')) {
      return { shouldEscalate: true, reason: 'repeated_unknown' };
    }

    return { shouldEscalate: false };
  }

  /**
   * Escalate conversation to human health worker
   */
  private async escalateToHuman(
    session: ChatbotSession, 
    reason: string
  ): Promise<{
    response: ChatbotMessage;
    session: ChatbotSession;
    escalated: boolean;
  }> {
    session.status = 'escalated';
    session.escalationReason = reason;

    // Find available health worker
    const availableWorker = this.findAvailableHealthWorker(session);
    if (availableWorker) {
      session.healthWorkerAssigned = availableWorker.id;
    }

    const escalationMessage: ChatbotMessage = {
      id: uuidv4(),
      sessionId: session.id,
      content: await this.getEscalationMessage(session.language, availableWorker),
      role: 'system',
      timestamp: new Date().toISOString(),
      language: session.language,
      messageType: 'text',
      escalated: true
    };

    session.messages.push(escalationMessage);
    this.sessions.set(session.id, session);

    return {
      response: escalationMessage,
      session,
      escalated: true
    };
  }

  /**
   * Initialize predefined intents
   */
  private initializeIntents(): void {
    const intents: ChatbotIntent[] = [
      {
        name: 'greeting',
        confidence: 0.9,
        examples: [
          'hello', 'hi', 'namaste', 'good morning', 'good evening',
          'hey', 'greetings', 'salaam', 'vanakkam'
        ],
        responses: [
          {
            text: 'Hello! I am your health assistant. How can I help you today?',
            language: 'english',
            quickReplies: [
              { id: '1', title: 'Health Question', payload: 'health_question' },
              { id: '2', title: 'Vaccination Info', payload: 'vaccination_info' },
              { id: '3', title: 'Symptoms Check', payload: 'symptom_check' }
            ]
          }
        ]
      },
      {
        name: 'symptom_check',
        confidence: 0.8,
        examples: [
          'I have fever', 'feeling sick', 'not feeling well', 'symptoms',
          'headache', 'cough', 'pain', 'illness'
        ],
        responses: [
          {
            text: 'I understand you\'re not feeling well. Can you tell me more about your symptoms?',
            language: 'english'
          }
        ]
      },
      {
        name: 'vaccination_info',
        confidence: 0.8,
        examples: [
          'vaccination', 'vaccine', 'immunization', 'shots',
          'when to vaccinate', 'vaccine schedule'
        ],
        responses: [
          {
            text: 'I can help you with vaccination information. What would you like to know?',
            language: 'english',
            quickReplies: [
              { id: '1', title: 'Child Vaccines', payload: 'child_vaccines' },
              { id: '2', title: 'Adult Vaccines', payload: 'adult_vaccines' },
              { id: '3', title: 'Vaccine Schedule', payload: 'vaccine_schedule' }
            ]
          }
        ]
      },
      {
        name: 'emergency',
        confidence: 0.9,
        examples: [
          'emergency', 'urgent', 'help', 'critical', 'severe pain',
          'can\'t breathe', 'chest pain', 'unconscious'
        ],
        responses: [
          {
            text: 'This seems urgent. Please call emergency services immediately at 108 or visit the nearest hospital.',
            language: 'english',
            escalate: true
          }
        ]
      }
    ];

    intents.forEach(intent => {
      this.intents.set(intent.name, intent);
    });
  }

  /**
   * Initialize health knowledge base
   */
  private initializeKnowledgeBase(): void {
    // This would typically be loaded from a database
    const knowledgeItems: HealthKnowledgeBase[] = [
      {
        id: '1',
        category: 'prevention',
        question: 'How to prevent common cold?',
        answer: 'Wash hands frequently, avoid close contact with sick people, maintain good hygiene, eat healthy foods, and get adequate sleep.',
        language: 'english',
        tags: ['prevention', 'cold', 'hygiene'],
        sources: ['WHO', 'CDC'],
        lastUpdated: new Date().toISOString(),
        accuracy: 0.95
      }
    ];

    knowledgeItems.forEach(item => {
      this.knowledgeBase.set(item.id, item);
    });
  }

  /**
   * Initialize symptom triage rules
   */
  private initializeTriageRules(): void {
    // This would typically be loaded from medical databases
    const rules: SymptomTriageRule[] = [
      {
        id: '1',
        symptoms: ['chest pain', 'difficulty breathing'],
        conditions: ['heart attack', 'pulmonary embolism'],
        severity: 'critical',
        redFlags: ['severe chest pain', 'shortness of breath'],
        recommendation: 'emergency',
        advice: 'Call emergency services immediately',
        language: 'english'
      }
    ];

    rules.forEach(rule => {
      this.triageRules.set(rule.id, rule);
    });
  }

  /**
   * Initialize escalation rules
   */
  private initializeEscalationRules(): void {
    this.escalationRules = [
      {
        id: '1',
        triggers: {
          severity: 'critical',
          keywords: ['emergency', 'urgent', 'severe']
        },
        action: 'escalate_to_human',
        priority: 'urgent',
        assignmentRules: {
          specialization: ['emergency_medicine'],
          language: ['english', 'hindi']
        }
      }
    ];
  }

  /**
   * Initialize health workers
   */
  private initializeHealthWorkers(): void {
    // This would typically be loaded from a database
    const workers: HealthWorker[] = [
      {
        id: '1',
        name: 'Dr. Priya Sharma',
        phoneNumber: '+91-9876543210',
        email: 'priya.sharma@health.gov.in',
        specialization: ['general_medicine', 'pediatrics'],
        languages: ['english', 'hindi', 'telugu'],
        location: {
          state: 'Telangana',
          district: 'Hyderabad'
        },
        availability: {
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          startTime: '09:00',
          endTime: '17:00'
        },
        currentLoad: 2,
        maxConcurrentChats: 5,
        rating: 4.8,
        isOnline: true
      }
    ];

    workers.forEach(worker => {
      this.healthWorkers.set(worker.id, worker);
    });
  }

  // Helper methods
  private calculateSimilarity(str1: string, str2: string): number {
    // Simple Jaccard similarity
    const set1 = new Set(str1.split(' '));
    const set2 = new Set(str2.split(' '));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }

  private keywordBasedIntentRecognition(message: string): { name: string; confidence: number } {
    // Fallback keyword matching
    if (message.includes('vaccine') || message.includes('vaccination')) {
      return { name: 'vaccination_info', confidence: 0.6 };
    }
    if (message.includes('symptom') || message.includes('sick') || message.includes('pain')) {
      return { name: 'symptom_check', confidence: 0.6 };
    }
    if (message.includes('emergency') || message.includes('urgent')) {
      return { name: 'emergency', confidence: 0.8 };
    }
    return { name: 'unknown', confidence: 0.1 };
  }

  private async handleUnknownIntent(language: Language, entities: ChatbotEntity[]): Promise<string> {
    const fallbackMessages = {
      english: "I'm sorry, I didn't understand that. Can you please rephrase your question?",
      hindi: "माफ़ करें, मैं समझ नहीं पाया। क्या आप अपना प्रश्न दोबारा पूछ सकते हैं?",
      telugu: "క్షమించండి, నాకు అర్థం కాలేదు. దయచేసి మీ ప్రశ్నను మళ్లీ అడగగలరా?"
    };

    return fallbackMessages[language] || fallbackMessages.english;
  }

  private async personalizeResponse(responseText: string, session: ChatbotSession): Promise<string> {
    if (session.userProfile?.name) {
      responseText = responseText.replace('{name}', session.userProfile.name);
    }
    return responseText;
  }

  private findAvailableHealthWorker(session: ChatbotSession): HealthWorker | null {
    for (const worker of this.healthWorkers.values()) {
      if (worker.isOnline && 
          worker.currentLoad < worker.maxConcurrentChats &&
          worker.languages.includes(session.language)) {
        return worker;
      }
    }
    return null;
  }

  private async getFallbackMessage(language: Language): Promise<string> {
    const messages = {
      english: "I'm experiencing some technical difficulties. Please try again in a moment.",
      hindi: "मुझे कुछ तकनीकी समस्या हो रही है। कृपया थोड़ी देर बाद पुनः प्रयास करें।",
      telugu: "నాకు కొన్ని సాంకేతిక సమస్యలు ఉన్నాయి. దయచేసి కొద్దిసేపు తర్వాత మళ్లీ ప్రయత్నించండి।"
    };

    return messages[language] || messages.english;
  }

  private async getEscalationMessage(language: Language, worker?: HealthWorker): Promise<string> {
    const messages = {
      english: worker 
        ? `I'm connecting you with ${worker.name}, a health professional who can better assist you.`
        : "I'm connecting you with a health professional who can better assist you.",
      hindi: worker
        ? `मैं आपको ${worker.name} से जोड़ रहा हूं, जो एक स्वास्थ्य पेशेवर हैं और आपकी बेहतर सहायता कर सकते हैं।`
        : "मैं आपको एक स्वास्थ्य पेशेवर से जोड़ रहा हूं जो आपकी बेहतर सहायता कर सकते हैं।"
    };

    return messages[language] || messages.english;
  }

  // Public methods for external access
  public getSession(sessionId: string): ChatbotSession | undefined {
    return this.sessions.get(sessionId);
  }

  public getAllActiveSessions(): ChatbotSession[] {
    return Array.from(this.sessions.values()).filter(s => s.status === 'active');
  }

  public endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'completed';
      session.endTime = new Date().toISOString();
      this.sessions.set(sessionId, session);
    }
  }
}

export const multilingualChatbotService = MultilingualChatbotService.getInstance();
