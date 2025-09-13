import React, { useState, useEffect } from 'react';
import { Globe, Volume2, VolumeX, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { textToSpeechService } from '@/services/textToSpeechService';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
}

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (languageCode: string) => void;
  isTextToSpeechEnabled: boolean;
  onTextToSpeechToggle: (enabled: boolean) => void;
  showAccessibilityOptions?: boolean;
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  isTextToSpeechEnabled,
  onTextToSpeechToggle,
  showAccessibilityOptions = true,
  className = ''
}) => {
  const [availableVoices, setAvailableVoices] = useState<number>(0);
  const [isTestingSpeech, setIsTestingSpeech] = useState(false);

  // Comprehensive language list with focus on Indian languages
  const languages: Language[] = [
    // English (Primary)
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    
    // Major Indian Languages
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇮🇳', rtl: true },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
    { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', flag: '🇮🇳' },
    
    // Regional Languages
    { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵' },
    { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', flag: '🇱🇰' },
    { code: 'my', name: 'Myanmar', nativeName: 'မြန်မာ', flag: '🇲🇲' },
    { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
    { code: 'tl', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭' },
    
    // International Languages
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' }
  ];

  const selectedLang = languages.find(lang => lang.code === selectedLanguage) || languages[0];

  useEffect(() => {
    // Check available voices for the selected language
    const voices = textToSpeechService.getVoicesForLanguage(selectedLanguage);
    setAvailableVoices(voices.length);
  }, [selectedLanguage]);

  const handleLanguageSelect = (languageCode: string) => {
    onLanguageChange(languageCode);
    
    // Save to localStorage for persistence
    try {
      localStorage.setItem('preferredLanguage', languageCode);
    } catch (error) {
      console.warn('Unable to save language preference:', error);
    }
  };

  const handleTextToSpeechToggle = () => {
    const newState = !isTextToSpeechEnabled;
    onTextToSpeechToggle(newState);
    
    // Save to localStorage
    try {
      localStorage.setItem('textToSpeechEnabled', newState.toString());
    } catch (error) {
      console.warn('Unable to save TTS preference:', error);
    }
  };

  const testTextToSpeech = async () => {
    if (isTestingSpeech) return;
    
    setIsTestingSpeech(true);
    
    try {
      const testText = selectedLanguage === 'hi' 
        ? 'यह एक परीक्षण संदेश है। डॉ. क्योरकास्ट में आपका स्वागत है।'
        : selectedLanguage === 'bn'
        ? 'এটি একটি পরীক্ষার বার্তা। ডাঃ কিউরকাস্টে আপনাকে স্বাগতম।'
        : selectedLanguage === 'ta'
        ? 'இது ஒரு சோதனை செய்தி. டாக்டர் க்யூர்காஸ்டில் உங்களை வரவேற்கிறோம்.'
        : 'This is a test message. Welcome to Dr. CureCast health alerts.';
      
      await textToSpeechService.speak(testText, selectedLanguage);
    } catch (error) {
      console.error('Text-to-speech test failed:', error);
    } finally {
      setIsTestingSpeech(false);
    }
  };

  // Group languages by region
  const indianLanguages = languages.filter(lang => lang.flag === '🇮🇳');
  const regionalLanguages = languages.filter(lang => 
    ['🇳🇵', '🇱🇰', '🇲🇲', '🇹🇭', '🇻🇳', '🇮🇩', '🇲🇾', '🇵🇭'].includes(lang.flag)
  );
  const internationalLanguages = languages.filter(lang => 
    !['🇮🇳', '🇳🇵', '🇱🇰', '🇲🇲', '🇹🇭', '🇻🇳', '🇮🇩', '🇲🇾', '🇵🇭'].includes(lang.flag)
  );

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Language Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 min-w-[140px] justify-between hover:bg-blue-50 border-blue-200"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedLang.flag}</span>
              <span className="font-medium">{selectedLang.name}</span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-64 max-h-96 overflow-y-auto">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Select Language
          </DropdownMenuLabel>
          
          {/* English First */}
          <DropdownMenuItem
            onClick={() => handleLanguageSelect('en')}
            className={`flex items-center gap-3 ${selectedLanguage === 'en' ? 'bg-blue-50' : ''}`}
          >
            <span className="text-lg">🇺🇸</span>
            <div className="flex-1">
              <div className="font-medium">English</div>
              <div className="text-xs text-gray-500">Primary Language</div>
            </div>
            {selectedLanguage === 'en' && (
              <Badge className="bg-blue-100 text-blue-800">Selected</Badge>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Indian Languages */}
          <DropdownMenuLabel className="text-xs text-gray-500 uppercase tracking-wide">
            Indian Languages
          </DropdownMenuLabel>
          {indianLanguages.slice(1).map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              className={`flex items-center gap-3 ${selectedLanguage === language.code ? 'bg-blue-50' : ''}`}
            >
              <span className="text-lg">{language.flag}</span>
              <div className="flex-1">
                <div className="font-medium">{language.name}</div>
                <div className="text-xs text-gray-500" dir={language.rtl ? 'rtl' : 'ltr'}>
                  {language.nativeName}
                </div>
              </div>
              {selectedLanguage === language.code && (
                <Badge className="bg-blue-100 text-blue-800">Selected</Badge>
              )}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          {/* Regional Languages */}
          <DropdownMenuLabel className="text-xs text-gray-500 uppercase tracking-wide">
            Regional Languages
          </DropdownMenuLabel>
          {regionalLanguages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              className={`flex items-center gap-3 ${selectedLanguage === language.code ? 'bg-blue-50' : ''}`}
            >
              <span className="text-lg">{language.flag}</span>
              <div className="flex-1">
                <div className="font-medium">{language.name}</div>
                <div className="text-xs text-gray-500" dir={language.rtl ? 'rtl' : 'ltr'}>
                  {language.nativeName}
                </div>
              </div>
              {selectedLanguage === language.code && (
                <Badge className="bg-blue-100 text-blue-800">Selected</Badge>
              )}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          {/* International Languages */}
          <DropdownMenuLabel className="text-xs text-gray-500 uppercase tracking-wide">
            International Languages
          </DropdownMenuLabel>
          {internationalLanguages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              className={`flex items-center gap-3 ${selectedLanguage === language.code ? 'bg-blue-50' : ''}`}
            >
              <span className="text-lg">{language.flag}</span>
              <div className="flex-1">
                <div className="font-medium">{language.name}</div>
                <div className="text-xs text-gray-500" dir={language.rtl ? 'rtl' : 'ltr'}>
                  {language.nativeName}
                </div>
              </div>
              {selectedLanguage === language.code && (
                <Badge className="bg-blue-100 text-blue-800">Selected</Badge>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Text-to-Speech Controls */}
      {showAccessibilityOptions && (
        <div className="flex items-center gap-2">
          <Button
            variant={isTextToSpeechEnabled ? "default" : "outline"}
            size="sm"
            onClick={handleTextToSpeechToggle}
            className={`flex items-center gap-2 ${
              isTextToSpeechEnabled 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'border-green-300 text-green-700 hover:bg-green-50'
            }`}
          >
            {isTextToSpeechEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {isTextToSpeechEnabled ? 'Audio On' : 'Audio Off'}
            </span>
          </Button>

          {isTextToSpeechEnabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={testTextToSpeech}
              disabled={isTestingSpeech || availableVoices === 0}
              className="text-blue-600 hover:bg-blue-50"
            >
              {isTestingSpeech ? (
                <Volume2 className="h-4 w-4 animate-pulse" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
              <span className="hidden sm:inline ml-1">Test</span>
            </Button>
          )}
        </div>
      )}

      {/* Voice Availability Indicator */}
      {showAccessibilityOptions && (
        <div className="hidden lg:flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${
            availableVoices > 0 ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-xs text-gray-500">
            {availableVoices > 0 ? `${availableVoices} voice${availableVoices > 1 ? 's' : ''}` : 'No voice'}
          </span>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
