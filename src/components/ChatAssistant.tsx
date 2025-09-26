import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '../config/api';

// System prompt for consistent chatbot behavior
const systemPrompt = `
You are a friendly healthcare chatbot.

Rules:
1. If the user greets (e.g., "hi", "hello"), reply: "Hi, how are you? How can I help you today?"
2. If the user mentions a symptom like "I have fever":
   - Ask one question at a time:
     1. "What is your current body temperature?"
     2. "Since how many days have you been experiencing this?"
     3. "Do you have other symptoms like cough, sore throat, body pain, or headache?"
     4. "Are you taking any medicine?"
     5. "Do you have existing health conditions (like diabetes, asthma, heart problems)?"
   - After collecting answers, give a short summary of the condition, simple self-care advice, and a disclaimer: "I am not a doctor. Please consult a healthcare professional for proper diagnosis and treatment."
`;
import {
  ChatContainer,
  Header,
  MessageContainer,
  Message,
  MessageBubble,
  InputContainer,
  SendButton,
  VoiceButton,
  TypingIndicator,
  SeverityIndicator,
  Recommendation
} from '../styles/ChatStyles';
import { Input } from '@/components/ui/input';

// Basic symptom-disease mapping for rule-based responses
const SYMPTOM_RULES = {
  fever: {
    symptoms: ['fever', 'temperature', 'hot', 'chills'],
    conditions: {
      mild: "Common cold or mild viral infection",
      moderate: "Flu or bacterial infection",
      severe: "Severe infection or COVID-19"
    },
    recommendations: {
      mild: { action: "self-care", text: "Rest, stay hydrated, and monitor temperature" },
      moderate: { action: "visit clinic", text: "Schedule a check-up within 24 hours" },
      severe: { action: "emergency", text: "Seek immediate medical attention" }
    }
  },
  headache: {
    symptoms: ['headache', 'migraine', 'head pain'],
    conditions: {
      mild: "Tension headache",
      moderate: "Migraine",
      severe: "Severe migraine or potential neurological issue"
    },
    recommendations: {
      mild: { action: "self-care", text: "Rest in a quiet dark room, stay hydrated" },
      moderate: { action: "visit clinic", text: "Consult a doctor for proper diagnosis" },
      severe: { action: "emergency", text: "Seek immediate medical attention" }
    }
  },
  cough: {
    symptoms: ['cough', 'coughing', 'chest congestion'],
    conditions: {
      mild: "Common cold or mild allergies",
      moderate: "Bronchitis or persistent infection",
      severe: "Severe respiratory infection"
    },
    recommendations: {
      mild: { action: "self-care", text: "Rest, stay hydrated, use honey for cough" },
      moderate: { action: "visit clinic", text: "Get checked for proper treatment" },
      severe: { action: "emergency", text: "Seek immediate medical attention" }
    }
  }
};

interface Message {
  text: string;
  isUser: boolean;
  severity?: 'low' | 'medium' | 'high';
  recommendation?: {
    action: string;
    text: string;
  };
  isEmpathyResponse?: boolean;
  isFollowUpQuestion?: boolean;
  isAssessment?: boolean;
}

interface AssessmentState {
  isActive: boolean;
  symptom: string;
  step: number;
  responses: string[];
  questions: string[];
}

const ChatAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      text: "Hi, how are you? How can I help you today?", 
      isUser: false 
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [assessmentState, setAssessmentState] = useState<AssessmentState>({
    isActive: false,
    symptom: '',
    step: 0,
    responses: [],
    questions: []
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detect if message is a greeting
  const detectGreeting = (text: string): boolean => {
    const greetings = [
      'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening',
      'namaste', 'namaskar', 'hola', 'bonjour', 'guten tag'
    ];
    
    const lowerText = text.toLowerCase().trim();
    return greetings.some(greeting => 
      lowerText === greeting || 
      lowerText.startsWith(greeting + ' ') || 
      lowerText.startsWith(greeting + ',')
    );
  };

  // Detect if message mentions symptoms - Enhanced recognition
  const detectSymptomMention = (text: string): string | null => {
    const symptomKeywords = [
      'fever', 'headache', 'cough', 'pain', 'ache', 'hurt', 'sick', 'nausea',
      'vomiting', 'diarrhea', 'dizzy', 'tired', 'fatigue', 'sore', 'swollen',
      'rash', 'itchy', 'burning', 'stiff', 'weak', 'breathe', 'chest', 'stomach',
      'back', 'joint', 'muscle', 'throat', 'temperature', 'hot', 'chills',
      'cold', 'flu', 'migraine', 'diabetes', 'asthma', 'allergies', 'infection',
      'wound', 'cut', 'bruise', 'sprain', 'strain', 'anxiety', 'depression',
      'insomnia', 'constipation', 'heartburn', 'acidity', 'gas', 'bloating'
    ];
    
    const lowerText = text.toLowerCase();
    for (const symptom of symptomKeywords) {
      if (lowerText.includes(symptom)) {
        return symptom;
      }
    }
    return null;
  };

  // Generate empathetic response based on symptom - Caring and supportive
  const generateEmpathyResponse = (symptom: string): string => {
    const empathyResponses = {
      fever: "I'm sorry to hear you're not feeling well. Let me help you understand what might be going on.",
      headache: "I understand you're dealing with a headache. That can be really uncomfortable. Let me ask you some questions to better help you.",
      cough: "A persistent cough can be quite bothersome. I'm here to help you figure out what might be causing it.",
      pain: "I'm sorry you're experiencing pain. Let me ask you some questions so I can provide you with the best guidance.",
      sick: "I understand you're not feeling well. That's never pleasant, and I'm here to help you through this.",
      temperature: "I'm sorry to hear you're not feeling well with temperature issues. Let me help you understand what's happening.",
      hot: "I understand you're feeling unwell. Let me ask you some questions to better assess your condition.",
      chills: "I'm sorry you're experiencing chills. That can be quite uncomfortable. Let me help you understand what might be going on."
    };
    
    return empathyResponses[symptom] || "I understand you're not feeling well. I'm here to help you through this.";
  };

  // Generate follow-up questions based on system prompt - Exact questions
  const generateFollowUpQuestion = (symptom: string, step: number): string => {
    // Exact questions from system prompt
    const mandatoryQuestions = [
      "What is your current body temperature?",
      "Since how many days have you been experiencing this?",
      "Do you have other symptoms like cough, sore throat, body pain, or headache?",
      "Are you taking any medicine?",
      "Do you have existing health conditions (like diabetes, asthma, heart problems)?"
    ];

    const questionBank = {
      // All symptoms use the same standardized questions from system prompt
      fever: mandatoryQuestions,
      temperature: mandatoryQuestions,
      hot: mandatoryQuestions,
      chills: mandatoryQuestions,
      headache: mandatoryQuestions,
      cough: mandatoryQuestions,
      pain: mandatoryQuestions,
      sick: mandatoryQuestions,
      nausea: mandatoryQuestions,
      vomiting: mandatoryQuestions,
      diarrhea: mandatoryQuestions,
      dizzy: mandatoryQuestions,
      tired: mandatoryQuestions,
      fatigue: mandatoryQuestions,
      sore: mandatoryQuestions,
      swollen: mandatoryQuestions,
      rash: mandatoryQuestions,
      itchy: mandatoryQuestions,
      burning: mandatoryQuestions,
      stiff: mandatoryQuestions,
      weak: mandatoryQuestions,
      breathe: mandatoryQuestions,
      chest: mandatoryQuestions,
      stomach: mandatoryQuestions,
      back: mandatoryQuestions,
      joint: mandatoryQuestions,
      muscle: mandatoryQuestions,
      throat: mandatoryQuestions
    };
    
    const questions = questionBank[symptom] || questionBank.sick;
    return questions[step] || "Can you tell me more about how you're feeling?";
  };

  // Generate acknowledgment for user's answer - Natural and caring
  const generateAcknowledgment = (): string => {
    const acknowledgments = [
      "Thank you for sharing that with me.",
      "I understand, that's helpful to know.",
      "Got it, thank you for the information.",
      "That's very helpful, thank you.",
      "I see, thanks for letting me know.",
      "Thank you, that gives me a better picture."
    ];
    return acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
  };

  const analyzeSymptoms = (text: string): { severity: 'low' | 'medium' | 'high', condition: string, recommendation: { action: string, text: string } } => {
    const textLower = text.toLowerCase();
    let matchedRule: any = null;
    let severity: 'low' | 'medium' | 'high' = 'low';

    // Find matching symptoms
    for (const [key, rule] of Object.entries(SYMPTOM_RULES)) {
      if (rule.symptoms.some(symptom => textLower.includes(symptom))) {
        matchedRule = rule;
        
        // Determine severity based on keywords
        if (textLower.includes('severe') || textLower.includes('intense') || textLower.includes('worst')) {
          severity = 'high';
        } else if (textLower.includes('moderate') || textLower.includes('bad')) {
          severity = 'medium';
        }
        break;
      }
    }

    if (!matchedRule) {
      return {
        severity: 'medium',
        condition: "Unspecified condition",
        recommendation: {
          action: "visit clinic",
          text: "Please consult a healthcare professional for proper diagnosis"
        }
      };
    }

    return {
      severity,
      condition: matchedRule.conditions[severity],
      recommendation: matchedRule.recommendations[severity]
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const userMessage = { text: newMessage, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    const currentMessage = newMessage;
    setNewMessage('');
    setIsLoading(true);

    try {
      // Check if we're in an active assessment
      if (assessmentState.isActive) {
        // Continue assessment with acknowledgment
        const acknowledgment = generateAcknowledgment();
        setMessages(prev => [...prev, {
          text: acknowledgment,
          isUser: false
        }]);

        // Update assessment state with user's response
        const updatedResponses = [...assessmentState.responses, currentMessage];
        const nextStep = assessmentState.step + 1;

        // Check if we have more questions (5 mandatory questions)
        if (nextStep < 5) {
          // Ask next question
          setTimeout(() => {
            const nextQuestion = generateFollowUpQuestion(assessmentState.symptom, nextStep);
            setMessages(prev => [...prev, {
              text: nextQuestion,
              isUser: false,
              isFollowUpQuestion: true
            }]);
          }, 1500);

          setAssessmentState(prev => ({
            ...prev,
            step: nextStep,
            responses: updatedResponses
          }));
        } else {
          // Assessment complete - generate final assessment
          setTimeout(async () => {
            const finalAssessment = await generateFinalAssessment(assessmentState.symptom, updatedResponses);
            setMessages(prev => [...prev, {
              text: finalAssessment,
              isUser: false,
              isAssessment: true,
              severity: 'medium'
            }]);
          }, 2000);

          // Reset assessment state
          setAssessmentState({
            isActive: false,
            symptom: '',
            step: 0,
            responses: [],
            questions: []
          });
        }
      } else {
        // Check if message is a greeting
        if (detectGreeting(currentMessage)) {
          setMessages(prev => [...prev, {
            text: "Hi, how are you? How can I help you today?",
            isUser: false
          }]);
        } else {
          // Check if message mentions symptoms
          const detectedSymptom = detectSymptomMention(currentMessage);
          
          if (detectedSymptom) {
            // Start symptom assessment - Ask first question directly
            const firstQuestion = "What is your current body temperature?";
            
            setMessages(prev => [...prev, {
              text: firstQuestion,
              isUser: false,
              isFollowUpQuestion: true
            }]);

            // Set assessment state
            setAssessmentState({
              isActive: true,
              symptom: detectedSymptom,
              step: 0,
              responses: [],
              questions: []
            });
          } else {
            // Regular health query - use Gemini with system prompt
            const result = await model.generateContent(`${systemPrompt}\n\nUser message: "${currentMessage}"\n\nProvide a helpful response following the system prompt guidelines.`);
            const response = await result.response;
            const aiResponse = response.text();

            setMessages(prev => [...prev, {
              text: aiResponse,
              isUser: false
            }]);
          }
        }
      }
    } catch (error) {
      console.error('Error in chat:', error);
      setMessages(prev => [...prev, {
        text: "I apologize, but I'm having trouble processing your message right now. For any concerning symptoms, please consult a healthcare professional.",
        isUser: false,
        severity: 'medium'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate final assessment following system prompt format exactly
  const generateFinalAssessment = async (symptom: string, responses: string[]): Promise<string> => {
    try {
      const prompt = `${systemPrompt}

Based on a patient reporting ${symptom} and providing these responses to the 5 questions: ${responses.join(', ')}, provide:
1. A short summary of the condition
2. Simple self-care advice 
3. The exact disclaimer: "I am not a doctor. Please consult a healthcare professional for proper diagnosis and treatment."

Keep it simple and follow the system prompt guidelines exactly.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      return `**Summary of your condition:**
Based on your ${symptom} and the information you've shared, you appear to be experiencing symptoms that may be related to a common condition. 

**Self-care advice:**
• Get adequate rest
• Stay hydrated by drinking plenty of fluids
• Monitor your symptoms
• Maintain a comfortable environment

**I am not a doctor. Please consult a healthcare professional for proper diagnosis and treatment.**`;
    }
  };

  const toggleVoiceRecording = () => {
    if (!isRecording) {
      // Start recording logic here
      setIsRecording(true);
    } else {
      // Stop recording logic here
      setIsRecording(false);
    }
  };

  return (
    <ChatContainer>
      <Header>
        <h1>Dr. CureCast</h1>
        <p>
          {assessmentState.isActive 
            ? `Symptom Assessment - Step ${assessmentState.step + 1}/5 (${assessmentState.symptom})`
            : 'Your personal healthcare assistant'
          }
        </p>
      </Header>

      <MessageContainer>
        {messages.map((msg, index) => (
          <Message key={index} $isUser={msg.isUser}>
            <MessageBubble $isUser={msg.isUser}>
              {/* Message type indicator */}
              {!msg.isUser && (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '12px', color: '#666' }}>
                  {msg.isEmpathyResponse && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      💙 <em>Empathetic Response</em>
                    </span>
                  )}
                  {msg.isFollowUpQuestion && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ❓ <em>Follow-up Question</em>
                    </span>
                  )}
                  {msg.isAssessment && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      📋 <em>Health Assessment</em>
                    </span>
                  )}
                </div>
              )}
              
              {msg.text}
              
              {!msg.isUser && msg.severity && (
                <>
                  <SeverityIndicator severity={msg.severity}>
                    {msg.severity === 'low' && '✓ Mild Condition'}
                    {msg.severity === 'medium' && '⚠ Moderate Condition'}
                    {msg.severity === 'high' && '⚡ Severe Condition'}
                  </SeverityIndicator>
                  {msg.recommendation && (
                    <Recommendation>
                      <strong>Recommendation: </strong>
                      {msg.recommendation.text}
                    </Recommendation>
                  )}
                </>
              )}
            </MessageBubble>
          </Message>
        ))}
        {isLoading && (
          <TypingIndicator>
            <div className="dot" />
            <div className="dot" />
            <div className="dot" />
          </TypingIndicator>
        )}
        <div ref={messagesEndRef} />
      </MessageContainer>

      <InputContainer onSubmit={handleSendMessage}>
        <Input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <VoiceButton
          type="button"
          onClick={toggleVoiceRecording}
          isRecording={isRecording}
          title="Voice Input"
        >
          🎤
        </VoiceButton>
        <SendButton type="submit" disabled={isLoading || !newMessage.trim()}>
          {isLoading ? 'Processing...' : 'Send'}
        </SendButton>
      </InputContainer>
    </ChatContainer>
  );
};

export default ChatAssistant; 