
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/types';
import { Send, Mic, Loader2, Stethoscope, Maximize2, Minimize2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useLanguage } from '@/contexts/LanguageContext';
import { symptomsMapping } from '@/services/mockData';
import { useUser } from '@/contexts/UserContext';

// Assessment state interface for tracking follow-up questions
interface AssessmentState {
  isActive: boolean;
  symptom: string;
  step: number;
  responses: string[];
  questions: string[];
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'intro',
      role: 'assistant',
      content: 'Hi, how are you? How can I help you today? I\'m here to listen and understand your health concerns.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [assessmentState, setAssessmentState] = useState<AssessmentState>({
    isActive: false,
    symptom: '',
    step: 0,
    responses: [],
    questions: []
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatSize, setChatSize] = useState({ width: 400, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { t, currentLanguage } = useLanguage();
  const { addMedicalRecord } = useUser();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle resize functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !chatContainerRef.current) return;
    
    const rect = chatContainerRef.current.getBoundingClientRect();
    const newWidth = Math.max(300, Math.min(800, e.clientX - rect.left + 20));
    const newHeight = Math.max(400, Math.min(800, e.clientY - rect.top + 20));
    
    setChatSize({ width: newWidth, height: newHeight });
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setChatSize({ width: 600, height: 700 });
    } else {
      setChatSize({ width: 400, height: 600 });
    }
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
    const currentMessage = inputValue;
    setInputValue('');
    setIsProcessing(true);

    // Process the message and generate a response
    setTimeout(() => {
      processConversation(currentMessage);
      setIsProcessing(false);
    }, 1000);
  };

  // Detect if message mentions symptoms
  const detectSymptomMention = (text: string): string | null => {
    const symptomKeywords = [
      'fever', 'headache', 'cough', 'pain', 'ache', 'hurt', 'sick', 'nausea',
      'vomiting', 'diarrhea', 'dizzy', 'tired', 'fatigue', 'sore', 'swollen',
      'rash', 'itchy', 'burning', 'stiff', 'weak', 'breathe', 'chest', 'stomach',
      'back', 'joint', 'muscle', 'throat', 'temperature', 'hot', 'chills',
      'cold', 'flu', 'migraine', 'diabetes', 'asthma', 'allergies', 'infection',
      'wound', 'cut', 'bruise', 'sprain', 'strain', 'anxiety', 'depression',
      'insomnia', 'constipation', 'heartburn', 'acidity', 'gas', 'bloating'
    ];
    
    const lowerText = text.toLowerCase();
    for (const symptom of symptomKeywords) {
      if (lowerText.includes(symptom)) {
        return symptom;
      }
    }
    return null;
  };

  // Detect if message is a greeting
  const detectGreeting = (text: string): boolean => {
    const greetings = [
      'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening',
      'namaste', 'namaskar'
    ];
    
    const lowerText = text.toLowerCase().trim();
    return greetings.some(greeting => 
      lowerText === greeting || 
      lowerText.startsWith(greeting + ' ') || 
      lowerText.startsWith(greeting + ',')
    );
  };

  // Disease-specific questions (5-7 questions per symptom)
  const generateFollowUpQuestion = (symptom: string, step: number): string => {
    const questionBank: { [key: string]: string[] } = {
      fever: [
        "What is your current body temperature?",
        "Since how many days have you been experiencing this fever?",
        "Do you have chills, body aches, or headache along with the fever?",
        "Have you taken any medicine for the fever?",
        "Do you have any other symptoms like cough, sore throat, or vomiting?",
        "Do you have any existing health conditions like diabetes or heart problems?"
      ],
      headache: [
        "How would you rate your headache on a scale of 1-10?",
        "Since how many days have you been experiencing this headache?",
        "Where exactly is the headache located - front, back, sides, or all over?",
        "Do you have nausea, vomiting, or sensitivity to light?",
        "Have you taken any medicine for the headache?",
        "What triggers make it worse - stress, certain foods, or lack of sleep?"
      ],
      cough: [
        "Is it a dry cough or are you bringing up phlegm/mucus?",
        "Since how many days have you been experiencing this cough?",
        "Do you have fever, sore throat, or difficulty breathing?",
        "Is the cough worse at night or during the day?",
        "Have you taken any cough medicine or home remedies?",
        "Do you have any existing conditions like asthma or allergies?"
      ],
      stomach: [
        "Where exactly do you feel the stomach pain - upper, lower, left, or right side?",
        "Since how many days have you been experiencing this pain?",
        "How severe is the pain on a scale of 1-10?",
        "Is the pain related to eating - before, during, or after meals?",
        "Do you have nausea, vomiting, or changes in bowel movements?",
        "Have you eaten anything unusual or taken any medicine recently?"
      ],
      cold: [
        "Do you have a runny or stuffy nose?",
        "Since how many days have you had these cold symptoms?",
        "Is your throat sore or scratchy?",
        "Do you have fever or body aches along with the cold?",
        "Are you feeling unusually tired or weak?",
        "Have you taken any medicine or home remedies for the cold?"
      ],
      pain: [
        "Where exactly do you feel the pain?",
        "How would you rate your pain on a scale of 1-10?",
        "Since how many days have you been experiencing this pain?",
        "Do you have swelling, fever, or difficulty moving?",
        "Have you taken any pain medicine?",
        "What makes the pain worse or better?"
      ]
    };
    
    const questions = questionBank[symptom] || questionBank.pain;
    return questions[step] || "Is there anything else you'd like to tell me about your condition?";
  };

  // Generate acknowledgment responses
  const generateAcknowledgment = (): string => {
    const acknowledgments = [
      "I understand, thank you for sharing that.",
      "Got it, that's helpful information.",
      "Thanks for letting me know.",
      "I see, thank you.",
      "That's very helpful, thank you."
    ];
    return acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
  };

  // Generate AI prescription based on symptoms and responses
  const generateAIPrescription = (symptom: string, responses: string[]): string => {
    // Analyze responses to determine likely condition and treatment
    const analysisText = responses.join(' ').toLowerCase();
    
    let diagnosis = "";
    let medications = "";
    let homeRemedies = "";
    let warningSigns = "";
    
    // Determine probable diagnosis based on symptom and responses
    if (symptom.includes('fever') || analysisText.includes('fever') || analysisText.includes('temperature')) {
      diagnosis = "Viral Fever / Flu-like illness";
      medications = "Paracetamol 500mg every 6-8 hours (if fever >100°F), ORS solution for hydration";
      homeRemedies = "Drink warm fluids (herbal tea, warm water with honey), take adequate rest, use cool compress on forehead";
      warningSigns = "Seek medical help if fever persists >3 days, temperature >103°F, difficulty breathing, severe headache, or persistent vomiting";
    } else if (symptom.includes('headache') || analysisText.includes('headache') || analysisText.includes('head')) {
      diagnosis = "Tension Headache / Migraine";
      medications = "Paracetamol 500mg or Ibuprofen 400mg every 6-8 hours, avoid overuse";
      homeRemedies = "Rest in a dark, quiet room, apply cold/warm compress, stay hydrated, practice relaxation techniques";
      warningSigns = "Seek immediate help for sudden severe headache, vision changes, neck stiffness, or headache with fever";
    } else if (symptom.includes('cough') || analysisText.includes('cough')) {
      if (analysisText.includes('dry')) {
        diagnosis = "Dry Cough / Upper Respiratory Tract Infection";
        medications = "Dextromethorphan-based cough syrup, throat lozenges, steam inhalation";
      } else {
        diagnosis = "Productive Cough / Chest Congestion";
        medications = "Expectorant cough syrup, warm salt water gargling";
      }
      homeRemedies = "Drink warm fluids, honey with warm water, steam inhalation, avoid cold drinks";
      warningSigns = "See doctor if cough persists >2 weeks, blood in sputum, high fever, or breathing difficulty";
    } else if (symptom.includes('stomach') || analysisText.includes('stomach') || analysisText.includes('pain')) {
      diagnosis = "Gastritis / Indigestion";
      medications = "Antacid tablets (Eno, Digene), Omeprazole 20mg before meals if severe";
      homeRemedies = "Eat light, bland foods (rice, toast), avoid spicy/oily foods, drink plenty of water, eat small frequent meals";
      warningSigns = "Seek help for severe abdominal pain, persistent vomiting, blood in vomit/stool, or signs of dehydration";
    } else if (symptom.includes('cold') || analysisText.includes('runny nose') || analysisText.includes('sore throat')) {
      diagnosis = "Common Cold / Upper Respiratory Infection";
      medications = "Paracetamol for body aches, saline nasal drops, throat lozenges";
      homeRemedies = "Rest, warm fluids, steam inhalation, honey with warm water, avoid cold foods";
      warningSigns = "See doctor if symptoms worsen after 7 days, high fever develops, or breathing becomes difficult";
    } else {
      diagnosis = "General Health Concern";
      medications = "Symptomatic treatment as needed (Paracetamol for pain/fever)";
      homeRemedies = "Rest, adequate hydration, balanced diet, monitor symptoms";
      warningSigns = "Consult healthcare provider if symptoms persist or worsen";
    }

    return `<div class="prescription-card bg-gradient-to-br from-blue-50 to-green-50 border-2 border-blue-200 rounded-xl p-6 my-4 shadow-lg">
      <div class="prescription-header mb-4">
        <h3 class="text-xl font-bold text-blue-800 flex items-center gap-2">
          <span class="text-2xl">🩺</span> AI Medical Assessment
        </h3>
        <p class="text-sm text-gray-600 mt-1">Based on your symptoms and information provided</p>
      </div>
      
      <div class="prescription-content space-y-4">
        <div class="diagnosis-section">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-lg">✅</span>
            <h4 class="font-semibold text-green-700">Possible Condition:</h4>
          </div>
          <p class="ml-6 text-gray-800">${diagnosis}</p>
        </div>
        
        <div class="medication-section">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-lg">💊</span>
            <h4 class="font-semibold text-purple-700">Suggested Medications:</h4>
          </div>
          <p class="ml-6 text-gray-800">${medications}</p>
        </div>
        
        <div class="home-care-section">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-lg">🏠</span>
            <h4 class="font-semibold text-orange-700">Home Care & Lifestyle:</h4>
          </div>
          <p class="ml-6 text-gray-800">${homeRemedies}</p>
        </div>
        
        <div class="warning-section">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-lg">⚠️</span>
            <h4 class="font-semibold text-red-700">Warning Signs - Seek Medical Help:</h4>
          </div>
          <p class="ml-6 text-gray-800">${warningSigns}</p>
        </div>
      </div>
      
      <div class="prescription-footer mt-6 pt-4 border-t border-blue-200">
        <p class="text-xs text-gray-600 italic">
          <strong>Disclaimer:</strong> This is an AI-generated assessment for informational purposes only. 
          Always consult a qualified healthcare professional for proper diagnosis and treatment. 
          Do not self-medicate without professional guidance.
        </p>
      </div>
    </div>`;
  };

  // Helper function to add bot messages
  const addBotMessage = (content: string) => {
    const botMessage: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, botMessage]);
  };

  // Main conversation processing logic
  const processConversation = (currentMessage: string) => {
    if (assessmentState.isActive) {
      // Continue assessment with acknowledgment
      const acknowledgment = generateAcknowledgment();
      addBotMessage(acknowledgment);

      // Update assessment state with user's response
      const updatedResponses = [...assessmentState.responses, currentMessage];
      const nextStep = assessmentState.step + 1;

      // Check if we have more questions (6 questions per symptom)
      const totalQuestions = 6;
      if (nextStep < totalQuestions) {
        // Ask next question after a delay
        setTimeout(() => {
          const nextQuestion = generateFollowUpQuestion(assessmentState.symptom, nextStep);
          addBotMessage(nextQuestion);
        }, 1500);

        setAssessmentState(prev => ({
          ...prev,
          step: nextStep,
          responses: updatedResponses
        }));
      } else {
        // Assessment complete - generate AI prescription
        setTimeout(() => {
          const aiPrescription = generateAIPrescription(assessmentState.symptom, updatedResponses);
          addBotMessage(aiPrescription);
        }, 2000);

        // Reset assessment state
        setAssessmentState({
          isActive: false,
          symptom: '',
          step: 0,
          responses: [],
          questions: []
        });
      }
    } else {
      // Check if message is a greeting
      if (detectGreeting(currentMessage)) {
        addBotMessage("Hi, how are you? How can I help you today?");
      } else {
        // Check if message mentions symptoms
        const detectedSymptom = detectSymptomMention(currentMessage);
        
        if (detectedSymptom) {
          // Start symptom assessment - Ask first question directly
          const firstQuestion = generateFollowUpQuestion(detectedSymptom, 0);
          
          addBotMessage("I understand.");
          
          setTimeout(() => {
            addBotMessage(firstQuestion);
          }, 1000);

          // Set assessment state
          setAssessmentState({
            isActive: true,
            symptom: detectedSymptom,
            step: 0,
            responses: [],
            questions: []
          });
        } else {
          // General health query
          addBotMessage("I'm here to help with your health concerns. Could you please describe any symptoms you're experiencing? For example, do you have fever, headache, cough, or any pain?");
        }
      }
    }
  };

  return (
    <div 
      ref={chatContainerRef}
      className="flex flex-col relative bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
      style={{ 
        width: chatSize.width, 
        height: chatSize.height,
        minWidth: '300px',
        minHeight: '400px',
        maxWidth: '800px',
        maxHeight: '800px'
      }}
    >
      {/* Header with resize and expand controls */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Doctor Assistant</h3>
            <p className="text-xs opacity-90">
              {assessmentState.isActive 
                ? `Medical Assessment - Step ${assessmentState.step + 1}/6`
                : 'Your personal healthcare assistant'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleExpanded}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

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
              <span>{assessmentState.isActive ? 'Thinking...' : 'Analyzing symptoms...'}</span>
            </div>
          </div>
        )}
        
        {/* Assessment progress indicator */}
        {assessmentState.isActive && (
          <div className="flex justify-center">
            <div className="glass-morphism rounded-full px-4 py-2 flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-blue-600 font-medium">
                Medical Assessment - Step {assessmentState.step + 1}/6
              </span>
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

      {/* Resize Handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 bg-gray-300 hover:bg-gray-400 cursor-se-resize opacity-50 hover:opacity-100 transition-opacity"
        onMouseDown={handleMouseDown}
        title="Drag to resize"
        style={{
          background: 'linear-gradient(-45deg, transparent 30%, #9ca3af 30%, #9ca3af 70%, transparent 70%)',
        }}
      />
    </div>
  );
};

export default ChatInterface;
