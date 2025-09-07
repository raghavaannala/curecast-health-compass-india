import React, { useState, useEffect } from 'react';
import { Language, HealthAlert } from '../types';
import { ruralHealthService } from '../services/ruralHealthService';
import { governmentHealthService } from '../services/governmentHealthService';
import { communicationService } from '../services/communicationService';
import { languageService } from '../services/languageService';

interface RuralHealthDashboardProps {
  userId: string;
  currentLanguage: Language;
  location: {
    state: string;
    district?: string;
    pincode?: string;
  };
}

interface HealthCenter {
  id: string;
  name: string;
  type: 'PHC' | 'CHC' | 'Hospital';
  distance: number;
  contact: string;
  services: string[];
  availability: 'open' | 'closed' | 'emergency';
}

interface HealthWorker {
  id: string;
  name: string;
  type: 'ASHA' | 'ANM' | 'Doctor';
  contact: string;
  languages: Language[];
  specialization?: string;
  availability: string;
}

export const RuralHealthDashboard: React.FC<RuralHealthDashboardProps> = ({
  userId,
  currentLanguage,
  location
}) => {
  const [healthAlerts, setHealthAlerts] = useState<HealthAlert[]>([]);
  const [nearbyHealthCenters, setNearbyHealthCenters] = useState<HealthCenter[]>([]);
  const [healthWorkers, setHealthWorkers] = useState<HealthWorker[]>([]);
  const [offlineMode, setOfflineMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'alerts' | 'centers' | 'workers' | 'services'>('alerts');

  // Localized text
  const [localizedText, setLocalizedText] = useState({
    dashboard: 'Rural Health Dashboard',
    healthAlerts: 'Health Alerts',
    nearbyCenters: 'Nearby Health Centers',
    healthWorkers: 'Health Workers',
    services: 'Health Services',
    offlineMode: 'Offline Mode',
    emergency: 'Emergency',
    call: 'Call',
    distance: 'Distance',
    availability: 'Availability',
    open: 'Open',
    closed: 'Closed',
    emergencyOnly: 'Emergency Only',
    contactWorker: 'Contact Health Worker',
    sendWhatsApp: 'Send WhatsApp',
    sendSMS: 'Send SMS',
    getDirections: 'Get Directions',
    bookAppointment: 'Book Appointment',
    vaccinationSchedule: 'Vaccination Schedule',
    maternalHealth: 'Maternal Health',
    childHealth: 'Child Health',
    chronicDisease: 'Chronic Disease Management',
    mentalHealth: 'Mental Health Support',
    nutritionPrograms: 'Nutrition Programs',
    waterSanitation: 'Water & Sanitation',
    loading: 'Loading...',
    noDataAvailable: 'No data available',
    syncData: 'Sync Data',
    lastUpdated: 'Last Updated'
  });

  useEffect(() => {
    loadLocalizedText();
    loadDashboardData();
    initializeRealTimeAlerts();
    checkOfflineMode();
  }, [currentLanguage, location]);

  const loadLocalizedText = async () => {
    if (currentLanguage === 'english') return;

    try {
      const translations = await Promise.all([
        languageService.translateText('Rural Health Dashboard', 'english', currentLanguage),
        languageService.translateText('Health Alerts', 'english', currentLanguage),
        languageService.translateText('Nearby Health Centers', 'english', currentLanguage),
        languageService.translateText('Health Workers', 'english', currentLanguage),
        languageService.translateText('Health Services', 'english', currentLanguage),
        languageService.translateText('Emergency', 'english', currentLanguage),
        languageService.translateText('Call', 'english', currentLanguage),
        languageService.translateText('Loading...', 'english', currentLanguage)
      ]);

      setLocalizedText(prev => ({
        ...prev,
        dashboard: translations[0],
        healthAlerts: translations[1],
        nearbyCenters: translations[2],
        healthWorkers: translations[3],
        services: translations[4],
        emergency: translations[5],
        call: translations[6],
        loading: translations[7]
      }));
    } catch (error) {
      console.error('Error loading localized text:', error);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load health alerts
      const alerts = await governmentHealthService.getHealthAlerts(location, currentLanguage);
      setHealthAlerts(alerts);

      // Load nearby health centers
      const healthcareServices = await ruralHealthService.getRuralHealthcareServices(
        location.district || location.state,
        currentLanguage
      );
      const centers = [...healthcareServices.primaryHealthCenters, ...healthcareServices.communityHealthCenters];
      setNearbyHealthCenters(centers.map(center => ({
        id: center.name || `center_${Math.random()}`,
        name: center.name,
        type: center.type || 'PHC',
        distance: parseFloat(center.distance?.replace('km', '').trim()) || 0,
        contact: center.phone || center.contact || '108',
        services: center.services || [],
        availability: center.availability === '24/7' ? 'open' : 'closed'
      })));

      // Load health workers
      const workers = healthcareServices.ashaWorkers;
      setHealthWorkers(workers.map(worker => ({
        id: worker.name || `worker_${Math.random()}`,
        name: worker.name,
        type: worker.type || 'ASHA',
        contact: worker.phone || worker.contact || '108',
        languages: worker.languages || [currentLanguage],
        specialization: worker.specialization,
        availability: worker.availability || 'Available during day hours'
      })));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Load from offline cache if available
      loadOfflineData();
    } finally {
      setLoading(false);
    }
  };

  const loadOfflineData = async () => {
    try {
      // Load cached data from localStorage
      const cachedCenters = localStorage.getItem('cached_health_centers');
      const cachedWorkers = localStorage.getItem('cached_health_workers');
      
      if (cachedCenters) {
        setNearbyHealthCenters(JSON.parse(cachedCenters));
      }
      if (cachedWorkers) {
        setHealthWorkers(JSON.parse(cachedWorkers));
      }
      setOfflineMode(true);
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  };

  const initializeRealTimeAlerts = () => {
    governmentHealthService.subscribeToAlerts((newAlerts) => {
      setHealthAlerts(prev => [...newAlerts, ...prev].slice(0, 10)); // Keep latest 10 alerts
    });

    governmentHealthService.initializeRealTimeAlerts();
  };

  const checkOfflineMode = () => {
    setOfflineMode(!navigator.onLine);
    window.addEventListener('online', () => setOfflineMode(false));
    window.addEventListener('offline', () => setOfflineMode(true));
  };

  const handleEmergencyCall = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleWhatsAppMessage = async (phoneNumber: string, workerName: string) => {
    try {
      const message = await languageService.translateText(
        `Hello ${workerName}, I need health assistance. This is from Dr.CureCast app.`,
        'english',
        currentLanguage
      );
      await communicationService.sendWhatsAppHealthReminder(phoneNumber, message, currentLanguage, 'emergency');
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
    }
  };

  const handleSMSMessage = async (phoneNumber: string, workerName: string) => {
    try {
      const message = await languageService.translateText(
        `Hello ${workerName}, I need health assistance. This is from Dr.CureCast app.`,
        'english',
        currentLanguage
      );
      await communicationService.sendSMSHealthReminder(phoneNumber, message, currentLanguage);
    } catch (error) {
      console.error('Error sending SMS:', error);
    }
  };

  const getDirections = (centerName: string) => {
    const query = encodeURIComponent(`${centerName} ${location.district} ${location.state}`);
    window.open(`https://www.google.com/maps/search/${query}`, '_blank');
  };

  const syncOfflineData = async () => {
    try {
      setLoading(true);
      // Cache current data to localStorage for offline access
      localStorage.setItem('cached_health_centers', JSON.stringify(nearbyHealthCenters));
      localStorage.setItem('cached_health_workers', JSON.stringify(healthWorkers));
      await loadDashboardData();
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  };

  const renderHealthAlerts = () => (
    <div className="space-y-4">
      {healthAlerts.length === 0 ? (
        <p className="text-gray-500 text-center py-8">{localizedText.noDataAvailable}</p>
      ) : (
        healthAlerts.map(alert => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border-l-4 ${
              alert.severity === 'high' ? 'border-red-500 bg-red-50' :
              alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
              'border-blue-500 bg-blue-50'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900">{alert.title}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {alert.severity.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-700 mb-2">{alert.description}</p>
            {alert.actionRequired && (
              <p className="text-sm text-gray-600 mb-2">
                <strong>Action Required:</strong> {alert.actionRequired}
              </p>
            )}
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{alert.issuedBy}</span>
              <span>{new Date(alert.issuedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderHealthCenters = () => (
    <div className="space-y-4">
      {nearbyHealthCenters.length === 0 ? (
        <p className="text-gray-500 text-center py-8">{localizedText.noDataAvailable}</p>
      ) : (
        nearbyHealthCenters.map(center => (
          <div key={center.id} className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">{center.name}</h3>
                <p className="text-sm text-gray-600">{center.type}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                center.availability === 'open' ? 'bg-green-100 text-green-800' :
                center.availability === 'emergency' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {center.availability === 'open' ? localizedText.open :
                 center.availability === 'emergency' ? localizedText.emergencyOnly :
                 localizedText.closed}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {localizedText.distance}: {center.distance}km
            </p>
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-1">Services:</p>
              <div className="flex flex-wrap gap-1">
                {center.services.map((service, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {service}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleEmergencyCall(center.contact)}
                className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-700"
              >
                📞 {localizedText.call}
              </button>
              <button
                onClick={() => getDirections(center.name)}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700"
              >
                🗺️ {localizedText.getDirections}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderHealthWorkers = () => (
    <div className="space-y-4">
      {healthWorkers.length === 0 ? (
        <p className="text-gray-500 text-center py-8">{localizedText.noDataAvailable}</p>
      ) : (
        healthWorkers.map(worker => (
          <div key={worker.id} className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">{worker.name}</h3>
                <p className="text-sm text-gray-600">{worker.type}</p>
                {worker.specialization && (
                  <p className="text-sm text-blue-600">{worker.specialization}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{localizedText.availability}</p>
                <p className="text-sm font-medium">{worker.availability}</p>
              </div>
            </div>
            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-1">Languages:</p>
              <div className="flex flex-wrap gap-1">
                {worker.languages.map((lang, index) => (
                  <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleEmergencyCall(worker.contact)}
                className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700"
              >
                📞 {localizedText.call}
              </button>
              <button
                onClick={() => handleWhatsAppMessage(worker.contact, worker.name)}
                className="flex-1 bg-green-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-600"
              >
                💬 WhatsApp
              </button>
              <button
                onClick={() => handleSMSMessage(worker.contact, worker.name)}
                className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-600"
              >
                📱 SMS
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderHealthServices = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { key: 'vaccination', icon: '💉', title: localizedText.vaccinationSchedule },
        { key: 'maternal', icon: '🤱', title: localizedText.maternalHealth },
        { key: 'child', icon: '👶', title: localizedText.childHealth },
        { key: 'chronic', icon: '💊', title: localizedText.chronicDisease },
        { key: 'mental', icon: '🧠', title: localizedText.mentalHealth },
        { key: 'nutrition', icon: '🥗', title: localizedText.nutritionPrograms },
        { key: 'water', icon: '💧', title: localizedText.waterSanitation }
      ].map(service => (
        <div
          key={service.key}
          className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md cursor-pointer transition-shadow"
          onClick={() => {/* Handle service navigation */}}
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{service.icon}</span>
            <div>
              <h3 className="font-medium text-gray-900">{service.title}</h3>
              <p className="text-sm text-gray-600">Access {service.title.toLowerCase()}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">{localizedText.loading}</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{localizedText.dashboard}</h1>
        <div className="flex items-center space-x-3">
          {offlineMode && (
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              <span className="text-sm text-orange-600">{localizedText.offlineMode}</span>
              <button
                onClick={syncOfflineData}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                {localizedText.syncData}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'alerts', label: localizedText.healthAlerts },
          { key: 'centers', label: localizedText.nearbyCenters },
          { key: 'workers', label: localizedText.healthWorkers },
          { key: 'services', label: localizedText.services }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key as any)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTab === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-gray-50 rounded-lg p-4">
        {selectedTab === 'alerts' && renderHealthAlerts()}
        {selectedTab === 'centers' && renderHealthCenters()}
        {selectedTab === 'workers' && renderHealthWorkers()}
        {selectedTab === 'services' && renderHealthServices()}
      </div>

      {/* Emergency Contact Bar */}
      <div className="fixed bottom-4 left-4 right-4 bg-red-600 text-white p-3 rounded-lg shadow-lg md:relative md:mt-6 md:bg-red-50 md:text-red-800 md:border md:border-red-200">
        <div className="flex justify-between items-center">
          <span className="font-medium">{localizedText.emergency}: 108 | 102 | 104</span>
          <button
            onClick={() => handleEmergencyCall('108')}
            className="bg-white text-red-600 px-4 py-2 rounded font-medium hover:bg-gray-100 md:bg-red-600 md:text-white md:hover:bg-red-700"
          >
            📞 {localizedText.call}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RuralHealthDashboard;
