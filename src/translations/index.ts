export interface Translations {
  // Common UI elements
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    close: string;
    back: string;
    next: string;
    submit: string;
    retry: string;
    selectLanguage: string;
  };

  // Header and Navigation
  header: {
    title: string;
    selectLanguage: string;
  };

  // Dr.CureCast Module
  drCurecast: {
    title: string;
    subtitle: string;
    welcome: string;
    startChat: string;
    typeMessage: string;
    sendMessage: string;
    voiceInput: string;
    medicalAssessment: string;
    step: string;
    of: string;
  };

  // Camera Diagnosis Module
  cameraDiagnosis: {
    title: string;
    subtitle: string;
    takePhoto: string;
    uploadPhoto: string;
    analyzing: string;
    results: string;
    confidence: string;
    recommendations: string;
  };

  // Diabetes Symptoms Checker
  diabetesChecker: {
    title: string;
    subtitle: string;
    symptoms: string;
    checkSymptoms: string;
    riskLevel: string;
    low: string;
    medium: string;
    high: string;
    recommendations: string;
  };

  // Blood Pressure Checker
  bpChecker: {
    title: string;
    subtitle: string;
    systolic: string;
    diastolic: string;
    checkBP: string;
    normal: string;
    elevated: string;
    stage1: string;
    stage2: string;
    crisis: string;
  };

  // Skin Disease Checker
  skinChecker: {
    title: string;
    subtitle: string;
    uploadImage: string;
    analyzing: string;
    possibleConditions: string;
    severity: string;
    mild: string;
    moderate: string;
    severe: string;
  };

  // Medical Terms
  medical: {
    symptoms: string;
    diagnosis: string;
    treatment: string;
    medication: string;
    dosage: string;
    sideEffects: string;
    precautions: string;
    consultDoctor: string;
    emergency: string;
  };

  // Chatbot Specific
  chatbot: {
    greeting: string;
    howCanIHelp: string;
    describeSymptoms: string;
    askingQuestions: string;
    generatingPrescription: string;
    disclaimer: string;
  };
}

// English translations (default)
const enTranslations: Translations = {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      submit: 'Submit',
      retry: 'Retry',
      selectLanguage: 'Select Language',
    },
    header: {
      title: 'CureCast Health Compass',
      selectLanguage: 'Select Language',
    },
    drCurecast: {
      title: 'Dr.CureCast',
      subtitle: 'AI-Powered Medical Assistant',
      welcome: 'Hello! I\'m your AI medical assistant. How can I help you today?',
      startChat: 'Start Chat',
      typeMessage: 'Type your message...',
      sendMessage: 'Send Message',
      voiceInput: 'Voice Input',
      medicalAssessment: 'Medical Assessment',
      step: 'Step',
      of: 'of',
    },
    cameraDiagnosis: {
      title: 'Camera Diagnosis',
      subtitle: 'AI-Powered Visual Health Analysis',
      takePhoto: 'Take Photo',
      uploadPhoto: 'Upload Photo',
      analyzing: 'Analyzing image...',
      results: 'Analysis Results',
      confidence: 'Confidence',
      recommendations: 'Recommendations',
    },
    diabetesChecker: {
      title: 'Diabetes Symptoms Checker',
      subtitle: 'Check your diabetes risk',
      symptoms: 'Symptoms',
      checkSymptoms: 'Check Symptoms',
      riskLevel: 'Risk Level',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      recommendations: 'Recommendations',
    },
    bpChecker: {
      title: 'Blood Pressure Checker',
      subtitle: 'Monitor your blood pressure',
      systolic: 'Systolic',
      diastolic: 'Diastolic',
      checkBP: 'Check Blood Pressure',
      normal: 'Normal',
      elevated: 'Elevated',
      stage1: 'Stage 1 Hypertension',
      stage2: 'Stage 2 Hypertension',
      crisis: 'Hypertensive Crisis',
    },
    skinChecker: {
      title: 'Skin Disease Checker',
      subtitle: 'AI-powered skin condition analysis',
      uploadImage: 'Upload Image',
      analyzing: 'Analyzing skin condition...',
      possibleConditions: 'Possible Conditions',
      severity: 'Severity',
      mild: 'Mild',
      moderate: 'Moderate',
      severe: 'Severe',
    },
    medical: {
      symptoms: 'Symptoms',
      diagnosis: 'Diagnosis',
      treatment: 'Treatment',
      medication: 'Medication',
      dosage: 'Dosage',
      sideEffects: 'Side Effects',
      precautions: 'Precautions',
      consultDoctor: 'Consult a Doctor',
      emergency: 'Emergency',
    },
    chatbot: {
      greeting: 'Hello! How can I help you today?',
      howCanIHelp: 'How can I help you?',
      describeSymptoms: 'Please describe your symptoms',
      askingQuestions: 'I\'ll ask you a few questions to better understand your condition',
      generatingPrescription: 'Generating your personalized health recommendations...',
      disclaimer: 'This is an AI-generated assessment for informational purposes only. Always consult a qualified healthcare professional.',
    },
  };

export const translations: Record<string, Translations> = {
  en: enTranslations,
  hi: {
    common: {
      loading: 'लोड हो रहा है...',
      error: 'त्रुटि',
      success: 'सफलता',
      cancel: 'रद्द करें',
      confirm: 'पुष्टि करें',
      save: 'सेव करें',
      close: 'बंद करें',
      back: 'वापस',
      next: 'आगे',
      submit: 'जमा करें',
      retry: 'पुनः प्रयास',
      selectLanguage: 'भाषा चुनें',
    },
    header: {
      title: 'क्योरकास्ट हेल्थ कंपास',
      selectLanguage: 'भाषा चुनें',
    },
    drCurecast: {
      title: 'डॉ.क्योरकास्ट',
      subtitle: 'AI-संचालित चिकित्सा सहायक',
      welcome: 'नमस्ते! मैं आपका AI चिकित्सा सहायक हूं। आज मैं आपकी कैसे मदद कर सकता हूं?',
      startChat: 'चैट शुरू करें',
      typeMessage: 'अपना संदेश टाइप करें...',
      sendMessage: 'संदेश भेजें',
      voiceInput: 'आवाज इनपुट',
      medicalAssessment: 'चिकित्सा मूल्यांकन',
      step: 'चरण',
      of: 'का',
    },
    cameraDiagnosis: {
      title: 'कैमरा निदान',
      subtitle: 'AI-संचालित दृश्य स्वास्थ्य विश्लेषण',
      takePhoto: 'फोटो लें',
      uploadPhoto: 'फोटो अपलोड करें',
      analyzing: 'छवि का विश्लेषण कर रहे हैं...',
      results: 'विश्लेषण परिणाम',
      confidence: 'विश्वास',
      recommendations: 'सिफारिशें',
    },
    diabetesChecker: {
      title: 'मधुमेह लक्षण जांचकर्ता',
      subtitle: 'अपने मधुमेह जोखिम की जांच करें',
      symptoms: 'लक्षण',
      checkSymptoms: 'लक्षणों की जांच करें',
      riskLevel: 'जोखिम स्तर',
      low: 'कम',
      medium: 'मध्यम',
      high: 'उच्च',
      recommendations: 'सिफारिशें',
    },
    bpChecker: {
      title: 'रक्तचाप जांचकर्ता',
      subtitle: 'अपने रक्तचाप की निगरानी करें',
      systolic: 'सिस्टोलिक',
      diastolic: 'डायस्टोलिक',
      checkBP: 'रक्तचाप जांचें',
      normal: 'सामान्य',
      elevated: 'बढ़ा हुआ',
      stage1: 'चरण 1 उच्च रक्तचाप',
      stage2: 'चरण 2 उच्च रक्तचाप',
      crisis: 'उच्च रक्तचाप संकट',
    },
    skinChecker: {
      title: 'त्वचा रोग जांचकर्ता',
      subtitle: 'AI-संचालित त्वचा स्थिति विश्लेषण',
      uploadImage: 'छवि अपलोड करें',
      analyzing: 'त्वचा की स्थिति का विश्लेषण कर रहे हैं...',
      possibleConditions: 'संभावित स्थितियां',
      severity: 'गंभीरता',
      mild: 'हल्का',
      moderate: 'मध्यम',
      severe: 'गंभीर',
    },
    medical: {
      symptoms: 'लक्षण',
      diagnosis: 'निदान',
      treatment: 'उपचार',
      medication: 'दवा',
      dosage: 'खुराक',
      sideEffects: 'साइड इफेक्ट्स',
      precautions: 'सावधानियां',
      consultDoctor: 'डॉक्टर से सलाह लें',
      emergency: 'आपातकाल',
    },
    chatbot: {
      greeting: 'नमस्ते! आज मैं आपकी कैसे मदद कर सकता हूं?',
      howCanIHelp: 'मैं आपकी कैसे मदद कर सकता हूं?',
      describeSymptoms: 'कृपया अपने लक्षणों का वर्णन करें',
      askingQuestions: 'मैं आपकी स्थिति को बेहतर समझने के लिए कुछ प्रश्न पूछूंगा',
      generatingPrescription: 'आपकी व्यक्तिगत स्वास्थ्य सिफारिशें तैयार कर रहे हैं...',
      disclaimer: 'यह केवल जानकारी के लिए AI-जनित मूल्यांकन है। हमेशा योग्य स्वास्थ्य पेशेवर से सलाह लें।',
    },
  },

  // Telugu translations
  te: {
    common: {
      loading: 'లోడ్ అవుతోంది...',
      error: 'లోపం',
      success: 'విజయం',
      cancel: 'రద్దు చేయండి',
      confirm: 'నిర్ధారించండి',
      save: 'సేవ్ చేయండి',
      close: 'మూసివేయండి',
      back: 'వెనుకకు',
      next: 'తదుపరి',
      submit: 'సమర్పించండి',
      retry: 'మళ్లీ ప్రయత్నించండి',
      selectLanguage: 'భాష ఎంచుకోండి',
    },
    header: {
      title: 'క్యూర్‌కాస్ట్ హెల్త్ కంపాస్',
      selectLanguage: 'భాష ఎంచుకోండి',
    },
    drCurecast: {
      title: 'డాక్టర్.క్యూర్‌కాస్ట్',
      subtitle: 'AI-శక్తితో కూడిన వైద్య సహాయకుడు',
      welcome: 'నమస్కారం! నేను మీ AI వైద్య సహాయకుడిని. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?',
      startChat: 'చాట్ ప్రారంభించండి',
      typeMessage: 'మీ సందేశాన్ని టైప్ చేయండి...',
      sendMessage: 'సందేశం పంపండి',
      voiceInput: 'వాయిస్ ఇన్‌పుట్',
      medicalAssessment: 'వైద్య మూల్యాంకనం',
      step: 'దశ',
      of: 'యొక్క',
    },
    cameraDiagnosis: {
      title: 'కెమెరా నిర్ధారణ',
      subtitle: 'AI-శక్తితో కూడిన దృశ్య ఆరోగ్య విశ్లేషణ',
      takePhoto: 'ఫోటో తీయండి',
      uploadPhoto: 'ఫోటో అప్‌లోడ్ చేయండి',
      analyzing: 'చిత్రాన్ని విశ్లేషిస్తోంది...',
      results: 'విశ్లేషణ ఫలితాలు',
      confidence: 'విశ్వాసం',
      recommendations: 'సిఫార్సులు',
    },
    diabetesChecker: {
      title: 'మధుమేహ లక్షణాల తనిఖీదారు',
      subtitle: 'మీ మధుమేహ ప్రమాదాన్ని తనిఖీ చేయండి',
      symptoms: 'లక్షణాలు',
      checkSymptoms: 'లక్షణాలను తనిఖీ చేయండి',
      riskLevel: 'ప్రమాద స్థాయి',
      low: 'తక్కువ',
      medium: 'మధ్యస్థ',
      high: 'అధిక',
      recommendations: 'సిఫార్సులు',
    },
    bpChecker: {
      title: 'రక్తపోటు తనిఖీదారు',
      subtitle: 'మీ రక్తపోటును పర్యవేక్షించండి',
      systolic: 'సిస్టోలిక్',
      diastolic: 'డయాస్టోలిక్',
      checkBP: 'రక్తపోటు తనిఖీ చేయండి',
      normal: 'సాధారణ',
      elevated: 'పెరిగిన',
      stage1: 'దశ 1 అధిక రక్తపోటు',
      stage2: 'దశ 2 అధిక రక్తపోటు',
      crisis: 'అధిక రక్తపోటు సంక్షోభం',
    },
    skinChecker: {
      title: 'చర్మ వ్యాధి తనిఖీదారు',
      subtitle: 'AI-శక్తితో కూడిన చర్మ పరిస్థితి విశ్లేషణ',
      uploadImage: 'చిత్రం అప్‌లోడ్ చేయండి',
      analyzing: 'చర్మ పరిస్థితిని విశ్లేషిస్తోంది...',
      possibleConditions: 'సాధ్యమైన పరిస్థితులు',
      severity: 'తీవ్రత',
      mild: 'తేలిక',
      moderate: 'మధ్యస్థ',
      severe: 'తీవ్రమైన',
    },
    medical: {
      symptoms: 'లక్షణాలు',
      diagnosis: 'నిర్ధారణ',
      treatment: 'చికిత్స',
      medication: 'మందు',
      dosage: 'మోతాదు',
      sideEffects: 'దుష్ప్రభావాలు',
      precautions: 'జాగ్రత్తలు',
      consultDoctor: 'వైద్యుడిని సంప్రదించండి',
      emergency: 'అత్యవసరం',
    },
    chatbot: {
      greeting: 'నమస్కారం! ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?',
      howCanIHelp: 'నేను మీకు ఎలా సహాయం చేయగలను?',
      describeSymptoms: 'దయచేసి మీ లక్షణాలను వివరించండి',
      askingQuestions: 'మీ పరిస్థితిని బాగా అర్థం చేసుకోవడానికి నేను కొన్ని ప్రశ్నలు అడుగుతాను',
      generatingPrescription: 'మీ వ్యక్తిగత ఆరోగ్య సిఫార్సులను రూపొందిస్తోంది...',
      disclaimer: 'ఇది కేవలం సమాచార ప్రయోజనాల కోసం AI-రూపొందించిన మూల్యాంకనం. ఎల్లప్పుడూ అర్హత కలిగిన ఆరోగ్య నిపుణుడిని సంప్రదించండి.',
    },
  },

  // Tamil translations
  ta: {
    common: {
      loading: 'ஏற்றுகிறது...',
      error: 'பிழை',
      success: 'வெற்றி',
      cancel: 'ரத்து செய்',
      confirm: 'உறுதிப்படுத்து',
      save: 'சேமி',
      close: 'மூடு',
      back: 'பின்',
      next: 'அடுத்து',
      submit: 'சமர்ப்பி',
      retry: 'மீண்டும் முயற்சி',
      selectLanguage: 'மொழியைத் தேர்ந்தெடு',
    },
    header: {
      title: 'க்யூர்காஸ்ட் ஹெல்த் கம்பாஸ்',
      selectLanguage: 'மொழியைத் தேர்ந்தெடு',
    },
    drCurecast: {
      title: 'டாக்டர்.க்யூர்காஸ்ட்',
      subtitle: 'AI-இயங்கும் மருத்துவ உதவியாளர்',
      welcome: 'வணக்கம்! நான் உங்கள் AI மருத்துவ உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?',
      startChat: 'அரட்டை தொடங்கு',
      typeMessage: 'உங்கள் செய்தியை தட்டச்சு செய்யுங்கள்...',
      sendMessage: 'செய்தி அனுப்பு',
      voiceInput: 'குரல் உள்ளீடு',
      medicalAssessment: 'மருத்துவ மதிப்பீடு',
      step: 'படி',
      of: 'இன்',
    },
    cameraDiagnosis: {
      title: 'கேமரா நோய் கண்டறிதல்',
      subtitle: 'AI-இயங்கும் காட்சி சுகாதார பகுப்பாய்வு',
      takePhoto: 'புகைப்படம் எடு',
      uploadPhoto: 'புகைப்படம் பதிவேற்று',
      analyzing: 'படத்தை பகுப்பாய்வு செய்கிறது...',
      results: 'பகுப்பாய்வு முடிவுகள்',
      confidence: 'நம்பிக்கை',
      recommendations: 'பரிந்துரைகள்',
    },
    diabetesChecker: {
      title: 'நீரிழிவு அறிகுறி சரிபார்ப்பாளர்',
      subtitle: 'உங்கள் நீரிழிவு ஆபத்தை சரிபார்க்கவும்',
      symptoms: 'அறிகுறிகள்',
      checkSymptoms: 'அறிகுறிகளை சரிபார்க்கவும்',
      riskLevel: 'ஆபத்து நிலை',
      low: 'குறைவு',
      medium: 'நடுத்தர',
      high: 'அதிக',
      recommendations: 'பரிந்துரைகள்',
    },
    bpChecker: {
      title: 'இரத்த அழுத்த சரிபார்ப்பாளர்',
      subtitle: 'உங்கள் இரத்த அழுத்தத்தை கண்காணிக்கவும்',
      systolic: 'சிஸ்டோலிக்',
      diastolic: 'டயாஸ்டோலிக்',
      checkBP: 'இரத்த அழுத்தத்தை சரிபார்க்கவும்',
      normal: 'சாதாரண',
      elevated: 'உயர்ந்த',
      stage1: 'நிலை 1 உயர் இரத்த அழுத்தம்',
      stage2: 'நிலை 2 உயர் இரத்த அழுத்தம்',
      crisis: 'உயர் இரத்த அழுத்த நெருக்கடி',
    },
    skinChecker: {
      title: 'தோல் நோய் சரிபார்ப்பாளர்',
      subtitle: 'AI-இயங்கும் தோல் நிலை பகுப்பாய்வு',
      uploadImage: 'படத்தை பதிவேற்று',
      analyzing: 'தோல் நிலையை பகுப்பாய்வு செய்கிறது...',
      possibleConditions: 'சாத்தியமான நிலைமைகள்',
      severity: 'தீவிரம்',
      mild: 'லேசான',
      moderate: 'நடுத்தர',
      severe: 'கடுமையான',
    },
    medical: {
      symptoms: 'அறிகுறிகள்',
      diagnosis: 'நோய் கண்டறிதல்',
      treatment: 'சிகிச்சை',
      medication: 'மருந்து',
      dosage: 'அளவு',
      sideEffects: 'பக்க விளைவுகள்',
      precautions: 'முன்னெச்சரிக்கைகள்',
      consultDoctor: 'மருத்துவரை அணுகவும்',
      emergency: 'அவசரநிலை',
    },
    chatbot: {
      greeting: 'வணக்கம்! இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?',
      howCanIHelp: 'நான் உங்களுக்கு எப்படி உதவ முடியும்?',
      describeSymptoms: 'தயவுசெய்து உங்கள் அறிகுறிகளை விவரிக்கவும்',
      askingQuestions: 'உங்கள் நிலையை நன்கு புரிந்துகொள்ள நான் சில கேள்விகள் கேட்கிறேன்',
      generatingPrescription: 'உங்கள் தனிப்பட்ட சுகாதார பரிந்துரைகளை உருவாக்குகிறது...',
      disclaimer: 'இது தகவல் நோக்கங்களுக்காக மட்டுமே AI-உருவாக்கிய மதிப்பீடு. எப்போதும் தகுதிவாய்ந்த சுகாதார நிபுணரை அணுகவும்.',
    },
  },
  
  // Additional languages using English as fallback for now
  bn: { ...enTranslations },
  mr: { ...enTranslations },
  gu: { ...enTranslations },
  kn: { ...enTranslations },
  ml: { ...enTranslations },
  pa: { ...enTranslations },
  ur: { ...enTranslations }
};

export const getTranslation = (language: string): Translations => {
  return translations[language] || translations.en;
};
