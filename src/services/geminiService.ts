import { GoogleGenerativeAI, GenerativeModel, GenerateContentRequest, GenerateContentResult } from '@google/generative-ai';
import { GEMINI_API_KEY, API_CONFIG } from '@/config/api';

export interface GeminiRequestOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
}

export interface GeminiResponse {
  text: string;
  modelUsed: string;
  attemptCount: number;
  success: boolean;
  error?: string;
}

export interface ModelAttempt {
  model: string;
  attempt: number;
  error?: string;
  success: boolean;
  timestamp: number;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private modelInstances: Map<string, GenerativeModel> = new Map();
  private failedModels: Set<string> = new Set();
  private lastResetTime: number = Date.now();
  private readonly RESET_INTERVAL = 60 * 60 * 1000; // Reset failed models every hour

  constructor() {
    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    this.initializeModels();
  }

  /**
   * Initialize all model instances
   */
  private initializeModels(): void {
    API_CONFIG.models.forEach(modelName => {
      try {
        const model = this.genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            maxOutputTokens: API_CONFIG.maxTokens,
          }
        });
        this.modelInstances.set(modelName, model);
      } catch (error) {
        console.warn(`Failed to initialize model ${modelName}:`, error);
      }
    });
  }

  /**
   * Reset failed models list periodically
   */
  private resetFailedModelsIfNeeded(): void {
    const now = Date.now();
    if (now - this.lastResetTime > this.RESET_INTERVAL) {
      this.failedModels.clear();
      this.lastResetTime = now;
      console.log('Reset failed models list');
    }
  }

  /**
   * Get available models (excluding failed ones)
   */
  private getAvailableModels(): string[] {
    this.resetFailedModelsIfNeeded();
    return API_CONFIG.models.filter(model => !this.failedModels.has(model));
  }

  /**
   * Check if error indicates rate limiting or quota exhaustion
   */
  private isRateLimitError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code || error?.status;
    
    return (
      errorCode === 429 ||
      errorCode === 503 ||
      errorMessage.includes('quota') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests') ||
      errorMessage.includes('resource exhausted') ||
      errorMessage.includes('limit exceeded') ||
      errorMessage.includes('temporarily unavailable')
    );
  }

  /**
   * Check if error indicates model unavailability
   */
  private isModelUnavailableError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code || error?.status;
    
    return (
      errorCode === 404 ||
      errorCode === 400 ||
      errorMessage.includes('model not found') ||
      errorMessage.includes('invalid model') ||
      errorMessage.includes('model unavailable') ||
      errorMessage.includes('not supported')
    );
  }

  /**
   * Wait for specified delay with exponential backoff
   */
  private async delay(ms: number, attempt: number = 1): Promise<void> {
    const backoffMs = ms * Math.pow(2, attempt - 1);
    return new Promise(resolve => setTimeout(resolve, Math.min(backoffMs, 10000)));
  }

  /**
   * Generate content with automatic model fallback
   */
  async generateContent(
    prompt: string | GenerateContentRequest,
    options: GeminiRequestOptions = {}
  ): Promise<GeminiResponse> {
    const availableModels = this.getAvailableModels();
    
    if (availableModels.length === 0) {
      throw new Error('No available models. All models have failed recently. Please try again later.');
    }

    // Start with primary model if available, otherwise use first available
    const orderedModels = availableModels.includes(API_CONFIG.primaryModel) 
      ? [API_CONFIG.primaryModel, ...availableModels.filter(m => m !== API_CONFIG.primaryModel)]
      : availableModels;

    const attempts: ModelAttempt[] = [];
    let lastError: any;

    for (let modelIndex = 0; modelIndex < orderedModels.length; modelIndex++) {
      const modelName = orderedModels[modelIndex];
      const model = this.modelInstances.get(modelName);
      
      if (!model) {
        console.warn(`Model instance not found for ${modelName}`);
        continue;
      }

      // Try each model with retry attempts
      for (let attempt = 1; attempt <= API_CONFIG.retryAttempts; attempt++) {
        const attemptStart = Date.now();
        
        try {
          console.log(`Attempting ${modelName} (attempt ${attempt}/${API_CONFIG.retryAttempts})`);
          
          // Configure generation parameters
          const generationConfig = {
            maxOutputTokens: options.maxTokens || API_CONFIG.maxTokens,
            temperature: options.temperature || 0.7,
            topP: options.topP || 0.8,
            topK: options.topK || 40,
            stopSequences: options.stopSequences || []
          };

          // Update model with new config
          const configuredModel = this.genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig
          });

          let result: GenerateContentResult;
          
          if (typeof prompt === 'string') {
            result = await configuredModel.generateContent(prompt);
          } else {
            result = await configuredModel.generateContent(prompt);
          }

          const response = await result.response;
          const text = response.text();

          attempts.push({
            model: modelName,
            attempt,
            success: true,
            timestamp: attemptStart
          });

          console.log(`✅ Success with ${modelName} on attempt ${attempt}`);
          
          return {
            text,
            modelUsed: modelName,
            attemptCount: attempts.length,
            success: true
          };

        } catch (error) {
          lastError = error;
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          attempts.push({
            model: modelName,
            attempt,
            error: errorMessage,
            success: false,
            timestamp: attemptStart
          });

          console.warn(`❌ ${modelName} attempt ${attempt} failed:`, errorMessage);

          // If it's a rate limit error, wait before retrying
          if (this.isRateLimitError(error)) {
            if (attempt < API_CONFIG.retryAttempts) {
              console.log(`Rate limit hit, waiting before retry...`);
              await this.delay(API_CONFIG.retryDelay, attempt);
              continue; // Retry same model
            } else {
              console.log(`Rate limit persists for ${modelName}, trying next model`);
              break; // Try next model
            }
          }

          // If model is unavailable, mark it as failed and try next model
          if (this.isModelUnavailableError(error)) {
            console.log(`Model ${modelName} unavailable, marking as failed`);
            this.failedModels.add(modelName);
            break; // Try next model immediately
          }

          // For other errors, wait before retrying
          if (attempt < API_CONFIG.retryAttempts) {
            await this.delay(API_CONFIG.retryDelay, attempt);
          }
        }
      }
    }

    // All models failed
    const errorDetails = attempts.map(a => 
      `${a.model} (attempt ${a.attempt}): ${a.error || 'Unknown error'}`
    ).join('\n');

    throw new Error(
      `All available models failed after ${attempts.length} attempts.\n\nDetails:\n${errorDetails}\n\nLast error: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Generate content for vision tasks (with image)
   */
  async generateContentWithImage(
    prompt: string,
    imageData: { data: string; mimeType: string },
    options: GeminiRequestOptions = {}
  ): Promise<GeminiResponse> {
    const request: GenerateContentRequest = [
      prompt,
      {
        inlineData: imageData
      }
    ];

    return this.generateContent(request, options);
  }

  /**
   * Get service status
   */
  getServiceStatus(): {
    availableModels: string[];
    failedModels: string[];
    totalModels: number;
    lastReset: number;
    nextReset: number;
  } {
    this.resetFailedModelsIfNeeded();
    
    return {
      availableModels: this.getAvailableModels(),
      failedModels: Array.from(this.failedModels),
      totalModels: API_CONFIG.models.length,
      lastReset: this.lastResetTime,
      nextReset: this.lastResetTime + this.RESET_INTERVAL
    };
  }

  /**
   * Manually reset failed models (for testing or admin purposes)
   */
  resetFailedModels(): void {
    this.failedModels.clear();
    this.lastResetTime = Date.now();
    console.log('Manually reset failed models list');
  }

  /**
   * Test all models to check availability
   */
  async testAllModels(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};
    const testPrompt = "Hello, please respond with 'OK' to confirm you're working.";

    for (const modelName of API_CONFIG.models) {
      try {
        const model = this.modelInstances.get(modelName);
        if (!model) {
          results[modelName] = false;
          continue;
        }

        const result = await model.generateContent(testPrompt);
        const response = await result.response;
        const text = response.text();
        
        results[modelName] = text.toLowerCase().includes('ok');
      } catch (error) {
        results[modelName] = false;
        console.warn(`Model ${modelName} test failed:`, error);
      }
    }

    return results;
  }
}

// Export singleton instance
export const geminiService = new GeminiService();