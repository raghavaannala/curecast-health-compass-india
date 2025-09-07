import { Language } from '../types';

// Language detection and translation service for Dr.Curecast
export class LanguageService {
  private static instance: LanguageService;
  private supportedLanguages: Language[] = [
    // Indian languages
    'english', 'hindi', 'telugu', 'tamil', 'bengali', 'marathi',
    'kannada', 'malayalam', 'gujarati', 'punjabi', 'urdu',
    'odia', 'assamese',
    // International languages
    'spanish', 'french', 'german', 'arabic', 'chinese',
    'japanese', 'russian', 'portuguese'
  ];

  private languageMap: Record<string, Language> = {
    // ISO codes to our language types
    'en': 'english', 'hi': 'hindi', 'te': 'telugu', 'ta': 'tamil',
    'bn': 'bengali', 'mr': 'marathi', 'kn': 'kannada', 'ml': 'malayalam',
    'gu': 'gujarati', 'pa': 'punjabi', 'ur': 'urdu', 'or': 'odia',
    'as': 'assamese', 'es': 'spanish', 'fr': 'french', 'de': 'german',
    'ar': 'arabic', 'zh': 'chinese', 'ja': 'japanese', 'ru': 'russian',
    'pt': 'portuguese'
  };

  private fallbackLanguage: Language = 'english';

  public static getInstance(): LanguageService {
    if (!LanguageService.instance) {
      LanguageService.instance = new LanguageService();
    }
    return LanguageService.instance;
  }

  /**
   * Detect language from text using multiple methods
   */
  async detectLanguage(text: string): Promise<{
    language: Language;
    confidence: number;
  }> {
    try {
      // Method 1: Browser language detection API (if available)
      if ('ml' in window && 'languageDetection' in (window as any).ml) {
        const result = await (window as any).ml.languageDetection.detect(text);
        const detectedLang = this.languageMap[result.language];
        if (detectedLang && this.supportedLanguages.includes(detectedLang)) {
          return {
            language: detectedLang,
            confidence: result.confidence
          };
        }
      }

      // Method 2: Pattern-based detection for Indian languages
      const detectedLang = this.detectLanguageByScript(text);
      if (detectedLang) {
        return {
          language: detectedLang,
          confidence: 0.8
        };
      }

      // Method 3: Use browser locale as fallback
      const browserLang = this.getBrowserLanguage();
      return {
        language: browserLang,
        confidence: 0.6
      };

    } catch (error) {
      console.error('Language detection failed:', error);
      return {
        language: this.fallbackLanguage,
        confidence: 0.5
      };
    }
  }

  /**
   * Detect language based on script/character patterns
   */
  private detectLanguageByScript(text: string): Language | null {
    // Devanagari script (Hindi, Marathi)
    if (/[\u0900-\u097F]/.test(text)) {
      // Simple heuristic: if contains specific Marathi characters
      if (/[\u0933\u0934\u0931\u0930]/.test(text)) {
        return 'marathi';
      }
      return 'hindi';
    }

    // Telugu script
    if (/[\u0C00-\u0C7F]/.test(text)) {
      return 'telugu';
    }

    // Tamil script
    if (/[\u0B80-\u0BFF]/.test(text)) {
      return 'tamil';
    }

    // Bengali script
    if (/[\u0980-\u09FF]/.test(text)) {
      return 'bengali';
    }

    // Kannada script
    if (/[\u0C80-\u0CFF]/.test(text)) {
      return 'kannada';
    }

    // Malayalam script
    if (/[\u0D00-\u0D7F]/.test(text)) {
      return 'malayalam';
    }

    // Gujarati script
    if (/[\u0A80-\u0AFF]/.test(text)) {
      return 'gujarati';
    }

    // Gurmukhi script (Punjabi)
    if (/[\u0A00-\u0A7F]/.test(text)) {
      return 'punjabi';
    }

    // Arabic script (Arabic, Urdu)
    if (/[\u0600-\u06FF\u0750-\u077F]/.test(text)) {
      // Simple heuristic for Urdu vs Arabic
      if (/[\u0679\u067E\u0686\u0688]/.test(text)) {
        return 'urdu';
      }
      return 'arabic';
    }

    // Odia script
    if (/[\u0B00-\u0B7F]/.test(text)) {
      return 'odia';
    }

    // Assamese script (similar to Bengali but with some differences)
    if (/[\u0980-\u09FF]/.test(text)) {
      // This is a simplified check - in practice, Assamese and Bengali are hard to distinguish
      return 'assamese';
    }

    // Chinese characters
    if (/[\u4E00-\u9FFF]/.test(text)) {
      return 'chinese';
    }

    // Japanese (Hiragana, Katakana, Kanji)
    if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) {
      return 'japanese';
    }

    // Cyrillic script (Russian)
    if (/[\u0400-\u04FF]/.test(text)) {
      return 'russian';
    }

    return null;
  }

  /**
   * Get browser language preference
   */
  private getBrowserLanguage(): Language {
    const browserLang = navigator.language.split('-')[0];
    const mappedLang = this.languageMap[browserLang];
    return mappedLang && this.supportedLanguages.includes(mappedLang) 
      ? mappedLang 
      : this.fallbackLanguage;
  }

  /**
   * Translate text using available translation services
   */
  async translateText(
    text: string, 
    fromLang: Language, 
    toLang: Language
  ): Promise<string> {
    if (fromLang === toLang) {
      return text;
    }

    try {
      // Method 1: Use Google Translate API (requires API key)
      if (process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY) {
        return await this.googleTranslate(text, fromLang, toLang);
      }

      // Method 2: Use browser translation API (if available)
      if ('translation' in navigator) {
        return await this.browserTranslate(text, fromLang, toLang);
      }

      // Method 3: Use predefined translations for common healthcare phrases
      return this.getPredefindTranslation(text, toLang) || text;

    } catch (error) {
      console.error('Translation failed:', error);
      return text;
    }
  }

  /**
   * Google Translate API integration
   */
  private async googleTranslate(
    text: string, 
    fromLang: Language, 
    toLang: Language
  ): Promise<string> {
    const apiKey = process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY;
    const fromCode = this.getLanguageCode(fromLang);
    const toCode = this.getLanguageCode(toLang);

    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: fromCode,
          target: toCode,
          format: 'text'
        })
      }
    );

    const data = await response.json();
    return data.data.translations[0].translatedText;
  }

  /**
   * Browser translation API (experimental)
   */
  private async browserTranslate(
    text: string, 
    fromLang: Language, 
    toLang: Language
  ): Promise<string> {
    // This is a placeholder for the experimental browser translation API
    // Implementation would depend on browser support
    return text;
  }

  /**
   * Get predefined translations for common healthcare phrases
   */
  private getPredefindTranslation(text: string, toLang: Language): string | null {
    const commonPhrases: Record<string, Partial<Record<Language, string>>> = {
      'Hello': {
        hindi: 'नमस्ते',
        telugu: 'హలో',
        tamil: 'வணக்கம்',
        bengali: 'হ্যালো',
        marathi: 'नमस्कार',
        kannada: 'ಹಲೋ',
        malayalam: 'ഹലോ',
        gujarati: 'હેલો',
        punjabi: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ',
        urdu: 'السلام علیکم'
      },
      'How are you feeling?': {
        hindi: 'आप कैसा महसूस कर रहे हैं?',
        telugu: 'మీరు ఎలా అనుభవిస్తున్నారు?',
        tamil: 'நீங்கள் எப்படி உணர்கிறீர்கள்?',
        bengali: 'আপনি কেমন অনুভব করছেন?'
      },
      'Vaccination reminder': {
        hindi: 'टीकाकरण अनुस्मारक',
        telugu: 'వ్యాక్సినేషన్ రిమైండర్',
        tamil: 'தடுப்பூசி நினைவூட்டல்',
        bengali: 'টিকাদান অনুস্মারক'
      }
    };

    return commonPhrases[text]?.[toLang] || null;
  }

  /**
   * Get ISO language code for API calls
   */
  private getLanguageCode(language: Language): string {
    const codeMap: Record<Language, string> = {
      english: 'en', hindi: 'hi', telugu: 'te', tamil: 'ta',
      bengali: 'bn', marathi: 'mr', kannada: 'kn', malayalam: 'ml',
      gujarati: 'gu', punjabi: 'pa', urdu: 'ur', odia: 'or',
      assamese: 'as', spanish: 'es', french: 'fr', german: 'de',
      arabic: 'ar', chinese: 'zh', japanese: 'ja', russian: 'ru',
      portuguese: 'pt'
    };
    return codeMap[language] || 'en';
  }

  /**
   * Get supported languages list
   */
  getSupportedLanguages(): Language[] {
    return [...this.supportedLanguages];
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(language: string): boolean {
    return this.supportedLanguages.includes(language as Language);
  }

  /**
   * Get language display name
   */
  getLanguageDisplayName(language: Language): string {
    const displayNames: Record<Language, string> = {
      english: 'English', hindi: 'हिंदी', telugu: 'తెలుగు', tamil: 'தமிழ்',
      bengali: 'বাংলা', marathi: 'मराठी', kannada: 'ಕನ್ನಡ', malayalam: 'മലയാളം',
      gujarati: 'ગુજરાતી', punjabi: 'ਪੰਜਾਬੀ', urdu: 'اردو', odia: 'ଓଡ଼ିଆ',
      assamese: 'অসমীয়া', spanish: 'Español', french: 'Français', german: 'Deutsch',
      arabic: 'العربية', chinese: '中文', japanese: '日本語', russian: 'Русский',
      portuguese: 'Português'
    };
    return displayNames[language] || language;
  }
}

export const languageService = LanguageService.getInstance();
