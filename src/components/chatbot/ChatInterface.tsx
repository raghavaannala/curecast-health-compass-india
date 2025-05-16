
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/types';
import { Send, Mic, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useLanguage } from '@/contexts/LanguageContext';
import { symptomsMapping } from '@/services/mockData';
import { useUser } from '@/contexts/UserContext';

const ChatInterface = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'intro',
      role: 'assistant',
      content: 'Hello! I\'m your health assistant. How can I help you today? Please describe any symptoms you\'re experiencing.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t, currentLanguage } = useLanguage();
  const { addMedicalRecord } = useUser();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || isProcessing) return;

    // Add user message
    const userMessage = {
      id: uuidv4(),
      role: 'user' as const,
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // Process the message and generate a response
    setTimeout(() => {
      const botResponse = processUserInput(userMessage.content);
      setMessages((prev) => [...prev, botResponse]);
      setIsProcessing(false);
    }, 1000);
  };

  const processUserInput = (input: string): ChatMessage => {
    // Simple keyword matching to identify symptoms
    const inputLower = input.toLowerCase();
    const detectedSymptoms: string[] = [];
    
    // Check the input against our symptom mapping to detect mentioned symptoms
    Object.keys(symptomsMapping).forEach(symptom => {
      if (inputLower.includes(symptom)) {
        detectedSymptoms.push(symptom);
      }
    });
    
    if (detectedSymptoms.length === 0) {
      // No recognized symptoms
      return {
        id: uuidv4(),
        role: 'assistant',
        content: `I couldn't identify specific symptoms from your description. Could you please describe what you're feeling in more detail? For example, do you have fever, cough, headache, etc.?`,
        timestamp: new Date().toISOString(),
      };
    }
    
    // Analyze the detected symptoms
    let highestSeverity = 'low';
    let recommendation = 'self-care';
    const possibleConditions = new Set<string>();
    
    detectedSymptoms.forEach(symptom => {
      const symptomData = symptomsMapping[symptom as keyof typeof symptomsMapping];
      
      // Collect possible conditions
      symptomData.possibleConditions.forEach(condition => possibleConditions.add(condition));
      
      // Determine highest severity
      if (
        (highestSeverity === 'low' && ['medium', 'high'].includes(symptomData.severity)) || 
        (highestSeverity === 'medium' && symptomData.severity === 'high')
      ) {
        highestSeverity = symptomData.severity;
      }
      
      // Determine most serious recommendation
      if (
        (recommendation === 'self-care' && ['clinic', 'emergency'].includes(symptomData.recommendation)) ||
        (recommendation === 'clinic' && symptomData.recommendation === 'emergency')
      ) {
        recommendation = symptomData.recommendation;
      }
    });
    
    // Save this medical record
    addMedicalRecord({
      symptoms: detectedSymptoms,
      diagnosis: Array.from(possibleConditions).join(', '),
      recommendation: recommendation as 'self-care' | 'clinic' | 'emergency',
      notes: `Based on reported symptoms: ${detectedSymptoms.join(', ')}`
    });
    
    // Generate response based on analysis
    let responseContent = `Based on the symptoms you've described (${detectedSymptoms.join(', ')}), `;
    
    if (possibleConditions.size > 0) {
      responseContent += `you might be experiencing one of the following: ${Array.from(possibleConditions).join(', ')}. `;
    }
    
    // Add recommendation based on severity
    switch (recommendation) {
      case 'self-care':
        responseContent += "For now, I recommend rest and self-care at home. Make sure to stay hydrated and get plenty of rest. If symptoms worsen, please consult a healthcare provider.";
        break;
      case 'clinic':
        responseContent += "I recommend you visit a local clinic or doctor for proper diagnosis and treatment. It's important to get professional medical advice.";
        break;
      case 'emergency':
        responseContent += "These symptoms may require urgent medical attention. Please visit an emergency room or call for medical assistance immediately.";
        break;
    }
    
    return {
      id: uuidv4(),
      role: 'assistant',
      content: responseContent,
      timestamp: new Date().toISOString(),
    };
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary text-white'
                  : 'glass-morphism'
              }`}
            >
              <p>{message.content}</p>
              <div className="text-xs opacity-70 mt-1 text-right">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
        
        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="glass-morphism max-w-[80%] rounded-lg p-4 flex items-center">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span>Analyzing symptoms...</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <div className="flex-1 glass-morphism rounded-lg overflow-hidden flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder={t('typeMessage')}
              className="flex-1 px-4 py-2 bg-transparent focus:outline-none"
            />
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
            >
              <Mic className="h-5 w-5" />
            </Button>
          </div>
          <Button 
            onClick={handleSendMessage} 
            className="rounded-full" 
            disabled={!inputValue.trim() || isProcessing}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
