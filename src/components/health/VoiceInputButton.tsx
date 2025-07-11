import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface VoiceInputButtonProps {
  onTranscriptReady: (transcript: string) => void;
  buttonText?: string;
}

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ 
  onTranscriptReady,
  buttonText = 'Speak Symptoms' 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { currentLanguage } = useLanguage();
  
  // Check if browser supports speech recognition
  const isSpeechRecognitionSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  
  // Initialize speech recognition
  let recognition: any = null;
  
  const initializeSpeechRecognition = () => {
    if (!isSpeechRecognitionSupported) return;
    
    // @ts-ignore - TypeScript doesn't know about webkitSpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    
    // Set language based on current app language
    switch (currentLanguage) {
      case 'hindi':
        recognition.lang = 'hi-IN';
        break;
      case 'telugu':
        recognition.lang = 'te-IN';
        break;
      default:
        recognition.lang = 'en-US';
    }
    
    // Set up event handlers
    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      toast({
        title: "Voice Input Error",
        description: `Error: ${event.error}. Please try again.`,
        variant: "destructive",
      });
    };
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      setTranscript(finalTranscript || interimTranscript);
    };
  };
  
  const startListening = () => {
    setTranscript('');
    initializeSpeechRecognition();
    
    if (recognition) {
      try {
        recognition.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };
  
  const stopListening = () => {
    if (recognition) {
      recognition.stop();
    }
  };
  
  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    // Start listening after a short delay to allow dialog to open
    setTimeout(() => {
      startListening();
    }, 500);
  };
  
  const handleCloseDialog = () => {
    stopListening();
    setIsDialogOpen(false);
    setTranscript('');
  };
  
  const handleSubmitTranscript = () => {
    if (!transcript.trim()) {
      toast({
        title: "No speech detected",
        description: "Please try speaking again",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    // Process the transcript
    setTimeout(() => {
      onTranscriptReady(transcript);
      setIsProcessing(false);
      setIsDialogOpen(false);
      setTranscript('');
      
      toast({
        title: "Voice input processed",
        description: "Your spoken symptoms have been added",
      });
    }, 500);
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);
  
  if (!isSpeechRecognitionSupported) {
    return null; // Don't render the button if speech recognition is not supported
  }
  
  return (
    <>
      <Button 
        type="button" 
        variant="outline" 
        onClick={handleOpenDialog}
        className="flex items-center gap-2"
      >
        <Mic className="h-4 w-4" />
        {buttonText}
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Voice Input</DialogTitle>
            <DialogDescription>
              Speak clearly to describe your symptoms
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <div className="flex justify-center mb-6">
              {isListening ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-primary-100 rounded-full animate-ping opacity-75"></div>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="h-16 w-16 rounded-full relative z-10 bg-primary-50 border-primary-200"
                    onClick={stopListening}
                  >
                    <Mic className="h-6 w-6 text-primary-600" />
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-16 w-16 rounded-full bg-gray-50"
                  onClick={startListening}
                >
                  <MicOff className="h-6 w-6 text-gray-400" />
                </Button>
              )}
            </div>
            
            <div className="border rounded-md p-4 min-h-[100px] mb-4 bg-gray-50">
              {transcript ? (
                <p className="text-gray-800">{transcript}</p>
              ) : (
                <p className="text-gray-400 italic">
                  {isListening ? 'Listening...' : 'Press the microphone button and start speaking'}
                </p>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCloseDialog} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handleSubmitTranscript} disabled={!transcript.trim() || isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Use This Text'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VoiceInputButton; 