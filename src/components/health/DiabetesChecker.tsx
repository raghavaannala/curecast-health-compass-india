import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Sparkles, Info, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGlobalLanguage } from '@/contexts/GlobalLanguageContext';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@/config/api';
import VoiceInputButton from '@/components/health/VoiceInputButton';
import AIDisclaimer from '@/components/ui/AIDisclaimer';

const DiabetesChecker: React.FC = () => {
  const { t, currentLanguage, changeLanguage } = useGlobalLanguage();
  const [symptoms, setSymptoms] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [dietRecommendations, setDietRecommendations] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize Gemini AI
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) return;
    
    setIsLoading(true);
    setResult(null);
    setDietRecommendations(null);
    
    try {
      // Process with Gemini AI
      const languageName = currentLanguage.name;
      const prompt = `You are a helpful medical assistant specializing in diabetes. 
      A patient has described the following symptoms: "${symptoms}".
      
      Please analyze if these symptoms might be related to diabetes and provide your response in ${languageName} language.
      
      Format your response in two clearly separated sections:
      1. ASSESSMENT: A brief analysis of the symptoms and their possible relation to diabetes
      2. DIET_RECOMMENDATIONS: Specific dietary recommendations that would be helpful, including culturally appropriate foods for ${languageName} speakers
      
      Keep each section concise and informative. Use simple language that's easy to understand.
      Include traditional foods and dietary practices common in ${languageName} culture where appropriate.
      
      Respond ONLY in ${languageName}. Do not include any other language in your response.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the response to separate assessment and diet recommendations
      const assessmentMatch = text.match(/ASSESSMENT:(.*?)(?=DIET_RECOMMENDATIONS:|$)/s);
      const dietMatch = text.match(/DIET_RECOMMENDATIONS:(.*?)$/s);
      
      if (assessmentMatch && assessmentMatch[1]) {
        setResult(assessmentMatch[1].trim());
      }
      
      if (dietMatch && dietMatch[1]) {
        setDietRecommendations(dietMatch[1].trim());
      }
      
    } catch (error) {
      console.error('Error processing diabetes symptoms:', error);
      setResult('Sorry, there was an error processing your symptoms. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-blue-800">{t('diabetesChecker.title')}</CardTitle>
              <CardDescription>
                {t('diabetesChecker.subtitle')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" />
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="symptoms">Describe your symptoms</Label>
                <VoiceInputButton onTranscriptReady={(text) => setSymptoms(text)} />
              </div>
              <Textarea
                id="symptoms"
                placeholder="E.g., frequent urination, increased thirst, unexplained weight loss, fatigue, blurred vision..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="min-h-[120px]"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !symptoms.trim()}
            >
              {isLoading ? 'Analyzing...' : 'Check Symptoms'}
            </Button>
          </form>
          
          {/* AI Disclaimer Banner */}
          <div className="mt-4">
            <AIDisclaimer variant="enhanced" type="diagnostic" />
          </div>
          
          {result && (
            <div className="mt-6 space-y-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="flex items-center gap-2 font-medium text-blue-800 mb-2">
                  <Info className="h-5 w-5" />
                  Assessment
                </h3>
                <div className="text-gray-700 whitespace-pre-line">{result}</div>
              </div>
              
              {dietRecommendations && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="flex items-center gap-2 font-medium text-green-800 mb-2">
                    <Sparkles className="h-5 w-5" />
                    Diet Recommendations
                  </h3>
                  <div className="text-gray-700 whitespace-pre-line">{dietRecommendations}</div>
                </div>
              )}
              
              {/* AI Disclaimer Banner (repeated at results) */}
              <AIDisclaimer variant="default" type="treatment" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DiabetesChecker; 