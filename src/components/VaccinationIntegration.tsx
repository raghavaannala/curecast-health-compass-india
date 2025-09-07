import React, { useEffect } from 'react';
import { Language } from '../types';
import { vaccinationReminderService } from '../services/vaccinationReminderService';
import { VaccinationReminderApp } from './VaccinationReminderApp';

interface VaccinationIntegrationProps {
  userId: string;
  sessionId: string;
  language: Language;
  onLanguageChange?: (language: Language) => void;
}

/**
 * Integration component for vaccination reminders with Dr.CureCast
 * Handles initialization and context sharing
 */
export const VaccinationIntegration: React.FC<VaccinationIntegrationProps> = ({
  userId,
  sessionId,
  language,
  onLanguageChange
}) => {
  useEffect(() => {
    // Initialize vaccination reminder integration
    const initializeIntegration = async () => {
      try {
        await vaccinationReminderService.integrateWithDrCureCast(userId, sessionId);
      } catch (error) {
        console.error('Failed to initialize vaccination integration:', error);
      }
    };

    if (userId && sessionId) {
      initializeIntegration();
    }
  }, [userId, sessionId]);

  return (
    <VaccinationReminderApp
      userId={userId}
      language={language}
      onLanguageChange={onLanguageChange}
    />
  );
};

export default VaccinationIntegration;
