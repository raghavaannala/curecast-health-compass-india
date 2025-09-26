import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '../config/api';
import { symptomAssessmentService, SymptomContext, AssessmentResult } from '../services/symptomAssessmentService';
import { 
  MessageCircle, 
  Send, 
  Mic, 
  MicOff, 
  Bot, 
  User, 
  AlertTriangle, 
  Heart, 
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isEmpathyResponse?: boolean;
  isFollowUpQuestion?: boolean;
  isAssessment?: boolean;
  assessment?: AssessmentResult;
  severity?: 'low' | 'medium' | 'high';
}

interface ConversationState {
  isInAssessment: boolean;
  assessmentContext?: SymptomContext;
  currentStep: number;
  userId: string;
}

const EnhancedChatAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your health assistant. I'm here to help you understand your symptoms and provide guidance. Please feel free to tell me about any health concerns you have. How are you feeling today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>({
    isInAssessment: false,
    currentStep: 0,
    userId: 'user_' + Math.random().toString(36).substr(2, 9)
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const model = new GoogleGenerativeAI(GEMINI_API_KEY).getGenerativeModel({ model: "gemini-pro" });

  useEffect(() => {
    scrollToBottom();
    setupSpeechRecognition();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const setupSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setNewMessage(transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  };

  const detectSymptomMention = (text: string): boolean => {
    const symptomKeywords = [
      'fever', 'headache', 'cough', 'pain', 'ache', 'hurt', 'sick', 'nausea',
      'vomiting', 'diarrhea', 'dizzy', 'tired', 'fatigue', 'sore', 'swollen',
      'rash', 'itchy', 'burning', 'stiff', 'weak', 'short of breath', 'chest pain',
      'stomach pain', 'back pain', 'joint pain', 'muscle pain', 'throat pain'
    ];
    
    const lowerText = text.toLowerCase();
    return symptomKeywords.some(keyword => lowerText.includes(keyword));
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: newMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = newMessage;
    setNewMessage('');
    setIsLoading(true);

    try {
      // Check if we're in an active assessment
      if (conversationState.isInAssessment) {
        await handleAssessmentResponse(currentMessage);
      } else {
        // Check if the message mentions symptoms
        if (detectSymptomMention(currentMessage)) {
          await startSymptomAssessment(currentMessage);
        } else {
          await handleGeneralQuery(currentMessage);
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      addBotMessage("I'm sorry, I encountered an error. Please try again or contact support if the issue persists.", 'medium');
    } finally {
      setIsLoading(false);
    }
  };

  const startSymptomAssessment = async (symptomMention: string) => {
    try {
      const assessment = await symptomAssessmentService.startSymptomAssessment(
        conversationState.userId,
        symptomMention,
        'english'
      );

      // Add empathy response
      addBotMessage(assessment.empathyResponse, 'low', true);

      // Add first follow-up question after a short delay
      setTimeout(() => {
        addBotMessage(assessment.firstQuestion, 'low', false, true);
      }, 1000);

      // Update conversation state
      setConversationState(prev => ({
        ...prev,
        isInAssessment: true,
        assessmentContext: assessment.context,
        currentStep: 1
      }));

    } catch (error) {
      console.error('Error starting symptom assessment:', error);
      addBotMessage("I understand you're not feeling well. Let me try to help you in a different way.", 'medium');
      await handleGeneralQuery(symptomMention);
    }
  };

  const handleAssessmentResponse = async (answer: string) => {
    try {
      const result = await symptomAssessmentService.processAnswer(
        conversationState.userId,
        answer,
        'english'
      );

      // Add acknowledgment
      addBotMessage(result.acknowledgment, 'low');

      if (result.isComplete && result.assessment) {
        // Assessment is complete, show final results
        setTimeout(() => {
          showAssessmentResults(result.assessment!);
        }, 1000);

        // Reset conversation state
        setConversationState(prev => ({
          ...prev,
          isInAssessment: false,
          assessmentContext: undefined,
          currentStep: 0
        }));
      } else if (result.nextQuestion) {
        // Ask next question
        setTimeout(() => {
          addBotMessage(result.nextQuestion!, 'low', false, true);
        }, 1500);

        // Update step
        setConversationState(prev => ({
          ...prev,
          currentStep: prev.currentStep + 1
        }));
      }

    } catch (error) {
      console.error('Error processing assessment response:', error);
      addBotMessage("I'm having trouble processing your response. Could you please rephrase that?", 'medium');
    }
  };

  const showAssessmentResults = (assessment: AssessmentResult) => {
    // Create comprehensive assessment message
    let assessmentText = "Based on our conversation, here's what I found:\n\n";

    // Possible conditions
    if (assessment.possibleConditions.length > 0) {
      assessmentText += "**Possible Conditions:**\n";
      assessment.possibleConditions.forEach(condition => {
        assessmentText += `• ${condition.condition} (${condition.probability} likelihood)\n`;
      });
      assessmentText += "\n";
    }

    // Immediate actions
    if (assessment.recommendations.immediate_actions.length > 0) {
      assessmentText += "**Immediate Actions:**\n";
      assessment.recommendations.immediate_actions.forEach(action => {
        assessmentText += `• ${action}\n`;
      });
      assessmentText += "\n";
    }

    // When to see doctor
    assessmentText += `**Medical Advice:** ${assessment.recommendations.when_to_see_doctor}\n\n`;

    // Home remedies if available
    if (assessment.recommendations.home_remedies && assessment.recommendations.home_remedies.length > 0) {
      assessmentText += "**Home Care Tips:**\n";
      assessment.recommendations.home_remedies.forEach(remedy => {
        assessmentText += `• ${remedy}\n`;
      });
      assessmentText += "\n";
    }

    // Red flags warning
    if (assessment.redFlags.length > 0) {
      assessmentText += "**⚠️ Seek Immediate Medical Attention If You Experience:**\n";
      assessment.redFlags.forEach(flag => {
        assessmentText += `• ${flag}\n`;
      });
      assessmentText += "\n";
    }

    // Preventive measures
    if (assessment.recommendations.preventive_measures.length > 0) {
      assessmentText += "**Prevention Tips:**\n";
      assessment.recommendations.preventive_measures.forEach(measure => {
        assessmentText += `• ${measure}\n`;
      });
    }

    assessmentText += "\n*Please remember: This assessment is for informational purposes only and doesn't replace professional medical advice. Always consult with a healthcare provider for proper diagnosis and treatment.*";

    const severity = assessment.urgencyLevel === 'immediate' ? 'high' : 
                    assessment.urgencyLevel === 'same_day' ? 'medium' : 'low';

    addBotMessage(assessmentText, severity, false, false, true, assessment);

    // Offer additional help
    setTimeout(() => {
      addBotMessage("Is there anything else about your symptoms you'd like to discuss, or do you have any other health questions?", 'low');
    }, 2000);
  };

  const handleGeneralQuery = async (query: string) => {
    try {
      // Use Gemini for general health queries
      const prompt = `As a compassionate healthcare assistant, provide helpful and accurate information about: "${query}". 
      Be empathetic, use simple language, and always remind users to consult healthcare professionals for serious concerns. 
      If this seems like a symptom or health concern, gently suggest they provide more details so you can help better.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();

      addBotMessage(aiResponse, 'low');

      // If the response might benefit from symptom assessment, offer it
      if (detectSymptomMention(query)) {
        setTimeout(() => {
          addBotMessage("Would you like me to ask you some specific questions about your symptoms to provide more personalized guidance?", 'low');
        }, 2000);
      }

    } catch (error) {
      console.error('Error with general query:', error);
      addBotMessage("I'm here to help with your health questions. Could you please tell me more about what you're experiencing?", 'medium');
    }
  };

  const addBotMessage = (
    text: string, 
    severity: 'low' | 'medium' | 'high' = 'low',
    isEmpathyResponse: boolean = false,
    isFollowUpQuestion: boolean = false,
    isAssessment: boolean = false,
    assessment?: AssessmentResult
  ) => {
    const botMessage: Message = {
      id: Date.now().toString() + Math.random(),
      text,
      isUser: false,
      timestamp: new Date(),
      severity,
      isEmpathyResponse,
      isFollowUpQuestion,
      isAssessment,
      assessment
    };

    setMessages(prev => [...prev, botMessage]);
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const getSeverityColor = (severity?: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  const getSeverityIcon = (severity?: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Heart className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="bg-white bg-opacity-20 p-2 rounded-full">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Enhanced Health Assistant</h2>
            <p className="text-blue-100 text-sm">
              {conversationState.isInAssessment 
                ? `Symptom Assessment - Step ${conversationState.currentStep}`
                : 'Ask me about your health concerns'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.isUser
                  ? 'bg-blue-600 text-white'
                  : `bg-gray-100 text-gray-800 border-l-4 ${getSeverityColor(message.severity)}`
              }`}
            >
              <div className="flex items-start space-x-2">
                {!message.isUser && (
                  <div className="flex-shrink-0 mt-1">
                    {message.isEmpathyResponse ? (
                      <Heart className="h-4 w-4 text-pink-500" />
                    ) : message.isFollowUpQuestion ? (
                      <MessageCircle className="h-4 w-4 text-blue-500" />
                    ) : message.isAssessment ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      getSeverityIcon(message.severity)
                    )}
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.text}
                  </div>
                  
                  {/* Assessment Results Display */}
                  {message.assessment && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <div className="text-xs text-gray-500 mb-2">Assessment Summary</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-medium">Urgency:</span>
                          <span className={`ml-1 px-2 py-1 rounded text-xs ${
                            message.assessment.urgencyLevel === 'immediate' ? 'bg-red-100 text-red-800' :
                            message.assessment.urgencyLevel === 'same_day' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {message.assessment.urgencyLevel.replace('_', ' ')}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Conditions:</span>
                          <span className="ml-1">{message.assessment.possibleConditions.length}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>

                {message.isUser && (
                  <div className="flex-shrink-0 mt-1">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-4 border-l-4 border-l-blue-500">
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4 text-blue-500" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600">Analyzing your symptoms...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={
                conversationState.isInAssessment 
                  ? "Please answer the question above..."
                  : "Describe your symptoms or ask a health question..."
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            
            {recognitionRef.current && (
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded ${
                  isListening ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!newMessage.trim() || isLoading}
            className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          {conversationState.isInAssessment && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Assessment in progress - Please answer the questions to get personalized guidance
            </span>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border-t border-amber-200 p-3 rounded-b-lg">
        <p className="text-xs text-amber-700 text-center">
          ⚠️ This AI assistant provides general health information only. Always consult healthcare professionals for medical advice, diagnosis, or treatment.
        </p>
      </div>
    </div>
  );
};

export default EnhancedChatAssistant;
