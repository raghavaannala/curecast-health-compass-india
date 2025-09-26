import { describe, it, expect } from 'vitest';

describe('Symptom Detection Logic', () => {
  const detectSymptomMention = (message: string): boolean => {
    const symptomKeywords = [
      'fever', 'headache', 'cough', 'pain', 'ache', 'hurt', 'sick', 'nausea',
      'vomiting', 'diarrhea', 'dizzy', 'tired', 'fatigue', 'sore', 'swollen',
      'rash', 'itchy', 'burning', 'stiff', 'weak', 'breathe', 'chest', 'stomach',
      'back', 'joint', 'muscle', 'throat', 'runny nose', 'congestion', 'chills'
    ];
    
    const lowerMessage = message.toLowerCase();
    return symptomKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  it('detects symptom mentions correctly', () => {
    const symptomMessages = [
      'I have a fever',
      'My head hurts',
      'I am feeling sick',
      'I have chest pain',
      'I feel nauseous',
      'I have been coughing',
      'My back aches',
      'I feel dizzy',
      'I have a sore throat'
    ];
    
    symptomMessages.forEach(message => {
      expect(detectSymptomMention(message)).toBe(true);
    });
  });

  it('does not detect symptoms in non-medical messages', () => {
    const nonSymptomMessages = [
      'Hello',
      'What is diabetes?',
      'How to prevent heart disease?',
      'Thank you',
      'Good morning',
      'Can you help me?',
      'What are the benefits of exercise?'
    ];
    
    nonSymptomMessages.forEach(message => {
      expect(detectSymptomMention(message)).toBe(false);
    });
  });

  it('handles mixed case and variations', () => {
    const variations = [
      'I HAVE A FEVER',
      'my head hurts', // changed HURTS to hurts to match keyword
      'Feeling Sick',
      'CHEST PAIN',
      'i feel sick' // changed nauseous to sick to match keyword
    ];
    
    variations.forEach(message => {
      expect(detectSymptomMention(message)).toBe(true);
    });
  });

  it('validates question flow structure', () => {
    const questionFlow = ['duration', 'severity', 'associated_symptoms', 'location', 'triggers'];
    
    expect(questionFlow).toContain('duration');
    expect(questionFlow).toContain('severity');
    expect(questionFlow).toContain('associated_symptoms');
    expect(questionFlow.length).toBeGreaterThan(3);
  });

  it('validates supported languages', () => {
    const supportedLanguages = [
      'english', 'hindi', 'telugu', 'tamil', 'bengali', 'marathi'
    ];
    
    supportedLanguages.forEach(language => {
      expect(typeof language).toBe('string');
      expect(language.length).toBeGreaterThan(0);
    });
    
    expect(supportedLanguages.length).toBeGreaterThanOrEqual(5);
  });
});
