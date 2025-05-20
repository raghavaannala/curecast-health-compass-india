import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY, API_CONFIG } from '@/config/api';
import { Stethoscope, Loader2, Send, AlertTriangle, Info, ChevronDown, User, Bot, Heart, Wind, Pill, Phone, Clock, Mic, Camera } from 'lucide-react';
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

// Enhanced symptom-disease mapping with photo requirements
const SYMPTOM_RULES = {
  snakebite: {
    symptoms: ['snake', 'bite', 'snake bite', 'bitten', 'venom', 'poisonous'],
    requiresPhoto: true,
    photoPrompt: "It's crucial to get a clear photo of the bite area. This will help assess the severity and type of snake bite. Please use the camera button to take or upload a clear photo showing:\n- The bite marks\n- Any swelling or discoloration\n- The surrounding area\n\nWhile you do this, please also tell me:\n- When did the bite occur?\n- Did you see the snake? If yes, what did it look like?\n- Are you experiencing any symptoms like dizziness or numbness?",
    conditions: {
      mild: "Possible dry bite or non-venomous snake bite",
      moderate: "Venomous snake bite requiring immediate attention",
      severe: "Severe envenomation requiring emergency care"
    },
    recommendations: {
      mild: { action: "visit clinic", text: "While it may be a non-venomous bite, medical evaluation is necessary for proper assessment" },
      moderate: { action: "emergency", text: "Proceed to emergency care immediately. Keep the affected area below heart level" },
      severe: { action: "emergency", text: "IMMEDIATE EMERGENCY CARE REQUIRED. Call emergency services now" }
    }
  },
  skin: {
    symptoms: ['rash', 'skin', 'itchy', 'itching', 'hives', 'spots', 'allergic', 'dermatitis'],
    requiresPhoto: true,
    photoPrompt: "To provide an accurate assessment of your skin condition, please use the camera button to take or upload a clear photo showing:\n- The affected area\n- Any patterns or texture changes\n- The surrounding healthy skin for comparison\n\nPlease also describe:\n- When did you first notice these symptoms?\n- Is there any itching, burning, or pain?\n- Have you used any medications on the area?",
    conditions: {
      mild: "Minor skin irritation or contact dermatitis",
      moderate: "Acute allergic reaction or infection",
      severe: "Severe allergic reaction or spreading infection"
    },
    recommendations: {
      mild: { action: "self-care", text: "Monitor the condition and try over-the-counter treatments" },
      moderate: { action: "visit clinic", text: "Schedule an appointment with a dermatologist" },
      severe: { action: "emergency", text: "Seek immediate medical attention" }
    }
  },
  wound: {
    symptoms: ['cut', 'wound', 'injury', 'bleeding', 'scrape', 'burn', 'laceration'],
    requiresPhoto: true,
    photoPrompt: "For proper wound assessment, please use the camera button to take or upload a clear photo showing:\n- The entire wound area\n- Any bleeding or discharge\n- The depth of the wound if visible\n\nPlease also tell me:\n- How did the injury occur?\n- When did it happen?\n- Is there active bleeding?\n- When was your last tetanus shot?",
    conditions: {
      mild: "Superficial wound or minor cut",
      moderate: "Deep cut or wound requiring medical attention",
      severe: "Severe injury requiring immediate care"
    },
    recommendations: {
      mild: { action: "self-care", text: "Clean the wound and apply appropriate first aid" },
      moderate: { action: "visit clinic", text: "Seek medical attention for proper wound care" },
      severe: { action: "emergency", text: "Immediate emergency care required" }
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
  imageUrl?: string;
  sourceType?: 'text' | 'voice' | 'camera';
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

interface DrCureCastProps {
  onVoiceInputRequest: () => void;
  onCameraInputRequest: () => void;
  voiceInput?: string | null;
  cameraInput?: { imageUrl: string, description: string } | null;
  onVoiceInputProcessed?: () => void;
  onCameraInputProcessed?: () => void;
}

const DrCureCast: React.FC<DrCureCastProps> = ({ 
  onVoiceInputRequest, 
  onCameraInputRequest, 
  voiceInput, 
  cameraInput,
  onVoiceInputProcessed,
  onCameraInputProcessed
 }) => {
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
  
  // Process voice input when it changes
  useEffect(() => {
    if (voiceInput) {
      // Set loading state
      setIsProcessing(true);
      // Add a slight delay to ensure UI updates properly
      setTimeout(() => {
        handleSendMessage(voiceInput, 'voice');
        if (onVoiceInputProcessed) {
          onVoiceInputProcessed();
        }
      }, 300);
    }
  }, [voiceInput]);
  
  // Process camera input when it changes
  useEffect(() => {
    if (cameraInput) {
      // Set loading state
      setIsProcessing(true);
      // Add a slight delay to ensure UI updates properly
      setTimeout(() => {
        handleSendMessage(cameraInput.description, 'camera', cameraInput.imageUrl);
        if (onCameraInputProcessed) {
          onCameraInputProcessed();
        }
      }, 300);
    }
  }, [cameraInput]);

  // Update greeting when language changes
  useEffect(() => {
    setMessages([{ 
      text: getInitialGreeting(currentLanguage), 
      isUser: false 
    }]);
  }, [currentLanguage]);

  const analyzeSymptoms = (text: string): { 
  severity: 'low' | 'medium' | 'high', 
  condition: string, 
  recommendation: { action: string, text: string },
  requiresPhoto?: boolean,
  photoPrompt?: string
} => {
  const textLower = text.toLowerCase();
  let matchedRule: any = null;
  let severity: 'low' | 'medium' | 'high' = 'low';
  let ruleKey: string = '';

  // Find matching symptoms
  for (const [key, rule] of Object.entries(SYMPTOM_RULES)) {
    if (rule.symptoms.some(symptom => textLower.includes(symptom))) {
      matchedRule = rule;
      ruleKey = key;
      
      // Determine severity based on keywords and condition type
      if (textLower.includes('severe') || textLower.includes('intense') || textLower.includes('worst') || key === 'snakebite') {
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
    recommendation: matchedRule.recommendations[severityMap[severity]],
    requiresPhoto: matchedRule.requiresPhoto,
    photoPrompt: matchedRule.photoPrompt
  };
  };

  const processAIResponse = (response: string): { text: string, sections: { assessment?: string, causes?: string, careAdvice?: string, whenToSeekHelp?: string } } => {
    console.log('Raw AI response:', response); // Log for debugging
    
    // Remove any asterisks, bullet points, and other formatting from the response
    const cleanedResponse = response
      .replace(/\*/g, '')
      .replace(/^\s*[-•]\s*/gm, '')
      .replace(/^\s*\d+\.\s*/gm, '');
    
    // Default structured response
    const defaultResponse = {
      text: cleanedResponse,
      sections: {}
    };

    try {
      // More robust pattern matching for sections
      const assessmentMatch = cleanedResponse.match(/(?:Initial assessment|Assessment):?\s*(.*?)(?=(?:Possible causes|Causes|Immediate care|When to seek|$))/is);
      const causesMatch = cleanedResponse.match(/(?:Possible causes|Causes):?\s*(.*?)(?=(?:Immediate care|Care advice|When to seek|$))/is);
      const careAdviceMatch = cleanedResponse.match(/(?:Immediate care advice|Care advice|Home care):?\s*(.*?)(?=(?:When to seek|Medical attention|$))/is);
      const whenToSeekHelpMatch = cleanedResponse.match(/(?:When to seek medical attention|Medical attention|Seek help):?\s*(.*)/is);

      // Build structured sections if matches found
      if (assessmentMatch || causesMatch || careAdviceMatch || whenToSeekHelpMatch) {
        // Process each section to clean up formatting
        const processSection = (text?: string) => {
          if (!text) return undefined;
          return text.trim()
            .replace(/\n+/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .replace(/^[\s,.:;-]+/, '')
            .replace(/[\s,.:;-]+$/, '');
        };
        
        const cleanedSections = {
          assessment: processSection(assessmentMatch?.[1]),
          causes: processSection(causesMatch?.[1]),
          careAdvice: processSection(careAdviceMatch?.[1]),
          whenToSeekHelp: processSection(whenToSeekHelpMatch?.[1])
        };
        
        return {
          text: cleanedResponse,
          sections: cleanedSections
        };
      }
      
      return defaultResponse;
    } catch (error) {
      console.error("Error formatting AI response:", error);
      return defaultResponse;
    }
  };

  const handleSendMessage = async (messageText = input.trim(), sourceType: 'text' | 'voice' | 'camera' = 'text', imageUrl?: string) => {
    if (!messageText && !imageUrl) return;
    
    const userMessage = messageText.trim();
    setInput('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { 
      text: userMessage, 
      isUser: true,
      sourceType,
      imageUrl
    }]);
    setIsProcessing(true);

    try {
      // Check if this is just a simple greeting
      const simpleGreeting = isSimpleGreeting(userMessage.toLowerCase().trim());
      if (simpleGreeting) {
        // Respond with a natural greeting instead of a medical assessment
        setMessages(prev => [
          ...prev,
          {
            text: simpleGreeting,
            isUser: false
          }
        ]);
        setIsProcessing(false);
        return;
      }

      // First, analyze symptoms using rule-based system
      const analysis = analyzeSymptoms(userMessage);

      // If condition requires a photo and no image is provided, prompt for one
      if (analysis.requiresPhoto && !imageUrl && sourceType !== 'camera') {
        setMessages(prev => [
          ...prev,
          {
            text: analysis.photoPrompt || "Please provide a photo for better assessment. You can use the camera button below.",
            isUser: false,
            severity: analysis.severity,
            recommendation: {
              action: "provide photo",
              text: "Use the camera button to take or upload a photo"
            }
          }
        ]);
        setIsProcessing(false);
        return;
      }

      // Prepare input based on source type
      let promptInput = userMessage;
      let promptPrefix = '';
      let promptSuffix = '';
      
      if (sourceType === 'camera' && imageUrl) {
        promptPrefix = 'I am analyzing a medical image. ';
        promptInput = `The patient has uploaded an image and described it as: "${userMessage}". `;
        promptSuffix = 'Based on this visual description, I will provide a medical assessment, but please note that a definitive diagnosis requires in-person examination.';
      } else if (sourceType === 'voice') {
        promptPrefix = 'I am analyzing symptoms described via voice. ';
        promptInput = `The patient has described via voice: "${userMessage}". `;
        promptSuffix = 'I will provide an assessment based on these reported symptoms.';
      }

      // Then get detailed response from Gemini
      const prompt = `You are Dr.CureCast, a professional medical physician with extensive experience. ${promptPrefix}A patient has described their symptoms as: "${promptInput}". ${promptSuffix}
      
      Please provide a concise, professional medical response in ${currentLanguage} using clear but medically appropriate language. Remember that you are a qualified doctor and should respond with the authority and professionalism expected of a medical professional.
      
      Structure your response with these EXACT sections in this EXACT order:
      Initial assessment: Provide a brief professional assessment
      Possible causes: List potential diagnoses (use professional medical terms where appropriate)
      Immediate care advice: Provide evidence-based recommendations for home care
      When to seek medical attention: Clear clinical indicators that warrant professional medical attention
      
      Keep your language professional and appropriate for a doctor-patient consultation. Maintain a calm, authoritative, and reassuring tone throughout.
      Do NOT use asterisks (*), numbers (1., 2.), bullet points, or any special formatting in your response.
      Each section MUST be clearly labeled with the exact section names provided above.
      
      If the input is in Hindi or Telugu, respond in that same language. Otherwise respond in English.`;

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

  // Detect simple greetings and return appropriate responses
  const isSimpleGreeting = (text: string): string | null => {
    const greetings = {
      'hi': "Hello there! How can I assist with your health concerns today?",
      'hello': "Hello! How can I help you with your health today?",
      'hey': "Hello! What health concerns can I address for you today?",
      'hii': "Hello! How may I assist you with your health concerns?",
      'hiii': "Hello! How may I assist you with your health concerns?",
      'hiiii': "Hello! How may I assist you with your health concerns?",
      'helo': "Hello! How can I help you with your health today?",
      'hellow': "Hello! How can I help you with your health today?",
      'hola': "Hello! How can I help you with your health today?",
      'namaste': "Namaste! How can I assist with your health concerns today?",
      'good morning': "Good morning! How can I help you with your health today?",
      'good afternoon': "Good afternoon! How can I help you with your health today?",
      'good evening': "Good evening! How can I help you with your health today?",
      'how are you': "I'm well, thank you for asking. More importantly, how are you feeling today? Any health concerns I can help with?"
    };

    // Check if input matches any greeting
    for (const [greeting, response] of Object.entries(greetings)) {
      if (text === greeting || text.startsWith(`${greeting} `)) {
        return response;
      }
    }
    
    // If no greeting match is found, return null to proceed with normal medical assessment
    return null;
  };

  // Function to handle voice input from external component
  const handleVoiceInput = (transcript: string) => {
    if (transcript.trim()) {
      handleSendMessage(transcript, 'voice');
    }
  };

  // Function to handle camera input from external component
  const handleCameraInput = (imageUrl: string, description: string = '') => {
    handleSendMessage(description || 'Please analyze this image.', 'camera', imageUrl);
  };

  // Expose functions to parent component
  useEffect(() => {
    // Add these methods to the window object for external access
    (window as any).drCureCastHandleVoiceInput = handleVoiceInput;
    (window as any).drCureCastHandleCameraInput = handleCameraInput;
    
    return () => {
      // Clean up
      delete (window as any).drCureCastHandleVoiceInput;
      delete (window as any).drCureCastHandleCameraInput;
    };
  }, []);

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
    <div id="dr-curecast-component" className="flex flex-col h-[calc(100vh-12rem)] max-w-3xl mx-auto">
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
                      msg.sourceType === 'voice' ? <Mic className="h-5 w-5" /> : 
                      msg.sourceType === 'camera' ? <Camera className="h-5 w-5" /> : 
                      <User className="h-5 w-5" />
                    ) : (
                      <Bot className="h-5 w-5" />
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
          <div className="flex gap-2 mb-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={onVoiceInputRequest}
              disabled={isProcessing}
              className="flex items-center gap-1 text-primary-600 border-primary-200 hover:bg-primary-50"
            >
              <Mic className="h-4 w-4" />
              Voice Input
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={onCameraInputRequest}
              disabled={isProcessing}
              className="flex items-center gap-1 text-primary-600 border-primary-200 hover:bg-primary-50"
            >
              <Camera className="h-4 w-4" />
              Camera Input
            </Button>
          </div>
          <form 
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
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