import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  X, 
  Volume2, 
  MapPin, 
  Clock, 
  Users,
  ChevronRight,
  Bell
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OutbreakAlert } from '@/types/outbreakTypes';
import { outbreakAlertService } from '@/services/outbreakAlertService';
import { locationService } from '@/services/locationService';
import { textToSpeechService } from '@/services/textToSpeechService';

interface OutbreakAlertBannerProps {
  onViewAllAlerts?: () => void;
  maxAlerts?: number;
  autoRotate?: boolean;
  rotationInterval?: number;
  className?: string;
}

const OutbreakAlertBanner: React.FC<OutbreakAlertBannerProps> = ({
  onViewAllAlerts,
  maxAlerts = 3,
  autoRotate = true,
  rotationInterval = 8000,
  className = ''
}) => {
  const [alerts, setAlerts] = useState<OutbreakAlert[]>([]);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCriticalAlerts();
    
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem('outbreakBannerDismissed');
    if (dismissed) {
      const dismissedTime = new Date(dismissed);
      const now = new Date();
      const hoursSinceDismissed = (now.getTime() - dismissedTime.getTime()) / (1000 * 60 * 60);
      
      // Show banner again after 6 hours
      if (hoursSinceDismissed < 6) {
        setIsDismissed(true);
        setIsVisible(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!autoRotate || alerts.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentAlertIndex((prev) => (prev + 1) % alerts.length);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [alerts.length, autoRotate, rotationInterval]);

  const loadCriticalAlerts = async () => {
    try {
      setIsLoading(true);
      
      // Get user location
      let userLocation = locationService.getCachedLocation();
      if (!userLocation) {
        try {
          userLocation = await locationService.getCurrentLocation();
        } catch {
          userLocation = await locationService.getLocationFromIP() as any;
        }
      }

      // Get location-based alerts
      const locationAlerts = userLocation 
        ? await outbreakAlertService.getLocationBasedAlerts(userLocation, 50)
        : await outbreakAlertService.getAllAlerts();

      // Filter for critical and urgent alerts
      const criticalAlerts = locationAlerts
        .filter(alert => 
          alert.status === 'active' && 
          (alert.severity === 'critical' || alert.severity === 'high' || alert.isUrgent)
        )
        .slice(0, maxAlerts);

      setAlerts(criticalAlerts);
      
      if (criticalAlerts.length > 0 && !isDismissed) {
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Failed to load critical alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    
    // Remember dismissal for 6 hours
    localStorage.setItem('outbreakBannerDismissed', new Date().toISOString());
  };

  const handleAlertClick = (alert: OutbreakAlert) => {
    // Speak alert if TTS is enabled
    const ttsEnabled = localStorage.getItem('textToSpeechEnabled') === 'true';
    if (ttsEnabled) {
      const language = localStorage.getItem('preferredLanguage') || 'en';
      textToSpeechService.speakOutbreakAlert({
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        disease: alert.disease,
        location: `${alert.location.city}, ${alert.location.state}`,
        cases: alert.confirmedCases
      }, language);
    }
    
    onViewAllAlerts?.();
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bgColor: 'bg-gradient-to-r from-red-600 to-red-700',
          textColor: 'text-white',
          icon: '🚨',
          pulse: 'animate-pulse'
        };
      case 'high':
        return {
          bgColor: 'bg-gradient-to-r from-orange-500 to-orange-600',
          textColor: 'text-white',
          icon: '⚠️',
          pulse: ''
        };
      default:
        return {
          bgColor: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
          textColor: 'text-white',
          icon: '⚡',
          pulse: ''
        };
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const alertTime = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (isLoading || !isVisible || alerts.length === 0) {
    return null;
  }

  const currentAlert = alerts[currentAlertIndex];
  const severityConfig = getSeverityConfig(currentAlert.severity);

  return (
    <div className={`relative ${className}`}>
      <Card className={`shadow-2xl border-0 overflow-hidden ${severityConfig.pulse}`}>
        <div className={`${severityConfig.bgColor} ${severityConfig.textColor}`}>
          <CardContent className="p-0">
            <div className="flex items-center">
              {/* Alert Icon and Indicator */}
              <div className="flex-shrink-0 p-4 flex items-center">
                <div className="relative">
                  <Bell className="h-6 w-6 animate-bounce" />
                  {currentAlert.isUrgent && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
                  )}
                </div>
              </div>

              {/* Alert Content */}
              <div className="flex-1 py-4 pr-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{severityConfig.icon}</span>
                      <Badge className="bg-white/20 text-white border-white/30 text-xs font-semibold">
                        {currentAlert.severity.toUpperCase()}
                      </Badge>
                      {currentAlert.isUrgent && (
                        <Badge className="bg-yellow-400 text-yellow-900 text-xs font-bold animate-pulse">
                          URGENT
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 text-xs opacity-80">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(currentAlert.lastUpdated)}
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-sm sm:text-base mb-1 line-clamp-1">
                      {currentAlert.title}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs opacity-90">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{currentAlert.location.city}, {currentAlert.location.state}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{currentAlert.confirmedCases.toLocaleString()} cases</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{currentAlert.disease}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      onClick={() => handleAlertClick(currentAlert)}
                      variant="secondary"
                      size="sm"
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs"
                    >
                      View Details
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                    
                    <Button
                      onClick={handleDismiss}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 p-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Indicator for Multiple Alerts */}
            {alerts.length > 1 && (
              <div className="px-4 pb-3">
                <div className="flex items-center justify-between text-xs opacity-80 mb-2">
                  <span>Alert {currentAlertIndex + 1} of {alerts.length}</span>
                  <button
                    onClick={onViewAllAlerts}
                    className="hover:underline flex items-center gap-1"
                  >
                    View All <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex gap-1">
                  {alerts.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        index === currentAlertIndex ? 'bg-white' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions Bar */}
            <div className="bg-black/10 px-4 py-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <span className="opacity-80">Quick Actions:</span>
                  <button
                    onClick={() => window.open(`tel:108`, '_blank')}
                    className="hover:underline flex items-center gap-1"
                  >
                    📞 Emergency (108)
                  </button>
                  <button
                    onClick={() => window.open(`https://maps.google.com/?q=${currentAlert.location.coordinates.latitude},${currentAlert.location.coordinates.longitude}`, '_blank')}
                    className="hover:underline flex items-center gap-1"
                  >
                    🗺️ View on Map
                  </button>
                </div>
                
                {alerts.length > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentAlertIndex((prev) => (prev - 1 + alerts.length) % alerts.length)}
                      className="hover:bg-white/20 rounded p-1"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => setCurrentAlertIndex((prev) => (prev + 1) % alerts.length)}
                      className="hover:bg-white/20 rounded p-1"
                    >
                      →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
};

export default OutbreakAlertBanner;
