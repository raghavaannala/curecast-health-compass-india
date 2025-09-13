import React, { useState, useEffect, useRef } from 'react';
import GoogleSignIn from './components/GoogleSignIn';
import DrCureCast from '@/components/chat/DrCureCast';
import DrCurecastSimple from './components/DrCurecastSimple';
import ProfilePage from './components/ProfilePage';
import HealthVault from '@/components/health/HealthVault';
import VoiceInterface from '@/components/voice/VoiceInterface';
import CameraDiagnostics from '@/components/camera/CameraDiagnostics';
import DiabetesChecker from '@/components/health/DiabetesChecker';
import BloodPressureChecker from '@/components/health/BloodPressureChecker';
import SkinDiseaseChecker from '@/components/health/SkinDiseaseChecker';
import { NavigationChatbot } from './components/chatbot/NavigationChatbot';
import ArchitecturePage from '@/pages/ArchitecturePage';
import Navbar from '@/components/ui/navbar';
import { ReminderSystem } from './components/ReminderSystem';
import RemindersSection from './components/reminders/RemindersSection';
import EmergencyButton from './components/emergency/EmergencyButton';
import PrescriptionScanner from '@/components/prescription/PrescriptionScanner';
import OutbreakAlerts from '@/components/outbreak/OutbreakAlerts';
import OutbreakAlertBanner from '@/components/outbreak/OutbreakAlertBanner';
import './App.css';
import { onAuthStateChanged } from 'firebase/auth';
import { app, auth } from './firebase';
import { Stethoscope, MapPin, Bell, Phone, Shield, Brain, Menu, X, LogIn, ArrowRight, Camera, Globe, FileText, Mic, ChevronLeft, User, Info, Crown, LogOut, Droplet, Activity, Scan, MessageCircle, Mail } from 'lucide-react';
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

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setShowLoginModal(false);
    toast({
      title: "Welcome back!",
      description: "You've successfully signed in.",
    });
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
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
    } catch (error) {
      console.error("Error during logout:", error);
      setAuthError("Failed to sign out. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle feature access - removed auth check
  const handleFeatureAccess = (path: string) => {
    navigate(path);
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
        {/* Outbreak Alert Banner */}
        <OutbreakAlertBanner 
          onViewAllAlerts={() => navigate('/outbreak-alerts')}
          maxAlerts={3}
          autoRotate={true}
          rotationInterval={8000}
        />
        
        {/* Hero Section - Modern Professional Design */}
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-xl border border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-blue-50/30 to-indigo-50/50"></div>
          <div className="relative z-10 px-8 py-16 md:px-16 md:py-24">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-3xl shadow-2xl mb-8">
                <Stethoscope className="h-16 w-16 text-white" />
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                Your <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">AI Health</span> Companion
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Experience the future of healthcare with intelligent diagnostics, personalized guidance, and 24/7 medical support powered by advanced AI technology.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
                <button 
                  onClick={() => handleFeatureAccess('/chat')}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3"
                >
                  Start Health Consultation
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button 
                  onClick={openVoiceInterface}
                  className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-3"
                >
                  <Mic className="h-5 w-5" />
                  Voice Assistant
                </button>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-emerald-200/30 to-blue-200/30 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-2xl"></div>
        </div>

        {/* Core Services - Professional Grid Layout */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Core Health Services</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Comprehensive AI-powered healthcare solutions at your fingertips</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Consultation Card */}
            <div className="group bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Stethoscope className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Health Consultation</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">Get instant, personalized health guidance from our advanced AI doctor trained on medical expertise</p>
              <button 
                onClick={() => handleFeatureAccess('/chat')}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                Start Consultation
                {!isLoggedIn ? <LogIn className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              </button>
            </div>

            {/* Voice Assistant Card */}
            <div className="group bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Mic className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Voice Assistant</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">Speak naturally about your health concerns in multiple languages with voice recognition</p>
              <button 
                onClick={openVoiceInterface}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                Start Speaking
                <Mic className="h-4 w-4" />
              </button>
            </div>

            {/* Prescription Scanner Card */}
            <div className="group bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Prescription Scanner</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">Scan or upload prescriptions to extract medicine details, dosage, and duration automatically</p>
              <button 
                onClick={() => handleFeatureAccess('/prescription-scanner')}
                className="w-full px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl font-semibold hover:from-teal-700 hover:to-teal-800 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                Scan Prescription
                <FileText className="h-4 w-4" />
              </button>
            </div>

            {/* Visual Diagnostics Card */}
            <div className="group bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Visual Diagnostics</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">Upload or capture images for AI-powered medical analysis and instant insights</p>
              <button 
                onClick={openCameraInterface}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                Analyze Image
                <Camera className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Health Checker Features */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Diabetes Checker Card */}
            <div className="group h-full transform transition-all duration-300 hover:-translate-y-2">
              <div className="relative h-full bg-gradient-to-br from-blue-500 to-blue-300 rounded-2xl p-6 shadow-xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/10 rounded-t-2xl"></div>
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-200 rounded-full opacity-30"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <Droplet className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Diabetes Checker</h3>
                  <p className="text-white/80 mb-6">Check symptoms & get diet recommendations</p>
                  <button 
                    onClick={() => handleFeatureAccess('/health/diabetes')}
                    className="px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors duration-200 flex items-center gap-2 font-medium shadow-lg group-hover:shadow-xl"
                  >
                    Check Now
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Blood Pressure Monitor Card */}
            <div className="group h-full transform transition-all duration-300 hover:-translate-y-2">
              <div className="relative h-full bg-gradient-to-br from-red-500 to-red-300 rounded-2xl p-6 shadow-xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/10 rounded-t-2xl"></div>
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-red-200 rounded-full opacity-30"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <Activity className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Blood Pressure Monitor</h3>
                  <p className="text-white/80 mb-6">Track BP readings & get lifestyle advice</p>
                  <button 
                    onClick={() => handleFeatureAccess('/health/blood-pressure')}
                    className="px-6 py-3 bg-white text-red-600 rounded-xl hover:bg-red-50 transition-colors duration-200 flex items-center gap-2 font-medium shadow-lg group-hover:shadow-xl"
                  >
                    Check Now
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>

            {/* Skin Disease Analyzer Card */}
            <div className="group h-full transform transition-all duration-300 hover:-translate-y-2">
              <div className="relative h-full bg-gradient-to-br from-purple-500 to-purple-300 rounded-2xl p-6 shadow-xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/10 rounded-t-2xl"></div>
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-200 rounded-full opacity-30"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <Scan className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Skin Disease Analyzer</h3>
                  <p className="text-white/80 mb-6">Upload images for AI-powered analysis</p>
                  <button 
                    onClick={() => handleFeatureAccess('/health/skin-disease')}
                    className="px-6 py-3 bg-white text-purple-600 rounded-xl hover:bg-purple-50 transition-colors duration-200 flex items-center gap-2 font-medium shadow-lg group-hover:shadow-xl"
                  >
                    Check Now
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Call Section */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl p-8 border-2 border-red-200 shadow-xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-red-800 mb-4">Emergency Services</h2>
            <p className="text-lg text-red-700 max-w-2xl mx-auto">Get immediate help in medical emergencies. One-tap access to ambulance, police, and fire services with automatic location sharing.</p>
          </div>
          
          <div className="max-w-md mx-auto">
            <EmergencyButton className="mb-4" />
            <div className="text-center text-sm text-red-600 bg-red-100 rounded-lg p-3">
              <p className="font-semibold">Available 24/7 • Location-based dispatch • Multiple emergency services</p>
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
      <header className="sticky top-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-lg h-[70px]">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/30 via-blue-50/30 to-indigo-50/30"></div>
        <div className="relative max-w-7xl mx-auto flex items-center justify-between px-8 h-full">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-emerald-100/50 hover:scale-105 transition-all duration-300">
                <Stethoscope className="h-7 w-7 text-white drop-shadow-sm" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full opacity-30"></div>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Dr.CureCast
              </h1>
              <p className="text-sm text-gray-600 font-medium">AI-Powered Health Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user?.name && (
              <div className="flex items-center gap-3 bg-gray-50/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="capitalize font-semibold text-sm text-gray-900 block">{user.name}</span>
                  <span className="text-xs text-gray-500">Premium Member</span>
                </div>
              </div>
            )}
            <div className="hidden lg:flex items-center gap-2 text-right bg-gray-50/60 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-gray-200/50">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <div>
                <span className="text-xs text-gray-500 block"></span>
                <span className="text-sm text-gray-900 font-semibold">Xenon</span>
              </div>
            </div>
            
            {/* Communication Icons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.open('https://web.whatsapp.com/', '_blank')}
                className="p-2 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 hover:border-green-300 transition-all duration-200 group"
                title="Open WhatsApp"
              >
                <MessageCircle className="h-4 w-4 text-green-600 group-hover:text-green-700" />
              </button>
              <button
                onClick={() => window.location.href = 'sms:'}
                className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-200 group"
                title="Send SMS"
              >
                <Mail className="h-4 w-4 text-blue-600 group-hover:text-blue-700" />
              </button>
            </div>
            
            {/* Reminder System */}
            <ReminderSystem />
            
            {/* Sign in/out button */}
            {isLoggedIn ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="bg-white/80 hover:bg-red-50 border-gray-200 text-gray-700 hover:text-red-600 hover:border-red-200 px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 font-medium"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleLoginClick}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Navbar component */}
      <Navbar 
        isLoggedIn={isLoggedIn}
        onLoginClick={handleLoginClick}
        onLogoutClick={handleLogout}
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8 pt-[90px] transition-all duration-300 md:ml-20">
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
          <Route path="/camera" element={<CameraDiagnostics />} />
          <Route path="/voice" element={<VoiceInterface />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/health" element={<HealthVault />} />
          <Route path="/health/diabetes" element={<DiabetesChecker />} />
          <Route path="/health/blood-pressure" element={<BloodPressureChecker />} />
          <Route path="/health/skin-disease" element={<SkinDiseaseChecker />} />
          <Route path="/about/architecture" element={<ArchitecturePage />} />
          <Route path="/founders" element={<FoundersPage />} />
          <Route path="/reminders" element={<RemindersSection userId={auth.currentUser?.uid || ''} isAuthenticated={isLoggedIn} />} />
          <Route path="/prescription-scanner" element={<PrescriptionScanner />} />
          <Route path="/outbreak-alerts" element={<OutbreakAlerts />} />
        </Routes>
      </main>

      {/* Footer Disclaimer */}
      <div className="fixed bottom-0 left-0 right-0 bg-amber-50/95 backdrop-blur-sm border-t border-amber-200 px-4 py-2 z-40 md:ml-20">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs text-amber-700 text-center">
            ⚠️ This AI assistant provides general health information only. Always consult healthcare professionals for medical advice.
          </p>
        </div>
      </div>

      {/* Navigation Chatbot */}
      <NavigationChatbot />
    </div>
  );
};

export default App;
