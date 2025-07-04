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
import { Stethoscope, MapPin, Bell, Phone, Shield, Brain, Menu, X, LogIn, ArrowRight, Camera, Globe, FileText, Mic, ChevronLeft, User, Info, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/contexts/UserContext';
import HealthFactsPage from '@/components/health/HealthFactsPage';
import FoundersPage from '@/components/founder/FoundersPage';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';

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
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [requestedFeature, setRequestedFeature] = useState<string | null>(null);
  const [showVoiceInterface, setShowVoiceInterface] = useState(false);
  const [showCameraInterface, setShowCameraInterface] = useState(false);
  const [voiceInput, setVoiceInput] = useState<string | null>(null);
  const [cameraInput, setCameraInput] = useState<{imageUrl: string, description: string} | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

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
      navigate(requestedFeature);
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
      await auth.signOut();
      navigate('/');
      window.location.reload();
    } catch (error) {
      console.error("Error during logout:", error);
      setAuthError("Failed to sign out. Please try again.");
      setIsLoading(false);
    }
  };

  // Handle feature access
  const handleFeatureAccess = (path: string) => {
    if (['/chat', '/profile', '/health', '/voice', '/camera', '/education'].includes(path) && !isLoggedIn) {
      setRequestedFeature(path);
      setShowLoginModal(true);
    } else {
      navigate(path);
    }
  };

  // Handle voice input from VoiceInterface
  const handleVoiceInput = (transcript: string) => {
    setVoiceInput(transcript);
    
    // If in standalone mode, don't navigate away
    if (location.pathname !== '/voice') {
      navigate('/chat');
    }
    
    setShowVoiceInterface(false);
  };

  // Handle camera input from CameraDiagnostics
  const handleCameraInput = (imageUrl: string, description: string) => {
    setCameraInput({ imageUrl, description });
    
    // If in standalone mode, don't navigate away
    if (location.pathname !== '/camera') {
      navigate('/chat');
    }
    
    setShowCameraInterface(false);
  };

  // Open voice interface modal
  const openVoiceInterface = () => {
    setShowVoiceInterface(true);
  };

  // Modify openCameraInterface to use navigation
  const openCameraInterface = () => {
    if (!isLoggedIn) {
      setRequestedFeature('camera');
      setShowLoginModal(true);
      return;
    }
    navigate('/camera');
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
      <div className="animate-fade-in space-y-12">
        {/* Hero Section with animated gradient background */}
        <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-r from-blue-500 via-primary-500 to-purple-500 p-8 md:p-12">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[url('/pattern-dots.svg')] bg-repeat"></div>
          </div>
          <div className="relative z-10 text-center space-y-6 max-w-3xl mx-auto py-8 md:py-12">
            <div className="inline-flex items-center justify-center p-3 bg-white/20 rounded-full backdrop-blur-sm mb-4">
              <Stethoscope className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-md">Your Health Companion</h2>
            <p className="text-xl md:text-2xl text-white/90">
              CureCast offers healthcare guidance, resources, and support designed for everyone
            </p>
            {!isLoggedIn && (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="mt-6 px-8 py-3 bg-white text-primary-600 rounded-full text-lg font-medium hover:bg-primary-50 transition-all duration-300 hover:shadow-xl hover:scale-105 flex items-center gap-2 mx-auto"
              >
                <LogIn className="h-5 w-5" />
                Sign in for full access
              </button>
            )}
          </div>
          
          {/* Animated wave effect at bottom */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
              <path fill="#ffffff" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,208C672,213,768,203,864,181.3C960,160,1056,128,1152,117.3C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
        </div>

        {/* Main Features - Card Grid with more vibrant styling */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-2 bg-primary-500 rounded-full"></div>
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 text-transparent bg-clip-text">Main Features</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Dr. CureCast AI Card */}
            <div className="group h-full transform transition-all duration-300 hover:-translate-y-2">
              <div className="relative h-full bg-gradient-to-br from-primary-600 to-primary-400 rounded-2xl p-6 shadow-xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/10 rounded-t-2xl"></div>
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary-300 rounded-full opacity-30"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <Stethoscope className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Dr. CureCast AI</h3>
                  <p className="text-white/80 mb-6">Get instant health guidance and expert advice for your concerns</p>
                  <button 
                    onClick={() => handleFeatureAccess('/chat')}
                    className="px-6 py-3 bg-white text-primary-600 rounded-xl hover:bg-primary-50 transition-colors duration-200 flex items-center gap-2 font-medium shadow-lg group-hover:shadow-xl"
                  >
                    Chat Now
                    {!isLoggedIn ? <LogIn className="h-4 w-4" /> : <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Voice Interface Card */}
            <div className="group h-full transform transition-all duration-300 hover:-translate-y-2">
              <div className="relative h-full bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl p-6 shadow-xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/10 rounded-t-2xl"></div>
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-300 rounded-full opacity-30"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <Mic className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Voice Interface</h3>
                  <p className="text-white/80 mb-6">Speak naturally with our AI in your preferred language</p>
                  <button 
                    onClick={openVoiceInterface}
                    className="px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors duration-200 flex items-center gap-2 font-medium shadow-lg group-hover:shadow-xl"
                  >
                    Start Speaking
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Camera Diagnostics Card */}
            <div className="group h-full transform transition-all duration-300 hover:-translate-y-2">
              <div className="relative h-full bg-gradient-to-br from-emerald-600 to-emerald-400 rounded-2xl p-6 shadow-xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/10 rounded-t-2xl"></div>
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-300 rounded-full opacity-30"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Camera Diagnostics</h3>
                  <p className="text-white/80 mb-6">Upload or take photos for instant medical analysis</p>
                  <button 
                    onClick={openCameraInterface}
                    className="px-6 py-3 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors duration-200 flex items-center gap-2 font-medium shadow-lg group-hover:shadow-xl"
                  >
                    Analyze Image
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Features - More Modern and Colorful */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-2 bg-purple-500 rounded-full"></div>
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-transparent bg-clip-text">Additional Services</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Health Vault Card */}
            <div className="group h-full transform transition-all duration-300 hover:scale-[1.02]">
              <div className="relative h-full bg-white border-2 border-purple-100 rounded-2xl p-6 shadow-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Health Vault</h3>
                  <p className="text-gray-600 mb-6">Securely store and access your health records anytime, anywhere</p>
                  <button 
                    onClick={() => handleFeatureAccess('/health')}
                    className="mt-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-colors duration-200 flex items-center gap-2 font-medium shadow-md"
                  >
                    Access Vault
                    {!isLoggedIn ? <LogIn className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Health Education Card */}
            <div className="group h-full transform transition-all duration-300 hover:scale-[1.02]">
              <div className="relative h-full bg-white border-2 border-amber-100 rounded-2xl p-6 shadow-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Health Education</h3>
                  <p className="text-gray-600 mb-6">Learn about common health conditions with expert insights</p>
                  <button 
                    onClick={() => handleFeatureAccess('/education')}
                    className="mt-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-colors duration-200 flex items-center gap-2 font-medium shadow-md"
                  >
                    Learn Facts
                    {!isLoggedIn ? <LogIn className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Health Facts Carousel - Dynamic and Interactive */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-3xl p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-2 bg-amber-500 rounded-full"></div>
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-500 text-transparent bg-clip-text">Health Facts</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HEALTH_FACTS.slice(0, 4).map((item, idx) => (
              <div
                key={idx}
                className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-amber-200"
              >
                <div className="flex flex-col gap-4 items-center text-center">
                  <div className={`p-4 rounded-full bg-gradient-to-br ${item.color}`}>
                    {item.icon}
                  </div>
                  <span className="text-base font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                    {item.fact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Health Resources - More Visual and Engaging */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-2 bg-emerald-500 rounded-full"></div>
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 text-transparent bg-clip-text">Health Resources</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-white to-emerald-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-emerald-400">
              <h4 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-500" />
                Common Cold & Flu Guide
              </h4>
              <p className="text-gray-600">Learn about symptoms, home remedies, and when to seek professional care</p>
            </div>
            
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-blue-400">
              <h4 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                Seasonal Health Tips
              </h4>
              <p className="text-gray-600">Practical advice to stay healthy during weather changes and seasonal transitions</p>
            </div>
            
            <div className="bg-gradient-to-br from-white to-red-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-red-400">
              <h4 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Bell className="h-5 w-5 text-red-500" />
                Emergency First Aid
              </h4>
              <p className="text-gray-600">Essential first aid procedures everyone should know for common emergency situations</p>
            </div>
          </div>
        </div>
        
        {/* Know the Founder Card - Elevated Design */}
        <div 
          onClick={() => handleFeatureAccess('/founders')} 
          className="relative overflow-hidden rounded-3xl cursor-pointer transform transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500"></div>
          <div className="absolute inset-0 bg-[url('/pattern-dots.svg')] bg-repeat opacity-20"></div>
          
          <div className="relative z-10 flex items-center justify-between p-8 md:p-12">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center justify-center p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <Crown className="h-8 w-8 text-white drop-shadow-glow" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-white drop-shadow-md">Meet Our Founder</h3>
              <p className="text-xl text-white/90">
                Discover the story behind CureCast Health Compass and the vision of Raghava Annala
              </p>
              <div className="inline-flex items-center gap-2 text-white font-medium mt-4">
                Learn more 
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Crown className="h-16 w-16 text-white drop-shadow-glow" />
              </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 relative">
      {/* App Header */}
      <header className="sticky top-0 left-0 right-0 z-[100] bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Stethoscope className="h-8 w-8 text-white drop-shadow" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-wide drop-shadow">Dr.CureCast</h1>
              <p className="text-xs text-white/80">Excellence in AI Health Guidance</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user?.name && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-5 py-2 rounded-xl shadow-lg text-white">
                <div className="h-8 w-8 bg-white/30 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <span className="capitalize font-medium">{user.name}</span>
              </div>
            )}
            <div className="hidden md:block text-right">
              <span className="text-xs text-white/70 block">Developed by</span>
              <span className="text-sm text-white font-medium">Raghava Annala</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navbar component */}
      <Navbar isLoggedIn={isLoggedIn} />
      
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
        <Routes>
          <Route path="/" element={renderDashboard()} />
          <Route path="/chat" element={
            <DrCureCast 
              voiceInput={voiceInput} 
              cameraInput={cameraInput} 
              onVoiceInputRequest={() => setShowVoiceInterface(true)}
              onCameraInputRequest={() => setShowCameraInterface(true)}
            />
          } />
          <Route path="/profile" element={isLoggedIn ? <ProfilePage /> : <Navigate to="/" />} />
          <Route path="/health" element={isLoggedIn ? <HealthVault /> : <Navigate to="/" />} />
          <Route path="/camera" element={isLoggedIn ? <CameraDiagnostics standalone={true} onImageCaptured={handleCameraInput} /> : <Navigate to="/" />} />
          <Route path="/voice" element={isLoggedIn ? <VoiceInterface standalone={true} onTranscriptReady={handleVoiceInput} /> : <Navigate to="/" />} />
          <Route path="/education" element={<HealthFactsPage />} />
          <Route path="/founders" element={<FoundersPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
