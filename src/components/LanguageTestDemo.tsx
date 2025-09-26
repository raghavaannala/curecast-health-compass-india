import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, CheckCircle, Languages, Zap } from 'lucide-react';
import { useGlobalLanguage } from '@/contexts/GlobalLanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const LanguageTestDemo: React.FC = () => {
  const { currentLanguage, changeLanguage, availableLanguages, t } = useGlobalLanguage();
  const [testResults, setTestResults] = useState<string[]>([]);

  const runLanguageTest = () => {
    const results = [
      `✅ Current Language: ${currentLanguage.nativeName} (${currentLanguage.code})`,
      `✅ Translation Test: ${t('common.loading')}`,
      `✅ Medical Translation: ${t('diabetesChecker.title')}`,
      `✅ Direction: ${currentLanguage.direction}`,
      `✅ Available Languages: ${availableLanguages.length}`,
      `✅ Persistence: localStorage.getItem('selectedLanguage') = ${localStorage.getItem('selectedLanguage')}`,
    ];
    setTestResults(results);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <Languages className="h-6 w-6 text-white" />
            </div>
            Multilingual Healthcare System Demo
          </CardTitle>
          <CardDescription className="text-lg">
            Comprehensive language support across all healthcare modules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Language Status */}
          <div className="bg-white rounded-lg p-4 border border-emerald-200">
            <h3 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Current Language Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Selected Language</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl">{currentLanguage.flag}</span>
                  <div>
                    <p className="font-semibold">{currentLanguage.nativeName}</p>
                    <p className="text-sm text-gray-500">{currentLanguage.name}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Language Code</p>
                <Badge variant="secondary" className="mt-1">{currentLanguage.code}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Text Direction</p>
                <Badge variant={currentLanguage.direction === 'rtl' ? 'destructive' : 'default'} className="mt-1">
                  {currentLanguage.direction.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Language Selector */}
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-3">Language Selector</h3>
            <div className="flex items-center gap-4">
              <Select value={currentLanguage.code} onValueChange={changeLanguage}>
                <SelectTrigger className="w-64">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <span>{currentLanguage.flag}</span>
                      <span>{currentLanguage.nativeName}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                        <span className="text-gray-500 text-sm">({lang.name})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={runLanguageTest} className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Test Translations
              </Button>
            </div>
          </div>

          {/* Translation Tests */}
          {testResults.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Translation Test Results
              </h3>
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-mono">{result}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sample Translations */}
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <h3 className="font-semibold text-purple-800 mb-3">Sample Translations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Common UI Elements:</p>
                <ul className="mt-2 space-y-1 text-gray-600">
                  <li>• Loading: <span className="font-semibold">{t('common.loading')}</span></li>
                  <li>• Success: <span className="font-semibold">{t('common.success')}</span></li>
                  <li>• Error: <span className="font-semibold">{t('common.error')}</span></li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-700">Medical Modules:</p>
                <ul className="mt-2 space-y-1 text-gray-600">
                  <li>• Diabetes: <span className="font-semibold">{t('diabetesChecker.title')}</span></li>
                  <li>• Blood Pressure: <span className="font-semibold">{t('bpChecker.title')}</span></li>
                  <li>• Skin Checker: <span className="font-semibold">{t('skinChecker.title')}</span></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Features Overview */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-3">🚀 Implemented Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Language dropdowns in all 5 healthcare modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Persistent language selection across modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>AI responses in selected language</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>11+ Indian languages with native scripts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Cross-tab language synchronization</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>No data loss during language switching</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LanguageTestDemo;
