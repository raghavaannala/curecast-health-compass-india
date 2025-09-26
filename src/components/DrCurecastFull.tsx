import React, { useState, useEffect } from 'react';
import { drCurecastService } from '../services/drCurecastService';
import { languageService } from '../services/languageService';
import { voiceService } from '../services/voiceService';
import { userProfileService } from '../services/userProfileService';
import { useGlobalLanguage } from '@/contexts/GlobalLanguageContext';
import { Language, ChatMessage, DrCurecastUser } from '../types';

interface DrCurecastFullProps {
  onUserCreated?: (userId: string) => void;
}

const DrCurecastFull: React.FC<DrCurecastFullProps> = ({ onUserCreated }) => {
  const { currentLanguage, t } = useGlobalLanguage();
  const [step, setStep] = useState<'setup' | 'chat'>('setup');
  const [userId, setUserId] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<DrCurecastUser | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('english');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string>('');

  // Available languages for Dr.Curecast
  const availableLanguages: { code: Language; name: string; flag: string }[] = [
    { code: 'english', name: 'English', flag: '🇺🇸' },
    { code: 'hindi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'telugu', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'tamil', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'bengali', name: 'বাংলা', flag: '🇮🇳' },
    { code: 'marathi', name: 'मराठी', flag: '🇮🇳' },
    { code: 'gujarati', name: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'kannada', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'malayalam', name: 'മലയാളം', flag: '🇮🇳' },
    { code: 'punjabi', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'spanish', name: 'Español', flag: '🇪🇸' },
    { code: 'french', name: 'Français', flag: '🇫🇷' },
    { code: 'german', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'arabic', name: 'العربية', flag: '🇸🇦' },
    { code: 'chinese', name: '中文', flag: '🇨🇳' }
  ];

  useEffect(() => {
    // Initialize with welcome message
    if (step === 'chat' && messages.length === 0) {
      initializeChat();
    }
  }, [step]);

  const initializeChat = async () => {
    try {
      const welcomeMessage = await languageService.translateText(
        'Hello! I am Dr.Curecast, your multilingual healthcare assistant. I can help you with health questions, vaccination reminders, and connect you with government health services. How can I assist you today?',
        'english',
        selectedLanguage
      );
      
      setMessages([{
        id: Date.now().toString(),
        content: welcomeMessage,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      }]);
    } catch (error) {
      setMessages([{
        id: Date.now().toString(),
        content: 'Hello! I am Dr.Curecast, your multilingual healthcare assistant. How can I help you today?',
        role: 'assistant',
        timestamp: new Date().toISOString(),
      }]);
    }
  };

  const handleSetup = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Create user profile
      const newUserId = `user_${Date.now()}`;
      const userProfile: DrCurecastUser = {
        id: newUserId,
        name: `Dr.Curecast User`,
        preferredLanguages: [selectedLanguage],
        createdAt: new Date().toISOString(),
        healthProfile: {
          emergencyContacts: []
        },
      };

      await userProfileService.createUserProfile(userProfile);
      setCurrentUser(userProfile);
      setUserId(newUserId);
      setStep('chat');
      
      if (onUserCreated) {
        onUserCreated(newUserId);
      }
    } catch (error) {
      setError('Failed to create user profile. Please try again.');
      console.error('Setup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: currentMessage,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      // Process message through Dr.Curecast service
      const response = await drCurecastService.processUserMessage(
        userId,
        { text: currentMessage }
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.response.content,
        role: 'assistant',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle voice response if enabled
      if (isVoiceEnabled && response.voiceResponse) {
        // Voice synthesis would be implemented here
        console.log('Voice synthesis:', response.response.content);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error('Message processing error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = async () => {
    if (!isVoiceEnabled) return;

    setIsListening(true);
    try {
      const voiceResult = await voiceService.startListening(selectedLanguage);
      if (voiceResult && voiceResult.transcription) {
        setCurrentMessage(voiceResult.transcription);
      }
    } catch (error) {
      console.error('Voice input error:', error);
    } finally {
      setIsListening(false);
    }
  };

  const handleLanguageChange = async (newLanguage: Language) => {
    setSelectedLanguage(newLanguage);
    if (currentUser) {
      await userProfileService.updateLanguagePreferences(userId, [newLanguage]);
    }
  };

  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-blue-600 mb-2">Dr.Curecast</h1>
              <p className="text-gray-600 text-lg">Multilingual Healthcare Assistant</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Your Preferred Language
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setSelectedLanguage(lang.code)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        selectedLanguage === lang.code
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-lg mb-1">{lang.flag}</div>
                      <div>{lang.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="voiceEnabled"
                  checked={isVoiceEnabled}
                  onChange={(e) => setIsVoiceEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="voiceEnabled" className="text-sm font-medium text-gray-700">
                  Enable voice interaction (speak and listen)
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleSetup}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Setting up...' : 'Start Chat with Dr.Curecast'}
              </button>

              <div className="text-xs text-gray-500 text-center">
                By continuing, you agree to our privacy policy and consent to health data processing.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">Dr.Curecast</h1>
                <p className="text-blue-100 text-sm">Healthcare Assistant in {availableLanguages.find(l => l.code === selectedLanguage)?.name}</p>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value as Language)}
                  className="px-3 py-1 rounded bg-blue-500 text-white text-sm border border-blue-400"
                >
                  {availableLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
                {isVoiceEnabled && (
                  <button
                    onClick={handleVoiceInput}
                    disabled={isListening}
                    className={`p-2 rounded-full ${
                      isListening ? 'bg-red-500' : 'bg-blue-500 hover:bg-blue-400'
                    } transition-colors`}
                  >
                    🎤
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm">Dr.Curecast is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Ask Dr.Curecast in ${availableLanguages.find(l => l.code === selectedLanguage)?.name}...`}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !currentMessage.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border-t bg-gray-50 p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCurrentMessage('Show my vaccination schedule')}
                className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200 transition-colors"
              >
                💉 Vaccination Schedule
              </button>
              <button
                onClick={() => setCurrentMessage('Emergency health assistance')}
                className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm hover:bg-red-200 transition-colors"
              >
                🚨 Emergency Help
              </button>
              <button
                onClick={() => setCurrentMessage('Health tips for today')}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
              >
                💡 Health Tips
              </button>
              <button
                onClick={() => setCurrentMessage('Connect to government health services')}
                className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm hover:bg-purple-200 transition-colors"
              >
                🏛️ Gov Services
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrCurecastFull;
