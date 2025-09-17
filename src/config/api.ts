export const GEMINI_API_KEY = 'AIzaSyC9Ci3dLb9PSBQ4m0VxxRTtVVEUknkVABU';

export const API_CONFIG = {
  baseUrl: 'https://generativelanguage.googleapis.com/v1/models',
  models: [
    'gemini-2.5-pro',
    'gemini-2.0-pro', 
    'gemini-2.0-flash',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-2.0-flash-lite'
  ],
  primaryModel: 'gemini-2.0-flash', // Default model to try first
  maxTokens: 800,
  retryAttempts: 3,
  retryDelay: 1000, // milliseconds
};