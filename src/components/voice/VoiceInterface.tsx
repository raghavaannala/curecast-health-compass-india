import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Play, Square, Volume2, ArrowRight, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@/config/api';

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
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Gemini AI
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
      
      // Stop any ongoing speech
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Effect to automatically speak the response when it changes
  useEffect(() => {
    if (response) {
      speakResponse();
    }
  }, [response]);

  const startRecording = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.error('Speech recognition not supported');
        return;
      }
      
      // Reset transcript and response whenever starting a new recording
      setTranscript('');
      setResponse('');
      
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
        // Mark as ready to send
        setReadyToSend(true);
        
        // In standalone mode, process directly
        if (standalone) {
          processTranscript(transcript);
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

  // Generate a response using Gemini AI
  const processTranscript = async (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // First, detect which language the input is in
      let detectedLanguage: LanguageOption = selectedLanguage;
      
      // Simple language detection based on script
      if (/[\u0900-\u097F]/.test(text)) {
        // Contains Devanagari script (Hindi)
        detectedLanguage = 'hindi';
      } else if (/[\u0C00-\u0C7F]/.test(text)) {
        // Contains Telugu script
        detectedLanguage = 'telugu';
      } else if (!/[a-zA-Z]/.test(text) || selectedLanguage !== 'english') {
        // If no Latin characters or language is already set to non-English
        detectedLanguage = selectedLanguage;
      } else {
        detectedLanguage = 'english';
      }
      
      // Set the language selection to match detected language
      if (detectedLanguage !== selectedLanguage) {
        setSelectedLanguage(detectedLanguage);
      }
      
      // Generate response with Gemini
      const prompt = `You are Dr.CureCast, a warm, compassionate physician with extensive experience who speaks in a conversational, approachable manner.

      A patient has said: "${text.trim()}"
      
      IMPORTANT: Respond ONLY in ${detectedLanguage} language. 
      
      If the language is Telugu, write ONLY in Telugu script.
      If the language is Hindi, write ONLY in Hindi script.
      If the language is English, write ONLY in English.
      
      DO NOT mix languages. DO NOT include translations. Respond ONLY in the specified language.
      
      Please provide a friendly, conversational medical response that sounds natural in ${detectedLanguage}.
      
      Use a warm, empathetic tone throughout. Keep your response concise and focused on addressing the patient's concern directly.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      if (!response.text) {
        throw new Error('No response from AI model');
      }

      const aiResponse = response.text();
      setResponse(aiResponse);
      
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Show error message based on language
      const errorMessage = selectedLanguage === 'hindi' 
        ? 'क्षमा करें, मैं अभी आपके प्रश्न का उत्तर देने में असमर्थ हूं। कृपया बाद में पुनः प्रयास करें।'
        : selectedLanguage === 'telugu'
        ? 'క్షమించండి, నేను ప్రస్తుతం మీ ప్రశ్నకు సమాధానం ఇవ్వలేకపోతున్నాను. దయచేసి తర్వాత మళ్లీ ప్రయత్నించండి.'
        : "I'm sorry, I'm unable to respond to your question at the moment. Please try again later.";
      
      setResponse(errorMessage);
      
      toast({
        title: "Error",
        description: "There was an issue generating a response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // If not in standalone mode, send to parent component
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
  };

  const speakResponse = () => {
    if ('speechSynthesis' in window) {
      try {
        // Stop any ongoing speech first
        window.speechSynthesis.cancel();
        setIsSpeaking(true);
        
        // Create utterance
        const utterance = new SpeechSynthesisUtterance(response);
        
        // Some browsers need a timeout to properly initialize speech synthesis
        setTimeout(() => {
          console.log("Attempting to speak:", response.substring(0, 50) + "...");
          
          // Get all available voices
          let voices = window.speechSynthesis.getVoices();
          
          // Chrome sometimes needs to be triggered to load voices
          if (voices.length === 0) {
            console.log("No voices available, trying to trigger voice loading");
            window.speechSynthesis.getVoices();
            // Try again after a short delay
            setTimeout(() => {
              voices = window.speechSynthesis.getVoices();
              console.log(`Found ${voices.length} voices after triggering load`);
              
              if (voices.length > 0) {
                performSpeech(utterance, voices);
              } else {
                // Last resort - try with default voice
                console.log("Still no voices available, using default");
                window.speechSynthesis.speak(utterance);
              }
            }, 500);
          } else {
            performSpeech(utterance, voices);
          }
        }, 100);
      } catch (error) {
        console.error("Speech synthesis error:", error);
        setIsSpeaking(false);
        toast({
          title: "Speech Error",
          description: "There was an issue with speech synthesis. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      console.error('Speech synthesis not supported in this browser');
      toast({
        title: "Not Supported",
        description: "Speech synthesis is not supported in your browser",
        variant: "destructive"
      });
    }
  };

  // Helper function to perform the actual speech
  const performSpeech = (utterance: SpeechSynthesisUtterance, voices: SpeechSynthesisVoice[]) => {
    try {
      // Map languages to their codes
      const langMap = {
        'english': 'en',
        'hindi': 'hi',
        'telugu': 'te'
      };
      
      // Full codes for exact matching
      const fullLangMap = {
        'english': 'en-US',
        'hindi': 'hi-IN',
        'telugu': 'te-IN'
      };
      
      // Set language
      utterance.lang = fullLangMap[selectedLanguage];
      
      // Log all available voices for debugging
      console.log("Available voices:", voices.map(v => `${v.name} (${v.lang})`));
      
      // Find appropriate voice
      let voice = null;
      
      // Try exact match
      voice = voices.find(v => v.lang === utterance.lang);
      if (voice) console.log("Found exact match voice:", voice.name);
      
      // Try base language match
      if (!voice) {
        const baseCode = langMap[selectedLanguage];
        voice = voices.find(v => v.lang.startsWith(baseCode));
        if (voice) console.log("Found base language match:", voice.name);
      }
      
      // Try any related voice
      if (!voice) {
        const baseCode = langMap[selectedLanguage];
        voice = voices.find(v => v.lang.includes(baseCode));
        if (voice) console.log("Found partial language match:", voice.name);
      }
      
      // Fall back to Google voices if available
      if (!voice) {
        voice = voices.find(v => 
          v.name.includes("Google") && 
          (v.lang.startsWith('en') || v.lang.includes(langMap[selectedLanguage]))
        );
        if (voice) console.log("Using Google fallback voice:", voice.name);
      }
      
      // Last resort - use first available voice
      if (!voice && voices.length > 0) {
        voice = voices[0];
        console.log("Using first available voice as last resort:", voice.name);
      }
      
      // Set the voice if found
      if (voice) {
        utterance.voice = voice;
      } else {
        console.warn("No suitable voice found");
      }
      
      // Adjust settings for clarity
      utterance.volume = 1.0;  // Maximum volume
      utterance.rate = selectedLanguage === 'english' ? 1.0 : 0.8;
      utterance.pitch = 1.0;
      
      // Set event handlers
      utterance.onstart = () => console.log("Speech started");
      utterance.onend = () => {
        console.log("Speech ended");
        setIsSpeaking(false);
      };
      utterance.onerror = (event) => {
        console.error("Speech error:", event);
        setIsSpeaking(false);
        toast({
          title: "Speech Error",
          description: `Speech synthesis failed: ${event.error}`,
          variant: "destructive"
        });
      };
      
      // Speak
      console.log(`Speaking in ${selectedLanguage} using ${voice ? voice.name : 'default voice'}`);
      window.speechSynthesis.speak(utterance);
      
      // Hack for Chrome that sometimes cuts off speech
      if (window.navigator.userAgent.includes("Chrome")) {
        // Keep speech synthesis active
        const keepAlive = () => {
          if (isSpeaking) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
            speechTimeoutRef.current = setTimeout(keepAlive, 5000);
          }
        };
        
        if (!speechTimeoutRef.current) {
          speechTimeoutRef.current = setTimeout(keepAlive, 5000);
        }
      }
    } catch (err) {
      console.error("Error in performSpeech:", err);
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
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
                : "Press 'Start Speaking' and tell Dr. CureCast how you're feeling"
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
        <Card className="bg-gradient-to-br from-green-50 to-blue-50">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                Dr.CureCast's Response:
              </div>
              <div className="flex gap-2">
                {!isSpeaking ? (
                  <Button onClick={speakResponse} size="sm" variant="outline" className="flex items-center gap-1">
                    <Play className="h-4 w-4" /> Listen Again
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