/**
 * Preventive Healthcare Education Service
 * Provides educational content and awareness programs for rural populations
 */

interface HealthEducationContent {
  id: string;
  title: string;
  category: 'nutrition' | 'hygiene' | 'exercise' | 'mental_health' | 'disease_prevention' | 'maternal_health' | 'child_health';
  content: string;
  language: string;
  targetAudience: 'children' | 'adults' | 'elderly' | 'pregnant_women' | 'all';
  mediaType: 'text' | 'audio' | 'video' | 'infographic';
  difficulty: 'basic' | 'intermediate' | 'advanced';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface HealthTip {
  id: string;
  tip: string;
  category: string;
  language: string;
  season?: 'summer' | 'winter' | 'monsoon' | 'all';
  frequency: 'daily' | 'weekly' | 'monthly';
}

interface PreventionProgram {
  id: string;
  name: string;
  description: string;
  duration: number; // in days
  modules: HealthEducationContent[];
  targetDiseases: string[];
  completionRate: number;
}

class PreventiveHealthcareService {
  private educationContent: Map<string, HealthEducationContent> = new Map();
  private healthTips: Map<string, HealthTip> = new Map();
  private preventionPrograms: Map<string, PreventionProgram> = new Map();
  private userProgress: Map<string, any> = new Map();

  constructor() {
    this.initializeEducationContent();
    this.initializeHealthTips();
    this.initializePreventionPrograms();
  }

  /**
   * Initialize health education content
   */
  private initializeEducationContent(): void {
    const content: HealthEducationContent[] = [
      {
        id: 'hygiene_001',
        title: 'Hand Washing Techniques',
        category: 'hygiene',
        content: 'Proper hand washing is one of the most effective ways to prevent disease transmission. Wash hands with soap for at least 20 seconds, especially before eating, after using the toilet, and after coughing or sneezing.',
        language: 'en',
        targetAudience: 'all',
        mediaType: 'text',
        difficulty: 'basic',
        tags: ['handwashing', 'hygiene', 'prevention'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'hygiene_001_hi',
        title: 'हाथ धोने की तकनीक',
        category: 'hygiene',
        content: 'उचित हाथ धोना बीमारी के संचरण को रोकने के सबसे प्रभावी तरीकों में से एक है। खाने से पहले, शौचालय का उपयोग करने के बाद, और खांसने या छींकने के बाद कम से कम 20 सेकंड तक साबुन से हाथ धोएं।',
        language: 'hi',
        targetAudience: 'all',
        mediaType: 'text',
        difficulty: 'basic',
        tags: ['हाथ धोना', 'स्वच्छता', 'रोकथाम'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'nutrition_001',
        title: 'Balanced Diet for Rural Communities',
        category: 'nutrition',
        content: 'A balanced diet includes grains, pulses, vegetables, fruits, and dairy products. Include local seasonal vegetables and fruits. Avoid processed foods and excessive sugar. Drink clean water regularly.',
        language: 'en',
        targetAudience: 'adults',
        mediaType: 'text',
        difficulty: 'basic',
        tags: ['nutrition', 'diet', 'health'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'nutrition_001_hi',
        title: 'ग्रामीण समुदायों के लिए संतुलित आहार',
        category: 'nutrition',
        content: 'संतुलित आहार में अनाज, दालें, सब्जियां, फल और डेयरी उत्पाद शामिल हैं। स्थानीय मौसमी सब्जियों और फलों को शामिल करें। प्रसंस्कृत खाद्य पदार्थों और अत्यधिक चीनी से बचें। नियमित रूप से स्वच्छ पानी पिएं।',
        language: 'hi',
        targetAudience: 'adults',
        mediaType: 'text',
        difficulty: 'basic',
        tags: ['पोषण', 'आहार', 'स्वास्थ्य'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'maternal_001',
        title: 'Prenatal Care Guidelines',
        category: 'maternal_health',
        content: 'Regular prenatal checkups are essential for healthy pregnancy. Take iron and folic acid supplements as prescribed. Eat nutritious food, avoid alcohol and smoking. Get adequate rest and exercise as recommended by healthcare provider.',
        language: 'en',
        targetAudience: 'pregnant_women',
        mediaType: 'text',
        difficulty: 'intermediate',
        tags: ['pregnancy', 'prenatal', 'maternal_health'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'disease_prevention_001',
        title: 'Malaria Prevention',
        category: 'disease_prevention',
        content: 'Prevent malaria by using mosquito nets, eliminating stagnant water, wearing long-sleeved clothes during evening hours, and using mosquito repellents. Seek immediate medical attention for fever.',
        language: 'en',
        targetAudience: 'all',
        mediaType: 'text',
        difficulty: 'basic',
        tags: ['malaria', 'prevention', 'mosquito'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'child_health_001',
        title: 'Childhood Vaccination Schedule',
        category: 'child_health',
        content: 'Follow the recommended vaccination schedule: BCG at birth, OPV and DPT at 6, 10, 14 weeks, Measles at 9 months. Keep vaccination records safe and ensure timely immunization.',
        language: 'en',
        targetAudience: 'adults',
        mediaType: 'text',
        difficulty: 'intermediate',
        tags: ['vaccination', 'children', 'immunization'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    content.forEach(item => {
      this.educationContent.set(item.id, item);
    });
  }

  /**
   * Initialize daily health tips
   */
  private initializeHealthTips(): void {
    const tips: HealthTip[] = [
      {
        id: 'tip_001',
        tip: 'Drink at least 8 glasses of clean water daily to stay hydrated and healthy.',
        category: 'nutrition',
        language: 'en',
        season: 'all',
        frequency: 'daily'
      },
      {
        id: 'tip_001_hi',
        tip: 'हाइड्रेटेड और स्वस्थ रहने के लिए रोजाना कम से कम 8 गिलास साफ पानी पिएं।',
        category: 'nutrition',
        language: 'hi',
        season: 'all',
        frequency: 'daily'
      },
      {
        id: 'tip_002',
        tip: 'Wash your hands frequently with soap and water for at least 20 seconds.',
        category: 'hygiene',
        language: 'en',
        season: 'all',
        frequency: 'daily'
      },
      {
        id: 'tip_003',
        tip: 'Include fresh fruits and vegetables in your daily diet for essential vitamins.',
        category: 'nutrition',
        language: 'en',
        season: 'all',
        frequency: 'daily'
      },
      {
        id: 'tip_004',
        tip: 'Get at least 7-8 hours of sleep every night for better health and immunity.',
        category: 'mental_health',
        language: 'en',
        season: 'all',
        frequency: 'daily'
      },
      {
        id: 'tip_005',
        tip: 'Exercise for at least 30 minutes daily - walking, yoga, or household work counts!',
        category: 'exercise',
        language: 'en',
        season: 'all',
        frequency: 'daily'
      }
    ];

    tips.forEach(tip => {
      this.healthTips.set(tip.id, tip);
    });
  }

  /**
   * Initialize prevention programs
   */
  private initializePreventionPrograms(): void {
    const programs: PreventionProgram[] = [
      {
        id: 'program_001',
        name: 'Dengue Prevention Program',
        description: '7-day program to learn about dengue prevention and control',
        duration: 7,
        modules: [],
        targetDiseases: ['dengue', 'chikungunya', 'zika'],
        completionRate: 0
      },
      {
        id: 'program_002',
        name: 'Maternal Health Awareness',
        description: '14-day program for pregnant women and new mothers',
        duration: 14,
        modules: [],
        targetDiseases: ['maternal_complications', 'infant_mortality'],
        completionRate: 0
      },
      {
        id: 'program_003',
        name: 'Child Nutrition Program',
        description: '10-day program focusing on child nutrition and growth',
        duration: 10,
        modules: [],
        targetDiseases: ['malnutrition', 'stunting', 'anemia'],
        completionRate: 0
      }
    ];

    programs.forEach(program => {
      this.preventionPrograms.set(program.id, program);
    });
  }

  /**
   * Get educational content by category and language
   */
  getEducationContent(category?: string, language: string = 'en', targetAudience?: string): HealthEducationContent[] {
    return Array.from(this.educationContent.values()).filter(content => {
      if (category && content.category !== category) return false;
      if (content.language !== language) return false;
      if (targetAudience && content.targetAudience !== 'all' && content.targetAudience !== targetAudience) return false;
      return true;
    });
  }

  /**
   * Get daily health tip
   */
  getDailyHealthTip(language: string = 'en', category?: string): HealthTip | null {
    const tips = Array.from(this.healthTips.values()).filter(tip => {
      if (tip.language !== language) return false;
      if (category && tip.category !== category) return false;
      return true;
    });

    if (tips.length === 0) return null;

    // Return random tip
    const randomIndex = Math.floor(Math.random() * tips.length);
    return tips[randomIndex];
  }

  /**
   * Get seasonal health tips
   */
  getSeasonalHealthTips(season: 'summer' | 'winter' | 'monsoon', language: string = 'en'): HealthTip[] {
    return Array.from(this.healthTips.values()).filter(tip => 
      tip.language === language && (tip.season === season || tip.season === 'all')
    );
  }

  /**
   * Send daily health education via WhatsApp/SMS
   */
  async sendDailyHealthEducation(phoneNumbers: string[], language: string = 'en', method: 'whatsapp' | 'sms' | 'both' = 'both'): Promise<void> {
    try {
      const dailyTip = this.getDailyHealthTip(language);
      if (!dailyTip) return;

      const message = language === 'hi'
        ? `🌟 आज का स्वास्थ्य सुझाव:\n\n${dailyTip.tip}\n\nडॉ.क्योरकास्ट के साथ स्वस्थ रहें! 💚`
        : `🌟 Today's Health Tip:\n\n${dailyTip.tip}\n\nStay healthy with Dr.CureCast! 💚`;

      if (method === 'whatsapp' || method === 'both') {
        const { whatsappService } = await import('./whatsappService');
        const promises = phoneNumbers.map(phone => 
          whatsappService.sendMessage(phone, message, language)
        );
        await Promise.all(promises);
      }

      if (method === 'sms' || method === 'both') {
        const { smsService } = await import('./smsService');
        await smsService.sendBulkSMS(phoneNumbers, message, language);
      }

      console.log(`Daily health education sent to ${phoneNumbers.length} users`);
    } catch (error) {
      console.error('Failed to send daily health education:', error);
    }
  }

  /**
   * Create personalized health education plan
   */
  createPersonalizedPlan(userId: string, userProfile: {
    age: number;
    gender: string;
    location: string;
    healthConditions: string[];
    interests: string[];
    language: string;
  }): HealthEducationContent[] {
    const plan: HealthEducationContent[] = [];
    
    // Get content based on user profile
    let targetAudience: string = 'adults';
    if (userProfile.age < 18) targetAudience = 'children';
    else if (userProfile.age > 60) targetAudience = 'elderly';

    // Get relevant content
    const relevantContent = this.getEducationContent(undefined, userProfile.language, targetAudience);
    
    // Filter by health conditions and interests
    const filteredContent = relevantContent.filter(content => {
      const hasRelevantTags = content.tags.some(tag => 
        userProfile.interests.includes(tag) || 
        userProfile.healthConditions.some(condition => tag.includes(condition))
      );
      return hasRelevantTags || content.difficulty === 'basic';
    });

    // Limit to 10 items for the plan
    plan.push(...filteredContent.slice(0, 10));

    // Store user progress
    this.userProgress.set(userId, {
      plan,
      currentIndex: 0,
      completedItems: [],
      startDate: new Date().toISOString()
    });

    return plan;
  }

  /**
   * Get prevention program by disease
   */
  getPreventionProgram(disease: string): PreventionProgram | null {
    for (const program of this.preventionPrograms.values()) {
      if (program.targetDiseases.includes(disease.toLowerCase())) {
        return program;
      }
    }
    return null;
  }

  /**
   * Send disease-specific prevention education
   */
  async sendDiseasePreventionEducation(disease: string, phoneNumbers: string[], language: string = 'en'): Promise<void> {
    try {
      const preventionContent = this.getEducationContent('disease_prevention', language).find(content =>
        content.tags.includes(disease.toLowerCase())
      );

      if (!preventionContent) {
        console.log(`No prevention content found for disease: ${disease}`);
        return;
      }

      const message = language === 'hi'
        ? `🛡️ ${disease} से बचाव:\n\n${preventionContent.content}\n\nअधिक जानकारी के लिए स्वास्थ्य कार्यकर्ता से मिलें। डॉ.क्योरकास्ट`
        : `🛡️ ${disease} Prevention:\n\n${preventionContent.content}\n\nConsult health workers for more information. Dr.CureCast`;

      const { whatsappService } = await import('./whatsappService');
      const { smsService } = await import('./smsService');

      // Send via both channels
      await Promise.all([
        ...phoneNumbers.map(phone => whatsappService.sendMessage(phone, message, language)),
        smsService.sendBulkSMS(phoneNumbers, message, language)
      ]);

      console.log(`Disease prevention education sent for ${disease}`);
    } catch (error) {
      console.error('Failed to send disease prevention education:', error);
    }
  }

  /**
   * Track user engagement with educational content
   */
  trackUserEngagement(userId: string, contentId: string, action: 'viewed' | 'completed' | 'shared'): void {
    const progress = this.userProgress.get(userId);
    if (!progress) return;

    if (!progress.engagement) {
      progress.engagement = [];
    }

    progress.engagement.push({
      contentId,
      action,
      timestamp: new Date().toISOString()
    });

    if (action === 'completed') {
      progress.completedItems.push(contentId);
    }

    this.userProgress.set(userId, progress);
  }

  /**
   * Get user progress statistics
   */
  getUserProgress(userId: string): any {
    return this.userProgress.get(userId) || null;
  }

  /**
   * Generate health awareness report
   */
  generateAwarenessReport(): {
    totalContent: number;
    contentByCategory: Record<string, number>;
    contentByLanguage: Record<string, number>;
    userEngagement: number;
    completionRate: number;
  } {
    const content = Array.from(this.educationContent.values());
    const users = Array.from(this.userProgress.values());

    const contentByCategory = content.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const contentByLanguage = content.reduce((acc, item) => {
      acc[item.language] = (acc[item.language] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalEngagements = users.reduce((sum, user) => 
      sum + (user.engagement?.length || 0), 0
    );

    const totalCompletions = users.reduce((sum, user) => 
      sum + (user.completedItems?.length || 0), 0
    );

    const totalAssigned = users.reduce((sum, user) => 
      sum + (user.plan?.length || 0), 0
    );

    return {
      totalContent: content.length,
      contentByCategory,
      contentByLanguage,
      userEngagement: totalEngagements,
      completionRate: totalAssigned > 0 ? (totalCompletions / totalAssigned) * 100 : 0
    };
  }

  /**
   * Add new educational content
   */
  addEducationContent(content: HealthEducationContent): void {
    this.educationContent.set(content.id, content);
  }

  /**
   * Add new health tip
   */
  addHealthTip(tip: HealthTip): void {
    this.healthTips.set(tip.id, tip);
  }
}

export const preventiveHealthcareService = new PreventiveHealthcareService();
export default preventiveHealthcareService;
