import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Upload, Camera, ImageIcon, Info, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGlobalLanguage } from '@/contexts/GlobalLanguageContext';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@/config/api';
import { useToast } from '@/components/ui/use-toast';
import VoiceInputButton from '@/components/health/VoiceInputButton';
import AIDisclaimer from '@/components/ui/AIDisclaimer';

const SkinDiseaseChecker: React.FC = () => {
  const { t, currentLanguage, changeLanguage } = useGlobalLanguage();
  const { toast } = useToast();
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [conditions, setConditions] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize Gemini AI
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file is an image
    if (!file.type.match('image.*')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile || !description.trim()) {
      toast({
        title: "Missing information",
        description: "Please upload an image and provide a description",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setConditions(null);
    
    try {
      // Convert image to base64 for Gemini API
      const fileReader = new FileReader();
      
      fileReader.onloadend = async () => {
        try {
          const base64Data = fileReader.result?.toString().split(',')[1];
          
          if (!base64Data) {
            throw new Error('Failed to process image');
          }
          
          // Process with Gemini Vision API
          const languageName = currentLanguage.name;
          const prompt = `You are a helpful dermatology assistant. 
          
          A patient has uploaded an image of their skin condition with this description: "${description}".
          
          Please analyze the image and provide your response in ${languageName} language:
          1. The most likely skin conditions based on the visual appearance
          2. General information about these conditions
          3. Recommendations for care
          4. When to seek immediate medical attention
          
          Format your response in clear sections. Be informative but concise.
          Use culturally appropriate medical terminology for ${languageName} speakers.
          
          IMPORTANT: Always emphasize that this is not a diagnosis and the patient should consult a dermatologist for proper evaluation.
          
          Respond ONLY in ${languageName}. Do not include any other language in your response.`;
          
          const result = await model.generateContent([
            prompt,
            {
              inlineData: {
                data: base64Data,
                mimeType: imageFile.type
              }
            }
          ]);
          
          const response = await result.response;
          const text = response.text();
          
          setConditions(text);
          
        } catch (error) {
          console.error('Error processing image with Gemini:', error);
          toast({
            title: "Processing error",
            description: "There was an error analyzing your image. Please try again.",
            variant: "destructive",
          });
          setConditions('Sorry, there was an error processing your image. Please try again with a clearer image or a more detailed description.');
        } finally {
          setIsLoading(false);
        }
      };
      
      fileReader.onerror = () => {
        console.error('Error reading file');
        toast({
          title: "File error",
          description: "There was an error reading your image file",
          variant: "destructive",
        });
        setIsLoading(false);
      };
      
      fileReader.readAsDataURL(imageFile);
      
    } catch (error) {
      console.error('Error in submission process:', error);
      setIsLoading(false);
      toast({
        title: "Submission error",
        description: "There was an error submitting your information",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-purple-800">{t('skinChecker.title')}</CardTitle>
              <CardDescription>
                {t('skinChecker.subtitle')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-purple-600" />
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
              <Label htmlFor="image-upload">{t('skinChecker.uploadImage')}</Label>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={handleUploadClick}
              >
                {imagePreview ? (
                  <div className="w-full">
                    <img 
                      src={imagePreview} 
                      alt="Skin condition preview" 
                      className="max-h-64 mx-auto rounded-md object-contain"
                    />
                    <p className="text-sm text-center mt-2 text-gray-500">
                      {imageFile?.name}
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 text-center">
                      Click to upload or drag and drop<br />
                      JPG, PNG (max 5MB)
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Describe your skin condition</Label>
                <VoiceInputButton onTranscriptReady={(text) => setDescription(text)} />
              </div>
              <Textarea
                id="description"
                placeholder="E.g., I've had this red, itchy rash on my arm for 3 days. It's slightly raised and feels warm to touch..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px]"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !imageFile || !description.trim()}
            >
              {isLoading ? 'Analyzing...' : 'Analyze Skin Condition'}
            </Button>
          </form>
          
          {/* AI Disclaimer Banner */}
          <div className="mt-4">
            <AIDisclaimer variant="enhanced" type="diagnostic" />
          </div>
          
          {conditions && (
            <div className="mt-6 space-y-6">
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="flex items-center gap-2 font-medium text-purple-800 mb-2">
                  <Info className="h-5 w-5" />
                  Analysis Results
                </h3>
                <div className="text-gray-700 whitespace-pre-line">{conditions}</div>
              </div>
              
              {/* AI Disclaimer Banner (repeated at results) */}
              <AIDisclaimer variant="default" type="treatment" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SkinDiseaseChecker; 