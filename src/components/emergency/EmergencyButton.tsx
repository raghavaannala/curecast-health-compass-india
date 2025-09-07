import React, { useState } from 'react';
import { Phone, AlertTriangle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmergencyCallInterface from './EmergencyCallInterface';

interface EmergencyButtonProps {
  className?: string;
  variant?: 'default' | 'floating' | 'compact';
}

export const EmergencyButton: React.FC<EmergencyButtonProps> = ({ 
  className = '',
  variant = 'default'
}) => {
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

  const handleEmergencyClick = () => {
    setIsEmergencyOpen(true);
  };

  if (variant === 'floating') {
    return (
      <>
        <button
          onClick={handleEmergencyClick}
          className={`fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full shadow-2xl hover:shadow-red-500/25 transition-all duration-300 hover:scale-110 animate-pulse ${className}`}
          title="Emergency Call"
        >
          <Phone className="w-8 h-8 mx-auto" />
        </button>
        
        <EmergencyCallInterface
          isOpen={isEmergencyOpen}
          onClose={() => setIsEmergencyOpen(false)}
        />
      </>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <Button
          onClick={handleEmergencyClick}
          className={`bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
          size="sm"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Emergency
        </Button>
        
        <EmergencyCallInterface
          isOpen={isEmergencyOpen}
          onClose={() => setIsEmergencyOpen(false)}
        />
      </>
    );
  }

  // Default variant - prominent emergency button
  return (
    <>
      <div className={`relative ${className}`}>
        <Button
          onClick={handleEmergencyClick}
          className="w-full bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white border-0 shadow-2xl hover:shadow-red-500/30 transition-all duration-300 hover:scale-105 py-6 text-lg font-bold"
          size="lg"
        >
          <div className="flex items-center justify-center space-x-3">
            <div className="relative">
              <Phone className="w-8 h-8" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
            </div>
            <div className="text-center">
              <div className="flex items-center space-x-2">
                <span>EMERGENCY CALL</span>
                <Zap className="w-5 h-5 text-yellow-300" />
              </div>
              <div className="text-xs font-normal text-red-100 mt-1">
                Ambulance • Police • Fire
              </div>
            </div>
          </div>
        </Button>
        
        {/* Pulsing border effect */}
        <div className="absolute inset-0 rounded-lg border-4 border-red-400 animate-pulse opacity-75 pointer-events-none"></div>
      </div>
      
      <EmergencyCallInterface
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />
    </>
  );
};

export default EmergencyButton;
