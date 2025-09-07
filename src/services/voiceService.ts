import { Language, VoiceMessage } from '../types';
import { languageService } from './languageService';

// Voice-to-text and text-to-voice service for Dr.Curecast
export class VoiceService {
  private static instance: VoiceService;
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private isListening = false;
  private currentLanguage: Language = 'english';

  private constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeSpeechRecognition();
  }

  public static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  /**
   * Initialize speech recognition with cross-browser support
   */
  private initializeSpeechRecognition(): void {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
    }
  }

  /**
   * Start voice recording and transcription
   */
  async startListening(
    language: Language = 'english',
    onResult?: (result: VoiceMessage) => void,
    onError?: (error: string) => void
  ): Promise<VoiceMessage | null> {
    if (!this.recognition) {
      const error = 'Speech recognition not supported in this browser';
      onError?.(error);
      throw new Error(error);
    }

    if (this.isListening) {
      this.stopListening();
    }

    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not available'));
        return;
      }

      this.currentLanguage = language;
      this.recognition.lang = languageService.getLanguageCode(language);
      this.isListening = true;

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;

        const voiceMessage: VoiceMessage = {
          id: this.generateId(),
          userId: '', // Will be set by calling component
          transcription: transcript,
          language: language,
          confidence: confidence,
          timestamp: new Date().toISOString()
        };

        onResult?.(voiceMessage);
        resolve(voiceMessage);
        this.isListening = false;
      };

      this.recognition.onerror = (event) => {
        const errorMsg = `Speech recognition error: ${event.error}`;
        onError?.(errorMsg);
        reject(new Error(errorMsg));
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      try {
        this.recognition.start();
      } catch (error) {
        const errorMsg = `Failed to start speech recognition: ${error}`;
        onError?.(errorMsg);
        reject(new Error(errorMsg));
        this.isListening = false;
      }
    });
  }

  /**
   * Stop voice recording
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Convert text to speech in specified language
   */
  async speakText(
    text: string,
    language: Language = 'english',
    options: {
      rate?: number;
      pitch?: number;
      volume?: number;
      voiceId?: string;
    } = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language
      utterance.lang = this.getVoiceLanguageCode(language);
      
      // Set voice options
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;

      // Try to find a voice for the specified language
      const voice = this.findVoiceForLanguage(language, options.voiceId);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => {
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.synthesis.speak(utterance);
    });
  }

  /**
   * Get available voices for a language
   */
  getAvailableVoices(language?: Language): SpeechSynthesisVoice[] {
    const voices = this.synthesis.getVoices();
    
    if (!language) {
      return voices;
    }

    const langCode = this.getVoiceLanguageCode(language);
    return voices.filter(voice => 
      voice.lang.startsWith(langCode) || 
      voice.lang.startsWith(langCode.split('-')[0])
    );
  }

  /**
   * Find best voice for language
   */
  private findVoiceForLanguage(
    language: Language, 
    preferredVoiceId?: string
  ): SpeechSynthesisVoice | null {
    const voices = this.getAvailableVoices(language);
    
    if (voices.length === 0) {
      return null;
    }

    // Try to find preferred voice
    if (preferredVoiceId) {
      const preferredVoice = voices.find(voice => voice.voiceURI === preferredVoiceId);
      if (preferredVoice) {
        return preferredVoice;
      }
    }

    // Find local voice first
    const localVoice = voices.find(voice => voice.localService);
    if (localVoice) {
      return localVoice;
    }

    // Return first available voice
    return voices[0];
  }

  /**
   * Get language code for speech synthesis
   */
  private getVoiceLanguageCode(language: Language): string {
    const voiceLanguageMap: Record<Language, string> = {
      english: 'en-US',
      hindi: 'hi-IN',
      telugu: 'te-IN',
      tamil: 'ta-IN',
      bengali: 'bn-IN',
      marathi: 'mr-IN',
      kannada: 'kn-IN',
      malayalam: 'ml-IN',
      gujarati: 'gu-IN',
      punjabi: 'pa-IN',
      urdu: 'ur-PK',
      odia: 'or-IN',
      assamese: 'as-IN',
      spanish: 'es-ES',
      french: 'fr-FR',
      german: 'de-DE',
      arabic: 'ar-SA',
      chinese: 'zh-CN',
      japanese: 'ja-JP',
      russian: 'ru-RU',
      portuguese: 'pt-BR'
    };
    return voiceLanguageMap[language] || 'en-US';
  }

  /**
   * Process voice input with language detection
   */
  async processVoiceInput(
    audioBlob?: Blob,
    expectedLanguage?: Language
  ): Promise<VoiceMessage> {
    try {
      let transcription = '';
      let detectedLanguage: Language = expectedLanguage || 'english';
      let confidence = 0;

      if (audioBlob) {
        // If we have audio blob, we could use external speech-to-text service
        // For now, we'll use the browser's built-in recognition
        const result = await this.startListening(detectedLanguage);
        if (result) {
          transcription = result.transcription;
          confidence = result.confidence;
        }
      }

      // Detect language from transcription if not specified
      if (!expectedLanguage && transcription) {
        const detection = await languageService.detectLanguage(transcription);
        detectedLanguage = detection.language;
        confidence = Math.min(confidence, detection.confidence);
      }

      return {
        id: this.generateId(),
        userId: '', // Will be set by calling component
        audioBlob,
        transcription,
        language: detectedLanguage,
        confidence,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Voice processing failed: ${error}`);
    }
  }

  /**
   * Convert voice message to different language
   */
  async translateVoiceMessage(
    voiceMessage: VoiceMessage,
    targetLanguage: Language
  ): Promise<VoiceMessage> {
    if (voiceMessage.language === targetLanguage) {
      return voiceMessage;
    }

    try {
      const translatedText = await languageService.translateText(
        voiceMessage.transcription,
        voiceMessage.language,
        targetLanguage
      );

      return {
        ...voiceMessage,
        id: this.generateId(),
        transcription: translatedText,
        language: targetLanguage,
        confidence: voiceMessage.confidence * 0.9 // Reduce confidence after translation
      };
    } catch (error) {
      throw new Error(`Voice translation failed: ${error}`);
    }
  }

  /**
   * Create voice response for healthcare scenarios
   */
  async createHealthcareVoiceResponse(
    message: string,
    language: Language,
    context: 'greeting' | 'vaccination' | 'emergency' | 'reminder' | 'general' = 'general'
  ): Promise<void> {
    try {
      // Adjust voice parameters based on context
      const voiceOptions = this.getContextualVoiceOptions(context);
      
      // Add appropriate tone and pacing for healthcare context
      const formattedMessage = this.formatHealthcareMessage(message, context, language);
      
      await this.speakText(formattedMessage, language, voiceOptions);
    } catch (error) {
      console.error('Healthcare voice response failed:', error);
      throw error;
    }
  }

  /**
   * Get voice options based on healthcare context
   */
  private getContextualVoiceOptions(context: string): {
    rate: number;
    pitch: number;
    volume: number;
  } {
    switch (context) {
      case 'emergency':
        return { rate: 1.1, pitch: 1.1, volume: 1.0 }; // Slightly faster and higher for urgency
      case 'vaccination':
      case 'reminder':
        return { rate: 0.9, pitch: 1.0, volume: 0.9 }; // Slower and calmer for important info
      case 'greeting':
        return { rate: 1.0, pitch: 1.05, volume: 0.8 }; // Friendly tone
      default:
        return { rate: 1.0, pitch: 1.0, volume: 0.8 }; // Normal conversation
    }
  }

  /**
   * Format message for healthcare context
   */
  private formatHealthcareMessage(
    message: string, 
    context: string, 
    language: Language
  ): string {
    // Add pauses and emphasis for better healthcare communication
    switch (context) {
      case 'vaccination':
        return `${message}. कृपया इस जानकारी को ध्यान से सुनें।`; // Please listen to this information carefully
      case 'emergency':
        return `महत्वपूर्ण: ${message}`; // Important: message
      case 'reminder':
        return `अनुस्मारक: ${message}. क्या आपको यह समझ आया?`; // Reminder: message. Did you understand this?
      default:
        return message;
    }
  }

  /**
   * Check if voice features are supported
   */
  isVoiceSupported(): {
    speechRecognition: boolean;
    speechSynthesis: boolean;
  } {
    return {
      speechRecognition: !!this.recognition,
      speechSynthesis: !!this.synthesis
    };
  }

  /**
   * Get current listening status
   */
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global speech recognition interface
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export const voiceService = VoiceService.getInstance();
