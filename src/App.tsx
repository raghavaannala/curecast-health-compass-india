import React, { useState, useEffect } from 'react';
import GoogleSignIn from './components/GoogleSignIn';
import DrCureCast from '@/components/chat/DrCureCast';
import ProfilePage from './components/ProfilePage';
import './App.css';
import { onAuthStateChanged } from 'firebase/auth';
import { app, auth } from './firebase';
import { Stethoscope, MapPin, Bell, Phone, Shield, Brain, Menu, X, LogIn, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [requestedFeature, setRequestedFeature] = useState<string | null>(null);

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
        setAuthError(null);
        
        // If user logged in and there was a requested feature, navigate to it
        if (requestedFeature) {
          setActivePage(requestedFeature);
          setRequestedFeature(null);
        }
      } else {
        // Force reset of UI state
        setIsLoggedIn(false);
        setActivePage('dashboard');
        
        // Check for any lingering auth data that might be causing the issue
        const hasLocalStorageAuth = Object.keys(localStorage).some(key => 
          key.includes('firebase') || key.includes('auth')
        );
        
        const hasSessionStorageAuth = Object.keys(sessionStorage).some(key => 
          key.includes('firebase') || key.includes('auth')
        );
        
        if (hasLocalStorageAuth || hasSessionStorageAuth) {
          // Clear any Firebase-related data
          [...Object.keys(localStorage), ...Object.keys(sessionStorage)].forEach(key => {
            if (key.includes('firebase') || key.includes('auth')) {
              localStorage.removeItem(key);
              sessionStorage.removeItem(key);
            }
          });
        }
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Auth state error:", error);
      setAuthError(`Authentication error: ${error.message}`);
      setIsLoading(false);
      authChangeProcessed = true;
    });

    // This function handles cases where Firebase auth fails to initialize properly
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
  }, [auth, requestedFeature]);

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
      setIsLoading(false);
      alert("An error occurred during logout. Please refresh the page and try again.");
    }
  };

  // Function to handle feature access
  const handleFeatureAccess = (featurePage: string) => {
    if (isLoggedIn) {
      // If logged in, directly navigate to the feature
      setActivePage(featurePage);
    } else {
      // If not logged in, set the requested feature and show login modal
      setRequestedFeature(featurePage);
      setShowLoginModal(true);
    }
  };

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

  const renderDashboard = () => (
    <div className="animate-fade-in space-y-8">
      <div className="text-center mb-12 max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-800 mb-4">Your Health Companion</h2>
        <p className="text-lg text-gray-600">
          CureCast offers healthcare guidance, resources, and support designed for rural communities. 
          {!isLoggedIn && (
            <span className="ml-1">
              <button 
                onClick={() => setShowLoginModal(true)}
                className="text-primary-600 hover:text-primary-700 font-medium underline"
              >
                Sign in
              </button> to access all features.
            </span>
          )}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Ask Dr.CureCast */}
        <div className="group relative bg-white rounded-2xl p-6 shadow-glass hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
              <Stethoscope className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Ask Dr.CureCast</h3>
            <p className="text-gray-600 mb-4">Get instant medical guidance in your language</p>
            <button 
              onClick={() => handleFeatureAccess('chat')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center gap-2"
            >
              Consult Now
              {!isLoggedIn && <LogIn className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Health Reminders */}
        <div className="group relative bg-white rounded-2xl p-6 shadow-glass hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center mb-4">
              <Bell className="h-6 w-6 text-secondary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Health Reminders</h3>
            <p className="text-gray-600 mb-4">Never miss your medications</p>
            <button 
              onClick={() => handleFeatureAccess('reminders')}
              className="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors duration-200 flex items-center gap-2"
            >
              Set Reminder
              {!isLoggedIn && <LogIn className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Health Vault */}
        <div className="group relative bg-white rounded-2xl p-6 shadow-glass hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-success-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-success-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Health Vault</h3>
            <p className="text-gray-600 mb-4">Securely store your health records</p>
            <button 
              onClick={() => handleFeatureAccess('vault')}
              className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors duration-200 flex items-center gap-2"
            >
              Open Vault
              {!isLoggedIn && <LogIn className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Superstition Buster */}
        <div className="group relative bg-white rounded-2xl p-6 shadow-glass hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Superstition Buster</h3>
            <p className="text-gray-600 mb-4">Get scientific facts about health myths</p>
            <button 
              onClick={() => handleFeatureAccess('myths')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center gap-2"
            >
              Learn Facts
              {!isLoggedIn && <LogIn className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Find Healthcare */}
        <div className="group relative bg-white rounded-2xl p-6 shadow-glass hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-secondary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Find Healthcare</h3>
            <p className="text-gray-600 mb-4">Locate nearby clinics and hospitals</p>
            <button 
              onClick={() => handleFeatureAccess('healthcare')}
              className="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors duration-200 flex items-center gap-2"
            >
              Find Now
              {!isLoggedIn && <LogIn className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Telemedicine */}
        <div className="group relative bg-white rounded-2xl p-6 shadow-glass hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-success-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center mb-4">
              <Phone className="h-6 w-6 text-success-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Telemedicine</h3>
            <p className="text-gray-600 mb-4">Connect with real doctors</p>
            <button 
              onClick={() => handleFeatureAccess('telemedicine')}
              className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors duration-200 flex items-center gap-2"
            >
              Connect
              {!isLoggedIn && <LogIn className="h-4 w-4" />}
            </button>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
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

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Stethoscope className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-display font-bold text-gray-800">CureCast</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => setActivePage('dashboard')}
                className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                  activePage === 'dashboard'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                Dashboard
              </button>
              
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => setActivePage('profile')}
                    className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                      activePage === 'profile'
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:text-primary-600'
                    }`}
                  >
                    My Profile
                  </button>
                  <button
                    onClick={() => setActivePage('chat')}
                    className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                      activePage === 'chat'
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:text-primary-600'
                    }`}
                  >
                    Ask Dr.CureCast
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Button 
                  onClick={() => setShowLoginModal(true)}
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                >
                  Sign In
                </Button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-600" />
              ) : (
                <Menu className="h-6 w-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-4 py-3 space-y-2">
              <button
                onClick={() => {
                  setActivePage('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-lg ${
                  activePage === 'dashboard'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600'
                }`}
              >
                Dashboard
              </button>
              
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => {
                      setActivePage('profile');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-lg ${
                      activePage === 'profile'
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600'
                    }`}
                  >
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      setActivePage('chat');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-lg ${
                      activePage === 'chat'
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600'
                    }`}
                  >
                    Ask Dr.CureCast
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Button 
                  onClick={() => {
                    setShowLoginModal(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white justify-center"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activePage === 'dashboard' && renderDashboard()}
        {isLoggedIn && activePage === 'profile' && <ProfilePage />}
        {isLoggedIn && activePage === 'chat' && <DrCureCast />}
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
