import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY, API_CONFIG } from '@/config/api';
import { Stethoscope, Loader2, Send, AlertTriangle, Info as InfoIcon, ChevronDown, User, Bot, Heart, Wind, Pill, Phone, Clock, Mic, Camera, Eye, BadgeCheck, CheckCircle2, Clipboard, Zap, Thermometer, ArrowDownRight, ArrowUpRight, AlertCircle, ClipboardCheck, CircleDot, ClipboardList, PillIcon, Globe, Activity, LightbulbIcon, Sparkles, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatContainer,
  Header,
  MessageContainer,
  Message,
  MessageBubble,
  InputContainer,
  SeverityIndicator,
  Recommendation,
  TypingIndicator,
  SectionHighlight,
  ImagePreview,
  MessageTime,
  ChipsContainer,
  CategorySection,
  mediaQueries
} from '@/styles/ChatStyles';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

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

// Complete language support for rural and semi-urban healthcare
const SUPPORTED_LANGUAGES = [
  // Indian Languages
  { code: 'english', name: 'English', flag: '', locale: 'en-US' },
  { code: 'hindi', name: 'हिंदी (Hindi)', flag: '', locale: 'hi-IN' },
  { code: 'telugu', name: 'తెలుగు (Telugu)', flag: '', locale: 'te-IN' },
  { code: 'tamil', name: 'தமிழ் (Tamil)', flag: '', locale: 'ta-IN' },
  { code: 'bengali', name: 'বাংলা (Bengali)', flag: '', locale: 'bn-IN' },
  { code: 'marathi', name: 'मराठी (Marathi)', flag: '', locale: 'mr-IN' },
  { code: 'gujarati', name: 'ગુજરાતી (Gujarati)', flag: '', locale: 'gu-IN' },
  { code: 'kannada', name: 'ಕನ್ನಡ (Kannada)', flag: '', locale: 'kn-IN' },
  { code: 'malayalam', name: 'മലയാളം (Malayalam)', flag: '', locale: 'ml-IN' },
  { code: 'punjabi', name: 'ਪੰਜਾਬੀ (Punjabi)', flag: '', locale: 'pa-IN' },
  { code: 'urdu', name: 'اردو (Urdu)', flag: '', locale: 'ur-IN' },
  { code: 'odia', name: 'ଓଡ଼ିଆ (Odia)', flag: '', locale: 'or-IN' },
  { code: 'assamese', name: 'অসমীয়া (Assamese)', flag: '', locale: 'as-IN' },
  // International Languages
  { code: 'spanish', name: 'Español (Spanish)', flag: '', locale: 'es-ES' },
  { code: 'french', name: 'Français (French)', flag: '', locale: 'fr-FR' },
  { code: 'german', name: 'Deutsch (German)', flag: '', locale: 'de-DE' },
  { code: 'arabic', name: 'العربية (Arabic)', flag: '', locale: 'ar-SA' },
  { code: 'chinese', name: '中文 (Chinese)', flag: '', locale: 'zh-CN' },
  { code: 'japanese', name: '日本語 (Japanese)', flag: '', locale: 'ja-JP' },
  { code: 'russian', name: 'Русский (Russian)', flag: '', locale: 'ru-RU' },
  { code: 'portuguese', name: 'Português (Portuguese)', flag: '', locale: 'pt-PT' }
];

const getInitialGreeting = (language: string) => {
  const greetings = {
    english: 'Hello! Im Dr. CureCast, your multilingual AI health assistant for rural and semi-urban healthcare. I can help with preventive care, symptoms, vaccination schedules, and connect you with government health services. How can I assist you today?',
    hindi: 'नमस्ते! मैं डॉ. क्योरकास्ट हूं, ग्रामीण और अर्ध-शहरी स्वास्थ्य सेवा के लिए आपका बहुभाषी AI स्वास्थ्य सहायक। मैं निवारक देखभाल, लक्षण, टीकाकरण कार्यक्रम में मदद कर सकता हूं और आपको सरकारी स्वास्थ्य सेवाओं से जोड़ सकता हूं। आज मैं आपकी कैसे सहायता कर सकता हूं?',
    telugu: 'నమస్కారం! నేను డాక్టర్ క్యూరకాస్ట్, గ్రామీణ మరియు అర్ధ-పట్టణ ఆరోగ్య సంరక్షణ కోసం మీ బహుభాషా AI ఆరోగ్య సహాయకుడిని। నేను నివారణ సంరక్షణ, లక్షణాలు, టీకా షెడ్యూల్‌లతో సహాయం చేయగలను మరియు మిమ్మల్ని ప్రభుత్వ ఆరోగ్య సేవలతో కనెక్ట్ చేయగలను. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?',
    tamil: 'வணக்கம்! நான் டாக்டர் க்யூர்காஸ்ட், கிராமப்புற மற்றும் அரை-நகர்ப்புற சுகாதார பராமரிப்புக்கான உங்கள் பன்மொழி AI சுகாதார உதவியாளர். நான் தடுப்பு பராமரிப்பு, அறிகுறிகள், தடுப்பூசி அட்டவணைகளில் உதவ முடியும் மற்றும் உங்களை அரசு சுகாதார சேவைகளுடன் இணைக்க முடியும். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?',
    bengali: 'নমস্কার! আমি ডাঃ কিউরকাস্ট, গ্রামীণ এবং আধা-শহুরে স্বাস্থ্যসেবার জন্য আপনার বহুভাষিক AI স্বাস্থ্য সহায়ক। আমি প্রতিরোধমূলক যত্ন, উপসর্গ, টিকাদানের সময়সূচীতে সাহায্য করতে পারি এবং আপনাকে সরকারি স্বাস্থ্য সেবার সাথে সংযুক্ত করতে পারি। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
    marathi: 'नमस्कार! मी डॉ. क्युरकास्ट आहे, ग्रामीण आणि अर्ध-शहरी आरोग्यसेवेसाठी तुमचा बहुभाषिक AI आरोग्य सहाय्यक. मी प्रतिबंधात्मक काळजी, लक्षणे, लसीकरण वेळापत्रकात मदत करू शकतो आणि तुम्हाला सरकारी आरोग्य सेवांशी जोडू शकतो. आज मी तुमची कशी मदत करू शकतो?',
    gujarati: 'નમસ્તે! હું ડૉ. ક્યુરકાસ્ટ છું, ગ્રામીણ અને અર્ધ-શહેરી આરોગ્યસંભાળ માટે તમારો બહુભાષી AI આરોગ્ય સહાયક. હું નિવારક સંભાળ, લક્ષણો, રસીકરણ કાર્યક્રમોમાં મદદ કરી શકું છું અને તમને સરકારી આરોગ્ય સેવાઓ સાથે જોડી શકું છું. આજે હું તમારી કેવી રીતે મદદ કરી શકું?',
    kannada: 'ನಮಸ್ಕಾರ! ನಾನು ಡಾ. ಕ್ಯೂರ್‌ಕಾಸ್ಟ್, ಗ್ರಾಮೀಣ ಮತ್ತು ಅರೆ-ನಗರ ಆರೋಗ್ಯ ಸೇವೆಗಾಗಿ ನಿಮ್ಮ ಬಹುಭಾಷಾ AI ಆರೋಗ್ಯ ಸಹಾಯಕ. ನಾನು ತಡೆಗಟ್ಟುವ ಆರೈಕೆ, ರೋಗಲಕ್ಷಣಗಳು, ವ್ಯಾಕ್ಸಿನೇಷನ್ ವೇಳಾಪಟ್ಟಿಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಹುದು ಮತ್ತು ನಿಮ್ಮನ್ನು ಸರ್ಕಾರಿ ಆರೋಗ್ಯ ಸೇವೆಗಳೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಬಹುದು. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',
    malayalam: 'നമസ്കാരം! ഞാൻ ഡോ. ക്യൂർകാസ്റ്റ് ആണ്, ഗ്രാമീണ, അർദ്ധ നഗര ആരോഗ്യ സംരക്ഷണത്തിനുള്ള നിങ്ങളുടെ ബഹുഭാഷാ AI ആരോഗ്യ സഹായി. പ്രതിരോധ പരിചരണം, ലക്ഷണങ്ങൾ, വാക്സിനേഷൻ ഷെഡ്യൂളുകൾ എന്നിവയിൽ എനിക്ക് സഹായിക്കാനും നിങ്ങളെ സർക്കാർ ആരോഗ്യ സേവനങ്ങളുമായി ബന്ധിപ്പിക്കാനും കഴിയും. ഇന്ന് എനിക്ക് നിങ്ങളെ എങ്ങനെ സഹായിക്കാം?',
    punjabi: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਡਾ. ਕਿਊਰਕਾਸਟ ਹਾਂ, ਪੇਂਡੂ ਅਤੇ ਅਰਧ-ਸ਼ਹਿਰੀ ਸਿਹਤ ਸੰਭਾਲ ਲਈ ਤੁਹਾਡਾ ਬਹੁ-ਭਾਸ਼ਾਈ AI ਸਿਹਤ ਸਹਾਇਕ। ਮੈਂ ਰੋਕਥਾਮ ਦੇਖਭਾਲ, ਲੱਛਣ, ਟੀਕਾਕਰਨ ਸਮਾਂ-ਸਾਰਣੀ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ ਅਤੇ ਤੁਹਾਨੂੰ ਸਰਕਾਰੀ ਸਿਹਤ ਸੇਵਾਵਾਂ ਨਾਲ ਜੋੜ ਸਕਦਾ ਹਾਂ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?',
    urdu: 'السلام علیکم! میں ڈاکٹر کیورکاسٹ ہوں، دیہی اور نیم شہری صحت کی دیکھ بھال کے لیے آپ کا کثیر لسانی AI صحت معاون۔ میں احتیاطی دیکھ بھال، علامات، ویکسینیشن شیڈول میں مدد کر سکتا ہوں اور آپ کو حکومتی صحت کی خدمات سے جوڑ سکتا ہوں۔ آج میں آپ کی کیسے مدد کر سکتا ہوں؟',
    odia: 'ନମସ୍କାର! ମୁଁ ଡାଃ କ୍ୟୁରକାଷ୍ଟ, ଗ୍ରାମାଞ୍ଚଳ ଏବଂ ଅର୍ଦ୍ଧ-ସହରାଞ୍ଚଳ ସ୍ୱାସ୍ଥ୍ୟ ସେବା ପାଇଁ ଆପଣଙ୍କର ବହୁଭାଷୀ AI ସ୍ୱାସ୍ଥ୍ୟ ସହାୟକ। ମୁଁ ପ୍ରତିରୋଧମୂଳକ ଯତ୍ନ, ଲକ୍ଷଣ, ଟୀକାକରଣ କାର୍ଯ୍ୟସୂଚୀରେ ସାହାଯ୍ୟ କରିପାରିବି ଏବଂ ଆପଣଙ୍କୁ ସରକାରୀ ସ୍ୱାସ୍ଥ୍ୟ ସେବା ସହିତ ସଂଯୋଗ କରିପାରିବି। ଆଜି ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?',
    assamese: 'নমস্কাৰ! মই ডাঃ কিউৰকাষ্ট, গ্ৰাম্য আৰু আধা-চহৰীয়া স্বাস্থ্যসেৱাৰ বাবে আপোনাৰ বহুভাষিক AI স্বাস্থ্য সহায়ক। মই প্ৰতিৰোধমূলক যত্ন, লক্ষণ, টীকাকৰণ সময়সূচীত সহায় কৰিব পাৰো আৰু আপোনাক চৰকাৰী স্বাস্থ্য সেৱাৰ সৈতে সংযোগ কৰিব পাৰো। আজি মই আপোনাক কেনেকৈ সহায় কৰিব পাৰো?'
  };
  return greetings[language as keyof typeof greetings] || greetings.english;
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
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage || 'english');
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      text: "Hello! I'm Dr. CureCast. It's nice to meet you. How can I help you today?",
      isUser: false,
    },
  ]);
  const [input, setInput] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const [quickChips, setQuickChips] = useState([
    "I have a headache",
    "Stomach pain",
    "Fever and cough",
    "Skin rash",
    "Help me with medication"
  ]);

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  useEffect(() => {
    scrollToBottom();
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
      const prompt = `You are Dr.CureCast, a warm, compassionate physician with extensive experience who speaks in a conversational, approachable manner. ${promptPrefix}A patient has described their symptoms as: "${promptInput}". ${promptSuffix}
      
      Please provide a friendly, conversational medical response in ${currentLanguage} that feels like talking to a trusted family doctor, not an AI.
      
      Structure your response with these sections, but make them sound natural and conversational:
      
      Initial assessment: Provide a brief, personalized assessment that acknowledges the patient's concerns
      Possible causes: Explain potential causes in an easy-to-understand way, using clear language with medical terms explained when needed
      Immediate care advice: Offer practical, helpful recommendations with a caring tone
      When to seek medical attention: Explain warning signs that need professional attention without causing unnecessary alarm
      
      ADDITIONALLY, if medications are appropriate, include this section:
      Medications: Suggest options in a helpful, informative way
      
      ADDITIONALLY, if symptoms need clarification, include this section:
      Symptoms: Discuss relevant symptoms to watch for in a conversational way
      
      Use a warm, empathetic tone throughout. Speak directly to the patient using "you" and occasionally add phrases like "I understand this must be uncomfortable" or "Many of my patients experience this" to sound more human and empathetic.
      
      Each section should be clearly labeled but feel like natural parts of a conversation with a caring doctor.
      
      If the input is in Hindi or Telugu, respond in that same language with the same warm, conversational approach.`;

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
      'hi': "Hello there! How are you doing today?",
      'hello': "Hello! It's nice to connect with you. How can I help?",
      'hey': "Hey there! How can I assist you today?",
      'hii': "Hi! How are you doing today?",
      'hiii': "Hello there! How can I assist you today?",
      'hiiii': "Hi! How are you doing? What can I help you with?",
      'helo': "Hello! How are you today?",
      'hellow': "Hello! How are you doing?",
      'hola': "¡Hola! How can I help you today?",
      'namaste': "Namaste! It's nice to meet you. How can I help?",
      'good morning': "Good morning! I hope your day is off to a great start. What can I do for you?",
      'good afternoon': "Good afternoon! How's your day going? How can I assist you?",
      'good evening': "Good evening! How has your day been? What can I help you with?",
      'how are you': "I'm doing well, thank you for asking! How are you today?"
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

  // Enhanced process message function to extract medical information from AI responses
  const processMessage = (text: string): {
    mainText: string;
    highlightedCondition?: string;
    consequences?: string;
    advice?: string;
    detection?: string;
    medications?: string[];
    dosages?: {name: string, dosage: string, frequency: string}[];
    symptoms?: string[];
    urgency?: 'low' | 'medium' | 'high';
    treatmentPlan?: string;
    websites?: string[];
    medicalState?: string;
  } => {
    // Store the original text as the main text
    const mainText = text;
    
    // Initialize all extraction variables
    let highlightedCondition = '';
    let consequences = '';
    let advice = '';
    let detection = '';
    let medications: string[] = [];
    let dosages: {name: string, dosage: string, frequency: string}[] = [];
    let symptoms: string[] = [];
    let urgency: 'low' | 'medium' | 'high' = 'medium';
    let treatmentPlan = '';
    let websites: string[] = [];
    let medicalState = '';

    // Extract the assessment section (Initial assessment)
    const assessmentRegex = /(?:Initial assessment|Assessment):?\s*(.*?)(?=(?:Possible causes|Causes|Immediate care|When to seek|$))/is;
    const assessmentMatch = text.match(assessmentRegex);
    if (assessmentMatch && assessmentMatch[1]) {
      detection = assessmentMatch[1].trim();
    }
    
    // Extract the possible causes section
    const causesRegex = /(?:Possible causes|Causes):?\s*(.*?)(?=(?:Immediate care|Care advice|When to seek|$))/is;
    const causesMatch = text.match(causesRegex);
    if (causesMatch && causesMatch[1]) {
      consequences = causesMatch[1].trim();
    }
    
    // Extract the immediate care advice section
    const careAdviceRegex = /(?:Immediate care advice|Care advice|Home care):?\s*(.*?)(?=(?:When to seek|Medical attention|$))/is;
    const careAdviceMatch = text.match(careAdviceRegex);
    if (careAdviceMatch && careAdviceMatch[1]) {
      advice = careAdviceMatch[1].trim();
      treatmentPlan = careAdviceMatch[1].trim();
    }
    
    // Extract when to seek medical attention section
    const whenToSeekRegex = /(?:When to seek medical attention|Medical attention|Seek help):?\s*(.*?)(?=(?:Initial assessment|Assessment|Possible causes|Causes|Immediate care|Care advice|Medications|Symptoms|$))/is;
    const whenToSeekMatch = text.match(whenToSeekRegex);
    if (whenToSeekMatch && whenToSeekMatch[1]) {
      medicalState = whenToSeekMatch[1].trim();
    }
    
    // Extract medications from standard format
    const medicationsRegex = /(?:Medications):?\s*(.*?)(?=(?:Initial assessment|Assessment|Possible causes|Causes|Immediate care|Care advice|When to seek|Medical attention|Symptoms|$))/is;
    const medicationsMatch = text.match(medicationsRegex);
    if (medicationsMatch && medicationsMatch[1]) {
      const medsText = medicationsMatch[1].trim();
      medications = medsText
        .split(/\n|,|;/)
        .map(med => med.trim())
        .filter(med => med.length > 0 && !med.toLowerCase().includes('section') && !med.toLowerCase().includes('medications'));
    }
    
    // Extract symptoms from standard format
    const symptomsStandardRegex = /(?:Symptoms):?\s*(.*?)(?=(?:Initial assessment|Assessment|Possible causes|Causes|Immediate care|Care advice|When to seek|Medical attention|Medications|$))/is;
    const symptomsStandardMatch = text.match(symptomsStandardRegex);
    if (symptomsStandardMatch && symptomsStandardMatch[1]) {
      const symptomsText = symptomsStandardMatch[1].trim();
      const extractedSymptoms = symptomsText
        .split(/\n|,|;/)
        .map(symptom => symptom.trim())
        .filter(symptom => symptom.length > 0 && !symptom.toLowerCase().includes('section') && !symptom.toLowerCase().includes('symptoms'));
      
      symptoms = extractedSymptoms;
    }
    
    // If no medications found through standard format, try finding common medication names in the text
    if (medications.length === 0) {
      const commonMeds = [
        'acetaminophen', 'ibuprofen', 'aspirin', 'paracetamol', 'tylenol', 'advil', 'motrin',
        'antacid', 'tums', 'pepcid', 'omeprazole', 'famotidine', 'ranitidine'
      ];
      
      const medRegex = new RegExp(`\\b(${commonMeds.join('|')})\\b`, 'gi');
      const medMatches = [...text.matchAll(medRegex)];
      
      if (medMatches.length > 0) {
        const uniqueMeds = Array.from(new Set(medMatches.map(match => match[0])));
        medications = uniqueMeds.map(med => med.charAt(0).toUpperCase() + med.slice(1).toLowerCase());
      }
    }
    
    // If no symptoms found through standard format, try to extract common symptoms from the text
    if (symptoms.length === 0) {
      const possibleSymptoms = [
        'headache', 'pain', 'fever', 'cough', 'rash', 'nausea', 'vomiting', 
        'diarrhea', 'fatigue', 'dizziness', 'weakness', 'sore throat'
      ];
      
      const foundSymptoms = new Set<string>();
      possibleSymptoms.forEach(symptom => {
        const symptomRegex = new RegExp(`\\b${symptom}\\b`, 'i');
        if (symptomRegex.test(text)) {
          foundSymptoms.add(symptom);
        }
      });
      
      symptoms = Array.from(foundSymptoms);
    }
    
    // Extract urgency level
    if (text.toLowerCase().includes('emergency') || 
        text.toLowerCase().includes('urgent') || 
        text.toLowerCase().includes('immediately') || 
        text.toLowerCase().includes('severe') || 
        text.toLowerCase().includes('critical')) {
      urgency = 'high';
    } else if (text.toLowerCase().includes('mild') && 
              !text.toLowerCase().includes('seek medical attention') && 
              !text.toLowerCase().includes('consult a doctor')) {
      urgency = 'low';
    }
    
    return {
      mainText,
      highlightedCondition,
      consequences,
      advice,
      detection,
      medications,
      dosages,
      symptoms,
      urgency,
      treatmentPlan,
      websites,
      medicalState
    };
  };

  // Update the renderMessageContent function to display organized medical sections
  const renderMessageContent = (message: ChatMessage) => {
    // Format current time for message bubbles
    const formatTime = (date = new Date()) => {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Special case for greeting message
    const isGreeting = message.text === "Hello! I'm Dr. CureCast. It's nice to meet you. How can I help you today?";

    // Process the message for highlights
    const {
      mainText,
      highlightedCondition,
      consequences,
      advice,
      detection,
      medications,
      dosages,
      symptoms,
      urgency,
      treatmentPlan,
      websites,
      medicalState
    } = message.isUser ? { mainText: message.text } : processMessage(message.text);
      
    if (message.isUser) {
      return (
        <div className="flex items-start gap-3 py-4">
          <Avatar>
            <AvatarImage src="/user-avatar.png" alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="text-sm">
            {message.text}
          </div>
        </div>
      );
    }
    
    // Check if we have structured sections
    const hasStructuredSections = detection || consequences || advice || 
                                 (medications && medications.length > 0) || 
                                 (symptoms && symptoms.length > 0) || 
                                 treatmentPlan || medicalState;

    return (
      <div className="flex items-start gap-3 py-4">
        <Avatar>
          <AvatarImage src="/doctor-avatar.png" alt="Dr. CureCast" />
          <AvatarFallback>Dr</AvatarFallback>
        </Avatar>
        <div className="text-sm flex-1 space-y-4 max-w-full">
          {/* Only show mainText if we don't have structured sections */}
          {mainText && !hasStructuredSections && (
            <div>
              {mainText}
            </div>
          )}
          
          {(highlightedCondition || detection) && (
            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400 shadow-sm">
              <div className="flex items-center gap-2 font-medium text-blue-700 mb-2">
                <ClipboardList size={18} className="text-blue-600" />
                Assessment
              </div>
              <div className="text-gray-700 leading-relaxed">
                {detection || highlightedCondition}
              </div>
            </div>
          )}

          {consequences && (
            <div className="bg-pink-50 rounded-lg p-4 border-l-4 border-pink-400 shadow-sm">
              <div className="flex items-center gap-2 font-medium text-pink-700 mb-2">
                <AlertCircle size={18} className="text-pink-600" />
                Possible Causes
              </div>
              <div className="text-gray-700 leading-relaxed">
                {consequences}
              </div>
            </div>
          )}

          {symptoms && symptoms.length > 0 && (
            <div className="bg-sky-50 rounded-lg p-4 border-l-4 border-sky-400 shadow-sm">
              <div className="flex items-center gap-2 font-medium text-sky-700 mb-2">
                <Thermometer size={18} className="text-sky-600" />
                Symptoms
              </div>
              <div className="text-gray-700">
                <ul className="space-y-2">
                  {symptoms.map((symptom, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CircleDot size={12} className="mt-1.5 text-sky-600" />
                      <span className="leading-relaxed">{symptom}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {(treatmentPlan || advice) && (
            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400 shadow-sm">
              <div className="flex items-center gap-2 font-medium text-green-700 mb-2">
                <Clipboard size={18} className="text-green-600" />
                Treatment Plan
              </div>
              <div className="text-gray-700 leading-relaxed">
                {treatmentPlan || advice}
              </div>
            </div>
          )}

          {medications && medications.length > 0 && (
            <div className="bg-emerald-50 rounded-lg p-4 border-l-4 border-emerald-400 shadow-sm">
              <div className="flex items-center gap-2 font-medium text-emerald-700 mb-2">
                <PillIcon size={18} className="text-emerald-600" />
                Medications
              </div>
              <div className="text-gray-700">
                <ul className="space-y-2">
                  {medications.map((medication, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CircleDot size={12} className="mt-1.5 text-emerald-600" />
                      <span className="leading-relaxed">{medication}</span>
                    </li>
                  ))}
                </ul>
                
                {dosages && dosages.length > 0 && (
                  <div className="mt-3 border-t border-emerald-200 pt-2">
                    <p className="font-medium text-sm text-emerald-700 mb-2">Dosage Instructions:</p>
                    <ul className="space-y-2">
                      {dosages.map((dosage, i) => (
                        <li key={i} className="leading-relaxed">
                          <span className="font-medium">{dosage.name}:</span> {dosage.dosage}, {dosage.frequency}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {advice && !treatmentPlan && (
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-amber-400 shadow-sm">
              <div className="flex items-center gap-2 font-medium text-amber-700 mb-2">
                <LightbulbIcon size={18} className="text-amber-500" />
                Recommendations
              </div>
              <div className="text-gray-700 leading-relaxed">
                {advice}
              </div>
            </div>
          )}

          {websites && websites.length > 0 && (
            <div className="bg-indigo-50 rounded-lg p-4 border-l-4 border-indigo-400 shadow-sm">
              <div className="flex items-center gap-2 font-medium text-indigo-700 mb-2">
                <Globe size={18} className="text-indigo-600" />
                Helpful Resources
              </div>
              <div className="text-gray-700">
                <ul className="space-y-2">
                  {websites.map((website, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CircleDot size={12} className="mt-1.5 text-indigo-600" />
                      <a 
                        href={website.startsWith('http') ? website : `https://${website}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline leading-relaxed"
                      >
                        {website}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {medicalState && (
            <div className="bg-amber-50 rounded-lg p-4 border-l-4 border-amber-400 shadow-sm">
              <div className="flex items-center gap-2 font-medium text-amber-700 mb-2">
                <Activity size={18} className="text-amber-600" />
                When to Seek Medical Attention
              </div>
              <div className="text-gray-700 leading-relaxed">
                {medicalState}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <Card className="w-full h-full border-none shadow-none bg-transparent">
      <ChatContainer>
        <Header>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="header-avatar">
              <Stethoscope size={16} />
            </div>
            <h2>
              Dr. CureCast <span className="status-indicator"></span>
            </h2>
          </div>
          <div style={{ 
            fontSize: '0.8rem', 
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '6px' 
          }}>
            <Clock size={14} />
            {new Date().toLocaleDateString()}
          </div>
        </Header>

        <MessageContainer ref={messagesEndRef}>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Message $isUser={message.isUser}>
                {renderMessageContent(message)}
              </Message>
            </motion.div>
          ))}

          {isProcessing && (
            <Message $isUser={false}>
              <TypingIndicator>
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </TypingIndicator>
            </Message>
          )}
          <div ref={messagesEndRef} />
        </MessageContainer>

        <ChipsContainer style={{ 
          position: 'absolute', 
          bottom: '80px', 
          left: '0', 
          right: '0', 
          padding: '0 20px',
          zIndex: 2,
          justifyContent: 'center',
          display: quickChips.length > 0 ? 'flex' : 'none'
        }}>
          {quickChips.map((chip, index) => (
            <motion.div 
              key={index} 
              className="chip"
              whileHover={{ y: -2, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setInput(chip);
                handleSendMessage(chip);
                setQuickChips(prev => prev.filter(c => c !== chip));
              }}
            >
              {chip}
            </motion.div>
          ))}
        </ChipsContainer>

        <InputContainer>
          <div className="input-wrapper">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Ask Dr. CureCast about your symptoms...`}
              disabled={isProcessing}
            />
            <div className="action-buttons">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={onCameraInputRequest} 
                  disabled={isProcessing || isUploading}
                >
                  <Camera size={18} color="#4f46e5" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onVoiceInputRequest}
                  disabled={isProcessing}
                >
                  <Mic size={18} color="#4f46e5" />
                </Button>
              </motion.div>
            </div>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              onClick={() => handleSendMessage()}
              disabled={isProcessing || (!input.trim() && !imageUrl)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </motion.div>
        </InputContainer>
      </ChatContainer>
    </Card>
  );
};

export default DrCureCast; 