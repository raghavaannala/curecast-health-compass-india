import React, { useState, useEffect, useRef } from 'react';
import GoogleSignIn from './components/GoogleSignIn';
import DrCureCast from '@/components/chat/DrCureCast';
import ProfilePage from './components/ProfilePage';
import HealthVault from '@/components/health/HealthVault';
import VoiceInterface from '@/components/voice/VoiceInterface';
import CameraDiagnostics from '@/components/camera/CameraDiagnostics';
import Navbar from '@/components/ui/navbar';
import './App.css';
import { onAuthStateChanged } from 'firebase/auth';
import { app, auth } from './firebase';
import { Stethoscope, MapPin, Bell, Phone, Shield, Brain, Menu, X, LogIn, ArrowRight, Camera, Globe, FileText, Mic, ChevronLeft, User, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/contexts/UserContext';
import HealthFactsPage from '@/components/health/HealthFactsPage';

const HEALTH_FACTS = [
  {
    fact: "Your heart beats about 100,000 times a day, pumping 7,570 liters of blood!",
    icon: <Info className="h-6 w-6 text-red-500" />,
    color: "from-red-100 to-red-50"
  },
  {
    fact: "Laughter boosts your immune system and reduces stress hormones.",
    icon: <Info className="h-6 w-6 text-yellow-500" />,
    color: "from-yellow-100 to-yellow-50"
  },
  {
    fact: "Drinking water can improve your mood and memory.",
    icon: <Info className="h-6 w-6 text-blue-500" />,
    color: "from-blue-100 to-blue-50"
  },
  {
    fact: "Walking just 30 minutes a day can reduce your risk of heart disease by 30%.",
    icon: <Info className="h-6 w-6 text-green-500" />,
    color: "from-green-100 to-green-50"
  },
  {
    fact: "Your skin is your body's largest organ!",
    icon: <Info className="h-6 w-6 text-pink-500" />,
    color: "from-pink-100 to-pink-50"
  },
  {
    fact: "Bananas can help improve your mood because they contain tryptophan, which the body converts to serotonin.",
    icon: <Info className="h-6 w-6 text-yellow-600" />,
    color: "from-yellow-200 to-yellow-50"
  },
  {
    fact: "Smiling can trick your brain into feeling happier, even if you're not!",
    icon: <Info className="h-6 w-6 text-emerald-500" />,
    color: "from-emerald-100 to-emerald-50"
  },
  {
    fact: "Your bones are constantly being replaced—your entire skeleton renews itself every 10 years.",
    icon: <Info className="h-6 w-6 text-indigo-500" />,
    color: "from-indigo-100 to-indigo-50"
  },
];

const App: React.FC = () => {
  const { toast } = useToast();
  const { user } = useUser ? useUser() : { user: null };
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [requestedFeature, setRequestedFeature] = useState<string | null>(null);
  const [showVoiceInterface, setShowVoiceInterface] = useState(false);
  const [showCameraInterface, setShowCameraInterface] = useState(false);
  const [voiceInput, setVoiceInput] = useState<string | null>(null);
  const [cameraInput, setCameraInput] = useState<{imageUrl: string, description: string} | null>(null);

  // Function to clear auth errors after a delay
  const clearAuthError = () => {
    if (authError) {
      setTimeout(() => {
        setAuthError(null);
      }, 5000);
    }
  };

  // Clear auth error when it changes
  useEffect(() => {
    clearAuthError();
  }, [authError]);

  useEffect(() => {
    // Check authentication state
    let authChangeProcessed = false;
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      authChangeProcessed = true;
      
      if (user) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
      
      setIsLoading(false);
    });
    
    // Set a timeout to handle the case where Firebase auth is not responding
    const authFailSafe = setTimeout(() => {
      if (!authChangeProcessed) {
        setIsLoading(false);
        setIsLoggedIn(false); // Default to logged out if auth check fails
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearTimeout(authFailSafe);
    };
  }, [requestedFeature]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setShowLoginModal(false);
    
    // If there was a requested feature, navigate to it after login
    if (requestedFeature) {
      setActivePage(requestedFeature);
      setRequestedFeature(null);
    }
  };

  // Simplified and focused logout function
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      setAuthError(null);
      localStorage.clear();
      sessionStorage.clear();
      setIsLoggedIn(false);
      setActivePage('dashboard');
      await auth.signOut();
      window.location.reload();
    } catch (error) {
      console.error("Error during logout:", error);
      setAuthError("Failed to sign out. Please try again.");
      setIsLoading(false);
    }
  };

  // Handle feature access
  const handleFeatureAccess = (featurePage: string) => {
    if (['chat', 'profile', 'health', 'voice', 'camera', 'education'].includes(featurePage) && !isLoggedIn) {
      setRequestedFeature(featurePage);
      setShowLoginModal(true);
    } else {
      setActivePage(featurePage);
    }
  };

  // Handle voice input from VoiceInterface
  const handleVoiceInput = (transcript: string) => {
    setVoiceInput(transcript);
    
    // If in standalone mode, don't navigate away
    if (activePage !== 'voice') {
      setActivePage('chat');
    }
    
    setShowVoiceInterface(false);
  };

  // Handle camera input from CameraDiagnostics
  const handleCameraInput = (imageUrl: string, description: string) => {
    setCameraInput({ imageUrl, description });
    
    // If in standalone mode, don't navigate away
    if (activePage !== 'camera') {
      setActivePage('chat');
    }
    
    setShowCameraInterface(false);
  };

  // Open voice interface modal
  const openVoiceInterface = () => {
    setShowVoiceInterface(true);
  };

  // Open camera interface modal
  const openCameraInterface = () => {
    setShowCameraInterface(true);
  };

  // Clean up voice and camera inputs when component unmounts
  useEffect(() => {
    return () => {
      setVoiceInput(null);
      setCameraInput(null);
    };
  }, []);

  // Dashboard renderer
  const renderDashboard = () => {
    return (
      <div className="animate-fade-in space-y-8">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-800 mb-4">Your Health Companion</h2>
          <p className="text-lg text-gray-600">
            CureCast offers healthcare guidance, resources, and support designed for rural communities. 
            {!isLoggedIn && (
              <span className="ml-1">
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="text-primary-600 font-medium hover:underline"
                >
                  Sign in
                </button> to access all features.
              </span>
            )}
          </p>
        </div>

        {/* Main Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Dr. CureCast AI */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-glass hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                <Stethoscope className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Dr. CureCast AI</h3>
              <p className="text-gray-600 mb-4">Get instant health guidance and advice</p>
              <button 
                onClick={() => handleFeatureAccess('chat')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center gap-2"
              >
                Chat Now
                {!isLoggedIn && <LogIn className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Voice Interface */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-glass hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Mic className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Voice Interface</h3>
              <p className="text-gray-600 mb-4">Speak with Dr. CureCast in your language</p>
              <button 
                onClick={openVoiceInterface}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
              >
                Start Speaking
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Camera Diagnostics */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-glass hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Camera className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Camera Diagnostics</h3>
              <p className="text-gray-600 mb-4">Upload or take photos for analysis</p>
              <button 
                onClick={openCameraInterface}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
              >
                Analyze Image
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Health Vault */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-glass hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Health Vault</h3>
              <p className="text-gray-600 mb-4">Securely store your health records</p>
              <button 
                onClick={() => handleFeatureAccess('health')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2"
              >
                Access Vault
                {!isLoggedIn && <LogIn className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Health Education */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-glass hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Health Education</h3>
              <p className="text-gray-600 mb-4">Learn about common health conditions</p>
              <button 
                onClick={() => handleFeatureAccess('education')}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors duration-200 flex items-center gap-2"
              >
                Learn Facts
                {!isLoggedIn && <LogIn className="h-4 w-4" />}
              </button>
              {/* Health Facts Section */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {HEALTH_FACTS.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r ${item.color} shadow hover:scale-[1.03] transition-transform duration-200`}
                  >
                    <div className="shrink-0">{item.icon}</div>
                    <span className="text-base font-medium text-gray-700">{item.fact}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Health Resources Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-display font-bold text-gray-800 mb-6">Health Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h4 className="font-semibold text-gray-800 mb-2">Common Cold & Flu Guide</h4>
              <p className="text-gray-600">Learn about symptoms and home remedies</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h4 className="font-semibold text-gray-800 mb-2">Seasonal Health Tips</h4>
              <p className="text-gray-600">Stay healthy during weather changes</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h4 className="font-semibold text-gray-800 mb-2">Emergency First Aid</h4>
              <p className="text-gray-600">Basic first aid procedures everyone should know</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // If loading, show loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center space-y-4 animate-pulse">
          <Stethoscope className="h-16 w-16 text-primary-600 mx-auto" />
          <h2 className="text-2xl font-display font-bold text-gray-800">Loading CureCast...</h2>
        </div>
      </div>
    );
  }

  // Main app UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 relative">
      {/* App Header */}
      <header className="sticky top-0 left-0 right-0 z-[100] bg-gradient-to-r from-primary-600 to-emerald-500 shadow-lg flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-8 w-8 text-white drop-shadow" />
          <span className="text-2xl font-extrabold text-white tracking-wide drop-shadow">Dr.CureCast</span>
          <span className="ml-3 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold uppercase tracking-wider shadow-sm">Excellence in AI Health Guidance</span>
        </div>
        {user?.name && (
          <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full shadow text-white font-semibold text-base">
            <User className="h-5 w-5 mr-1" />
            Welcome, <span className="ml-1 capitalize">{user.name}</span>
          </div>
        )}
      </header>
      {/* Navbar component */}
      <Navbar 
        activePage={activePage} 
        onPageChange={setActivePage} 
        isLoggedIn={isLoggedIn} 
      />
      
      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-display font-bold">Sign in to CureCast</DialogTitle>
            <DialogDescription className="text-center">
              Please sign in to access all features and personalize your experience.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <GoogleSignIn onLoginSuccess={handleLoginSuccess} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Voice Interface Dialog */}
      <Dialog open={showVoiceInterface} onOpenChange={setShowVoiceInterface}>
        <DialogContent className="sm:max-w-[500px] p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" />
              Voice Input
            </DialogTitle>
            <DialogDescription>
              Speak to Dr.CureCast using your voice
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 pt-2">
            <VoiceInterface 
              standalone={false} 
              onTranscriptReady={handleVoiceInput} 
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Camera Interface Dialog */}
      <Dialog open={showCameraInterface} onOpenChange={(open) => {
        setShowCameraInterface(open);
        // Clean up camera when dialog closes
        if (!open) {
          const videoElement = document.querySelector('video');
          if (videoElement && videoElement.srcObject) {
            const stream = videoElement.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoElement.srcObject = null;
          }
        }
      }}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Camera Input
            </DialogTitle>
            <DialogDescription>
              Take or upload a photo for Dr.CureCast to analyze
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 pt-2 max-h-[80vh] overflow-y-auto">
            <CameraDiagnostics 
              standalone={false} 
              onImageCaptured={handleCameraInput} 
            />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8 md:pl-72 pt-20">
        {activePage === 'dashboard' && renderDashboard()}
        {isLoggedIn && activePage === 'profile' && <ProfilePage />}
        {isLoggedIn && activePage === 'chat' && (
          <DrCureCast 
            onVoiceInputRequest={openVoiceInterface} 
            onCameraInputRequest={openCameraInterface}
            voiceInput={voiceInput}
            cameraInput={cameraInput}
            onVoiceInputProcessed={() => setVoiceInput(null)}
            onCameraInputProcessed={() => setCameraInput(null)}
          />
        )}
        {isLoggedIn && activePage === 'health' && <HealthVault />}
        {isLoggedIn && activePage === 'voice' && (
          <VoiceInterface 
            standalone={true} 
            onTranscriptReady={handleVoiceInput} 
          />
        )}
        {isLoggedIn && activePage === 'camera' && (
          <CameraDiagnostics 
            standalone={true} 
            onImageCaptured={handleCameraInput} 
          />
        )}
        {activePage === 'education' && <HealthFactsPage />}
        {!isLoggedIn && activePage !== 'dashboard' && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Sign in Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to access this feature.</p>
            <Button onClick={() => setShowLoginModal(true)} className="bg-primary-600 hover:bg-primary-700">
              Sign In Now
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
