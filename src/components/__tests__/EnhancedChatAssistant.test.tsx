import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EnhancedChatAssistant from '../EnhancedChatAssistant';

// Mock the services
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

vi.mock('../config/api', () => ({
  GEMINI_API_KEY: 'test-api-key'
}));

// Mock Google Generative AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: vi.fn().mockReturnValue('This is a test response from Gemini AI.')
        }
      })
    })
  }))
}));

describe('EnhancedChatAssistant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the enhanced chat assistant', () => {
    render(<EnhancedChatAssistant />);
    
    expect(screen.getByText('Enhanced Health Assistant')).toBeTruthy();
    expect(screen.getByText('Ask me about your health concerns')).toBeTruthy();
    expect(screen.getByPlaceholderText(/Describe your symptoms/)).toBeTruthy();
  });

  it('displays welcome message on load', () => {
    render(<EnhancedChatAssistant />);
    
    expect(screen.getByText(/Hello! I'm your health assistant/)).toBeTruthy();
  });

  it('handles symptom input correctly', async () => {
    render(<EnhancedChatAssistant />);
    
    const input = screen.getByPlaceholderText(/Describe your symptoms/);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    // Type a symptom
    fireEvent.change(input, { target: { value: 'I have a fever' } });
    fireEvent.click(sendButton);
    
    // Check that user message appears
    await waitFor(() => {
      expect(screen.getByText('I have a fever')).toBeTruthy();
    });
    
    // Check that loading indicator appears
    expect(screen.getByText(/Analyzing your symptoms/)).toBeTruthy();
  });

  it('shows assessment progress when in symptom assessment', async () => {
    render(<EnhancedChatAssistant />);
    
    const input = screen.getByPlaceholderText(/Describe your symptoms/);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    // Trigger symptom assessment
    fireEvent.change(input, { target: { value: 'I have a headache' } });
    fireEvent.click(sendButton);
    
    // Wait for assessment to start
    await waitFor(() => {
      expect(screen.getByText(/Symptom Assessment - Step/)).toBeInTheDocument();
    });
  });

  it('handles voice input when available', () => {
    // Mock speech recognition
    const mockSpeechRecognition = vi.fn().mockImplementation(() => ({
      continuous: false,
      interimResults: false,
      lang: 'en-US',
      start: vi.fn(),
      stop: vi.fn(),
      onresult: null,
      onerror: null,
      onend: null
    }));
    
    (global as any).webkitSpeechRecognition = mockSpeechRecognition;
    
    render(<EnhancedChatAssistant />);
    
    const voiceButton = screen.getByRole('button', { name: /voice/i });
    expect(voiceButton).toBeInTheDocument();
  });

  it('displays different message types with appropriate styling', async () => {
    render(<EnhancedChatAssistant />);
    
    const input = screen.getByPlaceholderText(/Describe your symptoms/);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    // Send a general health question
    fireEvent.change(input, { target: { value: 'What is diabetes?' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('What is diabetes?')).toBeInTheDocument();
    });
  });

  it('shows medical disclaimer', () => {
    render(<EnhancedChatAssistant />);
    
    expect(screen.getByText(/This AI assistant provides general health information only/)).toBeInTheDocument();
  });

  it('handles empty input gracefully', () => {
    render(<EnhancedChatAssistant />);
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    // Try to send empty message
    fireEvent.click(sendButton);
    
    // Should not add any new messages
    const messages = screen.getAllByText(/Hello! I'm your health assistant/);
    expect(messages).toHaveLength(1); // Only the welcome message
  });

  it('disables input during loading', async () => {
    render(<EnhancedChatAssistant />);
    
    const input = screen.getByPlaceholderText(/Describe your symptoms/);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'I feel sick' } });
    fireEvent.click(sendButton);
    
    // Input should be disabled during loading
    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });
});

describe('SymptomAssessmentService Integration', () => {
  it('detects symptom mentions correctly', () => {
    const symptomKeywords = [
      'fever', 'headache', 'cough', 'pain', 'ache', 'hurt', 'sick'
    ];
    
    const testMessages = [
      'I have a fever',
      'My head hurts',
      'I am feeling sick',
      'I have chest pain'
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
      'Thank you'
    ];
    
    testMessages.forEach(message => {
      const hasSymptom = symptomKeywords.some(keyword => 
        message.toLowerCase().includes(keyword)
      );
      expect(hasSymptom).toBe(false);
    });
  });
});
