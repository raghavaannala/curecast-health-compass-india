import React, { useState, useEffect } from 'react';
import { userProfileService } from '../services/userProfileService';
import { drCurecastService } from '../services/drCurecastService';
import { Language } from '../types';

interface DrCurecastDemoProps {
  onUserCreated?: (userId: string) => void;
}

const DrCurecastDemo: React.FC<DrCurecastDemoProps> = ({ onUserCreated }) => {
  const [step, setStep] = useState<'setup' | 'chat'>('setup');
  const [userId, setUserId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    preferredLanguages: ['english'] as Language[],
    voiceEnabled: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleCreateUser = async () => {
    if (!formData.name || !formData.age) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const user = await userProfileService.createUserProfile({
        name: formData.name,
        age: parseInt(formData.age),
        preferredLanguages: formData.preferredLanguages
      });

      setUserId(user.id);
      onUserCreated?.(user.id);
      setStep('chat');
    } catch (error) {
      setError('Failed to create user profile. Please try again.');
      console.error('User creation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = (language: Language, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        preferredLanguages: [...prev.preferredLanguages, language]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        preferredLanguages: prev.preferredLanguages.filter(lang => lang !== language)
      }));
    }
  };

  const supportedLanguages: Language[] = [
    'english', 'hindi', 'telugu', 'tamil', 'bengali', 'marathi',
    'kannada', 'malayalam', 'gujarati', 'punjabi', 'urdu',
    'spanish', 'french', 'german', 'arabic', 'chinese'
  ];

  const getLanguageDisplayName = (lang: Language): string => {
    const names: Record<Language, string> = {
      english: 'English', hindi: 'हिंदी', telugu: 'తెలుగు', tamil: 'தமிழ்',
      bengali: 'বাংলা', marathi: 'मराठी', kannada: 'ಕನ್ನಡ', malayalam: 'മലയാളം',
      gujarati: 'ગુજરાતી', punjabi: 'ਪੰਜਾਬੀ', urdu: 'اردو', odia: 'ଓଡ଼ିଆ',
      assamese: 'অসমীয়া', spanish: 'Español', french: 'Français', german: 'Deutsch',
      arabic: 'العربية', chinese: '中文', japanese: '日本語', russian: 'Русский',
      portuguese: 'Português'
    };
    return names[lang] || lang;
  };

  if (step === 'chat') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-3xl font-bold text-center text-blue-600 mb-2">
              Dr.Curecast Demo
            </h1>
            <p className="text-center text-gray-600 mb-4">
              Multilingual Healthcare Chatbot & Voice Assistant
            </p>
            <div className="text-center">
              <button
                onClick={() => setStep('setup')}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                ← Back to Setup
              </button>
            </div>
          </div>

          {/* Chat Interface Placeholder */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Dr.Curecast is Ready!
              </h2>
              <p className="text-gray-600 mb-6">
                User ID: <code className="bg-gray-100 px-2 py-1 rounded">{userId}</code>
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
                <h3 className="font-semibold text-blue-800 mb-2">Available Features:</h3>
                <ul className="text-left text-blue-700 space-y-1">
                  <li>• Multilingual chat support ({formData.preferredLanguages.length} languages)</li>
                  <li>• Voice interaction {formData.voiceEnabled ? '✅ Enabled' : '❌ Disabled'}</li>
                  <li>• Vaccination reminders and scheduling</li>
                  <li>• Government health database integration</li>
                  <li>• Emergency health assistance</li>
                </ul>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                The chat component would be integrated here in a full implementation.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🏥</div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">
              Welcome to Dr.Curecast
            </h1>
            <p className="text-gray-600">
              Your Multilingual Healthcare Assistant
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age *
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your age"
                min="1"
                max="120"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Preferred Languages (Select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                {supportedLanguages.map(lang => (
                  <label key={lang} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.preferredLanguages.includes(lang)}
                      onChange={(e) => handleLanguageChange(lang, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {getLanguageDisplayName(lang)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.voiceEnabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, voiceEnabled: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Enable voice interaction (requires microphone access)
                </span>
              </label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Privacy Notice</h3>
              <p className="text-sm text-blue-700">
                Your health data will be encrypted and stored securely. You can delete your data at any time. 
                Government database sync requires separate consent.
              </p>
            </div>

            <button
              onClick={handleCreateUser}
              disabled={isLoading || !formData.name || !formData.age}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating Profile...</span>
                </div>
              ) : (
                'Start Using Dr.Curecast'
              )}
            </button>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              By continuing, you agree to our privacy policy and terms of service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrCurecastDemo;
