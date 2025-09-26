import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@/config/api';

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  voiceCode: string; // For speech synthesis
  flag: string;
  direction: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', voiceCode: 'en-US', flag: '🇺🇸', direction: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', voiceCode: 'hi-IN', flag: '🇮🇳', direction: 'ltr' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', voiceCode: 'te-IN', flag: '🇮🇳', direction: 'ltr' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', voiceCode: 'ta-IN', flag: '🇮🇳', direction: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', voiceCode: 'bn-IN', flag: '🇮🇳', direction: 'ltr' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', voiceCode: 'mr-IN', flag: '🇮🇳', direction: 'ltr' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', voiceCode: 'gu-IN', flag: '🇮🇳', direction: 'ltr' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', voiceCode: 'kn-IN', flag: '🇮🇳', direction: 'ltr' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', voiceCode: 'ml-IN', flag: '🇮🇳', direction: 'ltr' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', voiceCode: 'pa-IN', flag: '🇮🇳', direction: 'ltr' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', voiceCode: 'ur-PK', flag: '🇵🇰', direction: 'rtl' },
];

export interface HealthAnalysisResult {
  condition: string;
  severity: 'mild' | 'moderate' | 'severe';
  recommendations: string[];
  medications: string[];
  homeRemedies: string[];
  warningSigns: string[];
  disclaimer: string;
}

export interface SkinAnalysisResult extends HealthAnalysisResult {
  confidence: number;
  possibleConditions: string[];
  skinCareAdvice: string[];
}

class MultilingualHealthcareService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private currentLanguage: string = 'en';

  constructor() {
    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }

  setLanguage(languageCode: string) {
    this.currentLanguage = languageCode;
  }

  getCurrentLanguage(): SupportedLanguage {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === this.currentLanguage) || SUPPORTED_LANGUAGES[0];
  }

  // Speech-to-Text functionality
  async startSpeechRecognition(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      const currentLang = this.getCurrentLanguage();
      recognition.lang = currentLang.voiceCode;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      recognition.onerror = (event: any) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      recognition.start();
    });
  }

  // Text-to-Speech functionality
  async speakText(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const currentLang = this.getCurrentLanguage();
      
      // Try to find a voice for the current language
      const voices = speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith(currentLang.code) || v.lang === currentLang.voiceCode);
      
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.lang = currentLang.voiceCode;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));
      
      speechSynthesis.speak(utterance);
    });
  }

  // Analyze skin condition from image and text
  async analyzeSkinCondition(imageBase64: string, description: string): Promise<SkinAnalysisResult> {
    const currentLang = this.getCurrentLanguage();
    
    const prompt = `As a dermatologist, analyze this skin condition image and description: "${description}". 
    
    Please provide your analysis in ${currentLang.nativeName} language with the following structure:
    
    1. Possible skin conditions (list 2-3 most likely)
    2. Severity assessment (mild/moderate/severe)
    3. Confidence level (0-100%)
    4. Treatment recommendations
    5. Home remedies and skincare advice
    6. Warning signs that require immediate medical attention
    7. Cultural considerations for ${currentLang.name} patients
    
    Use culturally appropriate medical terminology and be sensitive to local healthcare practices.
    Include a medical disclaimer in ${currentLang.nativeName}.`;

    try {
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: "image/jpeg"
          }
        }
      ]);

      const response = result.response.text();
      
      // Parse the response and structure it
      return this.parseSkinAnalysisResponse(response);
    } catch (error) {
      throw new Error(`Skin analysis failed: ${error}`);
    }
  }

  // General health chatbot Q&A
  async processHealthQuery(query: string, conversationHistory: string[] = []): Promise<string> {
    const currentLang = this.getCurrentLanguage();
    
    const prompt = `You are a multilingual AI health assistant. Respond to this health query in ${currentLang.nativeName}: "${query}"
    
    Context from previous conversation: ${conversationHistory.join('\n')}
    
    Guidelines:
    - Provide accurate, helpful health information
    - Use culturally appropriate medical terminology for ${currentLang.name} speakers
    - Include relevant home remedies common in ${currentLang.name} culture
    - Always include a medical disclaimer
    - Be empathetic and supportive
    - If it's an emergency, clearly state to seek immediate medical help
    - Adapt advice to local healthcare practices and availability
    
    Respond in ${currentLang.nativeName} language only.`;

    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      throw new Error(`Health query processing failed: ${error}`);
    }
  }

  // Generate educational content
  async generateEducationalContent(topic: string): Promise<string> {
    const currentLang = this.getCurrentLanguage();
    
    const prompt = `Create comprehensive educational content about "${topic}" in ${currentLang.nativeName} language.
    
    Include:
    1. Clear explanation of the condition/topic
    2. Symptoms to watch for
    3. Prevention strategies
    4. Treatment options available locally
    5. Lifestyle modifications
    6. Cultural considerations for ${currentLang.name} communities
    7. When to seek medical help
    8. Common myths and facts
    
    Make it accessible to people with basic education levels.
    Use simple language and culturally relevant examples.`;

    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      throw new Error(`Educational content generation failed: ${error}`);
    }
  }

  // Translate medical terms with cultural context
  async translateMedicalTerm(term: string, targetLanguage: string): Promise<string> {
    const targetLang = SUPPORTED_LANGUAGES.find(lang => lang.code === targetLanguage);
    if (!targetLang) throw new Error('Unsupported target language');

    const prompt = `Translate this medical term: "${term}" to ${targetLang.nativeName}.
    
    Provide:
    1. Direct translation
    2. Culturally appropriate explanation
    3. Common local terms used by patients
    4. Simple explanation in layman's terms
    
    Consider cultural sensitivities and local medical practices.`;

    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      throw new Error(`Medical term translation failed: ${error}`);
    }
  }

  private parseSkinAnalysisResponse(response: string): SkinAnalysisResult {
    // This is a simplified parser - in production, you'd want more robust parsing
    const lines = response.split('\n').filter(line => line.trim());
    
    return {
      condition: this.extractSection(lines, 'condition') || 'Unknown condition',
      severity: this.extractSeverity(response) || 'moderate',
      confidence: this.extractConfidence(response) || 75,
      possibleConditions: this.extractList(lines, 'conditions') || [],
      recommendations: this.extractList(lines, 'treatment') || [],
      medications: this.extractList(lines, 'medication') || [],
      homeRemedies: this.extractList(lines, 'home') || [],
      skinCareAdvice: this.extractList(lines, 'skincare') || [],
      warningSigns: this.extractList(lines, 'warning') || [],
      disclaimer: this.extractSection(lines, 'disclaimer') || 'Please consult a healthcare professional for proper diagnosis and treatment.'
    };
  }

  private extractSection(lines: string[], keyword: string): string | null {
    const line = lines.find(l => l.toLowerCase().includes(keyword));
    return line ? line.split(':')[1]?.trim() : null;
  }

  private extractSeverity(text: string): 'mild' | 'moderate' | 'severe' | null {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('mild')) return 'mild';
    if (lowerText.includes('severe')) return 'severe';
    if (lowerText.includes('moderate')) return 'moderate';
    return null;
  }

  private extractConfidence(text: string): number | null {
    const match = text.match(/(\d+)%/);
    return match ? parseInt(match[1]) : null;
  }

  private extractList(lines: string[], keyword: string): string[] {
    const startIndex = lines.findIndex(l => l.toLowerCase().includes(keyword));
    if (startIndex === -1) return [];
    
    const items: string[] = [];
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./)) {
        items.push(line.replace(/^[-•\d.]\s*/, ''));
      } else if (line && !line.includes(':')) {
        break;
      }
    }
    return items;
  }
}

export const multilingualHealthcareService = new MultilingualHealthcareService();
