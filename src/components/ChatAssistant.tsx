import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '../config/api';
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
}

const ChatAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      text: "Hello! I'm Dr. CureCast. It's nice to meet you. How can I help you today?", 
      isUser: false 
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    setNewMessage('');
    setIsLoading(true);

    try {
      // First, analyze symptoms using rule-based system
      const analysis = analyzeSymptoms(newMessage);

      // Then get detailed response from Gemini
      const result = await model.generateContent(`As a professional doctor, provide a detailed but concise response about the following symptoms: ${newMessage}. Focus on immediate care advice and when to seek medical attention.`);
      const response = await result.response;
      const aiResponse = response.text();

      // Add both the AI response and our rule-based analysis
      setMessages(prev => [
        ...prev,
        {
          text: aiResponse,
          isUser: false,
          severity: analysis.severity,
          recommendation: analysis.recommendation
        }
      ]);
    } catch (error) {
      console.error('Error in chat:', error);
      setMessages(prev => [...prev, {
        text: "I apologize, but I'm having trouble analyzing your symptoms right now. For any concerning symptoms, please consult a healthcare professional.",
        isUser: false,
        severity: 'medium',
        recommendation: {
          action: 'visit clinic',
          text: 'Please consult a healthcare professional for proper diagnosis'
        }
      }]);
    } finally {
      setIsLoading(false);
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
        <p>Your personal assistant</p>
      </Header>

      <MessageContainer>
        {messages.map((msg, index) => (
          <Message key={index} $isUser={msg.isUser}>
            <MessageBubble $isUser={msg.isUser}>
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