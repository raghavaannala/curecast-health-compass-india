import React, { useState, useEffect } from 'react';
import { Stethoscope, User, MessageSquare, Shield, Mic, Camera, Home, Menu, X, ChevronLeft, ChevronRight, Settings, LogOut, Crown, LogIn, Droplet, Activity, Scan, Server, Info, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '@/firebase';
import NavSubmenu from './NavSubmenu';

interface NavbarProps {
  isLoggedIn: boolean;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isLoggedIn, onLoginClick, onLogoutClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Handle window resize to determine if we're on mobile
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsOpen(false);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when changing pages on mobile
  const handlePageChange = (path: string) => {
    navigate(path);
    if (isMobile) {
      setIsOpen(false);
    }
  };
  
  const navItems = [
    { id: 'founder', path: '/founders', label: 'Founders', icon: Crown, color: 'text-yellow-600 bg-yellow-100 border-2 border-yellow-400 font-bold' },
    { id: 'dashboard', path: '/', label: 'Home', icon: Home, color: 'text-blue-600 bg-blue-100' },
    { id: 'chat', path: '/chat', label: 'Dr.CureCast', icon: MessageSquare, color: 'text-emerald-600 bg-emerald-100' },
    { id: 'reminders', path: '/reminders', label: 'Reminders', icon: Bell, color: 'text-orange-600 bg-orange-100' },
    { id: 'voice', path: '/voice', label: 'Voice', icon: Mic, color: 'text-purple-600 bg-purple-100' },
    { id: 'camera', path: '/camera', label: 'Camera', icon: Camera, color: 'text-amber-600 bg-amber-100' },
    { id: 'diabetes', path: '/health/diabetes', label: 'Diabetes', icon: Droplet, color: 'text-blue-600 bg-blue-100' },
    { id: 'bp', path: '/health/blood-pressure', label: 'Blood Pressure', icon: Activity, color: 'text-red-600 bg-red-100' },
    { id: 'skin', path: '/health/skin-disease', label: 'Skin Disease', icon: Scan, color: 'text-purple-600 bg-purple-100' },
    { id: 'health', path: '/health', label: 'Health Vault', icon: Shield, color: 'text-indigo-600 bg-indigo-100' },
    { id: 'architecture', path: '/about/architecture', label: 'Architecture', icon: Server, color: 'text-gray-600 bg-gray-100' },
    { id: 'profile', path: '/profile', label: 'Profile', icon: User, color: 'text-gray-600 bg-gray-100' },
  ];

  return (
    <>
      {/* Desktop Sidebar Toggle Button */}
      <motion.button
        className="hidden md:block fixed top-[80px] left-4 z-[95] bg-white border border-gray-200 text-gray-700 p-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-gray-50"
        onClick={() => setIsCollapsed(!isCollapsed)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isCollapsed ? (
          <ChevronRight className="h-5 w-5" />
        ) : (
          <ChevronLeft className="h-5 w-5" />
        )}
      </motion.button>

      {/* Desktop Sidebar */}
      <motion.div
        className="hidden md:block fixed top-[70px] left-0 bottom-0 z-[90] bg-white/95 backdrop-blur-xl border-r border-gray-200/50 shadow-xl"
        initial={false}
        animate={{
          width: isCollapsed ? '80px' : '280px',
          opacity: 1
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="flex flex-col h-full p-4 overflow-hidden">
          {/* Sidebar Header */}
          <div className="flex items-center mb-6 pb-4 border-b-2 border-blue-200">
            {!isCollapsed ? (
              <div className="flex items-center gap-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl px-4 py-3 shadow-lg border border-blue-200">
                <div className="p-2 bg-white/60 rounded-xl shadow-inner">
                  <Stethoscope className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-blue-800">CureCast</h2>
                  <p className="text-xs text-blue-600 font-medium">Health Navigation</p>
                </div>
              </div>
            ) : (
              <div className="mx-auto p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl shadow-lg border border-blue-200">
                <Stethoscope className="h-6 w-6 text-blue-600" />
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <div className="flex-1 space-y-2 overflow-y-auto">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <motion.div
                  key={item.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 + 0.1 }}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full transition-all duration-300 hover:bg-white/60 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.02] mb-2",
                      isCollapsed ? "justify-center p-3" : "justify-start p-4",
                      isActive && "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-l-4 border-blue-600 shadow-lg ring-2 ring-blue-200"
                    )}
                    onClick={() => handlePageChange(item.path)}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className={`rounded-xl p-3 transition-all duration-300 ${
                      isActive 
                        ? `${item.color} shadow-md ring-2 ring-blue-200` 
                        : 'bg-white/70 hover:bg-white shadow-inner'
                    } ${isCollapsed ? '' : 'mr-4'}`}>
                      <item.icon className={`h-5 w-5 ${isActive ? '' : 'text-gray-600'}`} />
                    </div>
                    {!isCollapsed && (
                      <div className="flex-1 text-left">
                        <span className="font-semibold text-sm">{item.label}</span>
                        {isActive && <div className="text-xs text-blue-600 font-medium mt-1">Active</div>}
                      </div>
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>

          {/* Auth Section */}
          <div className="mt-auto pt-4 border-t-2 border-blue-200">
            {isLoggedIn ? (
              <Button
                variant="ghost"
                className={cn(
                  "w-full transition-all duration-300 hover:bg-red-50 text-red-600 rounded-2xl hover:shadow-lg hover:scale-[1.02] bg-white/60 shadow-sm border border-red-200",
                  isCollapsed ? "justify-center p-3" : "justify-start p-4"
                )}
                onClick={() => {
                  onLogoutClick?.();
                }}
                title={isCollapsed ? "Sign Out" : undefined}
              >
                <div className="rounded-xl p-3 bg-gradient-to-br from-red-100 to-pink-100 shadow-md ring-2 ring-red-200">
                  <LogOut className="h-5 w-5" />
                </div>
                {!isCollapsed && (
                  <div className="ml-4 text-left">
                    <span className="font-semibold text-sm">Sign Out</span>
                    <div className="text-xs text-red-500 font-medium mt-1">Logout securely</div>
                  </div>
                )}
              </Button>
            ) : (
              <Button
                variant="ghost"
                className={cn(
                  "w-full transition-all duration-300 hover:bg-green-50 text-green-600 rounded-2xl hover:shadow-lg hover:scale-[1.02] bg-white/60 shadow-sm border border-green-200",
                  isCollapsed ? "justify-center p-3" : "justify-start p-4"
                )}
                onClick={() => {
                  onLoginClick?.();
                }}
                title={isCollapsed ? "Sign In" : undefined}
              >
                <div className="rounded-xl p-3 bg-gradient-to-br from-green-100 to-emerald-100 shadow-md ring-2 ring-green-200">
                  <LogIn className="h-5 w-5" />
                </div>
                {!isCollapsed && (
                  <div className="ml-4 text-left">
                    <span className="font-semibold text-sm">Sign In</span>
                    <div className="text-xs text-green-500 font-medium mt-1">Access your account</div>
                  </div>
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Mobile Bottom Navigation */}
      <motion.div 
        className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-white via-blue-50 to-indigo-50 border-t-2 border-blue-200 shadow-2xl z-[90] backdrop-blur-lg"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5"></div>
        <div className="relative flex justify-around items-center py-3">
          {[
            navItems.find(item => item.id === 'dashboard'),
            navItems.find(item => item.id === 'chat'),
            navItems.find(item => item.id === 'diabetes'),
            navItems.find(item => item.id === 'bp'),
            navItems.find(item => item.id === 'skin')
          ]
            .filter(Boolean)
            .map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 + 0.2 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex flex-col items-center py-2 px-2 rounded-xl transition-all duration-300 hover:scale-105 ${location.pathname === item.path ? 'text-primary-600 bg-gradient-to-br from-blue-100 to-indigo-100 shadow-lg' : 'text-gray-600 hover:bg-white/60'}`}
                  onClick={() => handlePageChange(item.path)}
                >
                  <div className={`rounded-xl p-2 mb-1 transition-all duration-300 ${location.pathname === item.path ? `${item.color} shadow-md ring-2 ring-blue-200` : 'bg-white/50 hover:bg-white/80'}`}>
                    <item.icon className={`h-5 w-5 ${location.pathname === item.path ? '' : 'text-gray-500'}`} />
                  </div>
                  <span className="text-xs font-semibold">{item.label}</span>
                </Button>
              </motion.div>
            ))}
            
          {/* Menu toggle button integrated into the bottom nav */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="flex flex-col items-center py-2 px-2 text-gray-600 rounded-xl transition-all duration-300 hover:scale-105 hover:bg-white/60"
            >
              <div className={`rounded-xl p-2 mb-1 transition-all duration-300 ${isOpen ? 'bg-gradient-to-br from-red-100 to-pink-100 shadow-md ring-2 ring-red-200' : 'bg-white/50 hover:bg-white/80'}`}>
                {isOpen ? 
                  <X className="h-5 w-5 text-red-600" /> : 
                  <Menu className="h-5 w-5 text-gray-500" />
                }
              </div>
              <span className="text-xs font-semibold">{isOpen ? 'Close' : 'Menu'}</span>
            </Button>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Mobile Sidebar - only shows when menu is opened */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <>
            {/* Overlay for mobile when sidebar is open */}
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-40 z-[80]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              aria-label="Close sidebar overlay"
            />
            <motion.div 
              className="fixed inset-0 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 shadow-2xl z-[90] backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="flex flex-col p-6 space-y-3 h-full overflow-y-auto">
                {/* Mobile Sidebar header */}
                <div className="flex items-center justify-between mb-8 border-b-2 border-blue-200 pb-6">
                  <div className="flex items-center gap-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl px-4 py-3 shadow-lg border border-blue-200">
                    <div className="p-2 bg-white/60 rounded-xl shadow-inner">
                      <Stethoscope className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-blue-800">CureCast</h2>
                      <p className="text-xs text-blue-600 font-medium">Health Navigation</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-red-100 rounded-xl p-2 transition-all duration-300 hover:scale-105 bg-white/60 shadow-md border border-red-200"
                    aria-label="Close sidebar"
                  >
                    <X className="h-5 w-5 text-red-600" />
                  </Button>
                </div>
                
                {/* Mobile Navigation items */}
                <div className="space-y-2">
                  {navItems.map((item, index) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.05 + 0.1 }}
                      >
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start p-4 text-left transition-all duration-300 hover:bg-white/60 rounded-2xl mb-2 shadow-sm hover:shadow-md hover:scale-[1.02]",
                            isActive && "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-l-4 border-blue-600 shadow-lg ring-2 ring-blue-200"
                          )}
                          onClick={() => handlePageChange(item.path)}
                        >
                          <div className={`rounded-xl p-3 mr-4 transition-all duration-300 ${isActive ? `${item.color} shadow-md ring-2 ring-blue-200` : 'bg-white/70 hover:bg-white shadow-inner'}`}>
                            <item.icon className={`h-6 w-6 ${isActive ? '' : 'text-gray-600'}`} />
                          </div>
                          <div>
                            <span className="font-semibold text-base">{item.label}</span>
                            {isActive && <div className="text-xs text-blue-600 font-medium mt-1">Active</div>}
                          </div>
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Mobile Authentication section */}
                <div className="mt-auto pt-6 border-t-2 border-blue-200">
                  {isLoggedIn ? (
                    <Button
                      variant="ghost"
                      className="w-full justify-start p-4 text-left hover:bg-red-50 text-red-600 rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-white/60 shadow-sm border border-red-200"
                      onClick={() => {
                        onLogoutClick?.();
                        setIsOpen(false);
                      }}
                    >
                      <div className="rounded-xl p-3 mr-4 bg-gradient-to-br from-red-100 to-pink-100 shadow-md ring-2 ring-red-200">
                        <LogOut className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="font-semibold text-base">Sign Out</span>
                        <div className="text-xs text-red-500 font-medium mt-1">Logout securely</div>
                      </div>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className="w-full justify-start p-4 text-left hover:bg-green-50 text-green-600 rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-white/60 shadow-sm border border-green-200"
                      onClick={() => {
                        onLoginClick?.();
                        setIsOpen(false);
                      }}
                    >
                      <div className="rounded-xl p-3 mr-4 bg-gradient-to-br from-green-100 to-emerald-100 shadow-md ring-2 ring-green-200">
                        <LogIn className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="font-semibold text-base">Sign In</span>
                        <div className="text-xs text-green-500 font-medium mt-1">Access your account</div>
                      </div>
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
