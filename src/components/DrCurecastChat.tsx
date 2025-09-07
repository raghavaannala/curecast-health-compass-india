import React, { useState, useEffect, useRef } from 'react';
import { 
  DrCurecastUser, 
  ChatMessage, 
  ChatSession, 
  Language,
  VoiceMessage 
} from '../types';
import { drCurecastService } from '../services/drCurecastService';
import { voiceService } from '../services/voiceService';
import { languageService } from '../services/languageService';
import { userProfileService } from '../services/userProfileService';
import { errorHandler } from '../utils/errorHandler';

interface DrCurecastChatProps {
  userId: string;
  initialLanguage?: Language;
  voiceEnabled?: boolean;
  context?: 'general' | 'vaccination' | 'emergency' | 'reminder';
}

export const DrCurecastChat: React.FC<DrCurecastChatProps> = ({
  userId,
  initialLanguage = 'english',
  voiceEnabled = false,
  context = 'general'
}) => {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [user, setUser] = useState<DrCurecastUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(initialLanguage);
  const [error, setError] = useState<string | null>(null);
  const [supportedFeatures, setSupportedFeatures] = useState({
    voice: false,
    multilingual: true,
    vaccinationReminders: true,
    governmentSync: false
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Dr.Curecast
  useEffect(() => {
    initializeDrCurecast();
  }, [userId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeDrCurecast = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const initResult = await drCurecastService.initializeForUser(userId);
      setUser(initResult.user);
      setSupportedFeatures(initResult.supportedFeatures);
      setCurrentLanguage(initResult.user.language);

      // Start chat session
      const newSession = await drCurecastService.startChatSession(
        userId,
        initResult.user.language,
        voiceEnabled && initResult.supportedFeatures.voice,
        context
      );

      setSession(newSession);
      setMessages(newSession.messages);

    } catch (error) {
      const errorResult = await errorHandler.handleError(
        error as Error,
        'chat_initialization',
        userId,
        currentLanguage
      );
      setError(errorResult.userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (text?: string, voiceMessage?: VoiceMessage) => {
    if (!session || (!text && !voiceMessage)) return;

    // Validate input
    if (text) {
      const validation = errorHandler.validateInput(text, 'text');
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }
      text = validation.sanitized;
    }

    // Check rate limiting
    const rateLimit = errorHandler.checkRateLimit(userId, 'message');
    if (!rateLimit.allowed) {
      setError('Too many messages. Please wait a moment before sending another message.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await drCurecastService.processUserMessage(session.id, {
        text,
        voiceMessage
      });

      // Update messages
      const updatedSession = drCurecastService.getSession(session.id);
      if (updatedSession) {
        setMessages([...updatedSession.messages]);
        setCurrentLanguage(updatedSession.language);
      }

      // Handle any actions
      if (response.actions) {
        handleResponseActions(response.actions);
      }

      // Clear input
      setInputText('');

    } catch (error) {
      const errorResult = await errorHandler.handleError(
        error as Error,
        'message_send',
        userId,
        currentLanguage
      );
      setError(errorResult.userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceInput = async () => {
    if (!supportedFeatures.voice) {
      setError('Voice input is not supported on this device');
      return;
    }

    try {
      setIsListening(true);
      setError(null);

      const voiceMessage = await voiceService.startListening(
        currentLanguage,
        (result) => {
          console.log('Voice input received:', result.transcription);
        },
        (error) => {
          console.error('Voice input error:', error);
          setError('Voice input failed. Please try again.');
        }
      );

      if (voiceMessage) {
        await sendMessage(undefined, voiceMessage);
      }

    } catch (error) {
      const errorResult = await errorHandler.handleError(
        error as Error,
        'voice_input',
        userId,
        currentLanguage
      );
      setError(errorResult.userMessage);
    } finally {
      setIsListening(false);
    }
  };

  const stopVoiceInput = () => {
    voiceService.stopListening();
    setIsListening(false);
  };

  const changeLanguage = async (newLanguage: Language) => {
    try {
      // Update user preferences
      await userProfileService.updateLanguagePreferences(userId, [newLanguage]);
      setCurrentLanguage(newLanguage);
      
      // Update session language immediately
      if (session) {
        session.language = newLanguage;
      }
      
      // Send language change confirmation in the new language
      const confirmationMessage = await getLocalizedMessage('language_changed', newLanguage);
      await sendMessage(confirmationMessage);
      
    } catch (error) {
      console.error('Language change failed:', error);
      setError('Failed to change language. Please try again.');
    }
  };

  // Get localized messages for the interface
  const getLocalizedMessage = async (key: string, language: Language): Promise<string> => {
    const messages: Record<string, Record<Language, string>> = {
      language_changed: {
        english: `Language switched to ${languageService.getLanguageDisplayName(language)}`,
        hindi: `भाषा ${languageService.getLanguageDisplayName(language)} में बदल दी गई`,
        bengali: `ভাষা ${languageService.getLanguageDisplayName(language)} এ পরিবর্তন করা হয়েছে`,
        telugu: `భాష ${languageService.getLanguageDisplayName(language)} కి మార్చబడింది`,
        tamil: `மொழி ${languageService.getLanguageDisplayName(language)} க்கு மாற்றப்பட்டது`,
        marathi: `भाषा ${languageService.getLanguageDisplayName(language)} मध्ये बदलली`,
        kannada: `ಭಾಷೆ ${languageService.getLanguageDisplayName(language)} ಗೆ ಬದಲಾಯಿಸಲಾಗಿದೆ`,
        malayalam: `ഭാഷ ${languageService.getLanguageDisplayName(language)} ലേക്ക് മാറ്റി`,
        gujarati: `ભાષા ${languageService.getLanguageDisplayName(language)} માં બદલાઈ`,
        punjabi: `ਭਾਸ਼ਾ ${languageService.getLanguageDisplayName(language)} ਵਿੱਚ ਬਦਲੀ`,
        urdu: `زبان ${languageService.getLanguageDisplayName(language)} میں تبدیل کر دی گئی`,
        odia: `ଭାଷା ${languageService.getLanguageDisplayName(language)} କୁ ପରିବର୍ତ୍ତନ କରାଗଲା`,
        assamese: `ভাষা ${languageService.getLanguageDisplayName(language)} লৈ সলনি কৰা হ'ল`,
        spanish: `Idioma cambiado a ${languageService.getLanguageDisplayName(language)}`,
        french: `Langue changée en ${languageService.getLanguageDisplayName(language)}`,
        german: `Sprache geändert zu ${languageService.getLanguageDisplayName(language)}`,
        arabic: `تم تغيير اللغة إلى ${languageService.getLanguageDisplayName(language)}`,
        chinese: `语言已切换到 ${languageService.getLanguageDisplayName(language)}`,
        japanese: `言語が${languageService.getLanguageDisplayName(language)}に変更されました`,
        russian: `Язык изменен на ${languageService.getLanguageDisplayName(language)}`,
        portuguese: `Idioma alterado para ${languageService.getLanguageDisplayName(language)}`
      }
    };

    return messages[key]?.[language] || messages[key]?.['english'] || `Language changed to ${languageService.getLanguageDisplayName(language)}`;
  };

  // Get multilingual quick action labels
  const getQuickActionLabel = (action: string, language: Language): string => {
    const labels: Record<string, Record<Language, string>> = {
      vaccination_status: {
        english: 'Vaccination Status',
        hindi: 'टीकाकरण स्थिति',
        bengali: 'টিকাদানের অবস্থা',
        telugu: 'వ్యాక్సినేషన్ స్థితి',
        tamil: 'தடுப்பூசி நிலை',
        marathi: 'लसीकरण स्थिती',
        kannada: 'ವ್ಯಾಕ್ಸಿನೇಷನ್ ಸ್ಥಿತಿ',
        malayalam: 'വാക്സിനേഷൻ നില',
        gujarati: 'રસીકરણ સ્થિતિ',
        punjabi: 'ਟੀਕਾਕਰਨ ਸਥਿਤੀ',
        urdu: 'ویکسینیشن کی صورتحال',
        odia: 'ଟିକାକରଣ ସ୍ଥିତି',
        assamese: 'টিকাকৰণৰ অৱস্থা',
        spanish: 'Estado de Vacunación',
        french: 'Statut de Vaccination',
        german: 'Impfstatus',
        arabic: 'حالة التطعيم',
        chinese: '疫苗接种状态',
        japanese: 'ワクチン接種状況',
        russian: 'Статус вакцинации',
        portuguese: 'Status de Vacinação'
      },
      set_reminder: {
        english: 'Set Reminder',
        hindi: 'रिमाइंडर सेट करें',
        bengali: 'রিমাইন্ডার সেট করুন',
        telugu: 'రిమైండర్ సెట్ చేయండి',
        tamil: 'நினைவூட்டல் அமைக்கவும்',
        marathi: 'स्मरणपत्र सेट करा',
        kannada: 'ರಿಮೈಂಡರ್ ಸೆಟ್ ಮಾಡಿ',
        malayalam: 'റിമൈൻഡർ സെറ്റ് ചെയ്യുക',
        gujarati: 'રિમાઇન્ડર સેટ કરો',
        punjabi: 'ਰਿਮਾਈਂਡਰ ਸੈੱਟ ਕਰੋ',
        urdu: 'یاد دہانی سیٹ کریں',
        odia: 'ରିମାଇଣ୍ଡର ସେଟ କରନ୍ତୁ',
        assamese: 'ৰিমাইণ্ডাৰ ছেট কৰক',
        spanish: 'Establecer Recordatorio',
        french: 'Définir un Rappel',
        german: 'Erinnerung Setzen',
        arabic: 'تعيين تذكير',
        chinese: '设置提醒',
        japanese: 'リマインダーを設定',
        russian: 'Установить напоминание',
        portuguese: 'Definir Lembrete'
      },
      sync_records: {
        english: 'Sync Records',
        hindi: 'रिकॉर्ड सिंक करें',
        bengali: 'রেকর্ড সিঙ্ক করুন',
        telugu: 'రికార్డులను సింక్ చేయండి',
        tamil: 'பதிவுகளை ஒத்திசைக்கவும்',
        marathi: 'रेकॉर्ड सिंक करा',
        kannada: 'ರೆಕಾರ್ಡ್‌ಗಳನ್ನು ಸಿಂಕ್ ಮಾಡಿ',
        malayalam: 'റെക്കോർഡുകൾ സിങ്ക് ചെയ്യുക',
        gujarati: 'રેકોર્ડ સિંક કરો',
        punjabi: 'ਰਿਕਾਰਡ ਸਿੰਕ ਕਰੋ',
        urdu: 'ریکارڈ سنک کریں',
        odia: 'ରେକର୍ଡ ସିଙ୍କ କରନ୍ତୁ',
        assamese: 'ৰেকৰ্ড চিংক কৰক',
        spanish: 'Sincronizar Registros',
        french: 'Synchroniser les Dossiers',
        german: 'Aufzeichnungen Synchronisieren',
        arabic: 'مزامنة السجلات',
        chinese: '同步记录',
        japanese: '記録を同期',
        russian: 'Синхронизировать записи',
        portuguese: 'Sincronizar Registros'
      },
      health_alerts: {
        english: 'Health Alerts',
        hindi: 'स्वास्थ्य अलर्ट',
        bengali: 'স্বাস্থ্য সতর্কতা',
        telugu: 'ఆరోగ్య హెచ్చరికలు',
        tamil: 'சுகாதார எச்சரிக்கைகள்',
        marathi: 'आरोग्य सूचना',
        kannada: 'ಆರೋಗ್ಯ ಎಚ್ಚರಿಕೆಗಳು',
        malayalam: 'ആരോഗ്യ മുന്നറിയിപ്പുകൾ',
        gujarati: 'આરોગ્ય ચેતવણીઓ',
        punjabi: 'ਸਿਹਤ ਚੇਤਾਵਨੀਆਂ',
        urdu: 'صحت کے انتباہات',
        odia: 'ସ୍ୱାସ୍ଥ୍ୟ ସତର୍କତା',
        assamese: 'স্বাস্থ্য সতৰ্কবাণী',
        spanish: 'Alertas de Salud',
        french: 'Alertes Santé',
        german: 'Gesundheitswarnungen',
        arabic: 'تنبيهات صحية',
        chinese: '健康警报',
        japanese: '健康アラート',
        russian: 'Оповещения о здоровье',
        portuguese: 'Alertas de Saúde'
      }
    };

    return labels[action]?.[language] || labels[action]?.['english'] || action;
  };

  // Get multilingual quick action text for sending messages
  const getQuickActionText = (action: string, language: Language): string => {
    const texts: Record<string, Record<Language, string>> = {
      vaccination_status: {
        english: 'Show my vaccination status',
        hindi: 'मेरी टीकाकरण स्थिति दिखाएं',
        bengali: 'আমার টিকাদানের অবস্থা দেখান',
        telugu: 'నా వ్యాక్సినేషన్ స్థితిని చూపించండి',
        tamil: 'எனது தடுப்பூசி நிலையைக் காட்டுங்கள்',
        marathi: 'माझी लसीकरण स्थिती दाखवा',
        kannada: 'ನನ್ನ ವ್ಯಾಕ್ಸಿನೇಷನ್ ಸ್ಥಿತಿಯನ್ನು ತೋರಿಸಿ',
        malayalam: 'എന്റെ വാക്സിനേഷൻ നില കാണിക്കുക',
        gujarati: 'મારી રસીકરણ સ્થિતિ બતાવો',
        punjabi: 'ਮੇਰੀ ਟੀਕਾਕਰਨ ਸਥਿਤੀ ਦਿਖਾਓ',
        urdu: 'میری ویکسینیشن کی صورتحال دکھائیں',
        odia: 'ମୋର ଟିକାକରଣ ସ୍ଥିତି ଦେଖାନ୍ତୁ',
        assamese: 'মোৰ টিকাকৰণৰ অৱস্থা দেখুৱাওক',
        spanish: 'Mostrar mi estado de vacunación',
        french: 'Afficher mon statut de vaccination',
        german: 'Zeige meinen Impfstatus',
        arabic: 'أظهر حالة التطعيم الخاصة بي',
        chinese: '显示我的疫苗接种状态',
        japanese: '私のワクチン接種状況を表示',
        russian: 'Показать мой статус вакцинации',
        portuguese: 'Mostrar meu status de vacinação'
      },
      set_reminder: {
        english: 'Schedule a vaccination reminder',
        hindi: 'टीकाकरण रिमाइंडर शेड्यूल करें',
        bengali: 'একটি টিকাদান রিমাইন্ডার নির্ধারণ করুন',
        telugu: 'వ్యాక్సినేషన్ రిమైండర్‌ను షెడ్యూల్ చేయండి',
        tamil: 'தடுப்பூசி நினைவூட்டலை திட்டமிடுங்கள்',
        marathi: 'लसीकरण स्मरणपत्र शेड्यूल करा',
        kannada: 'ವ್ಯಾಕ್ಸಿನೇಷನ್ ರಿಮೈಂಡರ್ ಅನ್ನು ಶೆಡ್ಯೂಲ್ ಮಾಡಿ',
        malayalam: 'വാക്സിനേഷൻ റിമൈൻഡർ ഷെഡ്യൂൾ ചെയ്യുക',
        gujarati: 'રસીકરણ રિમાઇન્ડર શેડ્યૂલ કરો',
        punjabi: 'ਟੀਕਾਕਰਨ ਰਿਮਾਈਂਡਰ ਸ਼ੈਡਿਊਲ ਕਰੋ',
        urdu: 'ویکسینیشن ریمائنڈر شیڈول کریں',
        odia: 'ଟିକାକରଣ ରିମାଇଣ୍ଡର ସିଡ୍ୟୁଲ କରନ୍ତୁ',
        assamese: 'টিকাকৰণ ৰিমাইণ্ডাৰ সূচী কৰক',
        spanish: 'Programar recordatorio de vacunación',
        french: 'Programmer un rappel de vaccination',
        german: 'Impferinnerung planen',
        arabic: 'جدولة تذكير التطعيم',
        chinese: '安排疫苗接种提醒',
        japanese: 'ワクチン接種のリマインダーをスケジュール',
        russian: 'Запланировать напоминание о вакцинации',
        portuguese: 'Agendar lembrete de vacinação'
      },
      sync_records: {
        english: 'Sync with government health records',
        hindi: 'सरकारी स्वास्थ्य रिकॉर्ड के साथ सिंक करें',
        bengali: 'সরকারি স্বাস্থ্য রেকর্ডের সাথে সিঙ্ক করুন',
        telugu: 'ప్రభుత్వ ఆరోగ్య రికార్డులతో సింక్ చేయండి',
        tamil: 'அரசு சுகாதார பதிவுகளுடன் ஒத்திசைக்கவும்',
        marathi: 'सरकारी आरोग्य रेकॉर्डसह सिंक करा',
        kannada: 'ಸರ್ಕಾರಿ ಆರೋಗ್ಯ ದಾಖಲೆಗಳೊಂದಿಗೆ ಸಿಂಕ್ ಮಾಡಿ',
        malayalam: 'സർക്കാർ ആരോഗ്യ രേഖകളുമായി സിങ്ക് ചെയ്യുക',
        gujarati: 'સરકારી આરોગ્ય રેકોર્ડ સાથે સિંક કરો',
        punjabi: 'ਸਰਕਾਰੀ ਸਿਹਤ ਰਿਕਾਰਡਾਂ ਨਾਲ ਸਿੰਕ ਕਰੋ',
        urdu: 'سرکاری صحت کے ریکارڈ کے ساتھ سنک کریں',
        odia: 'ସରକାରୀ ସ୍ୱାସ୍ଥ୍ୟ ରେକର୍ଡ ସହିତ ସିଙ୍କ କରନ୍ତୁ',
        assamese: 'চৰকাৰী স্বাস্থ্য ৰেকৰ্ডৰ সৈতে চিংক কৰক',
        spanish: 'Sincronizar con registros de salud gubernamentales',
        french: 'Synchroniser avec les dossiers de santé gouvernementaux',
        german: 'Mit staatlichen Gesundheitsakten synchronisieren',
        arabic: 'مزامنة مع سجلات الصحة الحكومية',
        chinese: '与政府健康记录同步',
        japanese: '政府の健康記録と同期',
        russian: 'Синхронизировать с государственными медицинскими записями',
        portuguese: 'Sincronizar com registros de saúde governamentais'
      },
      health_alerts: {
        english: 'Show health alerts in my area',
        hindi: 'मेरे क्षेत्र में स्वास्थ्य अलर्ट दिखाएं',
        bengali: 'আমার এলাকায় স্বাস্থ্য সতর্কতা দেখান',
        telugu: 'నా ప్రాంతంలో ఆరోగ్య హెచ్చరికలను చూపించండి',
        tamil: 'எனது பகுதியில் சுகாதார எச்சரிக்கைகளைக் காட்டுங்கள்',
        marathi: 'माझ्या भागात आरोग्य सूचना दाखवा',
        kannada: 'ನನ್ನ ಪ್ರದೇಶದಲ್ಲಿ ಆರೋಗ್ಯ ಎಚ್ಚರಿಕೆಗಳನ್ನು ತೋರಿಸಿ',
        malayalam: 'എന്റെ പ്രദേശത്തെ ആരോഗ്യ മുന്നറിയിപ്പുകൾ കാണിക്കുക',
        gujarati: 'મારા વિસ્તારમાં આરોગ્ય ચેતવણીઓ બતાવો',
        punjabi: 'ਮੇਰੇ ਖੇਤਰ ਵਿੱਚ ਸਿਹਤ ਚੇਤਾਵਨੀਆਂ ਦਿਖਾਓ',
        urdu: 'میرے علاقے میں صحت کے انتباہات دکھائیں',
        odia: 'ମୋ ଅଞ୍ଚଳରେ ସ୍ୱାସ୍ଥ୍ୟ ସତର୍କତା ଦେଖାନ୍ତୁ',
        assamese: 'মোৰ অঞ্চলত স্বাস্থ্য সতৰ্কবাণী দেখুৱাওক',
        spanish: 'Mostrar alertas de salud en mi área',
        french: 'Afficher les alertes santé dans ma région',
        german: 'Gesundheitswarnungen in meiner Gegend anzeigen',
        arabic: 'أظهر التنبيهات الصحية في منطقتي',
        chinese: '显示我所在地区的健康警报',
        japanese: '私の地域の健康アラートを表示',
        russian: 'Показать оповещения о здоровье в моем районе',
        portuguese: 'Mostrar alertas de saúde na minha área'
      }
    };

    return texts[action]?.[language] || texts[action]?.['english'] || `Show ${action}`;
  };

  const handleResponseActions = (actions: any[]) => {
    for (const action of actions) {
      switch (action.type) {
        case 'reminder_created':
          console.log('Vaccination reminder created:', action.data);
          break;
        case 'emergency_alert':
          console.log('Emergency alert triggered:', action.data);
          // In a real app, this might trigger emergency protocols
          break;
        case 'government_sync':
          console.log('Government sync completed:', action.data);
          break;
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  const formatMessage = (message: ChatMessage) => {
    // Format message content for display
    return message.content.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < message.content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  if (isLoading && !session) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Dr.Curecast...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4 rounded-t-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Dr.Curecast</h2>
            <p className="text-sm opacity-90">
              {user ? `Hello, ${user.name}!` : 'Multilingual Healthcare Assistant'}
            </p>
          </div>
          
          {/* Enhanced Language Selector */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <select
                value={currentLanguage}
                onChange={(e) => changeLanguage(e.target.value as Language)}
                className="bg-white/20 text-white rounded-lg px-3 py-2 text-sm font-medium border border-white/30 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 appearance-none pr-8"
                style={{ minWidth: '140px' }}
              >
                {/* Indian Languages */}
                <optgroup label="🇮🇳 Indian Languages" className="text-black font-semibold">
                  <option value="english" className="text-black">🇬🇧 English</option>
                  <option value="hindi" className="text-black">🇮🇳 हिंदी (Hindi)</option>
                  <option value="bengali" className="text-black">🇮🇳 বাংলা (Bengali)</option>
                  <option value="telugu" className="text-black">🇮🇳 తెలుగు (Telugu)</option>
                  <option value="marathi" className="text-black">🇮🇳 मराठी (Marathi)</option>
                  <option value="tamil" className="text-black">🇮🇳 தமிழ் (Tamil)</option>
                  <option value="gujarati" className="text-black">🇮🇳 ગુજરાતી (Gujarati)</option>
                  <option value="kannada" className="text-black">🇮🇳 ಕನ್ನಡ (Kannada)</option>
                  <option value="malayalam" className="text-black">🇮🇳 മലയാളം (Malayalam)</option>
                  <option value="punjabi" className="text-black">🇮🇳 ਪੰਜਾਬੀ (Punjabi)</option>
                  <option value="urdu" className="text-black">🇮🇳 اردو (Urdu)</option>
                  <option value="odia" className="text-black">🇮🇳 ଓଡ଼ିଆ (Odia)</option>
                  <option value="assamese" className="text-black">🇮🇳 অসমীয়া (Assamese)</option>
                </optgroup>
                
                {/* International Languages */}
                <optgroup label="🌍 International Languages" className="text-black font-semibold">
                  <option value="spanish" className="text-black">🇪🇸 Español (Spanish)</option>
                  <option value="french" className="text-black">🇫🇷 Français (French)</option>
                  <option value="german" className="text-black">🇩🇪 Deutsch (German)</option>
                  <option value="arabic" className="text-black">🇸🇦 العربية (Arabic)</option>
                  <option value="chinese" className="text-black">🇨🇳 中文 (Chinese)</option>
                  <option value="japanese" className="text-black">🇯🇵 日本語 (Japanese)</option>
                  <option value="russian" className="text-black">🇷🇺 Русский (Russian)</option>
                  <option value="portuguese" className="text-black">🇵🇹 Português (Portuguese)</option>
                </optgroup>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {supportedFeatures.voice && (
              <button
                onClick={isListening ? stopVoiceInput : startVoiceInput}
                className={`p-2 rounded-full transition-colors ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-white/20 hover:bg-white/30'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? '🔴' : '🎤'}
              </button>
            )}
          </div>
        </div>

        {/* Feature Status */}
        <div className="flex space-x-4 mt-2 text-xs">
          <span className={`px-2 py-1 rounded ${supportedFeatures.voice ? 'bg-green-500' : 'bg-gray-500'}`}>
            Voice: {supportedFeatures.voice ? 'ON' : 'OFF'}
          </span>
          <span className={`px-2 py-1 rounded ${supportedFeatures.governmentSync ? 'bg-green-500' : 'bg-yellow-500'}`}>
            Gov Sync: {supportedFeatures.governmentSync ? 'Connected' : 'Limited'}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mx-4 mt-4 rounded">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="text-sm">
                {formatMessage(message)}
              </div>
              <div className="text-xs opacity-70 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-pulse">Dr.Curecast is typing...</div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Type your message in ${languageService.getLanguageDisplayName(currentLanguage)}...`}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || isListening}
          />
          
          <button
            onClick={() => sendMessage(inputText)}
            disabled={isLoading || !inputText.trim() || isListening}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        
        {isListening && (
          <div className="mt-2 text-center">
            <div className="inline-flex items-center space-x-2 text-red-600">
              <div className="animate-pulse">🔴</div>
              <span>Listening... Speak now</span>
            </div>
          </div>
        )}
      </div>

      {/* Multilingual Quick Actions */}
      <div className="border-t bg-gray-50 p-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => sendMessage(getQuickActionText('vaccination_status', currentLanguage))}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
          >
            💉 {getQuickActionLabel('vaccination_status', currentLanguage)}
          </button>
          <button
            onClick={() => sendMessage(getQuickActionText('set_reminder', currentLanguage))}
            className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors"
          >
            ⏰ {getQuickActionLabel('set_reminder', currentLanguage)}
          </button>
          <button
            onClick={() => sendMessage(getQuickActionText('sync_records', currentLanguage))}
            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition-colors"
          >
            🔄 {getQuickActionLabel('sync_records', currentLanguage)}
          </button>
          <button
            onClick={() => sendMessage(getQuickActionText('health_alerts', currentLanguage))}
            className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm hover:bg-orange-200 transition-colors"
          >
            ⚠️ {getQuickActionLabel('health_alerts', currentLanguage)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrCurecastChat;
