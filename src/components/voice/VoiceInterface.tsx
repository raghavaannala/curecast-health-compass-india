import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Play, Square, Volume2, ArrowRight, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';

// Add TypeScript interface for the window object with optional speech recognition
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

interface VoiceInterfaceProps {
  standalone?: boolean;
  onTranscriptReady?: (transcript: string) => void;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ standalone = true, onTranscriptReady }) => {
  const { currentLanguage } = useLanguage();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(currentLanguage as LanguageOption || 'english');
  const [isProcessing, setIsProcessing] = useState(false);
  const [readyToSend, setReadyToSend] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Simulated responses in different languages
  const simulatedResponses: Record<string, string> = {
    english: "Based on your symptoms, it sounds like you might have a common cold. I recommend resting, staying hydrated, and taking over-the-counter medication for fever if needed.",
    hindi: "आपके लक्षणों के आधार पर, ऐसा लगता है कि आपको सामान्य सर्दी हो सकती है। मैं आराम करने, हाइड्रेटेड रहने और यदि आवश्यक हो तो बुखार के लिए ओवर-द-काउंटर दवा लेने की सलाह देता हूं।",
    telugu: "మీ లక్షణాల ఆధారంగా, మీకు సాధారణ జలుబు ఉన్నట్లు అనిపిస్తోంది. విశ్రాంతి తీసుకోవడం, హైడ్రేటెడ్‌గా ఉండడం మరియు అవసరమైతే జ్వరం కోసం కౌంటర్‌లో లభించే మందులు తీసుకోవాలని నేను సిఫార్సు చేస్తున్నాను."
  };

  type LanguageOption = 'english' | 'hindi' | 'telugu';
  
  const languages = [
    { value: 'english' as LanguageOption, label: 'English' },
    { value: 'hindi' as LanguageOption, label: 'हिंदी (Hindi)' },
    { value: 'telugu' as LanguageOption, label: 'తెలుగు (Telugu)' }
  ];

  useEffect(() => {
    // Check for browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported in this browser');
      return;
    }

    // Clean up on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.error('Speech recognition not supported');
        return;
      }
      
      recognitionRef.current = new SpeechRecognition();
      
      // Set language based on current selection
      recognitionRef.current.lang = selectedLanguage === 'hindi' ? 'hi-IN' : 
                                   selectedLanguage === 'telugu' ? 'te-IN' : 'en-US';
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            setTranscript(prev => prev + event.results[i][0].transcript + ' ');
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };
      
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      
      if (transcript.trim()) {
        if (standalone) {
          // Simulate AI response in standalone mode
          setIsProcessing(true);
          setTimeout(() => {
            setResponse(simulatedResponses[selectedLanguage]);
            setIsProcessing(false);
          }, 1000);
        } else {
          // In integrated mode, mark as ready to send to DrCureCastAI
          setReadyToSend(true);
        }
      } else {
        toast({
          title: "No speech detected",
          description: "Please try speaking again",
          variant: "destructive"
        });
      }
    }
  };

  const speakResponse = () => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(response);
      
      // Set language based on current selection
      utterance.lang = selectedLanguage === 'hindi' ? 'hi-IN' : 
                       selectedLanguage === 'telugu' ? 'te-IN' : 'en-US';
      
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('Speech synthesis not supported in this browser');
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value as LanguageOption);
  };

  // Function to send transcript to DrCureCastAI
  const sendToDrCureCast = () => {
    if (!transcript.trim()) return;
    
    // Enhance the transcript with language context for better AI processing
    const languageContext = selectedLanguage !== 'english' 
      ? `The following is in ${selectedLanguage === 'hindi' ? 'Hindi' : 'Telugu'} language: ` 
      : '';
    
    const enhancedTranscript = `${languageContext}${transcript.trim()}`;
    
    // If we have an external handler, use it
    if (onTranscriptReady) {
      onTranscriptReady(enhancedTranscript);
      setReadyToSend(false);
      setTranscript('');
      toast({
        title: "Voice input sent",
        description: "Your voice message has been sent to Dr. CureCast",
      });
    } else if (window && (window as any).drCureCastHandleVoiceInput) {
      // Use the global method if available
      (window as any).drCureCastHandleVoiceInput(enhancedTranscript);
      setReadyToSend(false);
      setTranscript('');
      toast({
        title: "Voice input sent",
        description: "Your voice message has been sent to Dr. CureCast",
      });
    }
    
    // Reset the interface for a new recording
    setResponse('');
  };

  return (
    <div className={`container mx-auto ${standalone ? 'p-4 space-y-6' : 'p-0 space-y-4'}`}>
      {standalone && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-primary">Voice Interface</h2>
            <p className="text-muted-foreground">Talk to Dr.CureCast in your language</p>
          </div>
          
          <div className="w-48">
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Speak to Dr.CureCast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 space-y-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center 
              ${isRecording ? 'bg-red-100 animate-pulse' : 'bg-primary-100'}`}>
              {isRecording ? (
                <Mic className="h-12 w-12 text-red-600" />
              ) : (
                <Mic className="h-12 w-12 text-primary-600" />
              )}
            </div>
            
            <div className="flex gap-4">
              {!isRecording ? (
                <Button onClick={startRecording} className="bg-primary-600">
                  Start Speaking
                </Button>
              ) : (
                <Button onClick={stopRecording} variant="destructive">
                  Stop Recording
                </Button>
              )}
            </div>
            
            <p className="text-sm text-center text-gray-500">
              {isRecording 
                ? "I'm listening... Speak clearly into your microphone." 
                : "Press 'Start Speaking' and describe your symptoms"
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {transcript && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <span>You said:</span>
              {!standalone && readyToSend && (
                <Button 
                  onClick={sendToDrCureCast} 
                  className="bg-primary-600 text-white"
                  size="sm"
                >
                  Send to Dr.CureCast
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{transcript}</p>
          </CardContent>
        </Card>
      )}

      {response && (
        <Card>
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                Dr.CureCast's Response:
              </div>
              <div className="flex gap-2">
                {!isSpeaking ? (
                  <Button onClick={speakResponse} size="sm" variant="outline" className="flex items-center gap-1">
                    <Play className="h-4 w-4" /> Listen
                  </Button>
                ) : (
                  <Button onClick={stopSpeaking} size="sm" variant="outline" className="flex items-center gap-1">
                    <Square className="h-4 w-4" /> Stop
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-gray-700">{response}</p>
          </CardContent>
        </Card>
      )}
      
      {standalone && response && (
        <Card className="bg-gradient-to-br from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Dr.CureCast's Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{response}</p>
            
            <div className="flex gap-3 mt-4">
              {!isSpeaking ? (
                <Button onClick={speakResponse} variant="outline" className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Listen
                </Button>
              ) : (
                <Button onClick={stopSpeaking} variant="outline" className="flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {isProcessing && (
        <div className="flex justify-center py-4">
          <div className="animate-pulse flex items-center gap-2">
            <div className="h-2 w-2 bg-primary rounded-full"></div>
            <div className="h-2 w-2 bg-primary rounded-full animation-delay-200"></div>
            <div className="h-2 w-2 bg-primary rounded-full animation-delay-400"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceInterface; 