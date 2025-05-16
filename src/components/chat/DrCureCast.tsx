import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY, API_CONFIG } from '@/config/api';
import { Stethoscope, Loader2, Send, AlertTriangle, Info, ChevronDown, User, Bot, Heart, Wind, Pill, Phone, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import {
  ChatContainer,
  Header,
  MessageContainer,
  Message,
  MessageBubble,
  InputContainer,
  SeverityIndicator,
  Recommendation,
  TypingIndicator
} from '@/styles/ChatStyles';

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

interface ChatMessage {
  text: string;
  isUser: boolean;
  severity?: 'low' | 'medium' | 'high';
  recommendation?: {
    action: string;
    text: string;
  };
  sections?: {
    assessment?: string;
    causes?: string;
    careAdvice?: string;
    whenToSeekHelp?: string;
  };
}

const getInitialGreeting = (language: string) => {
  switch (language) {
    case 'hindi':
      return 'नमस्ते! मैं डॉ. क्योरकास्ट हूं। मैं आपकी स्वास्थ्य संबंधी चिंताओं में मदद कर सकता हूं। कृपया मुझे बताएं कि आप कैसा महसूस कर रहे हैं?';
    case 'telugu':
      return 'నమస్కారం! నేను డాక్టర్ క్యూర్కాస్ట్. నేను మీ ఆరోగ్య సమస్యలలో సహాయం చేయగలను. దయచేసి మీరు ఎలా అనుభవిస్తున్నారో నాకు చెప్పండి?';
    default:
      return "Good day, I'm Dr. CureCast. I'm a qualified medical professional here to assist with your health concerns. Please describe your symptoms, and I'll provide a medical assessment.";
  }
};

const DrCureCast: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      text: getInitialGreeting(currentLanguage), 
      isUser: false 
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update greeting when language changes
  useEffect(() => {
    setMessages([{ 
      text: getInitialGreeting(currentLanguage), 
      isUser: false 
    }]);
  }, [currentLanguage]);

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
        severity: 'medium' as const,
        condition: "Unspecified condition",
        recommendation: {
          action: "visit clinic",
          text: "Please consult a healthcare professional for proper diagnosis"
        }
      };
    }

    const severityMap = {
      'low': 'mild',
      'medium': 'moderate',
      'high': 'severe'
    } as const;

    return {
      severity,
      condition: matchedRule.conditions[severityMap[severity]],
      recommendation: matchedRule.recommendations[severityMap[severity]]
    };
  };

  const processAIResponse = (response: string): { text: string, sections: { assessment?: string, causes?: string, careAdvice?: string, whenToSeekHelp?: string } } => {
    // Remove any asterisks from the response
    const cleanedResponse = response.replace(/\*/g, '');
    
    // Default structured response
    const defaultResponse = {
      text: cleanedResponse,
      sections: {}
    };

    try {
      // Try to split the response into sections
      const assessmentMatch = cleanedResponse.match(/Initial assessment:?(.*?)(?=(Possible causes|$))/is);
      const causesMatch = cleanedResponse.match(/Possible causes:?(.*?)(?=(Immediate care advice|$))/is);
      const careAdviceMatch = cleanedResponse.match(/Immediate care advice:?(.*?)(?=(When to seek medical attention|$))/is);
      const whenToSeekHelpMatch = cleanedResponse.match(/When to seek medical attention:?(.*)/is);

      // Build structured sections if matches found
      if (assessmentMatch || causesMatch || careAdviceMatch || whenToSeekHelpMatch) {
        return {
          text: cleanedResponse,
          sections: {
            assessment: assessmentMatch ? assessmentMatch[1].trim() : undefined,
            causes: causesMatch ? causesMatch[1].trim() : undefined,
            careAdvice: careAdviceMatch ? careAdviceMatch[1].trim() : undefined,
            whenToSeekHelp: whenToSeekHelpMatch ? whenToSeekHelpMatch[1].trim() : undefined
          }
        };
      }
      
      return defaultResponse;
    } catch (error) {
      console.error("Error formatting AI response:", error);
      return defaultResponse;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      text: input,
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // First, analyze symptoms using rule-based system
      const analysis = analyzeSymptoms(input);

      // Then get detailed response from Gemini
      const prompt = `You are Dr.CureCast, a professional medical physician with extensive experience. A patient has described their symptoms as: "${input}". 
      
      Please provide a concise, professional medical response in ${currentLanguage} using clear but medically appropriate language. Remember that you are a qualified doctor and should respond with the authority and professionalism expected of a medical professional.
      
      Structure your response clearly with these sections:
      1. Initial assessment: Provide a brief professional assessment (2-3 sentences)
      2. Possible causes: List 2-3 potential diagnoses (use professional medical terms where appropriate)
      3. Immediate care advice: Provide evidence-based recommendations for home care
      4. When to seek medical attention: Clear clinical indicators that warrant professional medical attention
      
      Use language appropriate for a doctor-patient consultation. Maintain a calm, authoritative, and reassuring tone throughout.
      Do NOT use asterisks (*) or informal formatting in your response.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      if (!response.text) {
        throw new Error('No response from AI model');
      }

      const aiResponseText = response.text();
      const processedResponse = processAIResponse(aiResponseText);

      setMessages(prev => [
        ...prev,
        {
          text: processedResponse.text,
          isUser: false,
          severity: analysis.severity,
          recommendation: analysis.recommendation,
          sections: processedResponse.sections
        }
      ]);
    } catch (error) {
      console.error('Error in chat:', error);
      
      // Add the error message to the chat
      setMessages(prev => [
        ...prev,
        {
          text: currentLanguage === 'hindi' 
            ? 'क्षमा करें, मैं अभी आपके लक्षणों का विश्लेषण करने में असमर्थ हूं। किसी भी चिंताजनक लक्षण के लिए, कृपया चिकित्सक से परामर्श करें।'
            : currentLanguage === 'telugu'
            ? 'క్షమించండి, నేను ప్రస్తుతం మీ లక్షణాలను విశ్లేషించలేకపోతున్నాను. ఏదైనా ఆందోళనకరమైన లక్షణాల కోసం, దయచేసి వైద్యుడిని సంప్రదించండి.'
            : 'I apologize, but I\'m having trouble analyzing your symptoms right now. For any concerning symptoms, please consult a healthcare professional.',
          isUser: false,
          severity: 'medium',
          recommendation: {
            action: 'visit clinic',
            text: 'Please consult a healthcare professional for proper diagnosis'
          }
        }
      ]);

      toast({
        title: "Error",
        description: "There was an issue connecting to the AI. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Get severity color
  const getSeverityColor = (severity?: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getRecommendationColor = (action?: string) => {
    switch (action) {
      case 'self-care': return 'bg-green-100 border-green-200';
      case 'visit clinic': return 'bg-yellow-100 border-yellow-200';
      case 'emergency': return 'bg-red-100 border-red-200';
      default: return 'bg-blue-100 border-blue-200';
    }
  };

  const renderMessageContent = (message: ChatMessage) => {
    if (message.isUser) {
      return <p className="text-gray-800">{message.text}</p>;
    }

    // For AI responses
    if (message.sections && Object.keys(message.sections).length > 0) {
      return (
        <div className="space-y-4">
          {!message.sections.assessment && !message.sections.causes && !message.sections.careAdvice && !message.sections.whenToSeekHelp && (
            <p className="text-gray-800">{message.text}</p>
          )}
          
          {message.sections.assessment && (
            <div className="rounded-lg bg-blue-50 p-3 border border-blue-100">
              <div className="flex items-center gap-2 font-medium text-blue-700 mb-2">
                <Stethoscope size={18} />
                <h4>Assessment</h4>
              </div>
              <p className="text-gray-800">{message.sections.assessment}</p>
            </div>
          )}
          
          {message.sections.causes && (
            <div className="rounded-lg bg-purple-50 p-3 border border-purple-100">
              <div className="flex items-center gap-2 font-medium text-purple-700 mb-2">
                <Info size={18} />
                <h4>Possible Causes</h4>
              </div>
              <p className="text-gray-800">{message.sections.causes}</p>
            </div>
          )}
          
          {message.sections.careAdvice && (
            <div className="rounded-lg bg-green-50 p-3 border border-green-100">
              <div className="flex items-center gap-2 font-medium text-green-700 mb-2">
                <Heart size={18} />
                <h4>Care Advice</h4>
              </div>
              <p className="text-gray-800">{message.sections.careAdvice}</p>
            </div>
          )}
          
          {message.sections.whenToSeekHelp && (
            <div className="rounded-lg bg-amber-50 p-3 border border-amber-100">
              <div className="flex items-center gap-2 font-medium text-amber-700 mb-2">
                <AlertTriangle size={18} />
                <h4>When to Seek Medical Help</h4>
              </div>
              <p className="text-gray-800">{message.sections.whenToSeekHelp}</p>
            </div>
          )}
        </div>
      );
    }

    return <p className="text-gray-800">{message.text}</p>;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4 p-4 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-xl shadow-sm">
        <div className="p-2 rounded-full bg-white/90 shadow-sm">
          <Stethoscope className="h-7 w-7 text-primary-600" />
        </div>
        <div>
          <h2 className="font-display font-bold text-xl text-gray-800">Dr.CureCast</h2>
          <p className="text-sm text-gray-600">Board-certified Medical Physician</p>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col shadow-lg border-gray-200">
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="space-y-6">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`flex gap-3 max-w-[80%] ${msg.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.isUser ? 'bg-blue-100' : 'bg-green-100'}`}>
                    {msg.isUser ? (
                      <User size={16} className="text-blue-600" />
                    ) : (
                      <Bot size={16} className="text-green-600" />
                    )}
                  </div>
                  
                  <div>
                    <div className={`rounded-2xl px-4 py-3 ${
                      msg.isUser 
                        ? 'bg-blue-50 border border-blue-100 text-gray-800 rounded-tr-none' 
                        : 'bg-white border border-gray-200 shadow-sm text-gray-800 rounded-tl-none'
                    }`}>
                      {renderMessageContent(msg)}
                    </div>

                    {!msg.isUser && msg.severity && (
                      <div className={`mt-2 inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${getSeverityColor(msg.severity)}`}>
                        {msg.severity === 'high' ? (
                          <AlertTriangle size={12} className="text-red-600" />
                        ) : msg.severity === 'medium' ? (
                          <Wind size={12} className="text-yellow-600" />
                        ) : (
                          <Info size={12} className="text-green-600" />
                        )}
                        {msg.severity === 'high' 
                          ? 'Urgent attention needed'
                          : msg.severity === 'medium'
                          ? 'Medical advice recommended'
                          : 'Minor concern'
                        }
                      </div>
                    )}
                    
                    {!msg.isUser && msg.recommendation && (
                      <div className={`mt-2 p-2 rounded-lg text-sm ${getRecommendationColor(msg.recommendation.action)}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {msg.recommendation.action === 'emergency' ? (
                            <Phone size={14} className="text-red-600" />
                          ) : msg.recommendation.action === 'visit clinic' ? (
                            <Clock size={14} className="text-yellow-600" />
                          ) : (
                            <Pill size={14} className="text-green-600" />
                          )}
                          <span className="font-medium">
                            {msg.recommendation.action === 'emergency' 
                              ? 'Seek immediate help'
                              : msg.recommendation.action === 'visit clinic'
                              ? 'Visit a healthcare provider'
                              : 'Self-care advice'
                            }
                          </span>
                        </div>
                        <p className="ml-6 text-gray-700">{msg.recommendation.text}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-green-100">
                    <Bot size={16} className="text-green-600" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 bg-white border border-gray-200 shadow-sm rounded-tl-none">
                    <div className="flex space-x-2 p-2">
                      <div className="h-2 w-2 rounded-full bg-gray-400 animate-pulse"></div>
                      <div className="h-2 w-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="h-2 w-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-white">
          <form 
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your symptoms here..."
              disabled={isProcessing}
              className="flex-1 bg-gray-50 border-gray-200 focus:border-primary-300 focus:ring-primary-200"
            />
            <Button 
              type="submit" 
              disabled={!input.trim() || isProcessing}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </form>
          
          <p className="text-xs text-gray-500 mt-2 text-center">
            If you have a medical emergency, please call your local emergency number immediately.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default DrCureCast; 