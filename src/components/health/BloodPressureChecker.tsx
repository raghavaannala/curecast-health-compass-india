import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Activity, Heart, Info, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGlobalLanguage } from '@/contexts/GlobalLanguageContext';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@/config/api';
import VoiceInputButton from '@/components/health/VoiceInputButton';
import AIDisclaimer from '@/components/ui/AIDisclaimer';

const BloodPressureChecker: React.FC = () => {
  const { t, currentLanguage, changeLanguage } = useGlobalLanguage();
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [riskLevel, setRiskLevel] = useState<string | null>(null);
  const [lifestyleTips, setLifestyleTips] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize Gemini AI
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!systolic.trim() || !diastolic.trim()) return;
    
    setIsLoading(true);
    setRiskLevel(null);
    setLifestyleTips(null);
    
    try {
      // Basic validation
      const systolicNum = parseInt(systolic);
      const diastolicNum = parseInt(diastolic);
      
      if (isNaN(systolicNum) || isNaN(diastolicNum)) {
        throw new Error('Please enter valid numbers for blood pressure readings.');
      }
      
      // Determine risk level based on standard BP categories
      let risk = '';
      
      if (systolicNum < 90 || diastolicNum < 60) {
        risk = 'Low Blood Pressure';
      } else if (systolicNum < 120 && diastolicNum < 80) {
        risk = 'Normal Blood Pressure';
      } else if ((systolicNum >= 120 && systolicNum <= 129) && diastolicNum < 80) {
        risk = 'Elevated Blood Pressure';
      } else if ((systolicNum >= 130 && systolicNum <= 139) || (diastolicNum >= 80 && diastolicNum <= 89)) {
        risk = 'Stage 1 Hypertension';
      } else if (systolicNum >= 140 || diastolicNum >= 90) {
        risk = 'Stage 2 Hypertension';
      } else if (systolicNum > 180 || diastolicNum > 120) {
        risk = 'Hypertensive Crisis';
      }
      
      setRiskLevel(risk);
      
      // Get lifestyle tips from Gemini
      const languageName = currentLanguage.name;
      const prompt = `You are a helpful medical assistant specializing in cardiovascular health.
      
      A patient has a blood pressure reading of ${systolic}/${diastolic} mm Hg, which is classified as "${risk}".
      
      Please provide your response in ${languageName} language with concise, practical lifestyle tips that would be helpful for someone with this blood pressure level.
      Focus on diet, exercise, and daily habits that could help manage or improve their blood pressure.
      Include culturally appropriate dietary recommendations for ${languageName} speakers.
      
      Keep your response under 250 words and make it easy to understand for someone without medical background.
      
      Respond ONLY in ${languageName}. Do not include any other language in your response.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      setLifestyleTips(text);
      
    } catch (error) {
      console.error('Error processing blood pressure:', error);
      setRiskLevel('Error');
      setLifestyleTips('Sorry, there was an error processing your blood pressure readings. Please try again with valid numbers.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getRiskColor = (risk: string | null) => {
    if (!risk) return 'bg-gray-50';
    
    switch(risk) {
      case 'Low Blood Pressure':
        return 'bg-blue-50';
      case 'Normal Blood Pressure':
        return 'bg-green-50';
      case 'Elevated Blood Pressure':
        return 'bg-yellow-50';
      case 'Stage 1 Hypertension':
        return 'bg-orange-50';
      case 'Stage 2 Hypertension':
        return 'bg-red-50';
      case 'Hypertensive Crisis':
        return 'bg-red-100';
      default:
        return 'bg-gray-50';
    }
  };
  
  const getRiskTextColor = (risk: string | null) => {
    if (!risk) return 'text-gray-800';
    
    switch(risk) {
      case 'Low Blood Pressure':
        return 'text-blue-800';
      case 'Normal Blood Pressure':
        return 'text-green-800';
      case 'Elevated Blood Pressure':
        return 'text-yellow-800';
      case 'Stage 1 Hypertension':
        return 'text-orange-800';
      case 'Stage 2 Hypertension':
        return 'text-red-800';
      case 'Hypertensive Crisis':
        return 'text-red-900';
      default:
        return 'text-gray-800';
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-red-800">{t('bpChecker.title')}</CardTitle>
              <CardDescription>
                {t('bpChecker.subtitle')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-red-600" />
              <Select value={currentLanguage.code} onValueChange={changeLanguage}>
                <SelectTrigger className="w-48">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <span>{currentLanguage.flag}</span>
                      <span>{currentLanguage.nativeName}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">
                    <div className="flex items-center gap-2">
                      <span>🇺🇸</span>
                      <span>English</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="hi">
                    <div className="flex items-center gap-2">
                      <span>🇮🇳</span>
                      <span>हिंदी (Hindi)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="te">
                    <div className="flex items-center gap-2">
                      <span>🇮🇳</span>
                      <span>తెలుగు (Telugu)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ta">
                    <div className="flex items-center gap-2">
                      <span>🇮🇳</span>
                      <span>தமிழ் (Tamil)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="bn">
                    <div className="flex items-center gap-2">
                      <span>🇮🇳</span>
                      <span>বাংলা (Bengali)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="mr">
                    <div className="flex items-center gap-2">
                      <span>🇮🇳</span>
                      <span>मराठी (Marathi)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="gu">
                    <div className="flex items-center gap-2">
                      <span>🇮🇳</span>
                      <span>ગુજરાતી (Gujarati)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="kn">
                    <div className="flex items-center gap-2">
                      <span>🇮🇳</span>
                      <span>ಕನ್ನಡ (Kannada)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ml">
                    <div className="flex items-center gap-2">
                      <span>🇮🇳</span>
                      <span>മലയാളം (Malayalam)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pa">
                    <div className="flex items-center gap-2">
                      <span>🇮🇳</span>
                      <span>ਪੰਜਾਬੀ (Punjabi)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ur">
                    <div className="flex items-center gap-2">
                      <span>🇵🇰</span>
                      <span>اردو (Urdu)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="systolic">Systolic (mm Hg)</Label>
                <Input
                  id="systolic"
                  type="number"
                  placeholder="120"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  className="text-lg"
                  required
                />
                <p className="text-xs text-gray-500">The top number</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="diastolic">Diastolic (mm Hg)</Label>
                <Input
                  id="diastolic"
                  type="number"
                  placeholder="80"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  className="text-lg"
                  required
                />
                <p className="text-xs text-gray-500">The bottom number</p>
              </div>
            </div>
            <div className="flex justify-end">
              <VoiceInputButton 
                onTranscriptReady={(text) => {
                  // Try to extract blood pressure numbers from voice input
                  const bpMatch = text.match(/(\d+)\s*(?:over|\/)\s*(\d+)/i);
                  if (bpMatch) {
                    setSystolic(bpMatch[1]);
                    setDiastolic(bpMatch[2]);
                  }
                }} 
                buttonText="Speak BP Reading"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !systolic.trim() || !diastolic.trim()}
            >
              {isLoading ? 'Analyzing...' : 'Check Blood Pressure'}
            </Button>
          </form>
          
          {/* AI Disclaimer Banner */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              CureCast provides AI-based guidance only. Please consult a doctor for medical decisions.
            </p>
          </div>
          
          {riskLevel && (
            <div className="mt-6 space-y-6">
              <div className={`p-4 rounded-lg ${getRiskColor(riskLevel)}`}>
                <h3 className={`flex items-center gap-2 font-medium ${getRiskTextColor(riskLevel)} mb-2`}>
                  <Activity className="h-5 w-5" />
                  Risk Level: {riskLevel}
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span className="font-medium">Your Reading: {systolic}/{diastolic} mm Hg</span>
                </div>
              </div>
              
              {lifestyleTips && (
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <h3 className="flex items-center gap-2 font-medium text-indigo-800 mb-2">
                    <Info className="h-5 w-5" />
                    Lifestyle Tips
                  </h3>
                  <div className="text-gray-700 whitespace-pre-line">{lifestyleTips}</div>
                </div>
              )}
              
              {/* AI Disclaimer Banner (repeated at results) */}
              <AIDisclaimer variant="default" type="diagnostic" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BloodPressureChecker; 