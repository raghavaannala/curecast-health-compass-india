/**
 * Natural Language Processing Service
 * Provides intelligent symptom analysis and health query processing
 */

interface SymptomAnalysis {
  symptoms: string[];
  possibleConditions: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  recommendations: string[];
  confidence: number;
}

interface HealthQuery {
  id: string;
  query: string;
  language: string;
  intent: string;
  entities: Record<string, any>;
  response: string;
  confidence: number;
  timestamp: string;
}

interface IntentClassification {
  intent: string;
  confidence: number;
  entities: Array<{
    entity: string;
    value: string;
    start: number;
    end: number;
  }>;
}

class NLPService {
  private symptomDatabase: Map<string, any> = new Map();
  private intentPatterns: Map<string, RegExp[]> = new Map();
  private queryHistory: HealthQuery[] = [];
  private accuracyMetrics: { correct: number; total: number } = { correct: 0, total: 0 };

  constructor() {
    this.initializeSymptomDatabase();
    this.initializeIntentPatterns();
  }

  /**
   * Initialize symptom database with medical knowledge
   */
  private initializeSymptomDatabase(): void {
    const symptoms = [
      {
        name: 'fever',
        keywords: ['fever', 'temperature', 'hot', 'chills', 'बुखार', 'तापमान'],
        conditions: ['viral infection', 'bacterial infection', 'malaria', 'dengue', 'typhoid'],
        urgency: 'medium'
      },
      {
        name: 'cough',
        keywords: ['cough', 'coughing', 'खांसी', 'कफ'],
        conditions: ['cold', 'flu', 'bronchitis', 'pneumonia', 'tuberculosis'],
        urgency: 'low'
      },
      {
        name: 'headache',
        keywords: ['headache', 'head pain', 'migraine', 'सिरदर्द'],
        conditions: ['tension headache', 'migraine', 'sinusitis', 'hypertension'],
        urgency: 'low'
      },
      {
        name: 'chest_pain',
        keywords: ['chest pain', 'heart pain', 'छाती में दर्द', 'दिल का दर्द'],
        conditions: ['heart attack', 'angina', 'acid reflux', 'muscle strain'],
        urgency: 'emergency'
      },
      {
        name: 'difficulty_breathing',
        keywords: ['breathless', 'shortness of breath', 'difficulty breathing', 'सांस लेने में तकलीफ'],
        conditions: ['asthma', 'pneumonia', 'heart failure', 'covid-19'],
        urgency: 'high'
      },
      {
        name: 'stomach_pain',
        keywords: ['stomach pain', 'abdominal pain', 'belly ache', 'पेट दर्द'],
        conditions: ['gastritis', 'appendicitis', 'food poisoning', 'ulcer'],
        urgency: 'medium'
      },
      {
        name: 'diarrhea',
        keywords: ['diarrhea', 'loose motions', 'दस्त', 'पतले दस्त'],
        conditions: ['food poisoning', 'viral gastroenteritis', 'bacterial infection'],
        urgency: 'medium'
      },
      {
        name: 'vomiting',
        keywords: ['vomiting', 'nausea', 'throwing up', 'उल्टी', 'जी मिचलाना'],
        conditions: ['food poisoning', 'gastritis', 'migraine', 'pregnancy'],
        urgency: 'medium'
      }
    ];

    symptoms.forEach(symptom => {
      this.symptomDatabase.set(symptom.name, symptom);
    });
  }

  /**
   * Initialize intent classification patterns
   */
  private initializeIntentPatterns(): void {
    this.intentPatterns.set('symptom_check', [
      /i have|i am experiencing|i feel|मुझे|मैं महसूस कर रहा हूं/i,
      /symptoms?|लक्षण/i,
      /pain|दर्द|ache|hurt/i
    ]);

    this.intentPatterns.set('medication_query', [
      /medicine|medication|drug|दवा|दवाई/i,
      /dosage|dose|खुराक/i,
      /side effects|побочные эффекты|साइड इफेक्ट/i
    ]);

    this.intentPatterns.set('vaccination_info', [
      /vaccine|vaccination|टीका|टीकाकरण/i,
      /immunization|प्रतिरक्षण/i,
      /schedule|कार्यक्रम/i
    ]);

    this.intentPatterns.set('emergency', [
      /emergency|urgent|critical|आपातकाल|तुरंत/i,
      /ambulance|एम्बुलेंस/i,
      /hospital|अस्पताल/i
    ]);

    this.intentPatterns.set('prevention', [
      /prevent|prevention|बचाव|रोकथाम/i,
      /avoid|बचना/i,
      /precaution|सावधानी/i
    ]);

    this.intentPatterns.set('health_education', [
      /what is|क्या है/i,
      /how to|कैसे/i,
      /information|जानकारी/i,
      /learn|सीखना/i
    ]);
  }

  /**
   * Analyze symptoms from user input
   */
  async analyzeSymptoms(input: string, language: string = 'en'): Promise<SymptomAnalysis> {
    try {
      const detectedSymptoms: string[] = [];
      const possibleConditions: string[] = [];
      let maxUrgency = 'low';
      let totalConfidence = 0;

      // Normalize input
      const normalizedInput = input.toLowerCase();

      // Detect symptoms
      for (const [symptomName, symptomData] of this.symptomDatabase.entries()) {
        const isDetected = symptomData.keywords.some((keyword: string) => 
          normalizedInput.includes(keyword.toLowerCase())
        );

        if (isDetected) {
          detectedSymptoms.push(symptomName);
          possibleConditions.push(...symptomData.conditions);
          
          // Update urgency level
          if (this.getUrgencyPriority(symptomData.urgency) > this.getUrgencyPriority(maxUrgency)) {
            maxUrgency = symptomData.urgency;
          }
          
          totalConfidence += 0.8; // Base confidence for keyword match
        }
      }

      // Remove duplicate conditions
      const uniqueConditions = [...new Set(possibleConditions)];

      // Generate recommendations
      const recommendations = this.generateRecommendations(detectedSymptoms, maxUrgency, language);

      // Calculate overall confidence
      const confidence = Math.min(totalConfidence / detectedSymptoms.length || 0.3, 1.0);

      return {
        symptoms: detectedSymptoms,
        possibleConditions: uniqueConditions.slice(0, 5), // Top 5 conditions
        urgencyLevel: maxUrgency as any,
        recommendations,
        confidence
      };
    } catch (error) {
      console.error('Symptom analysis failed:', error);
      return {
        symptoms: [],
        possibleConditions: [],
        urgencyLevel: 'low',
        recommendations: ['Please consult a healthcare professional for proper diagnosis.'],
        confidence: 0.1
      };
    }
  }

  /**
   * Classify user intent
   */
  classifyIntent(query: string): IntentClassification {
    const normalizedQuery = query.toLowerCase();
    let bestMatch = { intent: 'general', confidence: 0.3 };

    for (const [intent, patterns] of this.intentPatterns.entries()) {
      const matches = patterns.filter(pattern => pattern.test(normalizedQuery));
      const confidence = matches.length / patterns.length;

      if (confidence > bestMatch.confidence) {
        bestMatch = { intent, confidence };
      }
    }

    // Extract entities (simplified)
    const entities = this.extractEntities(query);

    return {
      intent: bestMatch.intent,
      confidence: bestMatch.confidence,
      entities
    };
  }

  /**
   * Process health query with NLP
   */
  async processHealthQuery(query: string, language: string = 'en'): Promise<HealthQuery> {
    try {
      const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Classify intent
      const intentResult = this.classifyIntent(query);
      
      // Generate response based on intent
      let response = '';
      let confidence = intentResult.confidence;

      switch (intentResult.intent) {
        case 'symptom_check':
          const symptomAnalysis = await this.analyzeSymptoms(query, language);
          response = this.formatSymptomResponse(symptomAnalysis, language);
          confidence = symptomAnalysis.confidence;
          break;

        case 'medication_query':
          response = this.handleMedicationQuery(query, language);
          break;

        case 'vaccination_info':
          response = this.handleVaccinationQuery(query, language);
          break;

        case 'emergency':
          response = this.handleEmergencyQuery(query, language);
          confidence = 0.9; // High confidence for emergency
          break;

        case 'prevention':
          response = this.handlePreventionQuery(query, language);
          break;

        case 'health_education':
          response = this.handleEducationQuery(query, language);
          break;

        default:
          response = this.handleGeneralQuery(query, language);
      }

      const healthQuery: HealthQuery = {
        id: queryId,
        query,
        language,
        intent: intentResult.intent,
        entities: intentResult.entities.reduce((acc, entity) => {
          acc[entity.entity] = entity.value;
          return acc;
        }, {} as Record<string, any>),
        response,
        confidence,
        timestamp: new Date().toISOString()
      };

      this.queryHistory.push(healthQuery);
      this.updateAccuracyMetrics(confidence);

      return healthQuery;
    } catch (error) {
      console.error('Health query processing failed:', error);
      
      return {
        id: `error_${Date.now()}`,
        query,
        language,
        intent: 'error',
        entities: {},
        response: language === 'hi' 
          ? 'क्षमा करें, मैं आपकी क्वेरी को समझ नहीं पाया। कृपया दोबारा कोशिश करें।'
          : 'Sorry, I could not understand your query. Please try again.',
        confidence: 0.1,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Extract entities from query
   */
  private extractEntities(query: string): Array<{entity: string; value: string; start: number; end: number}> {
    const entities: Array<{entity: string; value: string; start: number; end: number}> = [];
    
    // Extract age
    const ageMatch = query.match(/(\d+)\s*(years?|year old|साल)/i);
    if (ageMatch) {
      entities.push({
        entity: 'age',
        value: ageMatch[1],
        start: ageMatch.index || 0,
        end: (ageMatch.index || 0) + ageMatch[0].length
      });
    }

    // Extract gender
    const genderMatch = query.match(/(male|female|man|woman|boy|girl|पुरुष|महिला|लड़का|लड़की)/i);
    if (genderMatch) {
      entities.push({
        entity: 'gender',
        value: genderMatch[1],
        start: genderMatch.index || 0,
        end: (genderMatch.index || 0) + genderMatch[0].length
      });
    }

    // Extract duration
    const durationMatch = query.match(/(\d+)\s*(days?|weeks?|months?|दिन|सप्ताह|महीने)/i);
    if (durationMatch) {
      entities.push({
        entity: 'duration',
        value: `${durationMatch[1]} ${durationMatch[2]}`,
        start: durationMatch.index || 0,
        end: (durationMatch.index || 0) + durationMatch[0].length
      });
    }

    return entities;
  }

  /**
   * Generate recommendations based on symptoms
   */
  private generateRecommendations(symptoms: string[], urgency: string, language: string): string[] {
    const recommendations: string[] = [];

    if (urgency === 'emergency') {
      recommendations.push(
        language === 'hi' 
          ? '🚨 तुरंत नजदीकी अस्पताल जाएं या 108 पर कॉल करें'
          : '🚨 Seek immediate medical attention or call 108'
      );
    } else if (urgency === 'high') {
      recommendations.push(
        language === 'hi'
          ? '⚠️ जल्दी डॉक्टर से मिलें'
          : '⚠️ Consult a doctor soon'
      );
    } else {
      recommendations.push(
        language === 'hi'
          ? '💡 आराम करें और पानी पिएं'
          : '💡 Rest and stay hydrated'
      );
    }

    // Add specific recommendations based on symptoms
    if (symptoms.includes('fever')) {
      recommendations.push(
        language === 'hi'
          ? '🌡️ बुखार कम करने के लिए ठंडे पानी की पट्टी करें'
          : '🌡️ Use cold compress to reduce fever'
      );
    }

    if (symptoms.includes('cough')) {
      recommendations.push(
        language === 'hi'
          ? '🍯 गर्म पानी में शहद मिलाकर पिएं'
          : '🍯 Drink warm water with honey'
      );
    }

    return recommendations;
  }

  /**
   * Format symptom analysis response
   */
  private formatSymptomResponse(analysis: SymptomAnalysis, language: string): string {
    if (language === 'hi') {
      return `आपके लक्षणों के आधार पर:\n\n` +
             `🔍 पहचाने गए लक्षण: ${analysis.symptoms.join(', ')}\n` +
             `🏥 संभावित स्थितियां: ${analysis.possibleConditions.join(', ')}\n` +
             `⚠️ गंभीरता: ${analysis.urgencyLevel}\n\n` +
             `सुझाव:\n${analysis.recommendations.map(r => `• ${r}`).join('\n')}\n\n` +
             `⚠️ यह केवल प्रारंभिक जानकारी है। सटीक निदान के लिए डॉक्टर से मिलें।`;
    } else {
      return `Based on your symptoms:\n\n` +
             `🔍 Detected symptoms: ${analysis.symptoms.join(', ')}\n` +
             `🏥 Possible conditions: ${analysis.possibleConditions.join(', ')}\n` +
             `⚠️ Urgency level: ${analysis.urgencyLevel}\n\n` +
             `Recommendations:\n${analysis.recommendations.map(r => `• ${r}`).join('\n')}\n\n` +
             `⚠️ This is preliminary information only. Consult a doctor for accurate diagnosis.`;
    }
  }

  /**
   * Handle medication queries
   */
  private handleMedicationQuery(query: string, language: string): string {
    return language === 'hi'
      ? '💊 दवाओं के बारे में जानकारी के लिए कृपया डॉक्टर या फार्मासिस्ट से सलाह लें। स्व-चिकित्सा न करें।'
      : '💊 For medication information, please consult a doctor or pharmacist. Do not self-medicate.';
  }

  /**
   * Handle vaccination queries
   */
  private handleVaccinationQuery(query: string, language: string): string {
    return language === 'hi'
      ? '💉 टीकाकरण की जानकारी के लिए नजदीकी स्वास्थ्य केंद्र से संपर्क करें या CoWIN पोर्टल देखें।'
      : '💉 For vaccination information, contact your nearest health center or check the CoWIN portal.';
  }

  /**
   * Handle emergency queries
   */
  private handleEmergencyQuery(query: string, language: string): string {
    return language === 'hi'
      ? '🚨 आपातकाल के लिए:\n• एम्बुलेंस: 108\n• पुलिस: 100\n• फायर ब्रिगेड: 101\n• तुरंत नजदीकी अस्पताल जाएं'
      : '🚨 For emergencies:\n• Ambulance: 108\n• Police: 100\n• Fire: 101\n• Go to nearest hospital immediately';
  }

  /**
   * Handle prevention queries
   */
  private handlePreventionQuery(query: string, language: string): string {
    return language === 'hi'
      ? '🛡️ बचाव के उपाय:\n• हाथ धोएं\n• मास्क पहनें\n• सामाजिक दूरी बनाए रखें\n• स्वस्थ आहार लें\n• नियमित व्यायाम करें'
      : '🛡️ Prevention measures:\n• Wash hands frequently\n• Wear masks\n• Maintain social distance\n• Eat healthy food\n• Exercise regularly';
  }

  /**
   * Handle health education queries
   */
  private handleEducationQuery(query: string, language: string): string {
    return language === 'hi'
      ? '📚 स्वास्थ्य शिक्षा के लिए विश्वसनीय स्रोतों से जानकारी लें। अधिक जानकारी के लिए स्वास्थ्य कार्यकर्ता से मिलें।'
      : '📚 For health education, get information from reliable sources. Contact health workers for more information.';
  }

  /**
   * Handle general queries
   */
  private handleGeneralQuery(query: string, language: string): string {
    return language === 'hi'
      ? 'मैं आपकी स्वास्थ्य संबंधी सहायता के लिए यहां हूं। कृपया अपने लक्षण या स्वास्थ्य प्रश्न बताएं।'
      : 'I am here to help with your health-related queries. Please describe your symptoms or health questions.';
  }

  /**
   * Get urgency priority for comparison
   */
  private getUrgencyPriority(urgency: string): number {
    const priorities = { low: 1, medium: 2, high: 3, emergency: 4 };
    return priorities[urgency as keyof typeof priorities] || 1;
  }

  /**
   * Update accuracy metrics
   */
  private updateAccuracyMetrics(confidence: number): void {
    this.accuracyMetrics.total++;
    if (confidence >= 0.7) {
      this.accuracyMetrics.correct++;
    }
  }

  /**
   * Get accuracy statistics
   */
  getAccuracyStats(): { accuracy: number; totalQueries: number; correctResponses: number } {
    const accuracy = this.accuracyMetrics.total > 0 
      ? (this.accuracyMetrics.correct / this.accuracyMetrics.total) * 100 
      : 0;

    return {
      accuracy: Math.round(accuracy * 100) / 100,
      totalQueries: this.accuracyMetrics.total,
      correctResponses: this.accuracyMetrics.correct
    };
  }

  /**
   * Get query history
   */
  getQueryHistory(limit: number = 100): HealthQuery[] {
    return this.queryHistory.slice(-limit);
  }
}

export const nlpService = new NLPService();
export default nlpService;
