import React, { useState, useEffect } from 'react';
import { Phone, MapPin, Clock, AlertTriangle, User, Heart, Shield, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface EmergencyCallInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

interface EmergencyContact {
  name: string;
  number: string;
  type: 'ambulance' | 'police' | 'fire' | 'hospital';
}

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { name: 'Ambulance (National)', number: '108', type: 'ambulance' },
  { name: 'Police Emergency', number: '100', type: 'police' },
  { name: 'Fire Emergency', number: '101', type: 'fire' },
  { name: 'Medical Emergency', number: '102', type: 'ambulance' },
  { name: 'Women Helpline', number: '1091', type: 'police' },
  { name: 'Child Helpline', number: '1098', type: 'police' },
];

export const EmergencyCallInterface: React.FC<EmergencyCallInterfaceProps> = ({
  isOpen,
  onClose
}) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyContact | null>(null);
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [callTimer, setCallTimer] = useState(0);

  // Get user's current location
  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(null);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Reverse geocoding to get address (using a mock implementation)
      const address = await getAddressFromCoords(latitude, longitude);
      
      setLocation({ latitude, longitude, address });
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError(error instanceof Error ? error.message : 'Failed to get location');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Mock reverse geocoding function (in real app, use Google Maps API or similar)
  const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    // Mock implementation - in real app, use proper geocoding service
    return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
  };

  // Auto-get location when dialog opens
  useEffect(() => {
    if (isOpen && !location) {
      getCurrentLocation();
    }
  }, [isOpen]);

  // Call timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallInProgress) {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallInProgress]);

  const handleEmergencyCall = (contact: EmergencyContact) => {
    setSelectedEmergency(contact);
    setIsCallInProgress(true);
    setCallTimer(0);

    // In a real app, this would initiate an actual call
    // For demo purposes, we'll simulate the call
    if (window.confirm(`Call ${contact.name} at ${contact.number}?\n\nLocation: ${location?.address || 'Location not available'}`)) {
      // Simulate call initiation
      window.open(`tel:${contact.number}`, '_self');
    } else {
      setIsCallInProgress(false);
      setSelectedEmergency(null);
    }
  };

  const handleEndCall = () => {
    setIsCallInProgress(false);
    setSelectedEmergency(null);
    setCallTimer(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getContactIcon = (type: EmergencyContact['type']) => {
    switch (type) {
      case 'ambulance': return <Heart className="w-6 h-6" />;
      case 'police': return <Shield className="w-6 h-6" />;
      case 'fire': return <AlertTriangle className="w-6 h-6" />;
      case 'hospital': return <Heart className="w-6 h-6" />;
      default: return <Phone className="w-6 h-6" />;
    }
  };

  const getContactColor = (type: EmergencyContact['type']) => {
    switch (type) {
      case 'ambulance': return 'from-red-500 to-red-600';
      case 'police': return 'from-blue-500 to-blue-600';
      case 'fire': return 'from-orange-500 to-orange-600';
      case 'hospital': return 'from-green-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-gradient-to-br from-red-50 to-orange-50">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-red-600 to-red-700 text-white">
          <DialogTitle className="flex items-center space-x-3 text-xl font-bold">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span>Emergency Call Interface</span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Location Section */}
          <div className="bg-white rounded-lg p-4 border border-red-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-red-600" />
                <span>Your Location</span>
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Navigation className="w-4 h-4 mr-2" />
                {isGettingLocation ? 'Getting...' : 'Refresh'}
              </Button>
            </div>
            
            {isGettingLocation && (
              <div className="flex items-center space-x-2 text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                <span className="text-sm">Getting your location...</span>
              </div>
            )}
            
            {locationError && (
              <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                {locationError}
              </div>
            )}
            
            {location && (
              <div className="text-sm text-gray-700">
                <p className="font-medium">{location.address}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </div>

          {/* Call Status */}
          {isCallInProgress && selectedEmergency && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    {getContactIcon(selectedEmergency.type)}
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">{selectedEmergency.name}</p>
                    <p className="text-sm text-green-600">Calling {selectedEmergency.number}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 text-green-700">
                    <Clock className="w-4 h-4" />
                    <span className="font-mono font-semibold">{formatTime(callTimer)}</span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleEndCall}
                    className="mt-2"
                  >
                    End Call
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Emergency Contacts */}
          {!isCallInProgress && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Phone className="w-5 h-5 text-red-600" />
                <span>Emergency Contacts</span>
              </h3>
              
              <div className="grid gap-3">
                {EMERGENCY_CONTACTS.map((contact, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmergencyCall(contact)}
                    className="w-full p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 text-left group hover:border-red-300"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${getContactColor(contact.type)} rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                        {getContactIcon(contact.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 group-hover:text-red-700">
                          {contact.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Call {contact.number}
                        </p>
                      </div>
                      <Phone className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-800 mb-1">Important Notice</p>
                <p className="text-yellow-700">
                  This interface will attempt to call emergency services. Ensure you have a valid reason for emergency assistance. 
                  Your location will be shared with emergency responders to help them reach you quickly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmergencyCallInterface;
