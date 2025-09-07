import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare, Volume2, VolumeX, Globe, Users, Heart, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { whatsappService } from '../services/whatsappService';
import { smsService } from '../services/smsService';
import { nlpService } from '../services/nlpService';
import { preventiveHealthcareService } from '../services/preventiveHealthcareService';
import { outbreakAlertService } from '../services/outbreakAlertService';

interface RuralHealthInterfaceProps {
  language: string;
  onLanguageChange: (language: string) => void;
}

/**
 * Rural-friendly interface for healthcare access
 * Optimized for low-literacy users with voice and visual aids
 */
export const RuralHealthInterface: React.FC<RuralHealthInterfaceProps> = ({
  language,
  onLanguageChange
}) => {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [currentTip, setCurrentTip] = useState<any>(null);
  const [activeOutbreaks, setActiveOutbreaks] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<string>('');

  useEffect(() => {
    loadDailyTip();
    loadActiveOutbreaks();
    getUserLocation();
  }, [language]);

  const loadDailyTip = async () => {
    const tip = preventiveHealthcareService.getDailyHealthTip(language);
    setCurrentTip(tip);
  };

  const loadActiveOutbreaks = () => {
    const outbreaks = outbreakAlertService.getActiveOutbreaks();
    setActiveOutbreaks(outbreaks.slice(0, 3)); // Show top 3
  };

  const getUserLocation = () => {
    // Mock location - in production, use geolocation API
    setUserLocation('Rural Maharashtra');
  };

  const handleVoiceToggle = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
    if (!isVoiceEnabled) {
      speakText(getWelcomeMessage());
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window && isVoiceEnabled) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.8; // Slower for rural users
      speechSynthesis.speak(utterance);
    }
  };

  const getWelcomeMessage = () => {
    return language === 'hi'
      ? 'नमस्ते! डॉ.क्योरकास्ट में आपका स्वागत है। मैं आपकी स्वास्थ्य संबंधी सहायता के लिए यहां हूं।'
      : 'Hello! Welcome to Dr.CureCast. I am here to help you with your health needs.';
  };

  const handleQuickAction = async (action: string) => {
    const actionText = getActionText(action);
    if (isVoiceEnabled) {
      speakText(actionText);
    }

    switch (action) {
      case 'emergency':
        handleEmergency();
        break;
      case 'symptoms':
        handleSymptomCheck();
        break;
      case 'vaccination':
        handleVaccination();
        break;
      case 'education':
        handleHealthEducation();
        break;
    }
  };

  const getActionText = (action: string) => {
    const texts = {
      hi: {
        emergency: 'आपातकाल के लिए 108 डायल करें। नजदीकी अस्पताल की जानकारी भेजी जा रही है।',
        symptoms: 'अपने लक्षण बताएं। मैं आपकी सहायता करूंगा।',
        vaccination: 'टीकाकरण की जानकारी और अनुसूची देखी जा रही है।',
        education: 'आज का स्वास्थ्य सुझाव तैयार किया जा रहा है।'
      },
      en: {
        emergency: 'For emergency, dial 108. Sending nearby hospital information.',
        symptoms: 'Please describe your symptoms. I will help you.',
        vaccination: 'Checking vaccination information and schedule.',
        education: 'Preparing today\'s health tip for you.'
      }
    };

    return texts[language as keyof typeof texts]?.[action as keyof typeof texts.en] || '';
  };

  const handleEmergency = () => {
    // Show emergency contacts and nearby facilities
    console.log('Emergency action triggered');
  };

  const handleSymptomCheck = () => {
    // Open symptom checker interface
    console.log('Symptom check triggered');
  };

  const handleVaccination = () => {
    // Show vaccination schedule
    console.log('Vaccination info triggered');
  };

  const handleHealthEducation = () => {
    // Show health education content
    console.log('Health education triggered');
  };

  const quickActions = [
    {
      id: 'emergency',
      icon: Phone,
      title: language === 'hi' ? 'आपातकाल' : 'Emergency',
      subtitle: language === 'hi' ? '108 कॉल करें' : 'Call 108',
      color: 'bg-red-500 hover:bg-red-600',
      textColor: 'text-white'
    },
    {
      id: 'symptoms',
      icon: Heart,
      title: language === 'hi' ? 'लक्षण जांच' : 'Check Symptoms',
      subtitle: language === 'hi' ? 'लक्षण बताएं' : 'Describe symptoms',
      color: 'bg-blue-500 hover:bg-blue-600',
      textColor: 'text-white'
    },
    {
      id: 'vaccination',
      icon: Shield,
      title: language === 'hi' ? 'टीकाकरण' : 'Vaccination',
      subtitle: language === 'hi' ? 'टीके की जानकारी' : 'Vaccine info',
      color: 'bg-green-500 hover:bg-green-600',
      textColor: 'text-white'
    },
    {
      id: 'education',
      icon: Users,
      title: language === 'hi' ? 'स्वास्थ्य शिक्षा' : 'Health Education',
      subtitle: language === 'hi' ? 'स्वास्थ्य सुझाव' : 'Health tips',
      color: 'bg-purple-500 hover:bg-purple-600',
      textColor: 'text-white'
    }
  ];

  const languages = [
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-800">
                    {language === 'hi' ? 'डॉ.क्योरकास्ट' : 'Dr.CureCast'}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {language === 'hi' ? 'ग्रामीण स्वास्थ्य सहायक' : 'Rural Health Assistant'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Voice Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVoiceToggle}
                  className={`${isVoiceEnabled ? 'bg-green-100 border-green-300' : 'bg-gray-100'}`}
                >
                  {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>

                {/* Language Selector */}
                <select
                  value={language}
                  onChange={(e) => onLanguageChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map(action => (
            <Card
              key={action.id}
              className={`${action.color} ${action.textColor} cursor-pointer transform hover:scale-105 transition-all duration-200 shadow-lg border-0`}
              onClick={() => handleQuickAction(action.id)}
            >
              <CardContent className="p-6 text-center">
                <action.icon className="w-8 h-8 mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-1">{action.title}</h3>
                <p className="text-sm opacity-90">{action.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Daily Health Tip */}
      {currentTip && (
        <div className="max-w-4xl mx-auto mb-6">
          <Card className="bg-gradient-to-r from-yellow-100 to-orange-100 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-orange-800 flex items-center">
                <span className="text-2xl mr-2">💡</span>
                {language === 'hi' ? 'आज का स्वास्थ्य सुझाव' : 'Today\'s Health Tip'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700 text-base leading-relaxed">{currentTip.tip}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-orange-300 text-orange-700 hover:bg-orange-200"
                onClick={() => isVoiceEnabled && speakText(currentTip.tip)}
              >
                <Volume2 className="w-4 h-4 mr-2" />
                {language === 'hi' ? 'सुनें' : 'Listen'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Outbreaks Alert */}
      {activeOutbreaks.length > 0 && (
        <div className="max-w-4xl mx-auto mb-6">
          <Card className="bg-gradient-to-r from-red-100 to-pink-100 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-red-800 flex items-center">
                <span className="text-2xl mr-2">🚨</span>
                {language === 'hi' ? 'स्वास्थ्य चेतावनी' : 'Health Alert'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeOutbreaks.map(outbreak => (
                <div key={outbreak.id} className="mb-3 last:mb-0">
                  <p className="font-semibold text-red-700">
                    {outbreak.disease} - {outbreak.location.district}
                  </p>
                  <p className="text-red-600 text-sm">{outbreak.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Communication Channels */}
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">
              {language === 'hi' ? 'संपर्क के तरीके' : 'Contact Methods'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* WhatsApp */}
              <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <MessageSquare className="w-8 h-8 text-green-600" />
                <div>
                  <h4 className="font-semibold text-green-800">WhatsApp</h4>
                  <p className="text-sm text-green-600">
                    {language === 'hi' ? '+91-XXXXX-XXXXX पर मैसेज करें' : 'Message +91-XXXXX-XXXXX'}
                  </p>
                </div>
              </div>

              {/* SMS */}
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Phone className="w-8 h-8 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-blue-800">SMS</h4>
                  <p className="text-sm text-blue-600">
                    {language === 'hi' ? 'HEALTH भेजें 12345 पर' : 'Send HEALTH to 12345'}
                  </p>
                </div>
              </div>
            </div>

            {/* Emergency Numbers */}
            <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-800 mb-2">
                {language === 'hi' ? 'आपातकालीन नंबर' : 'Emergency Numbers'}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-red-700">
                  <strong>108</strong> - {language === 'hi' ? 'एम्बुलेंस' : 'Ambulance'}
                </div>
                <div className="text-red-700">
                  <strong>102</strong> - {language === 'hi' ? 'स्वास्थ्य हेल्पलाइन' : 'Health Helpline'}
                </div>
                <div className="text-red-700">
                  <strong>100</strong> - {language === 'hi' ? 'पुलिस' : 'Police'}
                </div>
                <div className="text-red-700">
                  <strong>101</strong> - {language === 'hi' ? 'फायर ब्रिगेड' : 'Fire Brigade'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto mt-6 text-center">
        <p className="text-sm text-gray-600">
          {language === 'hi' 
            ? 'यह सेवा निःशुल्क है। अधिक जानकारी के लिए अपने स्वास्थ्य कार्यकर्ता से मिलें।'
            : 'This service is free. Contact your health worker for more information.'
          }
        </p>
      </div>
    </div>
  );
};

export default RuralHealthInterface;
