import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  X, 
  Globe, 
  Navigation,
  Heart,
  Camera,
  Shield,
  User,
  Home,
  Brain,
  Activity,
  Droplet,
  Scan,
  ChevronDown,
  Play,
  Pause,
  Move,
  Languages
} from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@/config/api';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  language: string;
  audioUrl?: string;
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' }
];

const HEALTH_TOPICS = {
  en: {
    preventive_care: "Preventive Healthcare",
    symptoms: "Disease Symptoms", 
    vaccination: "Vaccination Schedule",
    navigation: "App Navigation Help",
    emergency: "Emergency Information"
  },
  hi: {
    preventive_care: "निवारक स्वास्थ्य देखभाल",
    symptoms: "रोग के लक्षण",
    vaccination: "टीकाकरण कार्यक्रम", 
    navigation: "ऐप नेवीगेशन सहायता",
    emergency: "आपातकालीन जानकारी"
  }
};

const NAVIGATION_RESPONSES = {
  en: {
    home: "I'll take you to the home page where you can see all main features.",
    chat: "Opening Dr. CureCast AI for health consultation.",
    voice: "Starting voice interface for hands-free interaction.",
    camera: "Opening camera for visual health analysis.",
    health: "Accessing your secure health vault.",
    profile: "Opening your profile settings.",
    diabetes: "Taking you to diabetes health checker.",
    bp: "Opening blood pressure monitoring tool.",
    skin: "Starting skin disease analysis tool."
  },
  hi: {
    home: "मैं आपको होम पेज पर ले जाऊंगा जहां आप सभी मुख्य सुविधाएं देख सकते हैं।",
    chat: "स्वास्थ्य परामर्श के लिए डॉ. क्योरकास्ट एआई खोल रहा हूं।",
    voice: "हैंड्स-फ्री इंटरैक्शन के लिए वॉयस इंटरफेस शुरू कर रहा हूं।",
    camera: "दृश्य स्वास्थ्य विश्लेषण के लिए कैमरा खोल रहा हूं।",
    health: "आपके सुरक्षित स्वास्थ्य वॉल्ट तक पहुंच रहा हूं।",
    profile: "आपकी प्रोफाइल सेटिंग्स खोल रहा हूं।",
    diabetes: "आपको मधुमेह स्वास्थ्य चेकर पर ले जा रहा हूं।",
    bp: "रक्तचाप निगरानी उपकरण खोल रहा हूं।",
    skin: "त्वचा रोग विश्लेषण उपकरण शुरू कर रहा हूं।"
  }
};

const HEALTH_EDUCATION_CONTENT = {
  en: {
    fever: "Fever is your body's natural response to infection. Drink plenty of fluids, rest, and consult a doctor if temperature exceeds 102°F or persists for more than 3 days.",
    cough: "For persistent cough, try warm water with honey and ginger. Avoid cold drinks. See a doctor if cough lasts more than 2 weeks or has blood.",
    headache: "Common causes include dehydration, stress, or lack of sleep. Drink water, rest in a dark room. Seek medical help for severe or recurring headaches.",
    vaccination: "Vaccines protect against serious diseases. Adults need annual flu shots, COVID boosters, and tetanus every 10 years. Children follow a specific schedule.",
    hygiene: "Wash hands frequently with soap for 20 seconds. Cover mouth when coughing. Keep surroundings clean to prevent disease spread."
  },
  hi: {
    fever: "बुखार संक्रमण के लिए आपके शरीर की प्राकृतिक प्रतिक्रिया है। भरपूर तरल पदार्थ पिएं, आराम करें, और यदि तापमान 102°F से अधिक हो या 3 दिन से अधिक बना रहे तो डॉक्टर से सलाह लें।",
    cough: "लगातार खांसी के लिए, शहद और अदरक के साथ गर्म पानी का सेवन करें। ठंडे पेय से बचें। यदि खांसी 2 सप्ताह से अधिक रहे या खून आए तो डॉक्टर को दिखाएं।",
    headache: "सामान्य कारणों में निर्जलीकरण, तनाव, या नींद की कमी शामिल है। पानी पिएं, अंधेरे कमरे में आराम करें। गंभीर या बार-बार होने वाले सिरदर्द के लिए चिकित्सा सहायता लें।",
    vaccination: "टीके गंभीर बीमारियों से बचाते हैं। वयस्कों को वार्षिक फ्लू शॉट, कोविड बूस्टर, और हर 10 साल में टेटनस की जरूरत होती है।",
    hygiene: "20 सेकंड तक साबुन से हाथ धोएं। खांसते समय मुंह ढकें। बीमारी के फैलाव को रोकने के लिए आसपास की सफाई रखें।"
  }
};

export const NavigationChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(SUPPORTED_LANGUAGES[0]);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 100 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Initialize Gemini AI
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  useEffect(() => {
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
    }

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = currentLanguage.code;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSendMessage(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Add welcome message when opened
    if (isOpen && messages.length === 0) {
      addBotMessage(getWelcomeMessage());
    }
  }, [isOpen, currentLanguage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getWelcomeMessage = () => {
    const welcomeMessages = {
      en: "Hello! I'm your health navigation assistant. I can help you navigate the app, provide health information, and answer questions in your preferred language. How can I help you today?",
      hi: "नमस्ते! मैं आपका स्वास्थ्य नेवीगेशन सहायक हूं। मैं आपको ऐप नेविगेट करने, स्वास्थ्य जानकारी प्रदान करने और आपकी पसंदीदा भाषा में प्रश्नों का उत्तर देने में मदद कर सकता हूं। आज मैं आपकी कैसे मदद कर सकता हूं?"
    };
    return welcomeMessages[currentLanguage.code as keyof typeof welcomeMessages] || welcomeMessages.en;
  };

  const formatMessage = (text: string): string => {
    // Clean the text first
    let formatted = text.trim();
    
    // Format section headers with proper HTML structure
    formatted = formatted
      .replace(/🔍 \*\*Assessment:\*\*/g, '<div class="mb-4"><div class="flex items-center gap-2 mb-2 pb-1 border-b border-blue-200"><span class="text-lg">🔍</span><span class="font-semibold text-blue-600">Assessment</span></div><div class="text-gray-700 ml-6">')
      .replace(/💡 \*\*Key Points:\*\*/g, '</div></div><div class="mb-4"><div class="flex items-center gap-2 mb-2 pb-1 border-b border-green-200"><span class="text-lg">💡</span><span class="font-semibold text-green-600">Key Points</span></div><div class="text-gray-700 ml-6">')
      .replace(/🏥 \*\*When to see a doctor:\*\*/g, '</div></div><div class="mb-4"><div class="flex items-center gap-2 mb-2 pb-1 border-b border-orange-200"><span class="text-lg">🏥</span><span class="font-semibold text-orange-600">When to see a doctor</span></div><div class="text-gray-700 ml-6">')
      .replace(/💊 \*\*Prevention:\*\*/g, '</div></div><div class="mb-4"><div class="flex items-center gap-2 mb-2 pb-1 border-b border-purple-200"><span class="text-lg">💊</span><span class="font-semibold text-purple-600">Prevention</span></div><div class="text-gray-700 ml-6">')
      .replace(/⚠️ \*\*Important:\*\*/g, '</div></div><div class="mb-4"><div class="flex items-center gap-2 mb-2 pb-1 border-b border-red-200"><span class="text-lg">⚠️</span><span class="font-semibold text-red-600">Important</span></div><div class="text-gray-700 ml-6">');
    
    // Format bullet points
    formatted = formatted.replace(/• ([^\n]+)/g, '<div class="flex items-start gap-2 mb-2"><span class="text-emerald-500 mt-1 font-bold">•</span><span class="flex-1">$1</span></div>');
    
    // Handle line breaks and paragraphs
    formatted = formatted.replace(/\n\n/g, '</div><div class="mt-3">').replace(/\n/g, '<br>');
    
    // Close any remaining open divs
    if (formatted.includes('<div class="text-gray-700 ml-6">')) {
      formatted += '</div></div>';
    }
    
    // Wrap in container if no sections were found
    if (!formatted.includes('class="mb-4"')) {
      formatted = `<div class="text-gray-700 leading-relaxed">${formatted}</div>`;
    }
    
    return formatted;
  };

  const addBotMessage = (text: string) => {
    const message: Message = {
      id: Date.now().toString(),
      text: formatMessage(text),
      isBot: true,
      timestamp: new Date(),
      language: currentLanguage.code
    };
    setMessages(prev => [...prev, message]);
    
    // Don't auto-speak here - let handleSendMessage control it
  };

  const addUserMessage = (text: string) => {
    const message: Message = {
      id: Date.now().toString(),
      text,
      isBot: false,
      timestamp: new Date(),
      language: currentLanguage.code
    };
    setMessages(prev => [...prev, message]);
  };

  const cleanTextForSpeech = (text: string): string => {
    return text
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove markdown formatting
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      // Remove emoji section markers
      .replace(/🔍\s*/g, '')
      .replace(/💡\s*/g, '')
      .replace(/🏥\s*/g, '')
      .replace(/💊\s*/g, '')
      .replace(/⚠️\s*/g, '')
      // Remove bullet points and replace with natural pauses
      .replace(/•\s*/g, '. ')
      // Clean up extra whitespace and line breaks
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '. ')
      .trim();
  };

  const speakText = (text: string) => {
    if (synthesisRef.current && !isSpeaking) {
      setIsSpeaking(true);
      const cleanText = cleanTextForSpeech(text);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = currentLanguage.code;
      utterance.rate = 0.8;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      synthesisRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.lang = currentLanguage.code;
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const processUserQuery = async (query: string): Promise<string> => {
    const lowerQuery = query.toLowerCase();
    
    // Navigation commands - handle these first
    if (lowerQuery.includes('home') || lowerQuery.includes('होम') || lowerQuery.includes('मुख्य')) {
      navigate('/');
      return NAVIGATION_RESPONSES[currentLanguage.code as keyof typeof NAVIGATION_RESPONSES]?.home || NAVIGATION_RESPONSES.en.home;
    }
    
    if (lowerQuery.includes('chat') || lowerQuery.includes('doctor') || lowerQuery.includes('डॉक्टर') || lowerQuery.includes('चैट')) {
      navigate('/chat');
      return NAVIGATION_RESPONSES[currentLanguage.code as keyof typeof NAVIGATION_RESPONSES]?.chat || NAVIGATION_RESPONSES.en.chat;
    }
    
    if (lowerQuery.includes('voice') || lowerQuery.includes('speak') || lowerQuery.includes('आवाज') || lowerQuery.includes('बोल')) {
      navigate('/voice');
      return NAVIGATION_RESPONSES[currentLanguage.code as keyof typeof NAVIGATION_RESPONSES]?.voice || NAVIGATION_RESPONSES.en.voice;
    }
    
    if (lowerQuery.includes('camera') || lowerQuery.includes('photo') || lowerQuery.includes('कैमरा') || lowerQuery.includes('फोटो')) {
      navigate('/camera');
      return NAVIGATION_RESPONSES[currentLanguage.code as keyof typeof NAVIGATION_RESPONSES]?.camera || NAVIGATION_RESPONSES.en.camera;
    }
    
    if (lowerQuery.includes('health vault') || lowerQuery.includes('records') || lowerQuery.includes('स्वास्थ्य') || lowerQuery.includes('रिकॉर्ड')) {
      navigate('/health');
      return NAVIGATION_RESPONSES[currentLanguage.code as keyof typeof NAVIGATION_RESPONSES]?.health || NAVIGATION_RESPONSES.en.health;
    }
    
    if (lowerQuery.includes('diabetes') || lowerQuery.includes('sugar') || lowerQuery.includes('मधुमेह') || lowerQuery.includes('शुगर')) {
      navigate('/health/diabetes');
      return NAVIGATION_RESPONSES[currentLanguage.code as keyof typeof NAVIGATION_RESPONSES]?.diabetes || NAVIGATION_RESPONSES.en.diabetes;
    }
    
    if (lowerQuery.includes('blood pressure') || lowerQuery.includes('bp') || lowerQuery.includes('रक्तचाप')) {
      navigate('/health/blood-pressure');
      return NAVIGATION_RESPONSES[currentLanguage.code as keyof typeof NAVIGATION_RESPONSES]?.bp || NAVIGATION_RESPONSES.en.bp;
    }
    
    if (lowerQuery.includes('skin') || lowerQuery.includes('rash') || lowerQuery.includes('त्वचा') || lowerQuery.includes('चकत्ते')) {
      navigate('/health/skin-disease');
      return NAVIGATION_RESPONSES[currentLanguage.code as keyof typeof NAVIGATION_RESPONSES]?.skin || NAVIGATION_RESPONSES.en.skin;
    }

    // For health questions, use Gemini AI for better responses
    try {
      const prompt = `You are a multilingual health navigation assistant for rural and illiterate populations. A user has asked: "${query}" in ${currentLanguage.name}.

      Please provide a helpful response that:
      1. Answers their health question in simple, easy-to-understand language
      2. Provides practical advice for preventive healthcare
      3. Explains when to seek medical help
      4. Uses culturally appropriate examples
      5. Responds in ${currentLanguage.name} language
      6. Keeps the response concise but informative
      7. Includes vaccination information if relevant
      8. Mentions hygiene practices when appropriate

      Format your response with clear sections using these markers:
      - Use "🔍 **Assessment:**" for initial assessment
      - Use "💡 **Key Points:**" for main advice (use bullet points with • )
      - Use "🏥 **When to see a doctor:**" for medical attention guidance
      - Use "💊 **Prevention:**" for preventive measures
      - Use "⚠️ **Important:**" for critical warnings

      If this is a greeting or general question, respond warmly and offer to help with health information or app navigation.

      Make the response accessible for people with limited literacy and healthcare knowledge.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      if (response.text) {
        return response.text();
      }
    } catch (error) {
      console.error('Gemini AI error:', error);
      // Fall back to predefined responses
    }

    // Fallback to predefined health education responses
    const healthContent = HEALTH_EDUCATION_CONTENT[currentLanguage.code as keyof typeof HEALTH_EDUCATION_CONTENT] || HEALTH_EDUCATION_CONTENT.en;
    
    if (lowerQuery.includes('fever') || lowerQuery.includes('बुखार')) {
      return healthContent.fever;
    }
    
    if (lowerQuery.includes('cough') || lowerQuery.includes('खांसी')) {
      return healthContent.cough;
    }
    
    if (lowerQuery.includes('headache') || lowerQuery.includes('सिरदर्द')) {
      return healthContent.headache;
    }
    
    if (lowerQuery.includes('vaccine') || lowerQuery.includes('vaccination') || lowerQuery.includes('टीका')) {
      return healthContent.vaccination;
    }
    
    if (lowerQuery.includes('hygiene') || lowerQuery.includes('clean') || lowerQuery.includes('स्वच्छता')) {
      return healthContent.hygiene;
    }

    // Default response
    const defaultResponses = {
      en: "I can help you navigate the app and provide health information. Try asking about: 'Go to chat', 'Open camera', 'Health vault', 'Diabetes check', 'Blood pressure', or health topics like 'fever', 'cough', 'vaccination'.",
      hi: "मैं आपको ऐप नेविगेट करने और स्वास्थ्य जानकारी प्रदान करने में मदद कर सकता हूं। इन्हें पूछने की कोशिश करें: 'चैट पर जाएं', 'कैमरा खोलें', 'स्वास्थ्य वॉल्ट', 'मधुमेह जांच', 'रक्तचाप', या स्वास्थ्य विषयों जैसे 'बुखार', 'खांसी', 'टीकाकरण'।"
    };
    
    return defaultResponses[currentLanguage.code as keyof typeof defaultResponses] || defaultResponses.en;
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    addUserMessage(messageText);
    setInputText('');
    setIsTyping(true);

    try {
      // Process the user query with AI
      const response = await processUserQuery(messageText);
      addBotMessage(response);
      setIsTyping(false);
      
      // Auto-speak the response if speech is enabled
      if (isSpeaking) {
        speakText(response);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      addBotMessage("I'm sorry, I'm having trouble processing your request right now. Please try again.");
      setIsTyping(false);
    }
  };

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language);
    setShowLanguageSelector(false);
    const changeMessage = {
      en: `Language changed to ${language.nativeName}. How can I help you?`,
      hi: `भाषा ${language.nativeName} में बदल दी गई। मैं आपकी कैसे सहायता कर सकता हूं?`,
      or: `ଭାଷା ${language.nativeName} ରେ ପରିବର୍ତ୍ତନ କରାଗଲା। ମୁଁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?`,
      bn: `ভাষা ${language.nativeName} এ পরিবর্তন করা হয়েছে। আমি কীভাবে সাহায্য করতে পারি?`,
      te: `భాష ${language.nativeName} కు మార్చబడింది. నేను ఎలా సహాయం చేయగలను?`,
      ta: `மொழி ${language.nativeName} க்கு மாற்றப்பட்டது. நான் எப்படி உதவ முடியும்?`,
      mr: `भाषा ${language.nativeName} मध्ये बदलली. मी कशी मदत करू शकतो?`,
      gu: `ભાષા ${language.nativeName} માં બદલાઈ ગઈ. હું કેવી રીતે મદદ કરી શકું?`
    };
    addBotMessage(changeMessage[language.code as keyof typeof changeMessage] || changeMessage.en);
  };

  const handleButtonMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - buttonPosition.x,
      y: e.clientY - buttonPosition.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Constrain to viewport (with padding for button size)
      const maxX = window.innerWidth - 60; // button width
      const maxY = window.innerHeight - 60; // button height
      
      setButtonPosition({
        x: Math.max(10, Math.min(newX, maxX)),
        y: Math.max(10, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      setIsOpen(true);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        className={`fixed z-50 w-16 h-16 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-500 flex items-center justify-center ${
          isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
        }`}
        style={{
          left: buttonPosition.x,
          top: buttonPosition.y,
        }}
        onClick={handleButtonClick}
        onMouseDown={handleButtonMouseDown}
        whileHover={{ 
          scale: isDragging ? 1 : 1.15,
          rotate: isDragging ? 0 : [0, -5, 5, 0],
          transition: { duration: 0.3 }
        }}
        whileTap={{ scale: isDragging ? 1 : 0.95 }}
        animate={{ 
          boxShadow: isOpen 
            ? "0 0 0 0 rgba(16, 185, 129, 0)" 
            : [
                "0 0 0 0 rgba(16, 185, 129, 0.4)",
                "0 0 0 15px rgba(16, 185, 129, 0.1)",
                "0 0 0 0 rgba(16, 185, 129, 0.4)"
              ],
          background: [
            "linear-gradient(45deg, #10b981, #3b82f6, #8b5cf6)",
            "linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6)",
            "linear-gradient(135deg, #10b981, #3b82f6, #8b5cf6)",
            "linear-gradient(45deg, #10b981, #3b82f6, #8b5cf6)"
          ],
          transition: {
            boxShadow: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            },
            background: {
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }
          }
        }}
      >
        <motion.div
          animate={{
            rotate: [0, 360],
            transition: {
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }
          }}
        >
          <MessageCircle className="h-8 w-8" />
        </motion.div>
        <motion.div 
          className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg"
          animate={{
            scale: [1, 1.2, 1],
            transition: {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        >
          <span className="text-xs font-bold text-white">AI</span>
        </motion.div>
      </motion.button>

      {/* Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatContainerRef}
            className="fixed bottom-20 right-4 z-40 w-80 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    Health Navigator
                    <Move className="h-4 w-4 opacity-60" title="Drag to move" />
                  </h3>
                  <p className="text-xs opacity-90">Multilingual AI Assistant • {currentLanguage.nativeName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Language Selector */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLanguageSelector(!showLanguageSelector);
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1"
                    title={`Current: ${currentLanguage.nativeName} | Click to change language`}
                  >
                    <Languages className="h-4 w-4" />
                    <span className="text-xs font-medium">{currentLanguage.code.toUpperCase()}</span>
                  </button>
                  {showLanguageSelector && (
                    <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-52 z-20 max-h-64 overflow-y-auto">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100">
                        Select Language / भाषा चुनें
                      </div>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLanguageChange(lang);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors flex items-center justify-between ${
                            currentLanguage.code === lang.code ? 'bg-emerald-50 text-emerald-600 border-l-4 border-emerald-500' : 'text-gray-700'
                          }`}
                        >
                          <div>
                            <div className="font-medium text-sm">{lang.nativeName}</div>
                            <div className="text-xs opacity-60">{lang.name}</div>
                          </div>
                          <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                            {lang.code.toUpperCase()}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Audio Controls */}
                <button
                  onClick={isSpeaking ? stopSpeaking : () => setIsSpeaking(!isSpeaking)}
                  className={`p-2 hover:bg-white/20 rounded-lg transition-colors ${
                    isSpeaking ? 'bg-red-500/20 text-red-400' : ''
                  }`}
                  title={isSpeaking ? 'Stop speaking' : 'Toggle auto-speak'}
                >
                  {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`max-w-[80%] p-4 rounded-2xl ${
                    message.isBot 
                      ? 'bg-white shadow-md border border-gray-100 text-gray-800' 
                      : 'bg-gradient-to-r from-emerald-500 to-blue-600 text-white'
                  }`}>
                    {message.isBot ? (
                      <div 
                        className="text-sm leading-relaxed prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: message.text }}
                      />
                    ) : (
                      <p className="text-sm leading-relaxed">{message.text}</p>
                    )}
                    <p className="text-xs opacity-60 mt-2 pt-2 border-t border-gray-200">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="bg-gray-100 p-3 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={currentLanguage.code === 'hi' ? 'अपना संदेश टाइप करें...' : 'Type your message...'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                  }`}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim()}
                  className="p-3 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-xl hover:from-emerald-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
              
              {/* Quick Actions */}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => handleSendMessage(currentLanguage.code === 'hi' ? 'होम पर जाएं' : 'Go to home')}
                  className="px-3 py-1 bg-white border border-gray-300 rounded-full text-xs hover:bg-gray-50 transition-colors"
                >
                  🏠 {currentLanguage.code === 'hi' ? 'होम' : 'Home'}
                </button>
                <button
                  onClick={() => handleSendMessage(currentLanguage.code === 'hi' ? 'डॉक्टर से बात करें' : 'Talk to doctor')}
                  className="px-3 py-1 bg-white border border-gray-300 rounded-full text-xs hover:bg-gray-50 transition-colors"
                >
                  👨‍⚕️ {currentLanguage.code === 'hi' ? 'डॉक्टर' : 'Doctor'}
                </button>
                <button
                  onClick={() => handleSendMessage(currentLanguage.code === 'hi' ? 'स्वास्थ्य जांच' : 'Health check')}
                  className="px-3 py-1 bg-white border border-gray-300 rounded-full text-xs hover:bg-gray-50 transition-colors"
                >
                  🩺 {currentLanguage.code === 'hi' ? 'जांच' : 'Check'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NavigationChatbot;
