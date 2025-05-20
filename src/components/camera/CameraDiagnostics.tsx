import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, Eye, FileImage, ArrowRight, Stethoscope, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [activeTab, setActiveTab] = useState('camera');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState('');
  const [readyToSend, setReadyToSend] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [selectedCondition, setSelectedCondition] = useState(conditions[0].id);

  // Start camera when component mounts or tab changes
  React.useEffect(() => {
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

  const analyzeImage = () => {
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

    if (standalone) {
      // Simulate AI analysis with a timeout
      setTimeout(() => {
        const selectedConditionData = conditions.find(c => c.id === selectedCondition);
        
        // Enhanced analysis results with severity levels and specific guidance
        const analysisResults = {
          snakebite: {
            severity: 'emergency' as SeverityLevel,
            analysis: "URGENT: The image shows signs consistent with a venomous snake bite. There is visible swelling and fang marks.\n\nIMMEDIATE ACTIONS REQUIRED:\n1. Keep the affected area below heart level\n2. Remove any constricting items (jewelry, tight clothing)\n3. Seek immediate emergency medical care\n4. Do NOT apply a tourniquet or try to suck out the venom\n\nThis is a medical emergency - please call emergency services or go to the nearest hospital immediately.",
          },
          skin: {
            severity: 'medium' as SeverityLevel,
            analysis: "The skin condition shows signs of contact dermatitis with moderate inflammation. Key observations:\n\n- Redness and mild swelling present\n- No signs of severe infection\n- Pattern suggests allergic reaction\n\nRECOMMENDED ACTIONS:\n1. Avoid scratching and potential triggers\n2. Apply cool compress for comfort\n3. Consider over-the-counter hydrocortisone cream\n4. If symptoms worsen or persist beyond 48 hours, consult a healthcare provider",
          },
          wound: {
            severity: 'medium' as SeverityLevel,
            analysis: "The wound appears to be a moderate laceration with these characteristics:\n\n- Clean edges with minimal debris\n- No signs of serious infection\n- Moderate depth\n\nRECOMMENDED CARE:\n1. Clean thoroughly with soap and water\n2. Apply antibiotic ointment\n3. Keep covered with sterile dressing\n4. Monitor for signs of infection (increased redness, warmth, pus)\n\nSeek medical attention if the wound is deep, shows signs of infection, or you're not up to date on tetanus shots.",
          },
          eye: {
            severity: 'medium' as SeverityLevel,
            analysis: "The eye shows signs of conjunctivitis (pink eye) with these observations:\n\n- Moderate redness of the conjunctiva\n- Some discharge present\n- No severe swelling\n\nRECOMMENDED ACTIONS:\n1. Avoid touching or rubbing eyes\n2. Use artificial tears for comfort\n3. Apply warm compresses\n4. If symptoms worsen or vision changes occur, seek immediate medical attention",
          }
        };

        const result = analysisResults[selectedCondition as keyof typeof analysisResults];
        
        // Add severity warning for urgent conditions
        if (selectedConditionData?.requiresUrgentCare) {
          setAnalysisResult(`⚠️ URGENT MEDICAL ATTENTION RECOMMENDED ⚠️\n\n${result.analysis}`);
        } else {
          setAnalysisResult(result.analysis);
        }
        
        setIsAnalyzing(false);
      }, 2000);
    } else {
      // Handle integration mode
      const selectedConditionData = conditions.find(c => c.id === selectedCondition);
      const autoDescription = `Medical analysis requested for ${selectedConditionData?.name.toLowerCase()}. ${selectedConditionData?.prompt}`;
      setImageDescription(prev => prev || autoDescription);
      setReadyToSend(true);
      setIsAnalyzing(false);
    }
  };

  // Function to send image to DrCureCastAI
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
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="camera" className="w-full">Use Camera</TabsTrigger>
                    <TabsTrigger value="upload" className="w-full">Upload Photo</TabsTrigger>
                  </TabsList>
                  <TabsContent value="camera" className="mt-0">
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
                  <TabsContent value="upload" className="mt-0">
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
            <CardContent className="p-4" />
          </Card>
          
          {(capturedImage || uploadedImage) && !analysisResult && (
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
          
          {standalone && analysisResult && (
            <Card className="bg-gradient-to-br from-green-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Analysis Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{analysisResult}</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        {standalone && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Condition to Analyze</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conditions.map(condition => (
                    <div 
                      key={condition.id}
                      className={`p-3 rounded-lg cursor-pointer border ${
                        selectedCondition === condition.id
                          ? 'bg-primary-50 border-primary-200'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedCondition(condition.id)}
                    >
                      <Label className="font-medium flex items-center">
                        <input
                          type="radio"
                          name="condition"
                          className="mr-2"
                          checked={selectedCondition === condition.id}
                          onChange={() => setSelectedCondition(condition.id)}
                        />
                        {condition.name}
                      </Label>
                      <p className="text-xs text-gray-500 ml-5">{condition.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {selectedCondition && (
              <Card className="bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-primary" />
                    Guidance for {conditions.find(c => c.id === selectedCondition)?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-4">
                    {conditions.find(c => c.id === selectedCondition)?.prompt}
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Please also provide:</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {conditions.find(c => c.id === selectedCondition)?.followUpQuestions.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle>Tips for Better Results</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="mr-2 text-primary">•</span>
                    Ensure good lighting when taking photos
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-primary">•</span>
                    Keep the camera steady and focused
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-primary">•</span>
                    Include only the affected area in frame
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-primary">•</span>
                    Take multiple angles if needed
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-primary">•</span>
                    Make sure there's no glare or shadows
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraDiagnostics; 