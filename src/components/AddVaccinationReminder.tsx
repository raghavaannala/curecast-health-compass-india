import React, { useState, useEffect } from 'react';
import { 
  CustomVaccinationReminder, 
  VaccineType, 
  ReminderSettings, 
  RecurringPattern,
  Language 
} from '../types';
import { vaccinationReminderService } from '../services/vaccinationReminderService';
import { languageService } from '../services/languageService';

interface AddVaccinationReminderProps {
  userId: string;
  language: Language;
  editingReminder?: CustomVaccinationReminder;
  onSave: (reminder: CustomVaccinationReminder) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  description: string;
  scheduledDate: string;
  scheduledTime: string;
  notes: string;
  vaccineCategory: 'routine' | 'travel' | 'occupational' | 'emergency' | 'custom';
  priority: 'low' | 'medium' | 'high' | 'critical';
  isRecurring: boolean;
  recurringType: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurringInterval: number;
  recurringEndDate: string;
  maxOccurrences: string;
  enableNotifications: boolean;
  notificationMethods: string[];
  advanceNotificationDays: string[];
  notificationTime: string;
}

/**
 * Comprehensive Add/Edit Vaccination Reminder Form
 * Features: Custom vaccines, recurring reminders, notification settings
 */
export const AddVaccinationReminder: React.FC<AddVaccinationReminderProps> = ({
  userId,
  language,
  editingReminder,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '09:00',
    notes: '',
    vaccineCategory: 'custom',
    priority: 'medium',
    isRecurring: false,
    recurringType: 'yearly',
    recurringInterval: 1,
    recurringEndDate: '',
    maxOccurrences: '',
    enableNotifications: true,
    notificationMethods: ['website', 'email'],
    advanceNotificationDays: ['7', '1'],
    notificationTime: '09:00'
  });

  const [standardVaccines, setStandardVaccines] = useState<VaccineType[]>([]);
  const [selectedStandardVaccine, setSelectedStandardVaccine] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Predefined vaccine options
  const vaccineOptions = [
    { id: 'polio', name: 'Polio Vaccine (OPV/IPV)', category: 'routine' },
    { id: 'measles', name: 'Measles, Mumps, Rubella (MMR)', category: 'routine' },
    { id: 'tetanus', name: 'Tetanus Toxoid (TT)', category: 'routine' },
    { id: 'hepatitis_b', name: 'Hepatitis B Vaccine', category: 'routine' },
    { id: 'covid19', name: 'COVID-19 Vaccine', category: 'emergency' },
    { id: 'influenza', name: 'Influenza (Flu) Vaccine', category: 'routine' },
    { id: 'pneumonia', name: 'Pneumococcal Vaccine', category: 'routine' },
    { id: 'yellow_fever', name: 'Yellow Fever Vaccine', category: 'travel' },
    { id: 'typhoid', name: 'Typhoid Vaccine', category: 'travel' },
    { id: 'japanese_encephalitis', name: 'Japanese Encephalitis', category: 'travel' },
    { id: 'custom', name: 'Custom Vaccination', category: 'custom' }
  ];

  useEffect(() => {
    if (editingReminder) {
      populateFormFromReminder(editingReminder);
    }
    setMinDate();
  }, [editingReminder]);

  const populateFormFromReminder = (reminder: CustomVaccinationReminder) => {
    setFormData({
      name: reminder.name,
      description: reminder.description,
      scheduledDate: reminder.scheduledDate,
      scheduledTime: reminder.scheduledTime,
      notes: reminder.notes || '',
      vaccineCategory: reminder.vaccineType.category,
      priority: reminder.priority,
      isRecurring: reminder.isRecurring,
      recurringType: reminder.recurringPattern?.type || 'yearly',
      recurringInterval: reminder.recurringPattern?.interval || 1,
      recurringEndDate: reminder.recurringPattern?.endDate || '',
      maxOccurrences: reminder.recurringPattern?.maxOccurrences?.toString() || '',
      enableNotifications: reminder.reminderSettings.enableNotifications,
      notificationMethods: reminder.reminderSettings.notificationMethods,
      advanceNotificationDays: reminder.reminderSettings.advanceNotificationDays.map(d => d.toString()),
      notificationTime: reminder.reminderSettings.timeOfDay
    });

    // Find matching standard vaccine
    const matchingVaccine = vaccineOptions.find(v => 
      reminder.name.toLowerCase().includes(v.name.toLowerCase()) ||
      v.name.toLowerCase().includes(reminder.name.toLowerCase())
    );
    if (matchingVaccine) {
      setSelectedStandardVaccine(matchingVaccine.id);
    }
  };

  const setMinDate = () => {
    const today = new Date();
    const minDate = today.toISOString().split('T')[0];
    if (!formData.scheduledDate) {
      setFormData(prev => ({ ...prev, scheduledDate: minDate }));
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleStandardVaccineSelect = (vaccineId: string) => {
    setSelectedStandardVaccine(vaccineId);
    
    const vaccine = vaccineOptions.find(v => v.id === vaccineId);
    if (vaccine && vaccine.id !== 'custom') {
      setFormData(prev => ({
        ...prev,
        name: vaccine.name,
        vaccineCategory: vaccine.category as any,
        description: `${vaccine.name} vaccination as per standard schedule`
      }));
    } else if (vaccine?.id === 'custom') {
      setFormData(prev => ({
        ...prev,
        name: '',
        description: '',
        vaccineCategory: 'custom'
      }));
    }
  };

  const handleNotificationMethodChange = (method: string, checked: boolean) => {
    const currentMethods = formData.notificationMethods;
    if (checked) {
      handleInputChange('notificationMethods', [...currentMethods, method]);
    } else {
      handleInputChange('notificationMethods', currentMethods.filter(m => m !== method));
    }
  };

  const handleAdvanceNotificationDaysChange = (days: string, checked: boolean) => {
    const currentDays = formData.advanceNotificationDays;
    if (checked) {
      handleInputChange('advanceNotificationDays', [...currentDays, days]);
    } else {
      handleInputChange('advanceNotificationDays', currentDays.filter(d => d !== days));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vaccination name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Scheduled date is required';
    } else {
      const selectedDate = new Date(formData.scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.scheduledDate = 'Scheduled date cannot be in the past';
      }
    }

    if (!formData.scheduledTime) {
      newErrors.scheduledTime = 'Scheduled time is required';
    }

    if (formData.isRecurring) {
      if (formData.recurringInterval < 1) {
        newErrors.recurringInterval = 'Interval must be at least 1';
      }

      if (formData.recurringEndDate) {
        const endDate = new Date(formData.recurringEndDate);
        const startDate = new Date(formData.scheduledDate);
        
        if (endDate <= startDate) {
          newErrors.recurringEndDate = 'End date must be after start date';
        }
      }

      if (formData.maxOccurrences && parseInt(formData.maxOccurrences) < 1) {
        newErrors.maxOccurrences = 'Max occurrences must be at least 1';
      }
    }

    if (formData.enableNotifications && formData.notificationMethods.length === 0) {
      newErrors.notificationMethods = 'Select at least one notification method';
    }

    if (formData.enableNotifications && formData.advanceNotificationDays.length === 0) {
      newErrors.advanceNotificationDays = 'Select at least one notification timing';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const reminderData: Partial<CustomVaccinationReminder> = {
        userId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        notes: formData.notes.trim(),
        isCustom: selectedStandardVaccine === 'custom' || selectedStandardVaccine === '',
        priority: formData.priority,
        isRecurring: formData.isRecurring,
        governmentMandated: false, // User-created reminders are not government mandated
        vaccineType: {
          id: selectedStandardVaccine || `custom_${Date.now()}`,
          name: formData.name,
          category: formData.vaccineCategory,
          ageGroup: ['All ages'],
          contraindications: [],
          sideEffects: []
        },
        reminderSettings: {
          enableNotifications: formData.enableNotifications,
          notificationMethods: formData.notificationMethods as any[],
          advanceNotificationDays: formData.advanceNotificationDays.map(d => parseInt(d)),
          timeOfDay: formData.notificationTime
        },
        recurringPattern: formData.isRecurring ? {
          type: formData.recurringType,
          interval: formData.recurringInterval,
          endDate: formData.recurringEndDate || undefined,
          maxOccurrences: formData.maxOccurrences ? parseInt(formData.maxOccurrences) : undefined
        } : undefined,
        educationalInfo: {
          importance: `${formData.name} is important for maintaining your health and preventing disease.`,
          description: formData.description,
          benefits: ['Disease prevention', 'Health protection', 'Community immunity'],
          risks: ['Mild side effects possible', 'Consult healthcare provider for concerns'],
          preparation: ['Consult healthcare provider', 'Bring vaccination records', 'Inform about allergies'],
          afterCare: ['Monitor for side effects', 'Keep records updated', 'Follow up as needed'],
          sources: ['Healthcare Provider', 'WHO Guidelines', 'Ministry of Health']
        }
      };

      let savedReminder: CustomVaccinationReminder;
      
      if (editingReminder) {
        savedReminder = await vaccinationReminderService.updateReminder(editingReminder.id, reminderData);
      } else {
        savedReminder = await vaccinationReminderService.createReminder(reminderData);
      }

      onSave(savedReminder);
    } catch (error) {
      console.error('Error saving vaccination reminder:', error);
      setErrors({ submit: 'Failed to save vaccination reminder. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {editingReminder ? 'Edit Vaccination Reminder' : 'Add Vaccination Reminder'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vaccine Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Vaccination Type
            </label>
            <select
              value={selectedStandardVaccine}
              onChange={(e) => handleStandardVaccineSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a vaccination...</option>
              {vaccineOptions.map(vaccine => (
                <option key={vaccine.id} value={vaccine.id}>
                  {vaccine.name} ({vaccine.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level *
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vaccination Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Travel Vaccine - Yellow Fever"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.vaccineCategory}
              onChange={(e) => handleInputChange('vaccineCategory', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="routine">Routine</option>
              <option value="travel">Travel</option>
              <option value="occupational">Occupational</option>
              <option value="emergency">Emergency</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description/Definition *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Brief description of the vaccination, its purpose, and any important notes..."
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scheduled Date *
            </label>
            <input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.scheduledDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.scheduledDate && <p className="text-red-500 text-sm mt-1">{errors.scheduledDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scheduled Time *
            </label>
            <input
              type="time"
              value={formData.scheduledTime}
              onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.scheduledTime ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.scheduledTime && <p className="text-red-500 text-sm mt-1">{errors.scheduledTime}</p>}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Optional Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Additional notes, precautions, next booster date, etc..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Advanced Options Toggle */}
        <div className="border-t pt-6">
          <button
            type="button"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <span>{showAdvancedOptions ? '▼' : '▶'}</span>
            <span>Advanced Options</span>
          </button>
        </div>

        {showAdvancedOptions && (
          <div className="space-y-6 bg-gray-50 p-4 rounded-lg">
            {/* Recurring Settings */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
                  Recurring Reminder (for booster doses)
                </label>
              </div>

              {formData.isRecurring && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Repeat Every
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        min="1"
                        value={formData.recurringInterval}
                        onChange={(e) => handleInputChange('recurringInterval', parseInt(e.target.value))}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={formData.recurringType}
                        onChange={(e) => handleInputChange('recurringType', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="daily">Day(s)</option>
                        <option value="weekly">Week(s)</option>
                        <option value="monthly">Month(s)</option>
                        <option value="yearly">Year(s)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.recurringEndDate}
                      onChange={(e) => handleInputChange('recurringEndDate', e.target.value)}
                      min={formData.scheduledDate}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Occurrences (Optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxOccurrences}
                      onChange={(e) => handleInputChange('maxOccurrences', e.target.value)}
                      placeholder="e.g., 5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notification Settings */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="enableNotifications"
                  checked={formData.enableNotifications}
                  onChange={(e) => handleInputChange('enableNotifications', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="enableNotifications" className="text-sm font-medium text-gray-700">
                  Enable Notifications
                </label>
              </div>

              {formData.enableNotifications && (
                <div className="ml-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notification Methods
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {['website', 'email', 'sms', 'whatsapp'].map(method => (
                        <label key={method} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.notificationMethods.includes(method)}
                            onChange={(e) => handleNotificationMethodChange(method, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm capitalize">{method}</span>
                        </label>
                      ))}
                    </div>
                    {errors.notificationMethods && (
                      <p className="text-red-500 text-sm mt-1">{errors.notificationMethods}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notify Me (Days Before)
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {['30', '14', '7', '3', '1', '0'].map(days => (
                        <label key={days} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.advanceNotificationDays.includes(days)}
                            onChange={(e) => handleAdvanceNotificationDaysChange(days, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">{days === '0' ? 'Same day' : `${days} days`}</span>
                        </label>
                      ))}
                    </div>
                    {errors.advanceNotificationDays && (
                      <p className="text-red-500 text-sm mt-1">{errors.advanceNotificationDays}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notification Time
                    </label>
                    <input
                      type="time"
                      value={formData.notificationTime}
                      onChange={(e) => handleInputChange('notificationTime', e.target.value)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : editingReminder ? 'Update Reminder' : 'Create Reminder'}
          </button>
        </div>

        {errors.submit && (
          <div className="text-red-500 text-sm text-center">{errors.submit}</div>
        )}
      </form>
    </div>
  );
};

export default AddVaccinationReminder;
