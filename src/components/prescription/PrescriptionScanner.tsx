import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, FileText, Scan, AlertCircle, CheckCircle, Loader2, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { prescriptionOCRService, PrescriptionData } from '@/services/prescriptionOCRService';
import { useToast } from '@/components/ui/use-toast';

interface PrescriptionScannerProps {
  onClose?: () => void;
}

const PrescriptionScanner: React.FC<PrescriptionScannerProps> = ({ onClose }) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');
  const [interactions, setInteractions] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = prescriptionOCRService.validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Process the image
      const data = await prescriptionOCRService.processPrescriptionImage(file);
      setPrescriptionData(data);

      // Check for interactions
      const warnings = await prescriptionOCRService.getMedicineInteractions(data.medicines);
      setInteractions(warnings);

      toast({
        title: "Prescription Processed Successfully",
        description: `Extracted ${data.medicines.length} medicine(s) from your prescription.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process prescription';
      setError(errorMessage);
      toast({
        title: "Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraActive(true);
        setError(null);
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to scan prescriptions.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  }, [stream]);

  // Capture photo
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setSelectedImage(imageDataUrl);
    
    stopCamera();
    setIsProcessing(true);

    try {
      const data = await prescriptionOCRService.processCameraCapture(imageDataUrl);
      setPrescriptionData(data);

      const warnings = await prescriptionOCRService.getMedicineInteractions(data.medicines);
      setInteractions(warnings);

      toast({
        title: "Photo Captured & Processed",
        description: `Extracted ${data.medicines.length} medicine(s) from your prescription.`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process captured image';
      setError(errorMessage);
      toast({
        title: "Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [stopCamera, toast]);

  // Reset scanner
  const resetScanner = useCallback(() => {
    setPrescriptionData(null);
    setSelectedImage(null);
    setError(null);
    setInteractions([]);
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [stopCamera]);

  // Download results as JSON
  const downloadResults = useCallback(() => {
    if (!prescriptionData) return;

    const dataStr = JSON.stringify(prescriptionData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `prescription-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: "Prescription data downloaded successfully.",
    });
  }, [prescriptionData, toast]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-2xl mb-4">
          <Scan className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">Prescription Scanner</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Upload or capture your prescription to extract medicine details, dosage, and duration automatically.
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel - Scanner Interface */}
        <Card className="shadow-xl border-2 border-blue-100">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              Scan Prescription
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'upload' | 'camera')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Image
                </TabsTrigger>
                <TabsTrigger value="camera" className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Take Photo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                  <Upload className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Upload Prescription Image
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Supports JPEG, PNG, WebP, BMP, TIFF (Max 20MB)
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-blue-700">
                      💡 <strong>Demo Mode:</strong> Upload any image to see sample prescription data extraction
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isProcessing}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="camera" className="space-y-4">
                <div className="border-2 border-dashed border-green-300 rounded-xl p-4 text-center">
                  {!isCameraActive ? (
                    <div className="py-8">
                      <Camera className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        Camera Scanner
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        Take a clear photo of your prescription
                      </p>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                        <p className="text-xs text-green-700">
                          💡 <strong>Demo Mode:</strong> Camera will show sample prescription data
                        </p>
                      </div>
                      <Button
                        onClick={startCamera}
                        disabled={isProcessing}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Start Camera
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full rounded-lg shadow-lg"
                      />
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={capturePhoto}
                          disabled={isProcessing}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Camera className="h-4 w-4 mr-2" />
                              Capture
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={stopCamera}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Error Display */}
            {error && (
              <Alert className="border-red-200 bg-red-50 mt-4">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Selected Image Preview */}
            {selectedImage && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Image Preview
                </h3>
                <img
                  src={selectedImage}
                  alt="Selected prescription"
                  className="w-full rounded-lg shadow-lg border-2 border-gray-200"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Panel - Results */}
        <Card className="shadow-xl border-2 border-green-100">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Extracted Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {!prescriptionData ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg text-gray-500">
                  Upload or capture a prescription to see extracted details here
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Prescription Info */}
                {(prescriptionData.doctorName || prescriptionData.date || prescriptionData.diagnosis) && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-2">Prescription Details</h3>
                    <div className="space-y-1 text-sm">
                      {prescriptionData.doctorName && (
                        <p><span className="font-medium">Doctor:</span> {prescriptionData.doctorName}</p>
                      )}
                      {prescriptionData.date && (
                        <p><span className="font-medium">Date:</span> {prescriptionData.date}</p>
                      )}
                      {prescriptionData.diagnosis && (
                        <p><span className="font-medium">Diagnosis:</span> {prescriptionData.diagnosis}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Medicine List */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Medicines ({prescriptionData.medicines.length})
                  </h3>
                  <div className="space-y-4">
                    {prescriptionData.medicines.map((medicine, index) => (
                      <Card key={index} className="border border-gray-200 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <h4 className="font-semibold text-lg text-gray-900">
                                {medicine.medicineName}
                              </h4>
                              <Badge variant="secondary" className="ml-2">
                                #{index + 1}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-600">Dosage:</span>
                                <p className="text-gray-900">{medicine.dosage}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Frequency:</span>
                                <p className="text-gray-900">{medicine.frequency}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Duration:</span>
                                <p className="text-gray-900">{medicine.duration}</p>
                              </div>
                              {medicine.purpose && (
                                <div>
                                  <span className="font-medium text-gray-600">Purpose:</span>
                                  <p className="text-gray-900">{medicine.purpose}</p>
                                </div>
                              )}
                            </div>
                            
                            {medicine.instructions && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                <span className="font-medium text-yellow-800">Instructions:</span>
                                <p className="text-yellow-700 text-sm mt-1">{medicine.instructions}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Interaction Warnings */}
                {interactions.length > 0 && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium text-orange-800">Drug Interaction Warnings:</p>
                        {interactions.map((warning, index) => (
                          <p key={index} className="text-orange-700 text-sm">{warning}</p>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Additional Notes */}
                {prescriptionData.additionalNotes && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">Additional Notes:</h4>
                    <p className="text-gray-600 text-sm">{prescriptionData.additionalNotes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={downloadResults}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    onClick={resetScanner}
                    variant="outline"
                    className="flex-1"
                  >
                    <Scan className="h-4 w-4 mr-2" />
                    Scan New
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hidden canvas for camera capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default PrescriptionScanner;
