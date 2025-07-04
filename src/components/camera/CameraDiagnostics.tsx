import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Loader2, Eye, FileImage, ArrowRight, Stethoscope, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from '@/config/api';

interface CameraDiagnosticsProps {
  standalone?: boolean;
  onImageCaptured?: (imageUrl: string, description: string) => void;
}

// Define severity levels
type SeverityLevel = 'low' | 'medium' | 'high' | 'emergency';

interface ConditionType {
  id: string;
  name: string;
  description: string;
  prompt: string;
  followUpQuestions: string[];
  requiresUrgentCare: boolean;
}

const CameraDiagnostics: React.FC<CameraDiagnosticsProps> = ({ standalone = true, onImageCaptured }) => {
  const { toast } = useToast();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  type TabValue = 'camera' | 'upload';
  const [activeTab, setActiveTab] = useState<TabValue>('camera');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState('');
  const [readyToSend, setReadyToSend] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Gemini AI
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Enhanced conditions with medical focus
  const conditions: ConditionType[] = [
    {
      id: 'snakebite',
      name: 'Snake Bite Analysis',
      description: 'Urgent assessment of snake bites for immediate care guidance',
      prompt: 'Please take a clear photo of the bite area. If possible, capture any visible fang marks or swelling.',
      followUpQuestions: [
        'When did the bite occur?',
        'Did you see the snake? If yes, describe its color and pattern',
        'Are you experiencing any numbness, dizziness, or difficulty breathing?'
      ],
      requiresUrgentCare: true
    },
    {
      id: 'skin',
      name: 'Skin Condition Assessment',
      description: 'Analyze rashes, infections, allergic reactions, or other skin concerns',
      prompt: 'Take a well-lit photo of the affected area. Try to include some surrounding healthy skin for comparison.',
      followUpQuestions: [
        'When did you first notice these symptoms?',
        'Is there any itching, burning, or pain?',
        'Have you used any medications on the area?'
      ],
      requiresUrgentCare: false
    },
    {
      id: 'wound',
      name: 'Wound Assessment',
      description: 'Evaluate cuts, scrapes, burns, or other injuries',
      prompt: 'Capture a clear image of the wound. If possible, include something for size reference.',
      followUpQuestions: [
        'How did the injury occur?',
        'Is there active bleeding or discharge?',
        'When was your last tetanus shot?'
      ],
      requiresUrgentCare: false
    },
    {
      id: 'eye',
      name: 'Eye Condition Analysis',
      description: 'Check eye redness, swelling, or other visible symptoms',
      prompt: 'Take a well-lit photo of the affected eye. Ensure the image is clear and in focus.',
      followUpQuestions: [
        'Do you have any pain or vision changes?',
        'Is there any discharge or tearing?',
        'Are both eyes affected?'
      ],
      requiresUrgentCare: false
    }
  ];

  const [selectedCondition, setSelectedCondition] = useState<string>('skin');

  // Start camera when component mounts or tab changes
  useEffect(() => {
    if (activeTab === 'camera') {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
      startCamera();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab]);

  const startCamera = async () => {
    try {
      if (videoRef.current) {
        // First stop any existing stream
        stopCamera();
        
        // Request camera with specific constraints
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });

        // Set the stream to video element
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element not found'));
            return;
          }

          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play()
                .then(resolve)
                .catch(reject);
            }
          };

          videoRef.current.onerror = (error) => {
            reject(error);
          };
        });

        // Add error handling for video element
        videoRef.current.onerror = (error) => {
          console.error('Video element error:', error);
          toast({
            title: "Camera Error",
            description: "There was an error accessing your camera. Please check your camera permissions and try again.",
            variant: "destructive"
          });
        };

      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to use this feature. You can change this in your browser settings.",
        variant: "destructive"
      });
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
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');

      if (context) {
        try {
          // Set canvas dimensions to match video
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
          
          // Draw the current video frame
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

          // Get the image data with high quality
          const imageDataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
          
          // Verify the captured image
          if (imageDataUrl.length < 100) {
            throw new Error('Captured image is too small or invalid');
          }

        setCapturedImage(imageDataUrl);
        stopCamera();
          
          toast({
            title: "Image Captured",
            description: "Your image has been captured successfully.",
          });
        } catch (error) {
          console.error('Error capturing image:', error);
          toast({
            title: "Capture Error",
            description: "Failed to capture image. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Canvas Error",
          description: "Unable to initialize canvas for image capture.",
          variant: "destructive"
        });
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };

      reader.readAsDataURL(file);
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

    try {
      // Get the condition data
      const selectedConditionData = conditions.find(c => c.id === selectedCondition);
      
      if (!selectedConditionData) {
        throw new Error("Selected condition not found");
      }
      
      // Create a special prompt that will cause highlighting in the chat
      const highlightPrompt = `HIGHLIGHT:${selectedConditionData.name}:ANALYZE THIS IMAGE:
        Please analyze this image showing a potential ${selectedConditionData.name.toLowerCase()}. 
        ${selectedConditionData.prompt}
        
        HIGHLIGHT_CONSEQUENCES:
        - What are the potential consequences if untreated?
        - How serious is this condition?
        
        HIGHLIGHT_ADVICE:
        - What treatment is recommended?
        - When should the patient seek professional care?`;
      
      // Send to the chat using the existing function
      if (window && (window as any).drCureCastHandleCameraInput) {
        (window as any).drCureCastHandleCameraInput(
          currentImage,
          highlightPrompt
        );
        
        toast({
          title: "Image Analysis Sent",
          description: `Analyzing for ${selectedConditionData.name} in chat window`,
        });
      } else {
        throw new Error("Chat function not available");
      }
    } catch (error) {
      console.error('Error sending to chat:', error);
      toast({
        title: "Error",
        description: "Failed to send image to chat",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Function to handle disease queries without images
  const handleDiseaseQuery = (disease: string) => {
    try {
      // Create a special highlighting prompt for diseases
      const diseasePrompt = `HIGHLIGHT:${disease}:DISEASE INFO:
        Please provide information about ${disease}.
        
        HIGHLIGHT_CONSEQUENCES:
        - What are the symptoms of ${disease}?
        - What complications can arise from ${disease}?
        - How contagious is this condition?
        
        HIGHLIGHT_ADVICE:
        - What are the recommended treatments for ${disease}?
        - What preventive measures should be taken?
        - When should someone with ${disease} see a doctor?`;
      
      // Send to chat without an image
      if (window && (window as any).drCureCastHandleCameraInput) {
        (window as any).drCureCastHandleCameraInput(null, diseasePrompt);
        
        toast({
          title: "Disease Query Sent",
          description: `Information about ${disease} will appear in chat`,
        });
      } else {
        throw new Error("Chat function not available");
      }
    } catch (error) {
      console.error('Error with disease query:', error);
      toast({
        title: "Error",
        description: "Failed to query disease information",
        variant: "destructive"
      });
    }
  };
  
  // List of common diseases for quick access
  const commonDiseases = [
    "Common Cold", 
    "Fever", 
    "Cough", 
    "Flu",
    "Headache"
  ];

  // Helper function to convert data URL to Blob
  const dataURLtoBlob = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Function to send image to DrCureCast
  const sendToDrCureCast = () => {
    const currentImage = activeTab === 'camera' ? capturedImage : uploadedImage;
    if (!currentImage) return;

    // Create a detailed description for the AI
    const conditionText = selectedCondition === 'rash' ? 'skin rash or irritation' : 
                         selectedCondition === 'eye' ? 'eye condition or irritation' : 
                         selectedCondition === 'tongue' ? 'tongue appearance' : 'wound or injury';
    
    const defaultDescription = `Please analyze this image of my ${conditionText}. I need a medical assessment, possible causes, and advice on treatment or when to see a doctor.`;
    
    const finalDescription = imageDescription.trim() || defaultDescription;

    // If we have an external handler, use it
    if (onImageCaptured) {
      onImageCaptured(currentImage, finalDescription);
      setReadyToSend(false);
      toast({
        title: "Image sent",
        description: "Your image has been sent to Dr. CureCast for analysis",
      });
      
      // Reset the form after sending
      if (activeTab === 'camera') {
        resetCapture();
      } else {
        resetUpload();
      }
      setImageDescription('');
      
    } else if (window && (window as any).drCureCastHandleCameraInput) {
      // Use the global method if available
      (window as any).drCureCastHandleCameraInput(
        currentImage, 
        finalDescription
      );
      setReadyToSend(false);
      toast({
        title: "Image sent",
        description: "Your image has been sent to Dr. CureCast for analysis",
      });
      
      // Reset the form after sending
      if (activeTab === 'camera') {
        resetCapture();
      } else {
        resetUpload();
      }
      setImageDescription('');
    }
  };

  // Handle tab change with proper typing
  const handleTabChange = (value: TabValue) => {
    setActiveTab(value);
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
                        <canvas ref={canvasRef} className="hidden" />
                        <Button 
                          onClick={captureImage}
                          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-primary-600 hover:bg-primary-700"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Capture Photo
                        </Button>
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
                      Send to AI Chat
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
                      className="border-primary-200 hover:border-primary-300"
                    >
                      {disease}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {readyToSend && (activeTab === 'camera' ? capturedImage : uploadedImage) && (
            <Card className="mt-4 border border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span>Add description (optional):</span>
                  <Button 
                    onClick={sendToDrCureCast} 
                    className="bg-primary-600 hover:bg-primary-700 text-white"
                    size="sm"
                  >
                    Send to Dr.CureCast
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Describe what you'd like Dr.CureCast to analyze in this image..."
                  value={imageDescription}
                  onChange={(e) => setImageDescription(e.target.value)}
                  className="min-h-[80px]"
                />
              </CardContent>
            </Card>
          )}
          
          {selectedCondition && conditions.find(c => c.id === selectedCondition)?.requiresUrgentCare && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600">
                This condition may require immediate medical attention. While we can provide initial guidance,
                please be prepared to seek emergency care if needed.
              </AlertDescription>
            </Alert>
          )}
          
          {analysisResult && (
            <Card className="mt-4 bg-gradient-to-br from-green-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="whitespace-pre-wrap text-gray-700">{analysisResult}</div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {standalone && (
          <div className="md:col-span-1">
            <Card className="border border-gray-200">
              <CardHeader className="bg-gradient-to-r from-primary-50 to-primary-100">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Select Condition
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {conditions.map((condition) => (
                    <div
                      key={condition.id}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedCondition === condition.id
                          ? 'bg-primary-100 border-2 border-primary-500'
                          : 'bg-gray-50 border border-gray-200 hover:border-primary-300'
                      }`}
                      onClick={() => setSelectedCondition(condition.id)}
                    >
                      <h3 className="font-semibold mb-1">{condition.name}</h3>
                      <p className="text-sm text-gray-600">{condition.description}</p>
                      {selectedCondition === condition.id && (
                        <div className="mt-3 text-sm text-primary-700">
                          <p className="font-medium">Guidance:</p>
                          <p>{condition.prompt}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraDiagnostics; 