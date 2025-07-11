import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Loader2, Eye, FileImage, ArrowRight, Stethoscope, AlertTriangle, MessageSquare, ClipboardList, AlertCircle, Thermometer, Clipboard, PillIcon, LightbulbIcon, Globe, CircleDot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { GEMINI_API_KEY } from '@/config/api';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// Simple map of conditions to their descriptions for fallback use
const CONDITION_DESCRIPTIONS = {
  'rash': `
    Skin rashes can have many causes including allergies, infections, heat, medications, immune system disorders, and other diseases.
    
    Common diagnoses for rashes include:
    - Contact dermatitis: Caused by direct contact with a substance that irritates the skin or triggers an allergic reaction.
    - Eczema: Dry, itchy patches that can become red, scaly and inflamed.
    - Hives: Raised, itchy welts that may appear suddenly.
    - Psoriasis: Thick, red patches with silvery scales caused by rapid skin cell turnover.
    - Fungal infections: Including ringworm, athlete's foot, and yeast infections.
    
    General care advice:
    - Keep the area clean and dry
    - Avoid scratching to prevent infection
    - Apply cool compresses for relief
    - Consider over-the-counter hydrocortisone cream for itching
    - Use fragrance-free moisturizers for dry rashes
    
    Seek medical attention if:
    - The rash is widespread over your body
    - It appears suddenly and spreads rapidly
    - It's accompanied by fever, pain, or difficulty breathing
    - The rash is blistering, painful, or shows signs of infection
    - It doesn't improve with home treatment within a few days
  `,
  
  'eye': `
    Eye conditions can range from minor irritations to serious issues requiring immediate attention.
    
    Possible conditions based on redness, swelling or irritation include:
    - Conjunctivitis (pink eye): Inflammation of the membrane covering the eye, often due to infection or allergies.
    - Stye: Infected oil gland on the eyelid appearing as a painful red bump.
    - Dry eye syndrome: Insufficient tear production causing irritation.
    - Allergic reactions: Itching, watering and redness due to allergen exposure.
    - Subconjunctival hemorrhage: Broken blood vessel causing bright red patch in the eye.
    
    General care recommendations:
    - Avoid touching or rubbing eyes
    - Use artificial tears for dryness
    - Apply warm compresses for styes
    - Remove contact lenses until symptoms resolve
    - Wash hands frequently to avoid spreading infection
    
    When to seek medical attention:
    - Moderate to severe pain in the eye
    - Vision changes or blurriness
    - Sensitivity to light
    - Foreign body sensation that persists
    - Discharge from the eye
    - Symptoms that worsen or don't improve within 1-2 days
  `,
  
  'wound': `
    Wounds can vary from minor cuts to serious injuries requiring immediate medical attention.
    
    Assessment of wounds considers:
    - Depth, size and location
    - Amount of bleeding
    - Presence of debris or foreign objects
    - Signs of infection (redness, warmth, swelling, pus)
    - Time since injury occurred
    
    General wound care recommendations:
    - Clean the wound gently with mild soap and water
    - Apply gentle pressure to stop bleeding
    - Apply antibiotic ointment to prevent infection
    - Cover with a clean bandage
    - Change the bandage daily or if it becomes wet or dirty
    
    Seek immediate medical attention if:
    - The wound is deep, large, or has jagged edges
    - Bleeding doesn't stop after applying pressure for 20 minutes
    - There's embedded debris you cannot clean out
    - The wound is from a dirty object or animal/human bite
    - You haven't had a tetanus shot in the last 5-10 years
    - Signs of infection develop (increasing pain, redness, swelling, warmth, pus)
  `,
  
  'bite': `
    Snake bites require immediate medical attention as they can be life-threatening, especially from venomous species.
    
    Snake bite assessment:
    - Location and time of bite
    - Description of the snake (if seen)
    - Symptoms: pain, swelling, bruising, numbness, difficulty breathing
    - Signs of envenomation: progressive swelling, bleeding, vomiting, blurred vision
    
    Emergency first aid for snake bites:
    - Call emergency services (911) immediately
    - Keep the bitten area below the level of the heart
    - Remove any constrictive items (jewelry, watches) before swelling occurs
    - Remain as calm and still as possible to slow venom spread
    - DO NOT: cut the wound, attempt to suck out venom, apply tourniquet, apply ice
    
    Seek emergency medical care for ALL suspected snake bites, even if you're unsure if the snake was venomous. Time is critical - the sooner antivenom can be administered for venomous bites, the better the outcome.
  `
};

interface CameraDiagnosticsProps {
  standalone?: boolean;
  onImageCaptured?: (imageUrl: string, description: string) => void;
}

type SeverityLevel = 'low' | 'medium' | 'high' | 'emergency';

interface ConditionType {
  id: string;
  name: string;
  description: string;
  prompt: string;
  followUpQuestions: string[];
  requiresUrgentCare: boolean;
}

// Add these helper functions from DrCureCast for processing messages
const processMessage = (text: string): {
  mainText: string;
  highlightedCondition?: string;
  consequences?: string;
  advice?: string;
  detection?: string;
  medications?: string[];
  dosages?: {name: string, dosage: string, frequency: string}[];
  symptoms?: string[];
  urgency?: 'low' | 'medium' | 'high';
  treatmentPlan?: string;
  websites?: string[];
  medicalState?: string;
} => {
  // Extract the main text content
  const mainText = text;
  
  // Extract sections using regex patterns with improved matching
  const assessmentMatch = text.match(/Assessment:\s*([^\n]+(?:\n(?!Possible Causes:|Symptoms:|Treatment Plan:|Medications:|When to Seek)[^\n]+)*)/i);
  const causesMatch = text.match(/Possible Causes:\s*([^\n]+(?:\n(?!Symptoms:|Treatment Plan:|Medications:|When to Seek)[^\n]+)*)/i);
  const treatmentMatch = text.match(/Treatment Plan:\s*([^\n]+(?:\n(?!Medications:|When to Seek)[^\n]+)*)/i);
  const whenToSeekMatch = text.match(/When to Seek Medical Help:\s*([^\n]+(?:\n(?!Assessment:|Possible Causes:|Symptoms:|Treatment Plan:|Medications:)[^\n]+)*)/i);
  
  // Extract medications using regex
  const medicationMatches = text.match(/Medications:\s*([^\n]+(?:\n(?!When to Seek|Assessment:|Possible Causes:|Symptoms:|Treatment Plan:)[^\n]+)*)/i);
  let medications: string[] = [];
  if (medicationMatches && medicationMatches[1]) {
    medications = medicationMatches[1]
      .split(/\n|,|;/)
      .map(med => med.replace(/^[\s•-]+/, '').trim())
      .filter(med => med.length > 0);
  }
  
  // Extract symptoms using regex
  const symptomMatches = text.match(/Symptoms:\s*([^\n]+(?:\n(?!Treatment Plan:|Medications:|When to Seek|Assessment:|Possible Causes:)[^\n]+)*)/i);
  let symptoms: string[] = [];
  if (symptomMatches && symptomMatches[1]) {
    symptoms = symptomMatches[1]
      .split(/\n|,|;/)
      .map(symptom => symptom.replace(/^[\s•-]+/, '').trim())
      .filter(symptom => symptom.length > 0);
  }
  
  return {
    mainText,
    detection: assessmentMatch ? assessmentMatch[1].trim() : undefined,
    consequences: causesMatch ? causesMatch[1].trim() : undefined,
    treatmentPlan: treatmentMatch ? treatmentMatch[1].trim() : undefined,
    medications,
    symptoms,
    medicalState: whenToSeekMatch ? whenToSeekMatch[1].trim() : undefined
  };
};

const CameraDiagnostics: React.FC<CameraDiagnosticsProps> = ({ standalone = true, onImageCaptured }) => {
  const { toast } = useToast();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  type TabValue = 'camera' | 'upload';
  const [activeTab, setActiveTab] = useState<TabValue>('camera');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCondition, setSelectedCondition] = useState('rash'); // Default condition
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState('');
  const [readyToSend, setReadyToSend] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  // List of common diseases for quick access
  const commonDiseases = [
    "Common Cold", 
    "Fever", 
    "Cough", 
    "Flu",
    "Headache"
  ];

  // Initialize Gemini with safeguards
  const geminiApi = React.useMemo(() => {
    try {
      if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 10) {
        console.error("Missing or invalid GEMINI_API_KEY");
        return null;
      }
      
      return new GoogleGenerativeAI(GEMINI_API_KEY);
    } catch (err) {
      console.error("Failed to initialize Gemini:", err);
      return null;
    }
  }, []);

  // List of conditions that can be analyzed
  const conditions: ConditionType[] = [
    {
      id: 'rash',
      name: 'Skin Condition Assessment',
      description: 'Analyze rashes, infections, allergic reactions, or other skin concerns',
      prompt: 'Focus on identifying the type of skin condition, possible causes, and recommended treatments.',
      followUpQuestions: [
        'Is the affected area itchy, painful, or numb?',
        'How long has this condition been present?',
        'Have you used any medications or creams on it?'
      ],
      requiresUrgentCare: false
    },
    {
      id: 'eye',
      name: 'Eye Condition Analysis',
      description: 'Check eye redness, swelling, or other visible symptoms',
      prompt: 'Identify potential eye conditions based on visible symptoms and suggest appropriate care.',
      followUpQuestions: [
        'Do you have any pain or discomfort in the eye?',
        'Have you noticed any changes in vision?',
        'Is there any discharge from the eye?'
      ],
      requiresUrgentCare: true
    },
    {
      id: 'wound',
      name: 'Wound Assessment',
      description: 'Evaluate cuts, scrapes, burns, or other injuries',
      prompt: 'Analyze the wound appearance, signs of infection, and recommend appropriate wound care.',
      followUpQuestions: [
        'How did the injury occur?',
        'When did it happen?',
        'Have you noticed any increasing pain, redness, or discharge?'
      ],
      requiresUrgentCare: true
    },
    {
      id: 'bite',
      name: 'Snake Bite Analysis',
      description: 'Urgent assessment of snake bites for immediate care guidance',
      prompt: 'Identify signs of envenomation, assess severity, and provide emergency guidance.',
      followUpQuestions: [
        'When did the bite occur?',
        'Can you describe the snake?',
        'Are you experiencing any numbness, dizziness, or difficulty breathing?'
      ],
      requiresUrgentCare: true
    }
  ];

  // Start camera when component mounts or tab changes
  useEffect(() => {
    if (activeTab === 'camera' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }

    // Cleanup function
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  const startCamera = async () => {
    // First, make sure we stop any existing stream
        stopCamera();
        
    try {
      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices not supported in this browser');
      }

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });

      if (!videoRef.current) {
        throw new Error('Video element not available');
      }

        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
          reject('Video element not found');
            return;
          }

        const onLoadedMetadata = () => {
          videoRef.current?.removeEventListener('loadedmetadata', onLoadedMetadata);
          resolve();
        };
        
        videoRef.current.addEventListener('loadedmetadata', onLoadedMetadata);
        
        // Add timeout to avoid hanging
        setTimeout(() => {
          reject('Video stream timed out');
        }, 10000);
      });

      await videoRef.current.play();
      setCapturedImage(null);
      setAnalysisResult(null);

    } catch (error: any) {
      console.error('Error starting camera:', error);
      
      let errorMessage = 'Failed to start camera. ';

      // Handle specific error cases
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Please grant camera permission and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotReadableError' || error.name === 'AbortError') {
        errorMessage += 'Camera is already in use by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += 'Camera doesn\'t meet the required constraints.';
      } else if (error.message) {
        errorMessage += error.message;
      }
      
          toast({
            title: "Camera Error",
        description: errorMessage,
            variant: "destructive"
          });
      
      // Fallback to upload tab
      setActiveTab('upload');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => {
        track.stop();
      });
      videoRef.current.srcObject = null;
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) {
      toast({
        title: "Camera Error",
        description: "Camera not initialized properly. Please refresh and try again.",
        variant: "destructive"
      });
      return;
    }

      const context = canvasRef.current.getContext('2d');

    if (!context) {
      toast({
        title: "Canvas Error",
        description: "Unable to initialize canvas for image capture.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if video is playing and has dimensions
      if (!videoRef.current.videoWidth || !videoRef.current.videoHeight) {
        throw new Error('Video stream not available or has zero dimensions');
      }

      // Calculate dimensions for optimized image (for Gemini API)
      const MAX_WIDTH = 2048;
      const MAX_HEIGHT = 2048;
      
      let width = videoRef.current.videoWidth;
      let height = videoRef.current.videoHeight;
      
      if (width > MAX_WIDTH) {
        height = Math.round(height * (MAX_WIDTH / width));
        width = MAX_WIDTH;
      }
      
      if (height > MAX_HEIGHT) {
        width = Math.round(width * (MAX_HEIGHT / height));
        height = MAX_HEIGHT;
      }

      // Set canvas dimensions to optimized size
      canvasRef.current.width = width;
      canvasRef.current.height = height;
          
      // Draw the current video frame with optimized dimensions
      context.drawImage(
        videoRef.current, 
        0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight,
        0, 0, width, height
      );

      // Get the image data with balanced quality (85% is a good balance between quality and file size)
      const imageDataUrl = canvasRef.current.toDataURL('image/jpeg', 0.85);
          
          // Verify the captured image
      if (imageDataUrl.length < 100 || imageDataUrl === 'data:,') {
        throw new Error('Captured image is invalid or too small');
          }

        setCapturedImage(imageDataUrl);
      setReadyToSend(true);
        stopCamera();
          
          toast({
            title: "Image Captured",
        description: "Your image has been captured and optimized for analysis.",
          });
        } catch (error) {
          console.error('Error capturing image:', error);
          toast({
            title: "Capture Error",
        description: "Failed to capture image. Please try again or use file upload instead.",
            variant: "destructive"
          });

      // Try to restart the camera if it failed
      try {
        startCamera();
      } catch (e) {
        console.error("Could not restart camera after failed capture:", e);
      }
        }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
        toast({
        title: "No file selected",
        description: "Please select an image file to upload",
          variant: "destructive"
        });
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid image file (JPEG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }
    
    // Validate file size (limit to 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result as string;
        
        // Validate that we got a valid result
        if (!result || result.length < 100) {
          toast({
            title: "Upload Error",
            description: "Failed to process the image. Please try another file.",
            variant: "destructive"
          });
          return;
        }
        
        // Resize and optimize the image for API use
        const img = new Image();
        img.onload = () => {
          try {
            // Create canvas for resizing
            const canvas = document.createElement('canvas');
            
            // Set max dimensions for the image (4MP is a good target for Gemini)
            const MAX_WIDTH = 2048;
            const MAX_HEIGHT = 2048;
            
            // Calculate dimensions while maintaining aspect ratio
            let width = img.width;
            let height = img.height;
            
            if (width > MAX_WIDTH) {
              height = Math.round(height * (MAX_WIDTH / width));
              width = MAX_WIDTH;
            }
            
            if (height > MAX_HEIGHT) {
              width = Math.round(width * (MAX_HEIGHT / height));
              height = MAX_HEIGHT;
            }
            
            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;
            
            // Draw resized image to canvas
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              throw new Error("Could not get canvas context");
            }
            
            ctx.drawImage(img, 0, 0, width, height);
            
            // Get optimized image as data URL (JPEG at 85% quality is a good balance)
            const optimizedImage = canvas.toDataURL('image/jpeg', 0.85);
            
            setUploadedImage(optimizedImage);
            setReadyToSend(true);
            
            toast({
              title: "Image uploaded",
              description: "Your image has been uploaded and optimized successfully",
            });
          } catch (resizeError) {
            console.error("Error resizing image:", resizeError);
            
            // Fall back to original image if resize fails
            setUploadedImage(result);
            setReadyToSend(true);
            
            toast({
              title: "Image uploaded",
              description: "Your image has been uploaded (optimization failed)",
            });
          }
        };
        
        img.onerror = () => {
          // If image loading fails, still try to use the raw data
          setUploadedImage(result);
          setReadyToSend(true);
          
          toast({
            title: "Image uploaded",
            description: "Your image has been uploaded (format may be suboptimal)",
            variant: "default"
          });
        };
        
        // Load the image from the FileReader result
        img.src = result;
      };
      
      reader.onerror = () => {
        toast({
          title: "Upload Error",
          description: "Failed to read the image file. Please try again.",
          variant: "destructive"
        });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload Error",
        description: "Failed to upload the image. Please try again.",
        variant: "destructive"
      });
    }
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  const resetUpload = () => {
    setUploadedImage(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Function to convert base64 to Uint8Array for Gemini
  const base64ToUint8Array = (base64: string) => {
    const binaryString = window.atob(base64.split(',')[1]);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const analyzeImage = async () => {
    setIsAnalyzing(true);
    const currentImage = activeTab === 'camera' ? capturedImage : uploadedImage;
    
    if (!currentImage) {
      setIsAnalyzing(false);
      toast({
        title: "No image available",
        description: "Please capture or upload an image first",
        variant: "destructive"
      });
      return;
    }

      // Get the condition data
      const selectedConditionData = conditions.find(c => c.id === selectedCondition);
      
      if (!selectedConditionData) {
      setIsAnalyzing(false);
      toast({
        title: "Error",
        description: "Selected condition not found",
        variant: "destructive"
      });
      return;
      }
      
    // Set an initial processing state
    setAnalysisResult("Analyzing image...");
    
    try {
      console.log("Initializing Gemini API for image analysis...");
      
      // Initialize the API with the working key
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      
      // Create a prompt for the AI
      const promptText = `You are a medical AI assistant analyzing an image. 
        Please analyze this image showing a potential ${selectedConditionData.name.toLowerCase()}. 
        ${selectedConditionData.prompt}
        
        Provide your analysis in the following EXACT format with these EXACT section headings:

        Assessment:
        [Detailed assessment of what you observe in the image, including any visible symptoms or conditions]

        Possible Causes:
        [List of potential causes or conditions, with brief explanations]

        Symptoms:
        [List all visible symptoms and any related symptoms typically associated with this condition]

        Treatment Plan:
        [Detailed recommended treatments and care instructions]

        Medications:
        [List specific medications or treatments that may be helpful]

        When to Seek Medical Help:
        [Clear criteria for when immediate medical attention is needed]

        IMPORTANT: Use EXACTLY these section headings and maintain clear spacing between sections for proper parsing.
        Be specific and clear in your analysis, focusing on what you can observe in the image.`;
      
      // Extract base64 data from data URL
      const base64ImageData = currentImage.split(',')[1];
      if (!base64ImageData) {
        throw new Error("Invalid image format");
      }
      
      console.log("Creating generative model...");
      
      // Create model with optimal parameters for medical analysis
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.2,  // Lower temperature for more accurate medical responses
          topK: 32,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      });
      
      console.log("Preparing content parts...");
      
      // Prepare content parts properly for the API
      const imagePart = {
        inlineData: {
          data: base64ImageData,
          mimeType: "image/jpeg"
        }
      };
      
      // Properly construct the prompt parts
      const parts = [
        { text: promptText },
        imagePart
      ];
      
      console.log("Sending request to Gemini API...");
      
      // Generate content with proper error handling
      try {
        const result = await model.generateContent(parts);
        console.log("Response received from Gemini API");
        
        const response = await result.response;
        const text = response.text();
        
        console.log("Successfully parsed response text");
        setAnalysisResult(text);
        
        toast({
          title: "Analysis Complete",
          description: "Your image has been successfully analyzed with AI",
        });
      } catch (apiError: any) {
        console.error("Gemini API error:", apiError);
        
        // Handle specific API errors
        if (apiError.message && apiError.message.includes("RESOURCE_EXHAUSTED")) {
          throw new Error("API quota exceeded. Please try again later.");
        } else if (apiError.message && apiError.message.includes("PERMISSION_DENIED")) {
          throw new Error("API access denied. Please check your API key.");
        } else if (apiError.message && (apiError.message.includes("deprecated") || apiError.message.includes("404"))) {
          // This handles model deprecation errors
          console.error("Model deprecation error detected");
          throw new Error("The AI model has been updated. Please contact the developer to update the application.");
      } else {
          throw apiError;
        }
      }
    } catch (error: any) {
      console.error('Error analyzing image with AI:', error);
      
      let errorMessage = "An unexpected error occurred while analyzing the image.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Analysis Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Set error in result
      setAnalysisResult(`We encountered an error while analyzing your image: ${errorMessage}
      
Please try again or contact support if this issue persists.`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Function to handle disease queries without images
  const handleDiseaseQuery = async (disease: string) => {
    if (!disease || disease.trim() === '') {
      toast({
        title: "Invalid query",
        description: "Please select a valid disease to query",
        variant: "destructive"
      });
      return;
    }
    
    setIsAnalyzing(true);
    
    // Predefined disease information for offline use
    const diseaseInfo: Record<string, string> = {
      "Common Cold": `
        **Common Cold**
        
        **Symptoms:**
        - Runny or stuffy nose
        - Sore throat
        - Cough
        - Congestion
        - Mild headache
        - Sneezing
        - Low-grade fever
        - Generally feeling unwell
        
        **Complications:**
        - Sinus infection
        - Middle ear infection
        - Asthma attacks in those with asthma
        - Development of secondary infections like bronchitis or pneumonia
        
        **Contagiousness:**
        Highly contagious, especially during the first 2-3 days of symptoms. Spreads through airborne droplets when infected people cough or sneeze, or through hand contact.
        
        **Treatments:**
        - Rest and adequate hydration
        - Over-the-counter pain relievers like acetaminophen or ibuprofen
        - Decongestants for nasal congestion
        - Cough suppressants for persistent cough
        - Throat lozenges for sore throat
        - Humidifier to add moisture to the air
        
        **Prevention:**
        - Frequent handwashing with soap and water
        - Avoid close contact with sick individuals
        - Don't touch your face with unwashed hands
        - Clean and disinfect frequently touched surfaces
        - Use tissues when coughing or sneezing and dispose of them properly
        
        **When to see a doctor:**
        - Fever above 101.3°F (38.5°C) lasting more than 3 days
        - Symptoms lasting more than 10 days without improvement
        - Severe symptoms such as difficulty breathing or severe headache
        - Symptoms that worsen rather than improve
        - If you have underlying health conditions like asthma or immunosuppression
      `,
      
      "Fever": `
        **Fever**
        
        **Symptoms:**
        - Elevated body temperature (above 100.4°F or 38°C)
        - Sweating or chills
        - Headache
        - Muscle aches
        - Loss of appetite
        - Dehydration
        - Weakness and fatigue
        - Irritability
        
        **Complications:**
        - Dehydration
        - Extreme discomfort
        - Febrile seizures (in some children)
        - In very high fevers (above 104°F/40°C), potential for brain damage if prolonged
        
        **Contagiousness:**
        Fever itself is not contagious, but the underlying condition causing the fever may be.
        
        **Treatments:**
        - Over-the-counter fever reducers like acetaminophen or ibuprofen
        - Rest
        - Stay hydrated with water, clear broths, or sports drinks
        - Dress in lightweight clothing
        - Use a light blanket if experiencing chills
        - Sponge bath with lukewarm water
        
        **Prevention:**
        Prevention depends on the underlying cause of fever:
        - Regular handwashing
        - Avoiding close contact with sick individuals
        - Staying up to date on vaccinations
        - Practicing food safety
        
        **When to see a doctor:**
        - Infants under 3 months with any fever
        - Children with fever lasting more than 3 days
        - Adults with fever above 103°F (39.4°C)
        - Fever accompanied by severe headache, stiff neck, confusion
        - Fever with rash, especially if the rash doesn't fade when pressed
        - Persistent fever (lasting more than 3 days in adults)
        - Fever in someone with a compromised immune system
      `,
      
      "Cough": `
        **Cough**
        
        **Symptoms:**
        - Persistent urge to clear the throat
        - Dry (non-productive) or wet (productive with mucus) cough
        - Tickling sensation in throat
        - Post-nasal drip
        - Sore throat from coughing
        - Chest discomfort
        - Shortness of breath (in some cases)
        - Wheezing (in some cases)
        
        **Complications:**
        - Disruption of sleep
        - Headaches from persistent coughing
        - Muscle strain in chest/abdomen
        - Broken ribs (in severe, prolonged cases)
        - Exhaustion
        - Aggravation of underlying conditions like asthma
        
        **Contagiousness:**
        Depends on the cause. If from infections like cold or flu, can be highly contagious. Non-contagious if from allergies, asthma, or environmental irritants.
        
        **Treatments:**
        - For dry coughs: cough suppressants (dextromethorphan)
        - For productive coughs: expectorants (guaifenesin)
        - Honey (for adults and children over 1 year)
        - Throat lozenges
        - Humidifier to add moisture to the air
        - Staying hydrated
        - Treating underlying causes (antibiotics for bacterial infections, inhalers for asthma)
        
        **Prevention:**
        - Stay hydrated
        - Avoid known triggers (allergens, smoke, pollution)
        - Use air filters in home
        - Quit smoking
        - Practice good hand hygiene to prevent infectious causes
        
        **When to see a doctor:**
        - Cough lasting more than 3 weeks
        - Coughing up blood
        - Cough with high fever
        - Wheezing, shortness of breath, or difficulty breathing
        - Cough with unexplained weight loss
        - Cough that disrupts sleep or daily activities
        - Coughing that produces thick, green or yellow mucus
      `,
      
      "Flu": `
        **Flu (Influenza)**
        
        **Symptoms:**
        - Sudden onset of fever, chills
        - Muscle aches and body pains
        - Headache
        - Fatigue and weakness
        - Dry cough
        - Sore throat
        - Runny or stuffy nose
        - Reduced appetite
        - In children: nausea, vomiting, diarrhea
        
        **Complications:**
        - Pneumonia
        - Bronchitis
        - Sinus infections
        - Ear infections
        - Worsening of chronic health conditions
        - In severe cases: respiratory failure, sepsis, inflammation of heart/brain/muscle tissues
        
        **Contagiousness:**
        Highly contagious. Spread through respiratory droplets when talking, coughing, or sneezing. Contagious from 1 day before symptoms appear until 5-7 days after.
        
        **Treatments:**
        - Rest and adequate hydration
        - Over-the-counter pain relievers (acetaminophen, ibuprofen)
        - Antiviral medications (oseltamivir/Tamiflu) if started within 48 hours
        - Decongestants for nasal symptoms
        - Humidifier to ease congestion
        - Avoiding contact with others to prevent spread
        
        **Prevention:**
        - Annual flu vaccination
        - Regular handwashing
        - Avoiding close contact with sick people
        - Staying home when sick
        - Covering coughs and sneezes
        - Regular cleaning of frequently touched surfaces
        
        **When to see a doctor:**
        - Difficulty breathing or shortness of breath
        - Pain or pressure in chest or abdomen
        - Sudden dizziness or confusion
        - Severe or persistent vomiting
        - Flu-like symptoms that improve but then return with fever and worse cough
        - High fever lasting more than 3 days
        - In high-risk individuals (pregnant, elderly, young children, immunocompromised) even mild symptoms warrant medical attention
      `,
      
      "Headache": `
        **Headache**
        
        **Symptoms:**
        - Pain in head or face
        - Throbbing, squeezing, constant, or intermittent pain
        - Pain on one or both sides of the head
        - Pain that worsens with physical activity
        - Sensitivity to light or sound (in some types)
        - Nausea or vomiting (in some types)
        
        **Types and Complications:**
        - Tension headaches: Generally mild; rarely cause complications
        - Migraines: Can cause significant disability and disruption to daily life
        - Cluster headaches: Extremely painful; can lead to depression due to pain severity
        - Secondary headaches: May indicate serious underlying conditions like brain tumors, aneurysms, or meningitis
        
        **Contagiousness:**
        Headaches themselves are not contagious.
        
        **Treatments:**
        - Over-the-counter pain relievers (acetaminophen, ibuprofen, aspirin)
        - Rest in a quiet, dark room
        - Cold or warm compresses
        - Massage of head, neck, shoulders
        - Adequate hydration
        - Prescription medications for specific headache types
        - Stress management techniques
        - For migraines: triptans, preventive medications
        
        **Prevention:**
        - Identify and avoid triggers
        - Maintain regular sleep schedule
        - Stay hydrated
        - Exercise regularly
        - Practice stress management
        - Limit alcohol and caffeine
        - Maintain good posture
        - Take regular breaks from screens
        
        **When to see a doctor:**
        - "Worst headache of your life"
        - Headache with fever, stiff neck, confusion, seizure, double vision
        - Headache after head injury
        - Chronic or recurrent headaches
        - Headache that worsens over days or changes in pattern
        - Headaches that wake you from sleep
        - Headaches with weakness, numbness, or difficulty speaking
        - New headaches in people over 50 or with cancer/HIV
      `
    };
    
    // Set a "processing" state first
    setAnalysisResult("Retrieving information...");
    
    try {
      // First try the predefined info
      if (diseaseInfo[disease]) {
        setAnalysisResult(diseaseInfo[disease]);
        
        toast({
          title: "Information Retrieved",
          description: `Information about ${disease} has been loaded`,
        });
        return;
      }
      
      // If not in our predefined list, try the API
      try {
        console.log("Attempting to query Gemini API for disease information...");
        
        // Initialize the Gemini API
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        
        // Create a prompt for disease information
        const diseasePrompt = `You are a medical AI assistant providing information about ${disease}.
          
          Please cover the following aspects:
          1. What are the common symptoms of ${disease}?
          2. What complications can arise from ${disease} if left untreated?
          3. How contagious is this condition (if applicable)?
          4. What are the recommended treatments for ${disease}?
          5. What preventive measures should be taken?
          6. When should someone with ${disease} see a doctor?
          
          Format your response in a clear, conversational way that's easy for patients to understand.`;

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Request timed out")), 10000);
        });
        
        // Create the API request promise
        const apiRequestPromise = (async () => {
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
          const result = await model.generateContent(diseasePrompt);
          const response = await result.response;
          return response.text();
        })();

        // Race between the API call and the timeout
        const apiResponse = await Promise.race([apiRequestPromise, timeoutPromise]);
        
        // If we got here, API call succeeded
        setAnalysisResult(apiResponse as string);
        
      toast({
          title: "Information Retrieved",
          description: `Information about ${disease} has been generated`,
        });
      } catch (apiError) {
        // API call failed, provide generic information
        console.error("Gemini API error for disease query:", apiError);
        
        setAnalysisResult(`
          **${disease}**
          
          We couldn't retrieve specific details about ${disease} at this time.
          
          **General health guidance:**
          
          - If you're experiencing symptoms, monitor their severity and duration
          - Rest and stay hydrated when feeling unwell
          - For mild symptoms, over-the-counter medications may provide relief
          - Wash hands frequently and maintain good hygiene
          - Avoid close contact with others if you suspect a contagious condition
          - If symptoms are severe or persistent, consult a healthcare professional
          
          For accurate diagnosis and treatment of ${disease}, please consult a qualified healthcare provider.
        `);
        
      toast({
          title: "Limited Information",
          description: "Using general guidance for this condition",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error retrieving disease information:', error);
      
      setAnalysisResult(`
        **${disease}**
        
        We're sorry, but we couldn't retrieve information about ${disease} at this time.
        
        **General health advice:**
        - If you're experiencing concerning symptoms, please consult a healthcare professional
        - For mild symptoms, rest and stay hydrated
        - If symptoms worsen, seek medical attention promptly
        
        For accurate diagnosis and treatment, please consult a qualified healthcare provider.
      `);
      
      toast({
        title: "Information Error",
        description: "Could not retrieve disease information",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle tab change with proper typing
  const handleTabChange = (value: TabValue) => {
    setActiveTab(value);
  };

  // Add a new component for rendering analysis results
  const AnalysisResults: React.FC<{ analysisText: string }> = ({ analysisText }) => {
    // Process the message to extract structured sections
    const {
      mainText,
      detection,
      consequences,
      advice,
      treatmentPlan,
      medications,
      symptoms,
      websites,
      medicalState
    } = processMessage(analysisText);

    // Check if we have structured sections
    const hasStructuredSections = detection || consequences || advice || 
                               (medications && medications.length > 0) || 
                               (symptoms && symptoms.length > 0) || 
                               treatmentPlan || medicalState;

    return (
      <div className="text-sm flex-1 space-y-4 max-w-none">
        {/* Only show mainText if we don't have structured sections */}
        {mainText && !hasStructuredSections && (
          <div className="whitespace-pre-wrap">
            {mainText}
          </div>
        )}
        
        {detection && (
          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400 shadow-sm">
            <div className="flex items-center gap-2 font-medium text-blue-700 mb-2">
              <ClipboardList size={18} className="text-blue-600" />
              Assessment
            </div>
            <div className="text-gray-700 leading-relaxed">
              {detection}
            </div>
          </div>
        )}

        {consequences && (
          <div className="bg-pink-50 rounded-lg p-4 border-l-4 border-pink-400 shadow-sm">
            <div className="flex items-center gap-2 font-medium text-pink-700 mb-2">
              <AlertCircle size={18} className="text-pink-600" />
              Possible Causes
            </div>
            <div className="text-gray-700 leading-relaxed">
              {consequences}
            </div>
          </div>
        )}

        {symptoms && symptoms.length > 0 && (
          <div className="bg-sky-50 rounded-lg p-4 border-l-4 border-sky-400 shadow-sm">
            <div className="flex items-center gap-2 font-medium text-sky-700 mb-2">
              <Thermometer size={18} className="text-sky-600" />
              Symptoms
            </div>
            <div className="text-gray-700">
              <ul className="space-y-2">
                {symptoms.map((symptom, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CircleDot size={12} className="mt-1.5 text-sky-600" />
                    <span className="leading-relaxed">{symptom}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {(treatmentPlan || advice) && (
          <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400 shadow-sm">
            <div className="flex items-center gap-2 font-medium text-green-700 mb-2">
              <Clipboard size={18} className="text-green-600" />
              Treatment Plan
            </div>
            <div className="text-gray-700 leading-relaxed">
              {treatmentPlan || advice}
            </div>
          </div>
        )}

        {medications && medications.length > 0 && (
          <div className="bg-emerald-50 rounded-lg p-4 border-l-4 border-emerald-400 shadow-sm">
            <div className="flex items-center gap-2 font-medium text-emerald-700 mb-2">
              <PillIcon size={18} className="text-emerald-600" />
              Medications
            </div>
            <div className="text-gray-700">
              <ul className="space-y-2">
                {medications.map((medication, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CircleDot size={12} className="mt-1.5 text-emerald-600" />
                    <span className="leading-relaxed">{medication}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {advice && !treatmentPlan && (
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-amber-400 shadow-sm">
            <div className="flex items-center gap-2 font-medium text-amber-700 mb-2">
              <LightbulbIcon size={18} className="text-amber-500" />
              Recommendations
            </div>
            <div className="text-gray-700 leading-relaxed">
              {advice}
            </div>
          </div>
        )}

        {websites && websites.length > 0 && (
          <div className="bg-indigo-50 rounded-lg p-4 border-l-4 border-indigo-400 shadow-sm">
            <div className="flex items-center gap-2 font-medium text-indigo-700 mb-2">
              <Globe size={18} className="text-indigo-600" />
              Helpful Resources
            </div>
            <div className="text-gray-700">
              <ul className="space-y-2">
                {websites.map((website, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CircleDot size={12} className="mt-1.5 text-indigo-600" />
                    <a 
                      href={website.startsWith('http') ? website : `https://${website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline leading-relaxed"
                    >
                      {website}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {medicalState && (
          <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-400 shadow-sm">
            <div className="flex items-center gap-2 font-medium text-red-700 mb-2">
              <AlertTriangle size={18} className="text-red-600" />
              When to Seek Medical Help
            </div>
            <div className="text-gray-700 leading-relaxed">
              {medicalState}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${standalone ? 'container mx-auto p-4 space-y-6' : 'space-y-4'} bg-white`}>
      {standalone && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-primary">Camera Diagnostics</h2>
            <p className="text-muted-foreground">Analyze visible symptoms through photos</p>
          </div>
        </div>
      )}

      <div className={`grid ${standalone ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'} gap-4`}>
        {/* Left column - Camera/Upload UI */}
        <div className={standalone ? 'md:col-span-2' : ''}>
          <Card className="overflow-hidden border border-gray-200">
            <CardHeader className="bg-gradient-to-r from-primary-50 to-primary-100 p-4">
              <CardTitle className="text-lg">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="camera" className="w-full">Use Camera</TabsTrigger>
                    <TabsTrigger value="upload" className="w-full">Upload Photo</TabsTrigger>
                  </TabsList>
                
                  <TabsContent value="camera" className="mt-4">
                    {!capturedImage ? (
                      <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video flex items-center justify-center min-h-[300px]">
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          muted
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                        <Button 
                          onClick={captureImage}
                            className="bg-primary-600 hover:bg-primary-700"
                            size="lg"
                        >
                            <Camera className="mr-2 h-5 w-5" />
                            Capture
                        </Button>
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                      </div>
                    ) : (
                      <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video min-h-[300px]">
                        <img 
                          src={capturedImage} 
                          alt="Captured" 
                          className="w-full h-full object-contain"
                        />
                        <Button 
                          onClick={resetCapture}
                          variant="outline"
                          className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full bg-white hover:bg-gray-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="upload" className="mt-4">
                    {!uploadedImage ? (
                      <div className="bg-gray-100 rounded-lg p-8 text-center min-h-[300px] flex items-center justify-center">
                        <div className="mx-auto flex flex-col items-center justify-center">
                          <div className="mb-4 rounded-full bg-primary-100 p-3">
                            <Upload className="h-6 w-6 text-primary-600" />
                          </div>
                          <h3 className="mb-2 text-lg font-semibold">Upload an Image</h3>
                          <p className="mb-4 text-sm text-gray-500">
                            Take a clear, well-lit photo of the area to analyze
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                          <Button 
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-primary-600 hover:bg-primary-700"
                          >
                            <FileImage className="mr-2 h-4 w-4" />
                            Browse Files
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video min-h-[300px]">
                        <img 
                          src={uploadedImage} 
                          alt="Uploaded" 
                          className="w-full h-full object-contain"
                        />
                        <Button 
                          onClick={resetUpload}
                          variant="outline"
                          className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full bg-white hover:bg-gray-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardTitle>
            </CardHeader>
          </Card>
          
          {(capturedImage || uploadedImage) && (
            <Card className="mt-4 border border-gray-200">
              <CardContent className="p-4">
                <Button 
                  onClick={analyzeImage}
                  className="w-full bg-primary-600 hover:bg-primary-700"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Image...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Analyze Image
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
          
          {standalone && commonDiseases.length > 0 && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quick Disease Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {commonDiseases.map(disease => (
                    <Button 
                      key={disease} 
                      variant="outline"
                      size="sm"
                      onClick={() => handleDiseaseQuery(disease)}
                      disabled={isAnalyzing}
                      className="border-primary-200 hover:border-primary-300"
                    >
                      {disease}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {isAnalyzing && (
            <Card className="mt-4 border border-gray-200">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-600 mb-4" />
                  <h3 className="text-lg font-medium">Analyzing...</h3>
                  <p className="text-sm text-gray-500 mt-1">Getting AI-powered insights</p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {analysisResult && !isAnalyzing && (
            <Card className="mt-4 border border-primary-200 shadow-sm">
              <CardHeader className="bg-primary-50 pb-2 border-b border-primary-100">
                <CardTitle className="flex items-center text-primary-700 text-lg">
                  <MessageSquare className="mr-2 h-5 w-5 text-primary-600" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 overflow-auto max-h-[500px]">
                <AnalysisResults analysisText={analysisResult} />
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Right column - Condition selector */}
        <div className={standalone ? 'md:col-span-1' : ''}>
            <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Select Condition to Analyze</CardTitle>
              </CardHeader>
            <CardContent className="space-y-4">
                  {conditions.map((condition) => (
                    <div
                      key={condition.id}
                  className={`p-3 rounded-md cursor-pointer border transition-all ${
                        selectedCondition === condition.id
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedCondition(condition.id)}
                    >
                  <h3 className="font-medium text-sm mb-1">{condition.name}</h3>
                  <p className="text-xs text-gray-500">{condition.description}</p>
                  {condition.requiresUrgentCare && (
                    <div className="flex items-center mt-2 text-amber-600">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      <span className="text-xs">May require urgent care</span>
                        </div>
                      )}
                    </div>
                  ))}
              </CardContent>
            </Card>
          
          {selectedCondition && conditions.find(c => c.id === selectedCondition)?.requiresUrgentCare && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600">
                This condition may require immediate medical attention. While we can provide initial guidance,
                please be prepared to seek emergency care if needed.
              </AlertDescription>
            </Alert>
          )}
          </div>
      </div>
    </div>
  );
};

export default CameraDiagnostics; 