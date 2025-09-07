import React, { useState, useEffect } from 'react';
import { Reminder } from '../types';
import { ReminderBell } from './ReminderBell';
import { ReminderPanel } from './ReminderPanel';
import { ReminderForm } from './ReminderForm';

interface ReminderSystemProps {
  className?: string;
}

/**
 * Main Reminder System component that integrates all reminder functionality
 * Includes notification bell, panel, and form modal with comprehensive error handling
 */
export const ReminderSystem: React.FC<ReminderSystemProps> = ({ className = '' }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      try {
        // Ctrl/Cmd + Shift + R to toggle reminder panel
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
          event.preventDefault();
          setIsPanelOpen(prev => !prev);
        }
        
        // Escape to close panel or form
        if (event.key === 'Escape') {
          if (isFormOpen) {
            setIsFormOpen(false);
            setEditingReminder(null);
          } else if (isPanelOpen) {
            setIsPanelOpen(false);
          }
        }
      } catch (err) {
        console.error('Keyboard shortcut error:', err);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPanelOpen, isFormOpen]);

  const handleTogglePanel = () => {
    try {
      setIsPanelOpen(prev => !prev);
    } catch (err) {
      console.error('Error toggling reminder panel:', err);
      showToast('Failed to toggle reminder panel', 'error');
    }
  };

  const handleClosePanel = () => {
    try {
      setIsPanelOpen(false);
    } catch (err) {
      console.error('Error closing reminder panel:', err);
    }
  };

  const handleAddReminder = () => {
    try {
      setEditingReminder(null);
      setIsFormOpen(true);
    } catch (err) {
      console.error('Error opening add reminder form:', err);
      showToast('Failed to open reminder form', 'error');
    }
  };

  const handleEditReminder = (reminder: Reminder) => {
    try {
      setEditingReminder(reminder);
      setIsFormOpen(true);
    } catch (err) {
      console.error('Error opening edit reminder form:', err);
      showToast('Failed to open edit form', 'error');
    }
  };

  const handleCloseForm = () => {
    try {
      setIsFormOpen(false);
      setEditingReminder(null);
    } catch (err) {
      console.error('Error closing reminder form:', err);
    }
  };

  const handleSaveReminder = (reminder: Reminder) => {
    try {
      const action = editingReminder ? 'updated' : 'created';
      showToast(`Reminder ${action} successfully!`, 'success');
      setIsFormOpen(false);
      setEditingReminder(null);
      
      // Force panel refresh by closing and reopening if it's open
      if (isPanelOpen) {
        setIsPanelOpen(false);
        setTimeout(() => setIsPanelOpen(true), 100);
      }
    } catch (err) {
      console.error('Error handling reminder save:', err);
      showToast('Failed to save reminder', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    try {
      setToastMessage(message);
      setToastType(type);
      
      // Auto-hide toast after 3 seconds
      setTimeout(() => {
        setToastMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error showing toast:', err);
    }
  };

  const handleCloseToast = () => {
    try {
      setToastMessage('');
    } catch (err) {
      console.error('Error closing toast:', err);
    }
  };

  return (
    <div className={`reminder-system ${className}`}>
      {/* Reminder Bell Icon */}
      <ReminderBell
        onTogglePanel={handleTogglePanel}
        isPanelOpen={isPanelOpen}
      />

      {/* Reminder Panel */}
      <ReminderPanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        onAddReminder={handleAddReminder}
        onEditReminder={handleEditReminder}
      />

      {/* Reminder Form Modal */}
      <ReminderForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveReminder}
        editingReminder={editingReminder}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
          <div className={`
            flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg max-w-sm
            ${toastType === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
            }
          `}>
            <div className="flex-shrink-0">
              {toastType === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            
            <div className="flex-1 text-sm font-medium">
              {toastMessage}
            </div>
            
            <button
              onClick={handleCloseToast}
              className="flex-shrink-0 p-1 rounded-full hover:bg-black hover:bg-opacity-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help (Hidden by default, can be shown with a help button) */}
      <div className="sr-only">
        <p>Keyboard shortcuts:</p>
        <ul>
          <li>Ctrl/Cmd + Shift + R: Toggle reminder panel</li>
          <li>Escape: Close panel or form</li>
        </ul>
      </div>
    </div>
  );
};

export default ReminderSystem;
