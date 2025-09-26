import { 
  HealthKnowledgeBase, 
  Language, 
  SymptomTriageRule,
  GovernmentHealthFeed 
} from '../types';
import { languageService } from './languageService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Health Knowledge Base Service
 * Manages medical FAQs, symptom triage, and government health information
 */
export class HealthKnowledgeBaseService {
  private static instance: HealthKnowledgeBaseService;
  private knowledgeBase: Map<string, HealthKnowledgeBase> = new Map();
  private triageRules: Map<string, SymptomTriageRule> = new Map();
  private governmentFeeds: Map<string, GovernmentHealthFeed> = new Map();
  private searchIndex: Map<string, string[]> = new Map(); // keyword -> knowledge IDs

  public static getInstance(): HealthKnowledgeBaseService {
    if (!HealthKnowledgeBaseService.instance) {
      HealthKnowledgeBaseService.instance = new HealthKnowledgeBaseService();
    }
    return HealthKnowledgeBaseService.instance;
  }

  constructor() {
    this.initializeKnowledgeBase();
    this.initializeTriageRules();
    this.initializeGovernmentFeeds();
    this.buildSearchIndex();
  }

  /**
   * Search knowledge base for relevant information
   */
  async searchKnowledge(
    query: string, 
    language: Language = 'english',
    category?: string
  ): Promise<{
    results: HealthKnowledgeBase[];
    confidence: number;
    relatedQuestions: string[];
  }> {
    try {
      // Normalize query
      const normalizedQuery = query.toLowerCase().trim();
      
      // Translate query to English for searching if needed
      let searchQuery = normalizedQuery;
      if (language !== 'english') {
        searchQuery = await languageService.translateText(query, language, 'english');
      }

      // Find matching knowledge items
      const matches = this.findMatches(searchQuery, category);
      
      // Sort by relevance
      const sortedMatches = matches.sort((a, b) => b.score - a.score);
      
      // Get top results
      const topResults = sortedMatches.slice(0, 5).map(match => match.item);
      
      // Calculate overall confidence
      const confidence = sortedMatches.length > 0 ? sortedMatches[0].score : 0;
      
      // Get related questions
      const relatedQuestions = this.getRelatedQuestions(topResults, language);

      // Translate results if needed
      const translatedResults = await this.translateResults(topResults, language);

      return {
        results: translatedResults,
        confidence,
        relatedQuestions
      };

    } catch (error) {
      console.error('Error searching knowledge base:', error);
      return {
        results: [],
        confidence: 0,
        relatedQuestions: []
      };
    }
  }

  /**
   * Get symptom triage recommendation
   */
  async getSymptomTriage(
    symptoms: string[], 
    language: Language = 'english',
    patientAge?: number,
    patientGender?: 'male' | 'female' | 'other'
  ): Promise<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendation: 'self_care' | 'consult_doctor' | 'urgent_care' | 'emergency';
    advice: string;
    redFlags: string[];
    followUpQuestions: string[];
    confidence: number;
  }> {
    try {
      // Normalize symptoms
      const normalizedSymptoms = symptoms.map(s => s.toLowerCase().trim());
      
      // Find matching triage rules
      const matchingRules = this.findTriageMatches(normalizedSymptoms);
      
      if (matchingRules.length === 0) {
        return this.getDefaultTriageResponse(language);
      }

      // Get the most severe recommendation
      const mostSevereRule = matchingRules.reduce((prev, current) => {
        const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
        return severityOrder[current.severity] > severityOrder[prev.severity] ? current : prev;
      });

      // Translate advice if needed
      let advice = mostSevereRule.advice;
      if (language !== 'english') {
        advice = await languageService.translateText(advice, 'english', language);
      }

      // Get follow-up questions
      const followUpQuestions = mostSevereRule.followUpQuestions || [];
      const translatedFollowUp = await Promise.all(
        followUpQuestions.map(q => 
          language !== 'english' 
            ? languageService.translateText(q, 'english', language)
            : q
        )
      );

      return {
        severity: mostSevereRule.severity,
        recommendation: mostSevereRule.recommendation,
        advice,
        redFlags: mostSevereRule.redFlags,
        followUpQuestions: translatedFollowUp,
        confidence: this.calculateTriageConfidence(normalizedSymptoms, matchingRules)
      };

    } catch (error) {
      console.error('Error in symptom triage:', error);
      return this.getDefaultTriageResponse(language);
    }
  }

  /**
   * Get government health alerts for location
   */
  async getHealthAlerts(
    location: { state: string; district?: string; pincode?: string },
    language: Language = 'english'
  ): Promise<GovernmentHealthFeed[]> {
    try {
      const alerts = Array.from(this.governmentFeeds.values())
        .filter(feed => {
          // Check location match
          if (feed.location.state !== location.state) return false;
          
          // Check if alert is still valid
          if (feed.expiresAt && new Date(feed.expiresAt) < new Date()) return false;
          
          // Check district match if specified
          if (location.district && feed.location.districts) {
            return feed.location.districts.includes(location.district);
          }
          
          // Check pincode match if specified
          if (location.pincode && feed.location.pincodes) {
            return feed.location.pincodes.includes(location.pincode);
          }
          
          return true;
        })
        .sort((a, b) => {
          // Sort by severity and date
          const severityOrder = { info: 1, warning: 2, critical: 3 };
          if (severityOrder[a.severity] !== severityOrder[b.severity]) {
            return severityOrder[b.severity] - severityOrder[a.severity];
          }
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        });

      // Translate alerts if needed
      if (language !== 'english') {
        for (const alert of alerts) {
          if (alert.language !== language) {
            alert.title = await languageService.translateText(alert.title, alert.language, language);
            alert.description = await languageService.translateText(alert.description, alert.language, language);
            if (alert.actionRequired) {
              alert.actionRequired = await languageService.translateText(alert.actionRequired, alert.language, language);
            }
          }
        }
      }

      return alerts;

    } catch (error) {
      console.error('Error getting health alerts:', error);
      return [];
    }
  }

  /**
   * Add new knowledge item
   */
  async addKnowledgeItem(item: Omit<HealthKnowledgeBase, 'id' | 'lastUpdated'>): Promise<string> {
    const id = uuidv4();
    const knowledgeItem: HealthKnowledgeBase = {
      ...item,
      id,
      lastUpdated: new Date().toISOString()
    };

    this.knowledgeBase.set(id, knowledgeItem);
    this.updateSearchIndex(knowledgeItem);
    
    return id;
  }

  /**
   * Update existing knowledge item
   */
  async updateKnowledgeItem(id: string, updates: Partial<HealthKnowledgeBase>): Promise<boolean> {
    const existing = this.knowledgeBase.get(id);
    if (!existing) return false;

    const updated: HealthKnowledgeBase = {
      ...existing,
      ...updates,
      id,
      lastUpdated: new Date().toISOString()
    };

    this.knowledgeBase.set(id, updated);
    this.updateSearchIndex(updated);
    
    return true;
  }

  /**
   * Get vaccination information
   */
  async getVaccinationInfo(
    ageGroup: string,
    language: Language = 'english'
  ): Promise<HealthKnowledgeBase[]> {
    const vaccinationItems = Array.from(this.knowledgeBase.values())
      .filter(item => 
        item.category === 'vaccination' && 
        item.tags.includes(ageGroup.toLowerCase())
      );

    return this.translateResults(vaccinationItems, language);
  }

  /**
   * Get preventive healthcare information
   */
  async getPreventiveHealthInfo(
    category: 'nutrition' | 'hygiene' | 'exercise' | 'maternal_health' | 'child_health',
    language: Language = 'english'
  ): Promise<HealthKnowledgeBase[]> {
    const preventiveItems = Array.from(this.knowledgeBase.values())
      .filter(item => 
        item.category === 'prevention' && 
        item.tags.includes(category)
      );

    return this.translateResults(preventiveItems, language);
  }

  /**
   * Initialize comprehensive knowledge base
   */
  private initializeKnowledgeBase(): void {
    const knowledgeItems: HealthKnowledgeBase[] = [
      // Disease Information
      {
        id: 'kb_001',
        category: 'disease_info',
        question: 'What is dengue fever?',
        answer: 'Dengue fever is a mosquito-borne viral infection that causes flu-like symptoms including high fever, headache, muscle pain, and rash. It is transmitted by Aedes mosquitoes and is common in tropical areas.',
        language: 'english',
        tags: ['dengue', 'fever', 'mosquito', 'viral'],
        sources: ['WHO', 'ICMR', 'CDC'],
        lastUpdated: new Date().toISOString(),
        accuracy: 0.95,
        relatedQuestions: ['How to prevent dengue?', 'What are dengue symptoms?', 'Dengue treatment options']
      },
      {
        id: 'kb_002',
        category: 'prevention',
        question: 'How to prevent malaria?',
        answer: 'Prevent malaria by using mosquito nets, applying insect repellent, wearing long-sleeved clothes, eliminating standing water around homes, and taking antimalarial medication if traveling to high-risk areas.',
        language: 'english',
        tags: ['malaria', 'prevention', 'mosquito', 'nets'],
        sources: ['WHO', 'NVBDCP'],
        lastUpdated: new Date().toISOString(),
        accuracy: 0.98,
        relatedQuestions: ['What are malaria symptoms?', 'Malaria treatment', 'Mosquito control methods']
      },
      // Vaccination Information
      {
        id: 'kb_003',
        category: 'vaccination',
        question: 'When should children get measles vaccination?',
        answer: 'Children should receive the first dose of measles vaccine at 9 months and the second dose at 16-24 months as per the Indian immunization schedule. This provides protection against measles, mumps, and rubella.',
        language: 'english',
        tags: ['measles', 'vaccination', 'children', 'immunization', 'mmr'],
        sources: ['Ministry of Health', 'IAP', 'WHO'],
        lastUpdated: new Date().toISOString(),
        accuracy: 0.99,
        relatedQuestions: ['What is MMR vaccine?', 'Vaccination side effects', 'Child vaccination schedule']
      },
      // Nutrition
      {
        id: 'kb_004',
        category: 'nutrition',
        question: 'What foods help boost immunity?',
        answer: 'Foods that boost immunity include citrus fruits (vitamin C), leafy greens, yogurt (probiotics), nuts and seeds, turmeric, ginger, garlic, and foods rich in zinc like legumes and whole grains.',
        language: 'english',
        tags: ['immunity', 'nutrition', 'vitamins', 'healthy_eating'],
        sources: ['ICMR', 'NIN'],
        lastUpdated: new Date().toISOString(),
        accuracy: 0.92,
        relatedQuestions: ['Balanced diet for children', 'Vitamin deficiency symptoms', 'Healthy meal planning']
      },
      // Hygiene
      {
        id: 'kb_005',
        category: 'hygiene',
        question: 'How to wash hands properly?',
        answer: 'Wash hands with soap and water for at least 20 seconds. Wet hands, apply soap, rub palms, backs of hands, between fingers, under nails, and wrists. Rinse thoroughly and dry with clean towel.',
        language: 'english',
        tags: ['handwashing', 'hygiene', 'infection_prevention'],
        sources: ['WHO', 'CDC', 'Ministry of Health'],
        lastUpdated: new Date().toISOString(),
        accuracy: 0.99,
        relatedQuestions: ['When to wash hands?', 'Hand sanitizer vs soap', 'Personal hygiene tips']
      },
      // Maternal Health
      {
        id: 'kb_006',
        category: 'maternal_health',
        question: 'What are important prenatal care practices?',
        answer: 'Important prenatal care includes regular checkups, taking folic acid supplements, eating nutritious foods, avoiding alcohol and smoking, getting adequate rest, and monitoring fetal movements.',
        language: 'english',
        tags: ['pregnancy', 'prenatal', 'maternal_health', 'anc'],
        sources: ['FOGSI', 'WHO', 'Ministry of Health'],
        lastUpdated: new Date().toISOString(),
        accuracy: 0.96,
        relatedQuestions: ['Pregnancy nutrition', 'Warning signs in pregnancy', 'Delivery preparation']
      },
      // Child Health
      {
        id: 'kb_007',
        category: 'child_health',
        question: 'What are signs of dehydration in children?',
        answer: 'Signs of dehydration in children include dry mouth, decreased urination, sunken eyes, lethargy, crying without tears, and skin that stays pinched when lifted. Severe dehydration requires immediate medical attention.',
        language: 'english',
        tags: ['dehydration', 'children', 'emergency', 'symptoms'],
        sources: ['IAP', 'WHO', 'UNICEF'],
        lastUpdated: new Date().toISOString(),
        accuracy: 0.97,
        relatedQuestions: ['How to treat mild dehydration?', 'ORS preparation', 'When to see doctor for dehydration?']
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
    const triageRules: SymptomTriageRule[] = [
      {
        id: 'triage_001',
        symptoms: ['chest pain', 'difficulty breathing', 'shortness of breath'],
        conditions: ['heart attack', 'pulmonary embolism', 'pneumonia'],
        severity: 'critical',
        redFlags: ['severe chest pain', 'cannot breathe', 'blue lips'],
        recommendation: 'emergency',
        advice: 'Call emergency services immediately (108) or go to nearest hospital. This could be a heart attack or serious breathing problem.',
        language: 'english',
        followUpQuestions: ['How long have you had chest pain?', 'Are you having trouble breathing?', 'Do you have a history of heart problems?']
      },
      {
        id: 'triage_002',
        symptoms: ['high fever', 'severe headache', 'neck stiffness'],
        conditions: ['meningitis', 'encephalitis'],
        severity: 'critical',
        redFlags: ['neck stiffness', 'confusion', 'sensitivity to light'],
        recommendation: 'emergency',
        advice: 'Seek immediate medical attention. These symptoms could indicate a serious brain infection.',
        language: 'english',
        followUpQuestions: ['How high is the fever?', 'Can you touch chin to chest?', 'Any rash on body?']
      },
      {
        id: 'triage_003',
        symptoms: ['fever', 'cough', 'body ache'],
        conditions: ['flu', 'viral infection', 'covid-19'],
        severity: 'medium',
        redFlags: ['difficulty breathing', 'persistent high fever'],
        recommendation: 'consult_doctor',
        advice: 'Monitor symptoms and consult a doctor if fever persists or breathing becomes difficult. Rest and stay hydrated.',
        language: 'english',
        followUpQuestions: ['How many days have you had fever?', 'Any contact with sick people?', 'Are you vaccinated?']
      },
      {
        id: 'triage_004',
        symptoms: ['mild headache', 'runny nose', 'sneezing'],
        conditions: ['common cold', 'allergies'],
        severity: 'low',
        redFlags: [],
        recommendation: 'self_care',
        advice: 'Rest, drink plenty of fluids, and use over-the-counter medications if needed. See a doctor if symptoms worsen or persist beyond a week.',
        language: 'english',
        followUpQuestions: ['Any known allergies?', 'Recent exposure to dust or pollen?', 'Taking any medications?']
      },
      {
        id: 'triage_005',
        symptoms: ['vomiting', 'diarrhea', 'stomach pain'],
        conditions: ['gastroenteritis', 'food poisoning'],
        severity: 'medium',
        redFlags: ['blood in stool', 'severe dehydration', 'high fever'],
        recommendation: 'consult_doctor',
        advice: 'Stay hydrated with ORS. Avoid solid foods initially. Consult doctor if symptoms persist or worsen.',
        language: 'english',
        followUpQuestions: ['Any recent travel?', 'What did you eat recently?', 'Signs of dehydration?']
      }
    ];

    triageRules.forEach(rule => {
      this.triageRules.set(rule.id, rule);
    });
  }

  /**
   * Initialize government health feeds
   */
  private initializeGovernmentFeeds(): void {
    const feeds: GovernmentHealthFeed[] = [
      {
        id: 'feed_001',
        type: 'outbreak_alert',
        title: 'Dengue Outbreak Alert - Hyderabad',
        description: 'Increased cases of dengue fever reported in Hyderabad. Take preventive measures against mosquito breeding.',
        severity: 'warning',
        location: {
          state: 'Telangana',
          districts: ['Hyderabad', 'Rangareddy']
        },
        targetAudience: 'all',
        language: 'english',
        publishedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        actionRequired: 'Remove standing water, use mosquito nets, seek medical attention for fever',
        contactInfo: {
          helpline: '104',
          website: 'https://health.telangana.gov.in'
        },
        source: 'state_health_dept'
      },
      {
        id: 'feed_002',
        type: 'vaccination_drive',
        title: 'Free COVID-19 Vaccination Drive',
        description: 'Free COVID-19 vaccination available at all government health centers. No appointment required.',
        severity: 'info',
        location: {
          state: 'Karnataka',
          districts: ['Bangalore Urban', 'Bangalore Rural']
        },
        targetAudience: 'adults',
        language: 'english',
        publishedAt: new Date().toISOString(),
        actionRequired: 'Visit nearest health center with ID proof',
        contactInfo: {
          helpline: '104',
          website: 'https://covid19.karnataka.gov.in'
        },
        source: 'state_health_dept'
      }
    ];

    feeds.forEach(feed => {
      this.governmentFeeds.set(feed.id, feed);
    });
  }

  /**
   * Build search index for faster queries
   */
  private buildSearchIndex(): void {
    this.searchIndex.clear();
    
    for (const [id, item] of this.knowledgeBase) {
      const keywords = [
        ...item.question.toLowerCase().split(' '),
        ...item.answer.toLowerCase().split(' '),
        ...item.tags,
        item.category
      ];

      keywords.forEach(keyword => {
        const cleanKeyword = keyword.replace(/[^\w]/g, '');
        if (cleanKeyword.length > 2) {
          if (!this.searchIndex.has(cleanKeyword)) {
            this.searchIndex.set(cleanKeyword, []);
          }
          this.searchIndex.get(cleanKeyword)!.push(id);
        }
      });
    }
  }

  /**
   * Find matching knowledge items
   */
  private findMatches(query: string, category?: string): Array<{ item: HealthKnowledgeBase; score: number }> {
    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    const matches = new Map<string, number>();

    // Score based on keyword matches
    queryWords.forEach(word => {
      const ids = this.searchIndex.get(word) || [];
      ids.forEach(id => {
        matches.set(id, (matches.get(id) || 0) + 1);
      });
    });

    // Convert to results with items
    const results: Array<{ item: HealthKnowledgeBase; score: number }> = [];
    
    for (const [id, score] of matches) {
      const item = this.knowledgeBase.get(id);
      if (item && (!category || item.category === category)) {
        // Normalize score by query length
        const normalizedScore = score / queryWords.length;
        results.push({ item, score: normalizedScore });
      }
    }

    return results;
  }

  /**
   * Find matching triage rules
   */
  private findTriageMatches(symptoms: string[]): SymptomTriageRule[] {
    const matches: SymptomTriageRule[] = [];

    for (const rule of this.triageRules.values()) {
      const matchCount = symptoms.filter(symptom => 
        rule.symptoms.some(ruleSymptom => 
          symptom.includes(ruleSymptom) || ruleSymptom.includes(symptom)
        )
      ).length;

      if (matchCount > 0) {
        matches.push(rule);
      }
    }

    return matches;
  }

  /**
   * Calculate triage confidence
   */
  private calculateTriageConfidence(symptoms: string[], rules: SymptomTriageRule[]): number {
    if (rules.length === 0) return 0;

    const totalMatches = rules.reduce((sum, rule) => {
      const matchCount = symptoms.filter(symptom => 
        rule.symptoms.some(ruleSymptom => 
          symptom.includes(ruleSymptom) || ruleSymptom.includes(symptom)
        )
      ).length;
      return sum + matchCount;
    }, 0);

    return Math.min(totalMatches / symptoms.length, 1.0);
  }

  /**
   * Get related questions
   */
  private getRelatedQuestions(results: HealthKnowledgeBase[], language: Language): string[] {
    const relatedQuestions: string[] = [];
    
    results.forEach(item => {
      if (item.relatedQuestions) {
        relatedQuestions.push(...item.relatedQuestions);
      }
    });

    return [...new Set(relatedQuestions)].slice(0, 5);
  }

  /**
   * Translate results to target language
   */
  private async translateResults(
    results: HealthKnowledgeBase[], 
    language: Language
  ): Promise<HealthKnowledgeBase[]> {
    if (language === 'english') return results;

    const translatedResults = await Promise.all(
      results.map(async (item) => {
        if (item.language === language) return item;

        return {
          ...item,
          question: await languageService.translateText(item.question, item.language, language),
          answer: await languageService.translateText(item.answer, item.language, language),
          language
        };
      })
    );

    return translatedResults;
  }

  /**
   * Get default triage response
   */
  private async getDefaultTriageResponse(language: Language): Promise<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendation: 'self_care' | 'consult_doctor' | 'urgent_care' | 'emergency';
    advice: string;
    redFlags: string[];
    followUpQuestions: string[];
    confidence: number;
  }> {
    const defaultAdvice = {
      english: 'I cannot provide a specific recommendation for your symptoms. Please consult with a healthcare professional for proper evaluation.',
      hindi: 'मैं आपके लक्षणों के लिए कोई विशिष्ट सिफारिश नहीं दे सकता। कृपया उचित मूल्यांकन के लिए किसी स्वास्थ्य पेशेवर से सलाह लें।',
      telugu: 'మీ లక్షణాలకు నేను నిర్దిష్ట సిఫార్సు చేయలేను. దయచేసి సరైన మూల్యాంకనం కోసం ఆరోగ్య నిపుణుడిని సంప్రదించండి।'
    };

    return {
      severity: 'medium',
      recommendation: 'consult_doctor',
      advice: defaultAdvice[language] || defaultAdvice.english,
      redFlags: [],
      followUpQuestions: [],
      confidence: 0.1
    };
  }

  /**
   * Update search index for a single item
   */
  private updateSearchIndex(item: HealthKnowledgeBase): void {
    // Remove old entries (simplified - in production, track which keywords belong to which items)
    this.buildSearchIndex();
  }

  // Public utility methods
  public getKnowledgeItem(id: string): HealthKnowledgeBase | undefined {
    return this.knowledgeBase.get(id);
  }

  public getAllCategories(): string[] {
    const categories = new Set<string>();
    for (const item of this.knowledgeBase.values()) {
      categories.add(item.category);
    }
    return Array.from(categories);
  }

  public getItemsByCategory(category: string): HealthKnowledgeBase[] {
    return Array.from(this.knowledgeBase.values())
      .filter(item => item.category === category);
  }
}

export const healthKnowledgeBaseService = HealthKnowledgeBaseService.getInstance();
