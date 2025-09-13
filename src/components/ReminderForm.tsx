import React, { useState, useEffect } from 'react';
import { Reminder, ReminderFormData } from '../types';
import { reminderService } from '../services/reminderService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Calendar, Clock, Tag, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReminderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reminder: Reminder) => void;
  editingReminder?: Reminder | null;
}

/**
 * Modal form for creating and editing reminders
 */
export const ReminderForm: React.FC<ReminderFormProps> = ({
  isOpen,
  onClose,
  onSave,
  editingReminder
}) => {
  const [formData, setFormData] = useState<ReminderFormData>({
    title: '',
    description: '',
    dueDate: '',
    dueTime: '',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadAvailableTags();
      if (editingReminder) {
        populateForm(editingReminder);
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingReminder]);

  const loadAvailableTags = async () => {
    try {
      const tags = await reminderService.getAllTags();
      setAvailableTags(tags);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const populateForm = (reminder: Reminder) => {
    try {
      const dueDate = new Date(reminder.dueDateTime);
      const dateStr = dueDate.toISOString().split('T')[0];
      const timeStr = dueDate.toTimeString().slice(0, 5);

      setFormData({
        title: reminder.title,
        description: reminder.description,
        dueDate: dateStr,
        dueTime: timeStr,
        tags: [...reminder.tags]
      });
    } catch (err) {
      console.error('Failed to populate form:', err);
      setErrors(['Failed to load reminder data']);
    }
  };

  const resetForm = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);

    setFormData({
      title: '',
      description: '',
      dueDate: dateStr,
      dueTime: timeStr,
      tags: []
    });
    setTagInput('');
    setErrors([]);
  };

  const handleInputChange = (field: keyof ReminderFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleQuickTagSelect = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const validateForm = (): boolean => {
    try {
      const validationErrors = reminderService.validateFormData(formData);
      setErrors(validationErrors);
      return validationErrors.length === 0;
    } catch (err) {
      console.error('Form validation error:', err);
      setErrors(['Form validation failed']);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      let savedReminder: Reminder;
      
      if (editingReminder) {
        savedReminder = await reminderService.updateReminder(editingReminder.id, formData);
      } else {
        savedReminder = await reminderService.createReminder(formData);
      }

      onSave(savedReminder);
      onClose();
    } catch (err) {
      console.error('Failed to save reminder:', err);
      setErrors([err instanceof Error ? err.message : 'Failed to save reminder']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (formData.title || formData.description) {
      if (window.confirm('Are you sure you want to discard your changes?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center min-h-screen p-4">
        {/* Modal */}
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border relative transform translate-x-0 translate-y-0">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {editingReminder ? 'Edit Reminder' : 'Create New Reminder'}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              disabled={isLoading}
              className="hover:bg-red-100 text-red-600 rounded-xl"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium mb-1">Please fix the following errors:</h4>
                  <ul className="text-sm space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-semibold text-gray-800">
                Reminder Title *
              </label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter a clear, descriptive title..."
                className="h-12 text-base"
                disabled={isLoading}
                maxLength={100}
                required
              />
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Be specific and clear</span>
                <span className={cn(
                  "font-medium",
                  formData.title.length > 80 ? "text-orange-600" : "text-gray-500"
                )}>
                  {formData.title.length}/100
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-semibold text-gray-800">
                Description (Optional)
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Add any additional details, context, or instructions..."
                rows={4}
                className="resize-none text-base"
                disabled={isLoading}
                maxLength={500}
              />
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Provide context or special instructions</span>
                <span className={cn(
                  "font-medium",
                  formData.description.length > 400 ? "text-orange-600" : "text-gray-500"
                )}>
                  {formData.description.length}/500
                </span>
              </div>
            </div>

            {/* Date and Time */}
            <div className="p-4 bg-blue-50 rounded-xl space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-800">Schedule</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="dueDate" className="block text-sm font-semibold text-gray-700">
                    Date *
                  </label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    className="h-12 bg-white"
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="dueTime" className="block text-sm font-semibold text-gray-700">
                    Time *
                  </label>
                  <Input
                    id="dueTime"
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) => handleInputChange('dueTime', e.target.value)}
                    className="h-12 bg-white"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="p-4 bg-green-50 rounded-xl space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-gray-800">Tags (Optional)</h3>
              </div>
              
              {/* Current Tags */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 text-sm"
                    >
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 h-4 w-4 p-0 hover:bg-blue-200 text-blue-600"
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add Tag Input */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  placeholder="Add a tag (e.g., work, health, personal)..."
                  className="flex-1 bg-white"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim() || isLoading}
                  variant="outline"
                  className="bg-white hover:bg-green-100"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              {/* Quick Tag Selection */}
              {availableTags.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Suggested tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableTags
                      .filter(tag => !formData.tags.includes(tag))
                      .slice(0, 6)
                      .map(tag => (
                        <Button
                          key={tag}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickTagSelect(tag)}
                          className="bg-white hover:bg-green-100 text-xs"
                          disabled={isLoading}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {tag}
                        </Button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 h-12 text-base"
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={isLoading || !formData.title.trim()}
                className="flex-1 h-12 text-base bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    {editingReminder ? (
                      <>
                        <Calendar className="h-4 w-4 mr-2" />
                        Update Reminder
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Reminder
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ReminderForm;
