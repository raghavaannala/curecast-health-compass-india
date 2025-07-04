import React, { useState, useEffect } from 'react';
import { Stethoscope, User, MessageSquare, Shield, Mic, Camera, Home, Menu, X, ChevronLeft, ChevronRight, Settings, LogOut, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  activePage: string;
  onPageChange: (page: string) => void;
  isLoggedIn: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ activePage, onPageChange, isLoggedIn }) => {
  // Start with open sidebar on desktop, closed on mobile
  const [isOpen, setIsOpen] = useState(false); // Always collapsed by default
  const [isMobile, setIsMobile] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Handle window resize to determine if we're on mobile
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Always collapsed by default, even on desktop
      setIsOpen(false);
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when changing pages on mobile
  const handlePageChange = (page: string) => {
    onPageChange(page);
    if (isMobile) {
      setIsOpen(false);
    }
  };
  
  const navItems = [
    { id: 'founder', label: 'Founders', icon: Crown, requiresAuth: false, color: 'text-yellow-600 bg-yellow-100 border-2 border-yellow-400 font-bold' },
    { id: 'dashboard', label: 'Home', icon: Home, requiresAuth: false, color: 'text-blue-600 bg-blue-100' },
    { id: 'chat', label: 'Dr.CureCast', icon: MessageSquare, requiresAuth: true, color: 'text-emerald-600 bg-emerald-100' },
    { id: 'voice', label: 'Voice', icon: Mic, requiresAuth: true, color: 'text-purple-600 bg-purple-100' },
    { id: 'camera', label: 'Camera', icon: Camera, requiresAuth: true, color: 'text-amber-600 bg-amber-100' },
    { id: 'health', label: 'Health Vault', icon: Shield, requiresAuth: true, color: 'text-indigo-600 bg-indigo-100' },
    { id: 'profile', label: 'Profile', icon: User, requiresAuth: true, color: 'text-gray-600 bg-gray-100' },
  ];

  return (
    <>
      
      {/* Mobile Bottom Navigation - with animations and toggle button */}
      <motion.div 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-[90] md:hidden"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex justify-around items-center py-2">
          {navItems
            .filter(item => !item.requiresAuth || isLoggedIn)
            .slice(0, 4) // Limit to 4 items for mobile bottom nav to make room for menu button
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
                  className={`flex flex-col items-center py-2 px-1 ${activePage === item.id ? 'text-primary-600' : 'text-gray-600'}`}
                  onClick={() => handlePageChange(item.id)}
                >
                  <div className={`rounded-full p-1.5 mb-1 ${activePage === item.id ? item.color : 'bg-transparent'}`}>
                    <item.icon className={`h-5 w-5 ${activePage === item.id ? '' : 'text-gray-500'}`} />
                  </div>
                  <span className="text-xs font-medium">{item.label}</span>
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
              className="flex flex-col items-center py-2 px-1 text-gray-600"
            >
              <div className={`rounded-full p-1.5 mb-1 ${isOpen ? 'bg-primary-100' : 'bg-transparent'}`}>
                {isOpen ? 
                  <X className="h-5 w-5 text-primary-600" /> : 
                  <Menu className="h-5 w-5 text-gray-500" />
                }
              </div>
              <span className="text-xs font-medium">{isOpen ? 'Close' : 'Menu'}</span>
            </Button>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Sidebar for both mobile and desktop - with animations */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay for mobile when sidebar is open */}
            {isMobile && (
              <motion.div
                className="fixed inset-0 bg-black bg-opacity-40 z-[80]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsOpen(false)}
                aria-label="Close sidebar overlay"
              />
            )}
            <motion.div 
              className={cn(
                "fixed bg-white border-r border-gray-200 shadow-lg z-[90]",
                // Mobile sidebar (full screen when open)
                isMobile ? "inset-0" : "top-16 left-0 bottom-0 w-64"
              )}
              initial={isMobile ? { opacity: 0 } : { x: -100, opacity: 0 }}
              animate={isMobile ? { opacity: 1 } : { x: 0, opacity: 1 }}
              exit={isMobile ? { opacity: 0 } : { x: -100, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ position: 'fixed' }}
            >
              <div className="flex flex-col p-4 space-y-2 h-full overflow-y-auto">
                {/* Sidebar header with toggle button for both mobile and desktop */}
                <div className="flex items-center justify-between mb-6 border-b pb-4">
                  <div className="flex items-center gap-2 bg-primary-50 rounded-lg px-3 py-2 relative" style={{minWidth: '0'}}>
                    {/* Vertical accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-l-lg" style={{minHeight: '100%'}} />
                    <Stethoscope className="h-6 w-6 text-primary-600 relative z-10" />
                    <h2 className="text-xl font-semibold text-primary-800 relative z-10" style={{letterSpacing: '0.01em'}}>CureCast</h2>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-gray-100 rounded-full"
                    aria-label="Close sidebar"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                {/* Navigation items with staggered animation */}
                <div className="space-y-1.5">
                  {navItems.map((item, index) => {
                    if (item.requiresAuth && !isLoggedIn) return null;
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Button
                          variant={activePage === item.id ? "default" : "ghost"}
                          size="sm"
                          className={`flex items-center gap-3 py-3 px-3 w-full justify-start rounded-lg ${activePage === item.id ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                          onClick={() => handlePageChange(item.id)}
                        >
                          <div className={`rounded-full p-1.5 ${activePage === item.id ? 'bg-white bg-opacity-20' : item.color}`}>
                            <item.icon className={`h-5 w-5 ${activePage === item.id ? 'text-white' : ''}`} />
                          </div>
                          <span className="font-medium">{item.label}</span>
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Bottom section with settings and logout */}
                {isLoggedIn && (
                  <motion.div 
                    className="mt-auto pt-4 border-t border-gray-200"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-3 py-3 px-3 w-full justify-start rounded-lg text-gray-600 hover:bg-gray-100"
                      onClick={() => handlePageChange('settings')}
                    >
                      <div className="rounded-full p-1.5 text-gray-600 bg-gray-100">
                        <Settings className="h-5 w-5" />
                      </div>
                      <span className="font-medium">Settings</span>
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Mini sidebar when collapsed on desktop */}
      {!isOpen && !isMobile && (
        <motion.div 
          className="fixed top-16 left-0 bottom-0 w-16 bg-white border-r border-gray-200 shadow-sm z-[90] py-4"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Collapse/Expand button at the top of mini sidebar */}
          <div className="flex justify-center mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(true)}
              className="rounded-full hover:bg-gray-100 mb-2 animate-pulse shadow-lg border-2 border-primary-200"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-5 w-5 text-primary-600 drop-shadow-glow" />
            </Button>
          </div>
          
          <div className="flex flex-col items-center space-y-4">
            {navItems.map((item, index) => {
              if (item.requiresAuth && !isLoggedIn) return null;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative group"
                  whileHover={{ scale: 1.05 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`rounded-full p-2 ${activePage === item.id ? 'bg-primary-600' : 'hover:bg-gray-100'}`}
                    onClick={() => handlePageChange(item.id)}
                  >
                    <item.icon className={`h-5 w-5 ${activePage === item.id ? 'text-white' : item.color.split(' ')[0]}`} />
                  </Button>
                  
                  {/* Tooltip */}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap">
                    {item.label}
                  </div>
                  
                  {/* Active indicator */}
                  {activePage === item.id && (
                    <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r-full" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </>
  );
};

export default Navbar;
