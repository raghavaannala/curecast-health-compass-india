import { Language } from '../types';

export interface SymptomContext {
  primarySymptom: string;
  duration: string;
  severity: 'mild' | 'moderate' | 'severe';
  associatedSymptoms: string[];
  patientAge?: number;
  patientGender?: 'male' | 'female' | 'other';
  currentStep: number;
  conversationHistory: ConversationStep[];
  assessmentComplete: boolean;
}

export interface ConversationStep {
  question: string;
  answer: string;
  questionType: 'duration' | 'severity' | 'associated_symptoms' | 'location' | 'triggers' | 'medical_history';
  timestamp: string;
}

export interface FollowUpQuestion {
  question: string;
  type: 'duration' | 'severity' | 'associated_symptoms' | 'location' | 'triggers' | 'medical_history';
  options?: string[];
  isRequired: boolean;
}

export interface AssessmentResult {
  possibleConditions: Array<{
    condition: string;
    probability: 'high' | 'medium' | 'low';
    description: string;
  }>;
  urgencyLevel: 'immediate' | 'same_day' | 'few_days' | 'home_care';
  recommendations: {
    immediate_actions: string[];
    preventive_measures: string[];
    when_to_see_doctor: string;
    home_remedies?: string[];
  };
  redFlags: string[];
}

/**
 * Enhanced Symptom Assessment Service
 * Provides human-like, empathetic follow-up questions for symptoms
 */
export class SymptomAssessmentService {
  private static instance: SymptomAssessmentService;
  private symptomDatabase: Map<string, SymptomProfile> = new Map();
  private activeAssessments: Map<string, SymptomContext> = new Map();

  public static getInstance(): SymptomAssessmentService {
    if (!SymptomAssessmentService.instance) {
      SymptomAssessmentService.instance = new SymptomAssessmentService();
    }
    return SymptomAssessmentService.instance;
  }

  constructor() {
    this.initializeSymptomDatabase();
  }

  /**
   * Start symptom assessment with empathetic response
   */
  async startSymptomAssessment(
    userId: string,
    symptomMention: string,
    language: Language = 'english',
    userAge?: number,
    userGender?: 'male' | 'female' | 'other'
  ): Promise<{
    empathyResponse: string;
    firstQuestion: string;
    context: SymptomContext;
  }> {
    const detectedSymptom = this.detectPrimarySymptom(symptomMention);
    const symptomProfile = this.symptomDatabase.get(detectedSymptom);

    if (!symptomProfile) {
      return this.handleUnknownSymptom(userId, symptomMention, language);
    }

    // Create assessment context
    const context: SymptomContext = {
      primarySymptom: detectedSymptom,
      duration: '',
      severity: 'mild',
      associatedSymptoms: [],
      patientAge: userAge,
      patientGender: userGender,
      currentStep: 0,
      conversationHistory: [],
      assessmentComplete: false
    };

    this.activeAssessments.set(userId, context);

    // Generate empathetic response
    const empathyResponse = this.generateEmpathyResponse(detectedSymptom, language);
    
    // Get first follow-up question
    const firstQuestion = this.getNextQuestion(context, symptomProfile, language);

    return {
      empathyResponse,
      firstQuestion,
      context
    };
  }

  /**
   * Process user's answer and get next question
   */
  async processAnswer(
    userId: string,
    answer: string,
    language: Language = 'english'
  ): Promise<{
    acknowledgment: string;
    nextQuestion?: string;
    assessment?: AssessmentResult;
    isComplete: boolean;
  }> {
    const context = this.activeAssessments.get(userId);
    if (!context) {
      throw new Error('No active assessment found for user');
    }

    const symptomProfile = this.symptomDatabase.get(context.primarySymptom);
    if (!symptomProfile) {
      throw new Error('Symptom profile not found');
    }

    // Process the answer based on current question type
    const currentQuestionType = this.getCurrentQuestionType(context, symptomProfile);
    this.updateContextWithAnswer(context, answer, currentQuestionType);

    // Generate acknowledgment
    const acknowledgment = this.generateAcknowledment(answer, currentQuestionType, language);

    // Check if assessment is complete
    if (this.isAssessmentComplete(context, symptomProfile)) {
      const assessment = await this.generateAssessment(context, symptomProfile, language);
      context.assessmentComplete = true;
      
      return {
        acknowledgment,
        assessment,
        isComplete: true
      };
    }

    // Get next question
    context.currentStep++;
    const nextQuestion = this.getNextQuestion(context, symptomProfile, language);

    return {
      acknowledgment,
      nextQuestion,
      isComplete: false
    };
  }

  /**
   * Generate empathetic response to symptom mention
   */
  private generateEmpathyResponse(symptom: string, language: Language): string {
    const responses = {
      english: {
        fever: "I understand you're feeling unwell with a fever. That can be quite uncomfortable. Let me ask you a few questions to better understand your condition so I can provide you with the most helpful guidance.",
        headache: "I'm sorry to hear you're experiencing a headache. Headaches can really affect your day. I'd like to ask you some questions to understand what might be causing it and how we can help you feel better.",
        cough: "A cough can be really bothersome, especially if it's been going on for a while. I'd like to learn more about your symptoms to give you the best advice possible.",
        stomach_pain: "Stomach pain can be very uncomfortable and concerning. Let me ask you some questions to understand what might be causing it and how we can help you feel better.",
        chest_pain: "I understand you're experiencing chest pain, which can be very worrying. This is something we need to take seriously. Let me ask you some important questions to assess your situation.",
        default: "I can see you're not feeling well, and I want to help you understand your symptoms better. Let me ask you a few questions so I can provide you with the most appropriate guidance."
      },
      hindi: {
        fever: "मुझे समझ आ रहा है कि आपको बुखार है और आप अस्वस्थ महसूस कर रहे हैं। यह काफी परेशान करने वाला हो सकता है। मैं आपसे कुछ सवाल पूछूंगा ताकि आपकी स्थिति को बेहतर समझ सकूं।",
        headache: "मुझे खुशी है कि आपने सिरदर्द के बारे में बताया। सिरदर्द वाकई आपके दिन को प्रभावित कर सकता है। मैं कुछ सवाल पूछना चाहूंगा ताकि समझ सकूं कि इसका कारण क्या हो सकता है।",
        default: "मैं देख सकता हूं कि आप अस्वस्थ महसूस कर रहे हैं। मैं आपके लक्षणों को बेहतर समझने में आपकी मदद करना चाहता हूं।"
      }
    };

    const langResponses = responses[language] || responses.english;
    return langResponses[symptom] || langResponses.default;
  }

  /**
   * Get next appropriate question based on context
   */
  private getNextQuestion(context: SymptomContext, profile: SymptomProfile, language: Language): string {
    const questionType = this.getCurrentQuestionType(context, profile);
    const questions = this.getQuestionsForSymptom(context.primarySymptom, language);

    switch (questionType) {
      case 'duration':
        return questions.duration[Math.floor(Math.random() * questions.duration.length)];
      case 'severity':
        return questions.severity[Math.floor(Math.random() * questions.severity.length)];
      case 'associated_symptoms':
        return this.generateAssociatedSymptomsQuestion(context.primarySymptom, language);
      case 'location':
        return questions.location?.[0] || questions.severity[0];
      case 'triggers':
        return questions.triggers?.[0] || questions.associated_symptoms[0];
      default:
        return questions.duration[0];
    }
  }

  /**
   * Generate human-like questions for each symptom
   */
  private getQuestionsForSymptom(symptom: string, language: Language): any {
    const questionBank = {
      english: {
        fever: {
          duration: [
            "Since when have you been experiencing this fever? Has it been a few hours, days, or longer?",
            "How long have you had this fever? When did you first notice your temperature was high?",
            "Can you tell me when this fever started? Was it sudden or gradual?"
          ],
          severity: [
            "How high would you say your fever is? Do you feel very hot, or is it a mild temperature?",
            "On a scale where you feel slightly warm to very hot, how would you describe your fever?",
            "Are you feeling very feverish with chills, or is it more of a mild warmth?"
          ],
          associated_symptoms: [
            "Along with the fever, are you experiencing any other symptoms?",
            "Besides the fever, have you noticed anything else bothering you?"
          ],
          location: [
            "Do you feel the heat more in any particular part of your body?"
          ],
          triggers: [
            "Did anything specific happen before the fever started? Any recent travel, exposure to sick people, or changes in your routine?"
          ]
        },
        headache: {
          duration: [
            "How long have you been having this headache? Did it start today or has it been going on for a while?",
            "When did this headache begin? Has it been constant or does it come and go?",
            "Can you tell me about when this headache started? Was it sudden or did it build up gradually?"
          ],
          severity: [
            "How would you describe the intensity of your headache? Is it mild, moderate, or quite severe?",
            "On a scale from a dull ache to a throbbing pain, how bad is your headache?",
            "Is this headache interfering with your daily activities, or is it manageable?"
          ],
          associated_symptoms: [
            "Along with the headache, are you experiencing any other symptoms like nausea, sensitivity to light, or dizziness?"
          ],
          location: [
            "Where exactly do you feel the headache? Is it on one side, both sides, or all over your head?",
            "Can you point to where the pain is strongest? Front, back, sides, or all over?"
          ],
          triggers: [
            "Did anything trigger this headache? Stress, lack of sleep, certain foods, or screen time?"
          ]
        },
        cough: {
          duration: [
            "How long have you had this cough? Is it something that started recently or has it been bothering you for a while?",
            "When did you first notice this cough? Has it been getting better, worse, or staying the same?"
          ],
          severity: [
            "How would you describe your cough? Is it a dry cough or are you bringing up phlegm?",
            "Is this cough keeping you awake at night, or is it more of a daytime issue?",
            "How frequent is the coughing? Is it constant or does it come in episodes?"
          ],
          associated_symptoms: [
            "Besides the cough, are you experiencing any other symptoms like fever, sore throat, or difficulty breathing?"
          ]
        },
        stomach_pain: {
          duration: [
            "How long have you been experiencing this stomach pain? Did it start suddenly or gradually?",
            "When did this stomach discomfort begin? Has it been constant or does it come in waves?"
          ],
          severity: [
            "How would you rate the pain? Is it a mild discomfort, moderate pain, or quite severe?",
            "Is the pain sharp and stabbing, or more of a dull ache or cramping feeling?"
          ],
          location: [
            "Where exactly do you feel the pain in your stomach? Upper part, lower part, or all over?",
            "Can you point to where it hurts the most? Is it more on the right side, left side, or center?"
          ],
          associated_symptoms: [
            "Along with the stomach pain, have you experienced nausea, vomiting, diarrhea, or loss of appetite?"
          ],
          triggers: [
            "Did you eat anything unusual before the pain started? Or have you been under stress lately?"
          ]
        }
      },
      hindi: {
        fever: {
          duration: [
            "आपको कब से बुखार है? क्या यह कुछ घंटों से है या कई दिनों से?",
            "बुखार कब शुरू हुआ था? क्या अचानक आया या धीरे-धीरे बढ़ा?"
          ],
          severity: [
            "बुखार कितना तेज है? क्या आप बहुत गर्म महसूस कर रहे हैं या हल्का सा?",
            "क्या आपको ठंड भी लग रही है या सिर्फ गर्मी महसूस हो रही है?"
          ],
          associated_symptoms: [
            "बुखार के साथ-साथ क्या आपको कोई और परेशानी भी है?"
          ]
        }
      }
    };

    const langQuestions = questionBank[language] || questionBank.english;
    return langQuestions[symptom] || langQuestions.fever;
  }

  /**
   * Generate associated symptoms question
   */
  private generateAssociatedSymptomsQuestion(symptom: string, language: Language): string {
    const associatedSymptoms = {
      english: {
        fever: "Along with the fever, are you experiencing any of these symptoms: cough, body aches, chills, headache, sore throat, or loss of appetite?",
        headache: "Besides the headache, do you have any nausea, vomiting, sensitivity to light, neck stiffness, or vision problems?",
        cough: "Along with the cough, do you have fever, sore throat, runny nose, body aches, or difficulty breathing?",
        stomach_pain: "With the stomach pain, are you experiencing nausea, vomiting, diarrhea, bloating, or loss of appetite?"
      },
      hindi: {
        fever: "बुखार के साथ क्या आपको खांसी, बदन दर्द, कंपकंपी, सिरदर्द, गले में खराश, या भूख न लगना जैसी समस्या है?",
        headache: "सिरदर्द के साथ क्या आपको जी मिचलाना, उल्टी, रोशनी से परेशानी, या गर्दन में अकड़न है?",
        cough: "खांसी के साथ क्या आपको बुखार, गले में खराश, नाक बहना, या सांस लेने में तकलीफ है?"
      }
    };

    const langSymptoms = associatedSymptoms[language] || associatedSymptoms.english;
    return langSymptoms[symptom] || langSymptoms.fever;
  }

  /**
   * Generate acknowledgment for user's answer
   */
  private generateAcknowledment(answer: string, questionType: string, language: Language): string {
    const acknowledgments = {
      english: {
        duration: [
          "I see, thank you for letting me know about the timing.",
          "That's helpful information about when it started.",
          "Thank you for sharing that detail with me."
        ],
        severity: [
          "I understand how you're feeling.",
          "Thank you for describing that to me.",
          "That gives me a good sense of what you're experiencing."
        ],
        associated_symptoms: [
          "Thank you for sharing those additional symptoms.",
          "That's very helpful to know.",
          "I appreciate you providing those details."
        ],
        general: [
          "I understand.",
          "Thank you for sharing that.",
          "That's helpful to know."
        ]
      },
      hindi: {
        duration: [
          "समझ गया, समय के बारे में बताने के लिए धन्यवाद।",
          "यह जानकारी मददगार है।"
        ],
        severity: [
          "मैं समझ गया कि आप कैसा महसूस कर रहे हैं।",
          "इसे बताने के लिए धन्यवाद।"
        ],
        general: [
          "समझ गया।",
          "यह बताने के लिए धन्यवाद।"
        ]
      }
    };

    const langAcks = acknowledgments[language] || acknowledgments.english;
    const typeAcks = langAcks[questionType] || langAcks.general;
    return typeAcks[Math.floor(Math.random() * typeAcks.length)];
  }

  /**
   * Generate final assessment with recommendations
   */
  private async generateAssessment(
    context: SymptomContext,
    profile: SymptomProfile,
    language: Language
  ): Promise<AssessmentResult> {
    const assessment = this.analyzeSymptoms(context, profile);
    
    return {
      possibleConditions: assessment.conditions,
      urgencyLevel: assessment.urgency,
      recommendations: {
        immediate_actions: this.getImmediateActions(context, language),
        preventive_measures: this.getPreventiveMeasures(context.primarySymptom, language),
        when_to_see_doctor: this.getWhenToSeeDoctor(assessment.urgency, language),
        home_remedies: this.getHomeRemedies(context.primarySymptom, language)
      },
      redFlags: this.getRedFlags(context.primarySymptom, language)
    };
  }

  /**
   * Initialize symptom database with profiles
   */
  private initializeSymptomDatabase(): void {
    // Fever profile
    this.symptomDatabase.set('fever', {
      name: 'fever',
      questionFlow: ['duration', 'severity', 'associated_symptoms', 'triggers'],
      associatedSymptoms: ['cough', 'headache', 'body_aches', 'chills', 'sore_throat'],
      redFlags: ['high_fever_over_103', 'difficulty_breathing', 'chest_pain', 'severe_headache'],
      commonCauses: ['viral_infection', 'bacterial_infection', 'flu', 'covid19']
    });

    // Headache profile
    this.symptomDatabase.set('headache', {
      name: 'headache',
      questionFlow: ['duration', 'severity', 'location', 'associated_symptoms', 'triggers'],
      associatedSymptoms: ['nausea', 'vomiting', 'light_sensitivity', 'neck_stiffness'],
      redFlags: ['sudden_severe_headache', 'neck_stiffness', 'vision_changes', 'confusion'],
      commonCauses: ['tension_headache', 'migraine', 'sinus_headache', 'cluster_headache']
    });

    // Cough profile
    this.symptomDatabase.set('cough', {
      name: 'cough',
      questionFlow: ['duration', 'severity', 'associated_symptoms', 'triggers'],
      associatedSymptoms: ['fever', 'sore_throat', 'runny_nose', 'difficulty_breathing'],
      redFlags: ['blood_in_cough', 'severe_difficulty_breathing', 'chest_pain'],
      commonCauses: ['common_cold', 'flu', 'bronchitis', 'allergies']
    });

    // Add more symptoms...
  }

  // Helper methods
  private detectPrimarySymptom(text: string): string {
    const symptoms = ['fever', 'headache', 'cough', 'stomach_pain', 'chest_pain', 'sore_throat'];
    const lowerText = text.toLowerCase();
    
    for (const symptom of symptoms) {
      if (lowerText.includes(symptom.replace('_', ' ')) || 
          lowerText.includes(symptom) ||
          this.getSymptomSynonyms(symptom).some(syn => lowerText.includes(syn))) {
        return symptom;
      }
    }
    
    return 'general';
  }

  private getSymptomSynonyms(symptom: string): string[] {
    const synonyms = {
      fever: ['temperature', 'hot', 'burning', 'feverish'],
      headache: ['head pain', 'migraine', 'head ache'],
      cough: ['coughing', 'hack'],
      stomach_pain: ['stomach ache', 'belly pain', 'abdominal pain', 'tummy ache']
    };
    return synonyms[symptom] || [];
  }

  private getCurrentQuestionType(context: SymptomContext, profile: SymptomProfile): string {
    if (context.currentStep < profile.questionFlow.length) {
      return profile.questionFlow[context.currentStep];
    }
    return 'complete';
  }

  private updateContextWithAnswer(context: SymptomContext, answer: string, questionType: string): void {
    const step: ConversationStep = {
      question: questionType,
      answer: answer,
      questionType: questionType as any,
      timestamp: new Date().toISOString()
    };
    
    context.conversationHistory.push(step);

    // Update specific context fields based on question type
    switch (questionType) {
      case 'duration':
        context.duration = answer;
        break;
      case 'severity':
        context.severity = this.parseSeverity(answer);
        break;
      case 'associated_symptoms':
        context.associatedSymptoms = this.parseAssociatedSymptoms(answer);
        break;
    }
  }

  private parseSeverity(answer: string): 'mild' | 'moderate' | 'severe' {
    const lowerAnswer = answer.toLowerCase();
    if (lowerAnswer.includes('severe') || lowerAnswer.includes('very') || lowerAnswer.includes('bad')) {
      return 'severe';
    } else if (lowerAnswer.includes('moderate') || lowerAnswer.includes('medium')) {
      return 'moderate';
    }
    return 'mild';
  }

  private parseAssociatedSymptoms(answer: string): string[] {
    const symptoms = ['cough', 'headache', 'nausea', 'vomiting', 'diarrhea', 'chills', 'body_aches'];
    const lowerAnswer = answer.toLowerCase();
    return symptoms.filter(symptom => lowerAnswer.includes(symptom.replace('_', ' ')));
  }

  private isAssessmentComplete(context: SymptomContext, profile: SymptomProfile): boolean {
    return context.currentStep >= profile.questionFlow.length - 1;
  }

  private analyzeSymptoms(context: SymptomContext, profile: SymptomProfile): any {
    // Simple analysis logic - in production, this would be more sophisticated
    const conditions = profile.commonCauses.map(cause => ({
      condition: cause.replace('_', ' '),
      probability: 'medium' as const,
      description: `Based on your symptoms, this could be ${cause.replace('_', ' ')}.`
    }));

    const urgency = this.determineUrgency(context, profile);

    return { conditions, urgency };
  }

  private determineUrgency(context: SymptomContext, profile: SymptomProfile): 'immediate' | 'same_day' | 'few_days' | 'home_care' {
    // Check for red flags
    const hasRedFlags = profile.redFlags.some(flag => 
      context.conversationHistory.some(step => 
        step.answer.toLowerCase().includes(flag.replace('_', ' '))
      )
    );

    if (hasRedFlags || context.severity === 'severe') {
      return 'immediate';
    } else if (context.severity === 'moderate') {
      return 'same_day';
    }
    return 'home_care';
  }

  private getImmediateActions(context: SymptomContext, language: Language): string[] {
    const actions = {
      english: {
        fever: ['Rest and stay hydrated', 'Take temperature regularly', 'Use fever-reducing medication if needed'],
        headache: ['Rest in a quiet, dark room', 'Apply cold or warm compress', 'Stay hydrated'],
        default: ['Rest and monitor symptoms', 'Stay hydrated', 'Avoid strenuous activities']
      }
    };

    const langActions = actions[language] || actions.english;
    return langActions[context.primarySymptom] || langActions.default;
  }

  private getPreventiveMeasures(symptom: string, language: Language): string[] {
    const measures = {
      english: {
        fever: ['Wash hands frequently', 'Avoid close contact with sick people', 'Get adequate sleep', 'Maintain good nutrition'],
        headache: ['Manage stress', 'Get regular sleep', 'Stay hydrated', 'Limit screen time'],
        default: ['Maintain good hygiene', 'Get adequate rest', 'Eat nutritious food', 'Exercise regularly']
      }
    };

    const langMeasures = measures[language] || measures.english;
    return langMeasures[symptom] || langMeasures.default;
  }

  private getWhenToSeeDoctor(urgency: string, language: Language): string {
    const guidance = {
      english: {
        immediate: 'Seek medical attention immediately or call emergency services.',
        same_day: 'Contact your doctor today or visit a clinic.',
        few_days: 'If symptoms persist or worsen over the next 2-3 days, consult a doctor.',
        home_care: 'Monitor symptoms and see a doctor if they worsen or don\'t improve in a week.'
      }
    };

    const langGuidance = guidance[language] || guidance.english;
    return langGuidance[urgency];
  }

  private getHomeRemedies(symptom: string, language: Language): string[] {
    const remedies = {
      english: {
        fever: ['Drink plenty of fluids', 'Take lukewarm baths', 'Wear light clothing', 'Use a fan or cool compress'],
        headache: ['Apply ice pack or warm compress', 'Massage temples gently', 'Practice relaxation techniques', 'Ensure good posture'],
        cough: ['Drink warm liquids', 'Use honey (for adults)', 'Stay in humid environment', 'Avoid irritants'],
        default: ['Rest adequately', 'Stay hydrated', 'Eat light, nutritious meals']
      }
    };

    const langRemedies = remedies[language] || remedies.english;
    return langRemedies[symptom] || langRemedies.default;
  }

  private getRedFlags(symptom: string, language: Language): string[] {
    const redFlags = {
      english: {
        fever: ['Temperature above 103°F (39.4°C)', 'Difficulty breathing', 'Severe headache', 'Persistent vomiting'],
        headache: ['Sudden, severe headache', 'Neck stiffness', 'Vision changes', 'Confusion or altered consciousness'],
        default: ['Severe or worsening symptoms', 'Difficulty breathing', 'Chest pain', 'Loss of consciousness']
      }
    };

    const langFlags = redFlags[language] || redFlags.english;
    return langFlags[symptom] || langFlags.default;
  }

  private handleUnknownSymptom(userId: string, symptom: string, language: Language): any {
    return {
      empathyResponse: "I understand you're not feeling well. While I may not have specific information about your exact symptoms, I'd still like to help you as best I can.",
      firstQuestion: "Can you describe what you're experiencing in more detail? When did these symptoms start?",
      context: {
        primarySymptom: 'general',
        duration: '',
        severity: 'mild',
        associatedSymptoms: [],
        currentStep: 0,
        conversationHistory: [],
        assessmentComplete: false
      }
    };
  }
}

interface SymptomProfile {
  name: string;
  questionFlow: string[];
  associatedSymptoms: string[];
  redFlags: string[];
  commonCauses: string[];
}

export const symptomAssessmentService = SymptomAssessmentService.getInstance();
