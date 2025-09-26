import React, { useState, useEffect } from 'react';
import { Language, CustomVaccinationReminder } from '../types';
import { VaccinationDashboard } from './VaccinationDashboard';
import { GovernmentVaccineSync } from './GovernmentVaccineSync';
import { VaccineEducationPanel } from './VaccineEducationPanel';
import { PrescriptionScanner } from './PrescriptionScanner';
import { languageService } from '../services/languageService';

interface VaccinationReminderAppProps {
  userId: string;
  language: Language;
  onLanguageChange?: (language: Language) => void;
}

/**
 * Main Vaccination Reminder Application
 * Integrates all vaccination reminder features with navigation and language support
 */
export const VaccinationReminderApp: React.FC<VaccinationReminderAppProps> = ({
  userId,
  language,
  onLanguageChange
}) => {
  const [activeView, setActiveView] = useState<'dashboard' | 'sync' | 'education' | 'prescription'>('dashboard');
  const [currentLanguage, setCurrentLanguage] = useState<Language>(language);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setCurrentLanguage(language);
  }, [language]);

  const handleLanguageChange = async (newLanguage: Language) => {
    setCurrentLanguage(newLanguage);
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
  };

  const handleSyncComplete = (syncedReminders: CustomVaccinationReminder[]) => {
    // Switch back to dashboard after successful sync
    setActiveView('dashboard');
    
    // Show success message
    const message = `Successfully synced ${syncedReminders.length} vaccination reminders from government databases.`;
    
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 5000);
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return 'Vaccination Dashboard';
      case 'sync':
        return 'Government Database Sync';
      case 'education':
        return 'Vaccine Education Center';
      case 'prescription':
        return 'Prescription Scanner';
      default:
        return 'Vaccination Reminders';
    }
  };

  const getViewDescription = () => {
    switch (activeView) {
      case 'dashboard':
        return 'Manage your vaccination schedule and reminders';
      case 'sync':
        return 'Sync with CoWIN, Ayushman Bharat, and state health portals';
      case 'education':
        return 'Learn about vaccines, schedules, and health protection';
      case 'prescription':
        return 'Scan prescriptions and find medicines at nearby pharmacies';
      default:
        return 'Custom vaccination reminder system';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">💉</span>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Dr.CureCast Vaccination Reminders
                  </h1>
                  <p className="text-sm text-gray-600">{getViewDescription()}</p>
                </div>
              </div>
            </div>

            {/* Language Selector */}
            <div className="flex items-center space-x-4">
              <select
                value={currentLanguage}
                onChange={(e) => handleLanguageChange(e.target.value as Language)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="bn">বাংলা</option>
                <option value="te">తెలుగు</option>
                <option value="mr">मराठी</option>
                <option value="ta">தமிழ்</option>
                <option value="gu">ગુજરાતી</option>
                <option value="kn">ಕನ್ನಡ</option>
                <option value="ml">മലയാളം</option>
                <option value="pa">ਪੰਜਾਬੀ</option>
              </select>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeView === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">📊</span>
                Dashboard
              </button>
              
              <button
                onClick={() => setActiveView('sync')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeView === 'sync'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">🔄</span>
                Government Sync
              </button>
              
              <button
                onClick={() => setActiveView('education')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeView === 'education'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">🎓</span>
                Education
              </button>
              
              <button
                onClick={() => setActiveView('prescription')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeView === 'prescription'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">💊</span>
                Prescription Scanner
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!isLoading && (
          <>
            {activeView === 'dashboard' && (
              <VaccinationDashboard
                userId={userId}
                language={currentLanguage}
              />
            )}

            {activeView === 'sync' && (
              <GovernmentVaccineSync
                userId={userId}
                language={currentLanguage}
                onSyncComplete={handleSyncComplete}
              />
            )}

            {activeView === 'education' && (
              <VaccineEducationPanel
                language={currentLanguage}
              />
            )}

            {activeView === 'prescription' && (
              <PrescriptionScanner
                userId={userId}
                language={currentLanguage}
              />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">About Dr.CureCast</h3>
              <p className="text-sm text-gray-600">
                Comprehensive healthcare platform providing multilingual medical assistance, 
                vaccination reminders, and health education for all.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Vaccination Schedule</a></li>
                <li><a href="#" className="hover:text-gray-900">Health Alerts</a></li>
                <li><a href="#" className="hover:text-gray-900">Emergency Contacts</a></li>
                <li><a href="#" className="hover:text-gray-900">Privacy Policy</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>📞 Helpline: 1800-XXX-XXXX</li>
                <li>✉️ Email: support@drcurecast.in</li>
                <li>🌐 Available in 19+ languages</li>
                <li>⏰ 24/7 Emergency Support</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-sm text-gray-500">
              © 2024 Dr.CureCast. All rights reserved. | 
              <span className="ml-2">Built with ❤️ for better healthcare access in India</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VaccinationReminderApp;
