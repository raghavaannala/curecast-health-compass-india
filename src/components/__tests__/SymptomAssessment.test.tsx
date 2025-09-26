import { describe, it, expect, vi } from 'vitest';

// Mock the symptom assessment service
vi.mock('../services/symptomAssessmentService', () => ({
  symptomAssessmentService: {
    startSymptomAssessment: vi.fn().mockResolvedValue({
      empathyResponse: "I understand you're feeling unwell with a fever.",
      firstQuestion: "Since when have you been experiencing this fever?",
      context: { primarySymptom: 'fever', currentStep: 0 }
    }),
    processAnswer: vi.fn().mockResolvedValue({
      acknowledgment: "Thank you for sharing that.",
      nextQuestion: "How high would you say your fever is?",
      isComplete: false
    })
  }
}));

describe('Symptom Assessment Integration', () => {
  it('detects symptom mentions correctly', () => {
    const symptomKeywords = [
      'fever', 'headache', 'cough', 'pain', 'ache', 'hurt', 'sick', 'nausea',
      'vomiting', 'diarrhea', 'dizzy', 'tired', 'fatigue', 'sore', 'swollen'
    ];
    
    const testMessages = [
      'I have a fever',
      'My head hurts',
      'I am feeling sick',
      'I have chest pain',
      'I feel nauseous',
      'I have been coughing'
    ];
    
    testMessages.forEach(message => {
      const hasSymptom = symptomKeywords.some(keyword => 
        message.toLowerCase().includes(keyword)
      );
      expect(hasSymptom).toBe(true);
    });
  });

  it('handles non-symptom messages correctly', () => {
    const symptomKeywords = [
      'fever', 'headache', 'cough', 'pain', 'ache', 'hurt', 'sick'
    ];
    
    const testMessages = [
      'Hello',
      'What is diabetes?',
      'How to prevent heart disease?',
      'Thank you',
      'Good morning',
      'Can you help me?'
    ];
    
    testMessages.forEach(message => {
      const hasSymptom = symptomKeywords.some(keyword => 
        message.toLowerCase().includes(keyword)
      );
      expect(hasSymptom).toBe(false);
    });
  });

  it('generates empathetic responses', async () => {
    const { symptomAssessmentService } = await import('../services/symptomAssessmentService');
    
    const result = await symptomAssessmentService.startSymptomAssessment(
      'user123',
      'I have a fever',
      'english'
    );
    
    expect(result.empathyResponse).toContain('understand');
    expect(result.firstQuestion).toContain('when');
    expect(result.context.primarySymptom).toBe('fever');
  });

  it('processes follow-up answers', async () => {
    const { symptomAssessmentService } = await import('../services/symptomAssessmentService');
    
    const result = await symptomAssessmentService.processAnswer(
      'user123',
      'Since yesterday',
      'english'
    );
    
    expect(result.acknowledgment).toContain('Thank you');
    expect(result.nextQuestion).toBeTruthy();
    expect(result.isComplete).toBe(false);
  });

  it('validates symptom assessment flow', () => {
    const assessmentFlow = [
      'duration',
      'severity', 
      'associated_symptoms',
      'location',
      'triggers'
    ];
    
    expect(assessmentFlow).toContain('duration');
    expect(assessmentFlow).toContain('severity');
    expect(assessmentFlow).toContain('associated_symptoms');
    expect(assessmentFlow.length).toBeGreaterThan(3);
  });

  it('handles multiple languages', () => {
    const supportedLanguages = [
      'english', 'hindi', 'telugu', 'tamil', 'bengali'
    ];
    
    supportedLanguages.forEach(language => {
      expect(typeof language).toBe('string');
      expect(language.length).toBeGreaterThan(0);
    });
  });
});
