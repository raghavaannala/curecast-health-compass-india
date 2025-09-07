import { Language } from '../types';
import { languageService } from '../services/languageService';

// Comprehensive error handling and security utilities for Dr.Curecast
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLogs: Array<{
    timestamp: string;
    error: Error;
    context: string;
    userId?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }> = [];

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and log errors with appropriate user feedback
   */
  async handleError(
    error: Error,
    context: string,
    userId?: string,
    language: Language = 'english'
  ): Promise<{
    userMessage: string;
    shouldRetry: boolean;
    logId: string;
  }> {
    const severity = this.assessErrorSeverity(error, context);
    const logId = this.logError(error, context, severity, userId);

    const userMessage = await this.generateUserFriendlyMessage(error, context, language);
    const shouldRetry = this.shouldAllowRetry(error, context);

    // Send critical errors to monitoring system
    if (severity === 'critical') {
      await this.sendToMonitoring(error, context, userId);
    }

    return {
      userMessage,
      shouldRetry,
      logId
    };
  }

  /**
   * Validate and sanitize user input
   */
  validateInput(input: any, type: 'text' | 'voice' | 'file' | 'api_key'): {
    isValid: boolean;
    sanitized?: any;
    errors: string[];
  } {
    const errors: string[] = [];
    let sanitized = input;

    switch (type) {
      case 'text':
        if (typeof input !== 'string') {
          errors.push('Input must be a string');
          break;
        }
        
        // Check for malicious content
        if (this.containsMaliciousContent(input)) {
          errors.push('Input contains potentially harmful content');
          break;
        }

        // Sanitize HTML and scripts
        sanitized = this.sanitizeText(input);
        
        // Check length limits
        if (sanitized.length > 10000) {
          errors.push('Input too long (max 10,000 characters)');
        }
        break;

      case 'voice':
        if (!(input instanceof Blob)) {
          errors.push('Voice input must be a Blob');
          break;
        }
        
        // Check file size (max 10MB)
        if (input.size > 10 * 1024 * 1024) {
          errors.push('Audio file too large (max 10MB)');
        }
        
        // Check MIME type
        if (!input.type.startsWith('audio/')) {
          errors.push('Invalid audio format');
        }
        break;

      case 'api_key':
        if (typeof input !== 'string') {
          errors.push('API key must be a string');
          break;
        }
        
        // Basic API key format validation
        if (input.length < 10 || input.length > 200) {
          errors.push('Invalid API key format');
        }
        
        // Mask the key for logging
        sanitized = this.maskApiKey(input);
        break;

      case 'file':
        if (!(input instanceof File)) {
          errors.push('Input must be a File');
          break;
        }
        
        // Check file size (max 50MB)
        if (input.size > 50 * 1024 * 1024) {
          errors.push('File too large (max 50MB)');
        }
        
        // Check allowed file types
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
        if (!allowedTypes.includes(input.type)) {
          errors.push('File type not allowed');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      sanitized: errors.length === 0 ? sanitized : undefined,
      errors
    };
  }

  /**
   * Rate limiting for API calls and user actions
   */
  checkRateLimit(
    userId: string,
    action: 'message' | 'voice' | 'api_call' | 'file_upload',
    windowMs: number = 60000 // 1 minute default
  ): {
    allowed: boolean;
    resetTime?: number;
    remaining?: number;
  } {
    const key = `${userId}_${action}`;
    const now = Date.now();
    
    // Get or create rate limit data
    const rateLimitData = this.getRateLimitData(key);
    
    // Define limits per action type
    const limits = {
      message: 60, // 60 messages per minute
      voice: 30,   // 30 voice messages per minute
      api_call: 100, // 100 API calls per minute
      file_upload: 10 // 10 file uploads per minute
    };

    const limit = limits[action];
    
    // Reset window if expired
    if (now - rateLimitData.windowStart > windowMs) {
      rateLimitData.count = 0;
      rateLimitData.windowStart = now;
    }

    // Check if limit exceeded
    if (rateLimitData.count >= limit) {
      return {
        allowed: false,
        resetTime: rateLimitData.windowStart + windowMs,
        remaining: 0
      };
    }

    // Increment counter
    rateLimitData.count++;
    this.setRateLimitData(key, rateLimitData);

    return {
      allowed: true,
      remaining: limit - rateLimitData.count
    };
  }

  /**
   * Encrypt sensitive data before storage
   */
  async encryptSensitiveData(data: string, key: string = ''): Promise<string> {
    try {
      // In a real implementation, use proper encryption libraries like crypto-js
      // This is a simplified example
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Use Web Crypto API for encryption
      const cryptoKey = await this.getOrCreateEncryptionKey(key);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        dataBuffer
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptSensitiveData(encryptedData: string, key: string = ''): Promise<string> {
    try {
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const cryptoKey = await this.getOrCreateEncryptionKey(key);
      
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  /**
   * Validate HIPAA/GDPR compliance for data operations
   */
  validateDataCompliance(
    operation: 'create' | 'read' | 'update' | 'delete' | 'share',
    dataType: 'medical' | 'personal' | 'voice' | 'location',
    userConsent: {
      hasConsent: boolean;
      consentDate?: string;
      purpose?: string;
    }
  ): {
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check basic consent
    if (!userConsent.hasConsent) {
      issues.push('User consent required for this operation');
      recommendations.push('Obtain explicit user consent before proceeding');
    }

    // Check consent age (must be renewed every 2 years for medical data)
    if (userConsent.consentDate && dataType === 'medical') {
      const consentAge = Date.now() - new Date(userConsent.consentDate).getTime();
      const twoYears = 2 * 365 * 24 * 60 * 60 * 1000;
      
      if (consentAge > twoYears) {
        issues.push('Medical data consent has expired');
        recommendations.push('Renew user consent for medical data processing');
      }
    }

    // Check operation-specific requirements
    switch (operation) {
      case 'share':
        if (dataType === 'medical' && !userConsent.purpose?.includes('government_sync')) {
          issues.push('Sharing medical data requires specific purpose consent');
          recommendations.push('Obtain consent for government database sharing');
        }
        break;

      case 'delete':
        // Right to be forgotten - should always be allowed
        break;

      case 'create':
        if (dataType === 'voice' && !userConsent.purpose?.includes('voice_processing')) {
          issues.push('Voice recording requires specific consent');
          recommendations.push('Obtain consent for voice data processing');
        }
        break;
    }

    return {
      compliant: issues.length === 0,
      issues,
      recommendations
    };
  }

  // Private helper methods

  private assessErrorSeverity(
    error: Error, 
    context: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Critical errors
    if (context.includes('emergency') || context.includes('government_sync')) {
      return 'critical';
    }

    // High severity errors
    if (error.message.includes('authentication') || 
        error.message.includes('permission') ||
        context.includes('vaccination')) {
      return 'high';
    }

    // Medium severity errors
    if (error.message.includes('network') || 
        error.message.includes('timeout') ||
        context.includes('translation')) {
      return 'medium';
    }

    return 'low';
  }

  private logError(
    error: Error,
    context: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    userId?: string
  ): string {
    const logId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      error,
      context,
      userId,
      severity
    };

    this.errorLogs.push(logEntry);

    // Keep only last 1000 error logs
    if (this.errorLogs.length > 1000) {
      this.errorLogs = this.errorLogs.slice(-1000);
    }

    console.error(`[${logId}] ${severity.toUpperCase()}: ${error.message}`, {
      context,
      userId,
      stack: error.stack
    });

    return logId;
  }

  private async generateUserFriendlyMessage(
    error: Error,
    context: string,
    language: Language
  ): Promise<string> {
    let message = '';

    // Generate context-appropriate messages
    switch (context) {
      case 'voice_recognition':
        message = 'I had trouble understanding your voice. Please try speaking clearly or use text input.';
        break;
      case 'translation':
        message = 'Translation service is temporarily unavailable. I\'ll respond in English for now.';
        break;
      case 'government_sync':
        message = 'Unable to connect to government health databases. Please try again later.';
        break;
      case 'vaccination_reminder':
        message = 'There was an issue setting up your vaccination reminder. Please try again.';
        break;
      case 'network':
        message = 'Network connection issue. Please check your internet connection and try again.';
        break;
      default:
        message = 'I encountered an issue while processing your request. Please try again.';
    }

    // Translate if needed
    if (language !== 'english') {
      try {
        return await languageService.translateText(message, 'english', language);
      } catch (translationError) {
        console.error('Failed to translate error message:', translationError);
      }
    }

    return message;
  }

  private shouldAllowRetry(error: Error, context: string): boolean {
    // Don't retry for authentication or permission errors
    if (error.message.includes('authentication') || 
        error.message.includes('permission') ||
        error.message.includes('unauthorized')) {
      return false;
    }

    // Don't retry for validation errors
    if (error.message.includes('validation') || 
        error.message.includes('invalid')) {
      return false;
    }

    // Allow retry for network and temporary errors
    return true;
  }

  private async sendToMonitoring(error: Error, context: string, userId?: string): Promise<void> {
    // In a real implementation, this would send to monitoring services like Sentry, DataDog, etc.
    console.error('CRITICAL ERROR - Sending to monitoring:', {
      error: error.message,
      context,
      userId,
      timestamp: new Date().toISOString(),
      stack: error.stack
    });
  }

  private containsMaliciousContent(input: string): boolean {
    const maliciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /vbscript:/gi
    ];

    return maliciousPatterns.some(pattern => pattern.test(input));
  }

  private sanitizeText(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  private maskApiKey(apiKey: string): string {
    if (apiKey.length <= 8) {
      return '*'.repeat(apiKey.length);
    }
    return apiKey.slice(0, 4) + '*'.repeat(apiKey.length - 8) + apiKey.slice(-4);
  }

  private getRateLimitData(key: string): { count: number; windowStart: number } {
    // In a real implementation, this would use Redis or similar
    const stored = localStorage.getItem(`rateLimit_${key}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return { count: 0, windowStart: Date.now() };
  }

  private setRateLimitData(key: string, data: { count: number; windowStart: number }): void {
    localStorage.setItem(`rateLimit_${key}`, JSON.stringify(data));
  }

  private async getOrCreateEncryptionKey(keyId?: string): Promise<CryptoKey> {
    // In a real implementation, this would securely manage encryption keys
    return await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): {
    total: number;
    bySeverity: Record<string, number>;
    byContext: Record<string, number>;
    recentErrors: number;
  } {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    const bySeverity: Record<string, number> = {};
    const byContext: Record<string, number> = {};
    let recentErrors = 0;

    for (const log of this.errorLogs) {
      // Count by severity
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
      
      // Count by context
      byContext[log.context] = (byContext[log.context] || 0) + 1;
      
      // Count recent errors (last hour)
      if (now - new Date(log.timestamp).getTime() < oneHour) {
        recentErrors++;
      }
    }

    return {
      total: this.errorLogs.length,
      bySeverity,
      byContext,
      recentErrors
    };
  }
}

export const errorHandler = ErrorHandler.getInstance();
