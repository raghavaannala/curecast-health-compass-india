import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Droplet, Scan } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const PopularUseCases: React.FC = () => {
  const navigate = useNavigate();
  const { t, currentLanguage } = useLanguage();
  
  // Get translated text based on language
  const getText = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      title: {
        english: "Popular Health Use Cases",
        hindi: "लोकप्रिय स्वास्थ्य उपयोग केस",
        telugu: "ప్రజాదరణ పొందిన ఆరోగ్య కేసులు"
      },
      subtitle: {
        english: "Get AI-powered guidance for common health concerns",
        hindi: "सामान्य स्वास्थ्य चिंताओं के लिए AI-संचालित मार्गदर्शन प्राप्त करें",
        telugu: "సాధారణ ఆరోగ్య సమస్యలకు AI-ఆధారిత మార్గదర్శకత్వం పొందండి"
      },
      diabetes: {
        english: "Diabetes Checker",
        hindi: "डायबिटीज चेकर",
        telugu: "మధుమేహం పరిశీలకుడు"
      },
      diabetesDesc: {
        english: "Check symptoms & get diet recommendations",
        hindi: "लक्षणों की जांच करें और आहार संबंधी सिफारिशें प्राप्त करें",
        telugu: "లక్షణాలను తనిఖీ చేసి ఆహార సిఫార్సులను పొందండి"
      },
      bp: {
        english: "Blood Pressure Monitor",
        hindi: "रक्तचाप मॉनिटर",
        telugu: "రక్తపోటు మానిటర్"
      },
      bpDesc: {
        english: "Track BP readings & lifestyle advice",
        hindi: "बीपी रीडिंग और जीवनशैली सलाह का पता लगाएं",
        telugu: "BP రీడింగ్‌లు & జీవనశైలి సలహాలను ట్రాక్ చేయండి"
      },
      skin: {
        english: "Skin Disease Analyzer",
        hindi: "त्वचा रोग विश्लेषक",
        telugu: "చర్మ వ్యాధి విశ్లేషకుడు"
      },
      skinDesc: {
        english: "Upload images for AI-powered analysis",
        hindi: "AI-संचालित विश्लेषण के लिए छवियां अपलोड करें",
        telugu: "AI-ఆధారిత విశ్లేషణ కోసం చిత్రాలను అప్‌లోడ్ చేయండి"
      },
      checkNow: {
        english: "Check Now",
        hindi: "अभी जांचें",
        telugu: "ఇప్పుడు తనిఖీ చేయండి"
      }
    };
    
    return translations[key]?.[currentLanguage] || translations[key]?.english || key;
  };
  
  return (
    <section className="py-8 px-4">
      <div className="container mx-auto">
        <h2 className="text-2xl font-bold text-center mb-2">{getText('title')}</h2>
        <p className="text-gray-600 text-center mb-8">{getText('subtitle')}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Diabetes Use Case */}
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2"></div>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Droplet className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{getText('diabetes')}</h3>
                  <p className="text-gray-600 text-sm">{getText('diabetesDesc')}</p>
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={() => navigate('/health/diabetes')}
              >
                {getText('checkNow')}
              </Button>
            </CardContent>
          </Card>
          
          {/* Blood Pressure Use Case */}
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 h-2"></div>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{getText('bp')}</h3>
                  <p className="text-gray-600 text-sm">{getText('bpDesc')}</p>
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={() => navigate('/health/blood-pressure')}
              >
                {getText('checkNow')}
              </Button>
            </CardContent>
          </Card>
          
          {/* Skin Disease Use Case */}
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2"></div>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Scan className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{getText('skin')}</h3>
                  <p className="text-gray-600 text-sm">{getText('skinDesc')}</p>
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={() => navigate('/health/skin-disease')}
              >
                {getText('checkNow')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PopularUseCases; 