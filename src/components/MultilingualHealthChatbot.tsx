import React, { useState, useEffect, useRef } from 'react';
import { 
  ChatbotMessage, 
  ChatbotSession, 
  Language, 
  ChatbotUserProfile 
} from '../types';
import { multilingualChatbotService } from '../services/multilingualChatbotService';
import { healthKnowledgeBaseService } from '../services/healthKnowledgeBaseService';
import { chatbotAnalyticsService } from '../services/chatbotAnalyticsService';
import { languageService } from '../services/languageService';
import { 
  MessageCircle, 
  Send, 
  Mic, 
  MicOff, 
  Globe, 
  Phone, 
  AlertTriangle,
  Bot,
  User,
  Volume2,
  VolumeX
} from 'lucide-react';

interface MultilingualHealthChatbotProps {
  userId: string;
  platform?: 'web' | 'whatsapp' | 'sms' | 'ivr';
  initialLanguage?: Language;
  onEscalation?: (session: ChatbotSession) => void;
  onSessionEnd?: (session: ChatbotSession) => void;
}

export const MultilingualHealthChatbot: React.FC<MultilingualHealthChatbotProps> = ({
  userId,
  platform = 'web',
  initialLanguage = 'english',
  onEscalation,
  onSessionEnd
}) => {
  const [session, setSession] = useState<ChatbotSession | null>(null);
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(initialLanguage);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [userProfile, setUserProfile] = useState<ChatbotUserProfile | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    initializeChatbot();
    setupSpeechRecognition();
    setupTextToSpeech();
    
    return () => {
      if (session) {
        handleEndSession();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
    if (!isMinimized && messages.length > 0) {
      setUnreadCount(0);
    }
  }, [messages, isMinimized]);

  const initializeChatbot = async () => {
    try {
      // Initialize with welcome message
      const welcomeMessage = await getWelcomeMessage(currentLanguage);
      const initialMessage: ChatbotMessage = {
        id: 'welcome',
        sessionId: 'temp',
        content: welcomeMessage,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        language: currentLanguage,
        messageType: 'text',
        quickReplies: [
          { id: '1', title: 'Health Question', payload: 'health_question' },
          { id: '2', title: 'Vaccination Info', payload: 'vaccination_info' },
          { id: '3', title: 'Symptoms Check', payload: 'symptom_check' },
          { id: '4', title: 'Emergency Help', payload: 'emergency' }
        ]
      };
      
      setMessages([initialMessage]);
      
    } catch (error) {
      console.error('Error initializing chatbot:', error);
    }
  };

  const setupSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = getLanguageCode(currentLanguage);
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
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

  const setupTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      // Add user message to UI immediately
      const userChatMessage: ChatbotMessage = {
        id: `user_${Date.now()}`,
        sessionId: session?.id || 'temp',
        content: userMessage,
        role: 'user',
        timestamp: new Date().toISOString(),
        language: currentLanguage,
        messageType: 'text'
      };

      setMessages(prev => [...prev, userChatMessage]);

      // Process message through chatbot service
      const result = await multilingualChatbotService.processMessage(
        userId,
        userMessage,
        platform,
        session?.id
      );

      // Update session
      setSession(result.session);
      
      // Add bot response to UI
      setMessages(prev => [...prev, result.response]);

      // Handle escalation
      if (result.escalated) {
        handleEscalation(result.session);
      }

      // Track analytics
      await chatbotAnalyticsService.trackSession(result.session);

      // Speak response if enabled
      if (isSpeaking && result.response.content) {
        speakText(result.response.content);
      }

      // Update unread count if minimized
      if (isMinimized) {
        setUnreadCount(prev => prev + 1);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: ChatbotMessage = {
        id: `error_${Date.now()}`,
        sessionId: session?.id || 'temp',
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        language: currentLanguage,
        messageType: 'text'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = async (payload: string, title: string) => {
    setInputMessage(title);
    await handleSendMessage();
  };

  const handleButtonClick = async (payload: string, title: string) => {
    await handleQuickReply(payload, title);
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.lang = getLanguageCode(currentLanguage);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text: string) => {
    if (!synthRef.current) return;

    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLanguageCode(currentLanguage);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    synthRef.current.speak(utterance);
  };

  const handleLanguageChange = async (language: Language) => {
    setCurrentLanguage(language);
    setShowLanguageSelector(false);
    
    // Update speech recognition language
    if (recognitionRef.current) {
      recognitionRef.current.lang = getLanguageCode(language);
    }

    // Send language change message
    const languageChangeMessage = await getLanguageChangeMessage(language);
    const systemMessage: ChatbotMessage = {
      id: `lang_change_${Date.now()}`,
      sessionId: session?.id || 'temp',
      content: languageChangeMessage,
      role: 'system',
      timestamp: new Date().toISOString(),
      language: language,
      messageType: 'text'
    };
    
    setMessages(prev => [...prev, systemMessage]);
  };

  const handleEscalation = (escalatedSession: ChatbotSession) => {
    const escalationMessage: ChatbotMessage = {
      id: `escalation_${Date.now()}`,
      sessionId: escalatedSession.id,
      content: 'I\'m connecting you with a health professional. Please wait a moment.',
      role: 'system',
      timestamp: new Date().toISOString(),
      language: currentLanguage,
      messageType: 'text'
    };
    
    setMessages(prev => [...prev, escalationMessage]);
    
    if (onEscalation) {
      onEscalation(escalatedSession);
    }
  };

  const handleEndSession = () => {
    if (session) {
      multilingualChatbotService.endSession(session.id);
      if (onSessionEnd) {
        onSessionEnd(session);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getWelcomeMessage = async (language: Language): Promise<string> => {
    const messages = {
      english: 'Hello! I\'m your health assistant. I can help you with health questions, vaccination information, and symptom checking. How can I assist you today?',
      hindi: 'नमस्ते! मैं आपका स्वास्थ्य सहायक हूं। मैं स्वास्थ्य प्रश्नों, टीकाकरण की जानकारी और लक्षणों की जांच में आपकी सहायता कर सकता हूं। आज मैं आपकी कैसे सहायता कर सकता हूं?',
      telugu: 'హలో! నేను మీ ఆరోగ్య సహాయకుడిని. ఆరోగ్య ప్రశ్నలు, వ్యాక్సినేషన్ సమాచారం మరియు లక్షణాల తనిఖీలో నేను మీకు సహాయం చేయగలను. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?',
      tamil: 'வணக்கம்! நான் உங்கள் சுகாதார உதவியாளர். சுகாதார கேள்விகள், தடுப்பூசி தகவல் மற்றும் அறிகுறி சோதனையில் நான் உங்களுக்கு உதவ முடியும். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?',
      bengali: 'হ্যালো! আমি আপনার স্বাস্থ্য সহায়ক। আমি স্বাস্থ্য প্রশ্ন, টিকাদানের তথ্য এবং উপসর্গ পরীক্ষায় আপনাকে সাহায্য করতে পারি। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?'
    };

    return messages[language] || messages.english;
  };

  const getLanguageChangeMessage = async (language: Language): Promise<string> => {
    const messages = {
      english: 'Language changed to English. How can I help you?',
      hindi: 'भाषा हिंदी में बदल दी गई। मैं आपकी कैसे सहायता कर सकता हूं?',
      telugu: 'భాష తెలుగుకు మార్చబడింది. నేను మీకు ఎలా సహాయం చేయగలను?',
      tamil: 'மொழி தமிழுக்கு மாற்றப்பட்டது. நான் உங்களுக்கு எப்படி உதவ முடியும்?',
      bengali: 'ভাষা বাংলায় পরিবর্তিত হয়েছে। আমি আপনাকে কীভাবে সাহায্য করতে পারি?'
    };

    return messages[language] || messages.english;
  };

  const getLanguageCode = (language: Language): string => {
    const codes = {
      english: 'en-US',
      hindi: 'hi-IN',
      telugu: 'te-IN',
      tamil: 'ta-IN',
      bengali: 'bn-IN',
      marathi: 'mr-IN',
      kannada: 'kn-IN',
      malayalam: 'ml-IN',
      gujarati: 'gu-IN',
      punjabi: 'pa-IN',
      urdu: 'ur-IN'
    };
    return codes[language] || 'en-US';
  };

  const supportedLanguages: Array<{ code: Language; name: string; nativeName: string }> = [
    { code: 'english', name: 'English', nativeName: 'English' },
    { code: 'hindi', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'telugu', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'tamil', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'bengali', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'marathi', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'kannada', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'malayalam', name: 'Malayalam', nativeName: 'മലയാളം' },
    { code: 'gujarati', name: 'Gujarati', nativeName: 'ગુજરાતી' },
    { code: 'punjabi', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' }
  ];

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 relative"
        >
          <MessageCircle size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot size={20} />
          <div>
            <h3 className="font-semibold">Health Assistant</h3>
            <p className="text-xs opacity-90">
              {session?.status === 'escalated' ? 'Connected to health worker' : 'AI Assistant'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageSelector(!showLanguageSelector)}
              className="p-1 hover:bg-blue-700 rounded"
            >
              <Globe size={16} />
            </button>
            
            {showLanguageSelector && (
              <div className="absolute top-8 right-0 bg-white text-black rounded-lg shadow-lg border max-h-48 overflow-y-auto z-10">
                {supportedLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`block w-full text-left px-3 py-2 hover:bg-gray-100 ${
                      currentLanguage === lang.code ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                  >
                    <div className="text-sm font-medium">{lang.nativeName}</div>
                    <div className="text-xs text-gray-500">{lang.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Voice Toggle */}
          <button
            onClick={() => setIsSpeaking(!isSpeaking)}
            className={`p-1 rounded ${isSpeaking ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
          >
            {isSpeaking ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Minimize */}
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-blue-700 rounded"
          >
            <span className="text-lg">−</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.role === 'system'
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role !== 'user' && (
                  <div className="flex-shrink-0 mt-1">
                    {message.role === 'system' ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <Bot size={16} />
                    )}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm">{message.content}</p>
                  
                  {/* Quick Replies */}
                  {message.quickReplies && message.quickReplies.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.quickReplies.map((reply) => (
                        <button
                          key={reply.id}
                          onClick={() => handleQuickReply(reply.payload, reply.title)}
                          className="block w-full text-left text-xs bg-white text-gray-700 border border-gray-300 rounded px-2 py-1 hover:bg-gray-50"
                        >
                          {reply.title}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Buttons */}
                  {message.buttons && message.buttons.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.buttons.map((button) => (
                        <button
                          key={button.id}
                          onClick={() => handleButtonClick(button.payload, button.title)}
                          className="block w-full text-left text-xs bg-blue-500 text-white rounded px-2 py-1 hover:bg-blue-600"
                        >
                          {button.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 mt-1">
                    <User size={16} />
                  </div>
                )}
              </div>
              
              <div className="text-xs opacity-70 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Bot size={16} />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your health question..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            
            {/* Voice Input Button */}
            {recognitionRef.current && (
              <button
                onClick={handleVoiceInput}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded ${
                  isListening ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
        
        {session?.status === 'escalated' && (
          <div className="mt-2 text-xs text-orange-600 flex items-center space-x-1">
            <Phone size={12} />
            <span>Connected to health professional</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultilingualHealthChatbot;
