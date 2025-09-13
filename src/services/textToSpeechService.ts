export class TextToSpeechService {
  private static instance: TextToSpeechService;
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeVoices();
  }

  public static getInstance(): TextToSpeechService {
    if (!TextToSpeechService.instance) {
      TextToSpeechService.instance = new TextToSpeechService();
    }
    return TextToSpeechService.instance;
  }

  /**
   * Initialize available voices
   */
  private initializeVoices(): void {
    const loadVoices = () => {
      this.voices = this.synthesis.getVoices();
      this.isInitialized = true;
    };

    loadVoices();

    // Some browsers load voices asynchronously
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = loadVoices;
    }
  }

  /**
   * Get available voices for a specific language
   */
  public getVoicesForLanguage(languageCode: string): SpeechSynthesisVoice[] {
    if (!this.isInitialized) {
      this.initializeVoices();
    }

    return this.voices.filter(voice => 
      voice.lang.startsWith(languageCode) || 
      voice.lang.startsWith(languageCode.split('-')[0])
    );
  }

  /**
   * Get the best voice for a language
   */
  private getBestVoice(languageCode: string): SpeechSynthesisVoice | null {
    const languageVoices = this.getVoicesForLanguage(languageCode);
    
    if (languageVoices.length === 0) {
      // Fallback to English if no voice found for the language
      const englishVoices = this.getVoicesForLanguage('en');
      return englishVoices.length > 0 ? englishVoices[0] : null;
    }

    // Prefer local voices over remote ones
    const localVoices = languageVoices.filter(voice => voice.localService);
    if (localVoices.length > 0) {
      return localVoices[0];
    }

    return languageVoices[0];
  }

  /**
   * Speak text in the specified language
   */
  public speak(
    text: string, 
    languageCode: string = 'en-US',
    options: {
      rate?: number;
      pitch?: number;
      volume?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (error: SpeechSynthesisErrorEvent) => void;
    } = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Stop any current speech
      this.stop();

      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Clean and prepare text
      const cleanText = this.cleanTextForSpeech(text);
      
      if (!cleanText.trim()) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Set voice
      const voice = this.getBestVoice(languageCode);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = languageCode;
      }

      // Set speech parameters
      utterance.rate = options.rate || 0.9;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      // Set event handlers
      utterance.onstart = () => {
        options.onStart?.();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        options.onEnd?.();
        resolve();
      };

      utterance.onerror = (error) => {
        this.currentUtterance = null;
        options.onError?.(error);
        reject(error);
      };

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    });
  }

  /**
   * Stop current speech
   */
  public stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * Pause current speech
   */
  public pause(): void {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume paused speech
   */
  public resume(): void {
    if (this.synthesis && this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  /**
   * Check if currently speaking
   */
  public isSpeaking(): boolean {
    return this.synthesis ? this.synthesis.speaking : false;
  }

  /**
   * Check if speech is paused
   */
  public isPaused(): boolean {
    return this.synthesis ? this.synthesis.paused : false;
  }

  /**
   * Clean text for better speech synthesis
   */
  private cleanTextForSpeech(text: string): string {
    return text
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Replace common abbreviations
      .replace(/\bDr\./g, 'Doctor')
      .replace(/\bMr\./g, 'Mister')
      .replace(/\bMrs\./g, 'Missus')
      .replace(/\bMs\./g, 'Miss')
      .replace(/\betc\./g, 'etcetera')
      .replace(/\bi\.e\./g, 'that is')
      .replace(/\be\.g\./g, 'for example')
      // Add pauses for better speech flow
      .replace(/\./g, '. ')
      .replace(/,/g, ', ')
      .replace(/;/g, '; ')
      .replace(/:/g, ': ')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Get supported languages
   */
  public getSupportedLanguages(): { code: string; name: string; voices: number }[] {
    if (!this.isInitialized) {
      this.initializeVoices();
    }

    const languageMap = new Map<string, { name: string; count: number }>();

    this.voices.forEach(voice => {
      const langCode = voice.lang.split('-')[0];
      const existing = languageMap.get(langCode);
      
      if (existing) {
        existing.count++;
      } else {
        languageMap.set(langCode, {
          name: this.getLanguageName(langCode),
          count: 1
        });
      }
    });

    return Array.from(languageMap.entries()).map(([code, info]) => ({
      code,
      name: info.name,
      voices: info.count
    }));
  }

  /**
   * Get human-readable language name
   */
  private getLanguageName(languageCode: string): string {
    const languageNames: Record<string, string> = {
      'en': 'English',
      'hi': 'Hindi',
      'bn': 'Bengali',
      'te': 'Telugu',
      'mr': 'Marathi',
      'ta': 'Tamil',
      'gu': 'Gujarati',
      'ur': 'Urdu',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'or': 'Odia',
      'pa': 'Punjabi',
      'as': 'Assamese',
      'ne': 'Nepali',
      'si': 'Sinhala',
      'my': 'Myanmar',
      'km': 'Khmer',
      'lo': 'Lao',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'id': 'Indonesian',
      'ms': 'Malay',
      'tl': 'Filipino',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ar': 'Arabic',
      'fa': 'Persian',
      'tr': 'Turkish',
      'ru': 'Russian',
      'fr': 'French',
      'de': 'German',
      'es': 'Spanish',
      'pt': 'Portuguese',
      'it': 'Italian'
    };

    return languageNames[languageCode] || languageCode.toUpperCase();
  }

  /**
   * Speak outbreak alert with optimized settings
   */
  public speakOutbreakAlert(
    alert: {
      title: string;
      description: string;
      severity: string;
      disease: string;
      location: string;
      cases: number;
    },
    languageCode: string = 'en-US'
  ): Promise<void> {
    const urgencyRate = alert.severity === 'critical' ? 1.1 : 0.9;
    const text = `${alert.severity} alert. ${alert.title}. ${alert.description}. 
                  Disease: ${alert.disease}. Location: ${alert.location}. 
                  Confirmed cases: ${alert.cases}. Please take necessary precautions.`;

    return this.speak(text, languageCode, {
      rate: urgencyRate,
      pitch: alert.severity === 'critical' ? 1.1 : 1.0,
      volume: 1.0
    });
  }

  /**
   * Speak precautions with clear pronunciation
   */
  public speakPrecautions(
    precautions: { title: string; description: string }[],
    languageCode: string = 'en-US'
  ): Promise<void> {
    const text = precautions
      .map((precaution, index) => 
        `Precaution ${index + 1}: ${precaution.title}. ${precaution.description}.`
      )
      .join(' ');

    return this.speak(text, languageCode, {
      rate: 0.8, // Slower for better comprehension
      pitch: 1.0,
      volume: 1.0
    });
  }

  /**
   * Check if text-to-speech is supported
   */
  public isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  /**
   * Get speech synthesis capabilities
   */
  public getCapabilities(): {
    isSupported: boolean;
    voiceCount: number;
    supportedLanguages: string[];
    canPause: boolean;
    canStop: boolean;
  } {
    return {
      isSupported: this.isSupported(),
      voiceCount: this.voices.length,
      supportedLanguages: this.getSupportedLanguages().map(lang => lang.code),
      canPause: true,
      canStop: true
    };
  }
}

export const textToSpeechService = TextToSpeechService.getInstance();
