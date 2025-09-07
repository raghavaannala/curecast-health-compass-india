import React, { useState, useEffect } from 'react';
import { 
  GovernmentVaccineSchedule, 
  CustomVaccinationReminder,
  Language 
} from '../types';
import { vaccinationReminderService } from '../services/vaccinationReminderService';
import { governmentHealthService } from '../services/governmentHealthService';

interface GovernmentVaccineSyncProps {
  userId: string;
  language: Language;
  onSyncComplete: (syncedReminders: CustomVaccinationReminder[]) => void;
}

interface SyncStatus {
  isConnected: boolean;
  lastSyncTime?: Date;
  availableSchedules: GovernmentVaccineSchedule[];
  syncInProgress: boolean;
  errors: string[];
}

/**
 * Government Vaccine Database Sync Component
 * Integrates with CoWIN, Ayushman Bharat, and state health portals
 */
export const GovernmentVaccineSync: React.FC<GovernmentVaccineSyncProps> = ({
  userId,
  language,
  onSyncComplete
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isConnected: false,
    availableSchedules: [],
    syncInProgress: false,
    errors: []
  });

  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState({
    aadhaarNumber: '',
    age: '',
    state: '',
    district: '',
    pincode: '',
    mobileNumber: ''
  });
  const [showProfileForm, setShowProfileForm] = useState(false);

  // Indian states for dropdown
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Lakshadweep', 'Puducherry', 'Andaman and Nicobar Islands'
  ];

  useEffect(() => {
    checkConnectionStatus();
    loadUserProfile();
  }, [userId]);

  const checkConnectionStatus = async () => {
    try {
      // Check if government services are available
      const healthAlerts = await governmentHealthService.getHealthAlerts('general');
      setSyncStatus(prev => ({
        ...prev,
        isConnected: true,
        lastSyncTime: new Date()
      }));
      
      // Load available government vaccine schedules
      await loadGovernmentSchedules();
      
    } catch (error) {
      console.error('Government service connection failed:', error);
      setSyncStatus(prev => ({
        ...prev,
        isConnected: false,
        errors: ['Unable to connect to government health services. Please check your internet connection.']
      }));
    }
  };

  const loadGovernmentSchedules = async () => {
    try {
      // Mock government vaccine schedules - in production, this would fetch from real APIs
      const mockSchedules: GovernmentVaccineSchedule[] = [
        {
          id: 'covid19_adult',
          vaccineName: 'COVID-19 Vaccine',
          ageGroup: '18+ years',
          doses: 2,
          intervalBetweenDoses: 84,
          boosterRequired: true,
          boosterInterval: 365,
          mandatoryFor: ['Healthcare workers', 'Frontline workers', 'Adults 60+'],
          source: 'CoWIN',
          lastUpdated: new Date().toISOString(),
          priority: 'high',
          description: 'COVID-19 vaccination as per national immunization program'
        },
        {
          id: 'tetanus_adult',
          vaccineName: 'Tetanus Toxoid (TT)',
          ageGroup: 'All adults',
          doses: 1,
          intervalBetweenDoses: 0,
          boosterRequired: true,
          boosterInterval: 3650, // 10 years
          mandatoryFor: ['Pregnant women', 'Healthcare workers'],
          source: 'National Immunization Program',
          lastUpdated: new Date().toISOString(),
          priority: 'medium',
          description: 'Tetanus vaccination for adults as per national guidelines'
        },
        {
          id: 'hepatitis_b_adult',
          vaccineName: 'Hepatitis B Vaccine',
          ageGroup: '18-65 years',
          doses: 3,
          intervalBetweenDoses: 30,
          boosterRequired: false,
          boosterInterval: 0,
          mandatoryFor: ['Healthcare workers', 'High-risk groups'],
          source: 'National Immunization Program',
          lastUpdated: new Date().toISOString(),
          priority: 'medium',
          description: 'Hepatitis B vaccination for high-risk adults'
        },
        {
          id: 'influenza_annual',
          vaccineName: 'Influenza Vaccine',
          ageGroup: '6 months+',
          doses: 1,
          intervalBetweenDoses: 0,
          boosterRequired: true,
          boosterInterval: 365, // Annual
          mandatoryFor: ['Healthcare workers', 'Adults 65+', 'Chronic disease patients'],
          source: 'WHO Guidelines',
          lastUpdated: new Date().toISOString(),
          priority: 'medium',
          description: 'Annual influenza vaccination as recommended by WHO'
        }
      ];

      setSyncStatus(prev => ({
        ...prev,
        availableSchedules: mockSchedules
      }));

    } catch (error) {
      console.error('Error loading government schedules:', error);
      setSyncStatus(prev => ({
        ...prev,
        errors: [...prev.errors, 'Failed to load government vaccine schedules']
      }));
    }
  };

  const loadUserProfile = () => {
    // Load user profile from localStorage or service
    const savedProfile = localStorage.getItem(`user_profile_${userId}`);
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    }
  };

  const saveUserProfile = () => {
    localStorage.setItem(`user_profile_${userId}`, JSON.stringify(userProfile));
    setShowProfileForm(false);
  };

  const handleScheduleSelection = (scheduleId: string, selected: boolean) => {
    if (selected) {
      setSelectedSchedules(prev => [...prev, scheduleId]);
    } else {
      setSelectedSchedules(prev => prev.filter(id => id !== scheduleId));
    }
  };

  const syncSelectedSchedules = async () => {
    if (selectedSchedules.length === 0) {
      setSyncStatus(prev => ({
        ...prev,
        errors: ['Please select at least one vaccine schedule to sync']
      }));
      return;
    }

    setSyncStatus(prev => ({ ...prev, syncInProgress: true, errors: [] }));

    try {
      const syncedReminders: CustomVaccinationReminder[] = [];

      for (const scheduleId of selectedSchedules) {
        const schedule = syncStatus.availableSchedules.find(s => s.id === scheduleId);
        if (!schedule) continue;

        // Create reminder for primary vaccination
        const primaryReminder = await vaccinationReminderService.createReminderFromGovernmentSchedule(
          userId,
          schedule
        );
        syncedReminders.push(primaryReminder);

        // Create booster reminder if required
        if (schedule.boosterRequired) {
          const boosterDate = new Date();
          boosterDate.setDate(boosterDate.getDate() + schedule.boosterInterval);

          const boosterReminder = await vaccinationReminderService.createReminder({
            userId,
            name: `${schedule.vaccineName} - Booster`,
            description: `Booster dose for ${schedule.vaccineName} as per ${schedule.source}`,
            scheduledDate: boosterDate.toISOString().split('T')[0],
            scheduledTime: '10:00',
            isCustom: false,
            priority: schedule.priority as any,
            governmentMandated: true,
            vaccineType: {
              id: `${schedule.id}_booster`,
              name: `${schedule.vaccineName} - Booster`,
              category: 'routine',
              ageGroup: [schedule.ageGroup],
              contraindications: [],
              sideEffects: []
            },
            reminderSettings: {
              enableNotifications: true,
              notificationMethods: ['website', 'email'],
              advanceNotificationDays: [30, 7, 1],
              timeOfDay: '10:00'
            },
            isRecurring: schedule.boosterInterval === 365, // Annual boosters are recurring
            recurringPattern: schedule.boosterInterval === 365 ? {
              type: 'yearly',
              interval: 1
            } : undefined,
            educationalInfo: {
              importance: `Booster dose is important to maintain immunity against ${schedule.vaccineName.split(' ')[0]}`,
              description: schedule.description,
              benefits: ['Maintains immunity', 'Prevents disease', 'Protects community'],
              risks: ['Mild side effects possible'],
              preparation: ['Consult healthcare provider', 'Bring vaccination records'],
              afterCare: ['Monitor for side effects', 'Keep records updated'],
              sources: [schedule.source, 'Ministry of Health and Family Welfare']
            }
          });
          syncedReminders.push(boosterReminder);
        }
      }

      setSyncStatus(prev => ({
        ...prev,
        syncInProgress: false,
        lastSyncTime: new Date()
      }));

      onSyncComplete(syncedReminders);

      // Show success message
      alert(`Successfully synced ${syncedReminders.length} vaccination reminders from government schedules.`);

    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus(prev => ({
        ...prev,
        syncInProgress: false,
        errors: ['Sync failed. Please try again later.']
      }));
    }
  };

  const isScheduleApplicable = (schedule: GovernmentVaccineSchedule): boolean => {
    if (!userProfile.age) return true; // Show all if age not provided
    
    const age = parseInt(userProfile.age);
    const ageGroup = schedule.ageGroup.toLowerCase();
    
    if (ageGroup.includes('18+') && age >= 18) return true;
    if (ageGroup.includes('65+') && age >= 65) return true;
    if (ageGroup.includes('all')) return true;
    if (ageGroup.includes('6 months+') && age >= 1) return true;
    
    return false;
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Government Vaccine Database Sync</h2>
          <p className="text-gray-600 mt-1">
            Sync with CoWIN, Ayushman Bharat, and state health portals
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${syncStatus.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {syncStatus.isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Connection Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium text-gray-900">Connection Status</h3>
            <p className="text-sm text-gray-600">
              {syncStatus.lastSyncTime 
                ? `Last synced: ${syncStatus.lastSyncTime.toLocaleString()}`
                : 'Never synced'
              }
            </p>
          </div>
          <button
            onClick={checkConnectionStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Check Connection
          </button>
        </div>
      </div>

      {/* Errors */}
      {syncStatus.errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-medium text-red-800 mb-2">Sync Errors</h3>
          <ul className="text-sm text-red-700 space-y-1">
            {syncStatus.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* User Profile Section */}
      <div className="mb-6 p-4 border rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-gray-900">User Profile for Government Sync</h3>
          <button
            onClick={() => setShowProfileForm(!showProfileForm)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {showProfileForm ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {showProfileForm ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              <input
                type="number"
                value={userProfile.age}
                onChange={(e) => setUserProfile(prev => ({ ...prev, age: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your age"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <select
                value={userProfile.state}
                onChange={(e) => setUserProfile(prev => ({ ...prev, state: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select State</option>
                {indianStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District
              </label>
              <input
                type="text"
                value={userProfile.district}
                onChange={(e) => setUserProfile(prev => ({ ...prev, district: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your district"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PIN Code
              </label>
              <input
                type="text"
                value={userProfile.pincode}
                onChange={(e) => setUserProfile(prev => ({ ...prev, pincode: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter PIN code"
              />
            </div>

            <div className="md:col-span-2 flex justify-end space-x-2">
              <button
                onClick={() => setShowProfileForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveUserProfile}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Profile
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            {userProfile.age ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><strong>Age:</strong> {userProfile.age}</div>
                <div><strong>State:</strong> {userProfile.state || 'Not set'}</div>
                <div><strong>District:</strong> {userProfile.district || 'Not set'}</div>
                <div><strong>PIN:</strong> {userProfile.pincode || 'Not set'}</div>
              </div>
            ) : (
              <p>Please set up your profile to get personalized vaccine recommendations.</p>
            )}
          </div>
        )}
      </div>

      {/* Available Government Schedules */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-4">
          Available Government Vaccine Schedules ({syncStatus.availableSchedules.length})
        </h3>

        {syncStatus.availableSchedules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No government vaccine schedules available.</p>
            <button
              onClick={loadGovernmentSchedules}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Refresh Schedules
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {syncStatus.availableSchedules
              .filter(isScheduleApplicable)
              .map(schedule => (
              <div key={schedule.id} className="border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id={schedule.id}
                    checked={selectedSchedules.includes(schedule.id)}
                    onChange={(e) => handleScheduleSelection(schedule.id, e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <label htmlFor={schedule.id} className="cursor-pointer">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900">{schedule.vaccineName}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          schedule.priority === 'high' ? 'bg-red-100 text-red-600' :
                          schedule.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {schedule.priority}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600">
                          {schedule.source}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{schedule.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                        <div><strong>Age Group:</strong> {schedule.ageGroup}</div>
                        <div><strong>Doses:</strong> {schedule.doses}</div>
                        <div><strong>Booster:</strong> {schedule.boosterRequired ? 'Required' : 'Not required'}</div>
                        <div><strong>Updated:</strong> {new Date(schedule.lastUpdated).toLocaleDateString()}</div>
                      </div>
                      {schedule.mandatoryFor.length > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          <strong>Mandatory for:</strong> {schedule.mandatoryFor.join(', ')}
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sync Actions */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div className="text-sm text-gray-600">
          {selectedSchedules.length > 0 && (
            <span>{selectedSchedules.length} schedule(s) selected for sync</span>
          )}
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={loadGovernmentSchedules}
            disabled={syncStatus.syncInProgress}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Refresh Schedules
          </button>
          
          <button
            onClick={syncSelectedSchedules}
            disabled={syncStatus.syncInProgress || selectedSchedules.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncStatus.syncInProgress ? 'Syncing...' : 'Sync Selected Schedules'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GovernmentVaccineSync;
