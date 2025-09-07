import React, { useState, useEffect } from 'react';
import { Reminder, ReminderFilter } from '../types';
import { reminderService } from '../services/reminderService';

interface ReminderPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddReminder: () => void;
  onEditReminder: (reminder: Reminder) => void;
}

/**
 * Sidebar panel showing all reminders with search, filter, and actions
 */
export const ReminderPanel: React.FC<ReminderPanelProps> = ({
  isOpen,
  onClose,
  onAddReminder,
  onEditReminder
}) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filteredReminders, setFilteredReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<ReminderFilter>({
    searchQuery: '',
    selectedTags: [],
    showCompleted: false
  });
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadReminders();
      loadTags();
    }
  }, [isOpen]);

  useEffect(() => {
    applyFilters();
  }, [reminders, filter]);

  const loadReminders = async () => {
    try {
      setError('');
      setIsLoading(true);
      const data = await reminderService.getReminders();
      setReminders(data);
    } catch (err) {
      console.error('Failed to load reminders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reminders');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const tags = await reminderService.getAllTags();
      setAvailableTags(tags);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const applyFilters = async () => {
    try {
      const filtered = await reminderService.searchReminders(
        filter.searchQuery,
        filter.selectedTags,
        filter.showCompleted
      );
      setFilteredReminders(filtered);
    } catch (err) {
      console.error('Failed to filter reminders:', err);
      setFilteredReminders(reminders);
    }
  };

  const handleToggleComplete = async (id: string) => {
    try {
      await reminderService.toggleReminderComplete(id);
      await loadReminders(); // Refresh the list
    } catch (err) {
      console.error('Failed to toggle reminder:', err);
      setError(err instanceof Error ? err.message : 'Failed to update reminder');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await reminderService.deleteReminder(id);
      await loadReminders(); // Refresh the list
    } catch (err) {
      console.error('Failed to delete reminder:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete reminder');
    }
  };

  const handleSearchChange = (query: string) => {
    setFilter(prev => ({ ...prev, searchQuery: query }));
  };

  const handleTagToggle = (tag: string) => {
    setFilter(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag]
    }));
  };

  const handleShowCompletedToggle = () => {
    setFilter(prev => ({ ...prev, showCompleted: !prev.showCompleted }));
  };

  const formatDateTime = (dateTime: string) => {
    try {
      const date = new Date(dateTime);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();
      
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (isToday) return `Today at ${timeStr}`;
      if (isTomorrow) return `Tomorrow at ${timeStr}`;
      
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateTime;
    }
  };

  const getReminderStatusClass = (reminder: Reminder) => {
    if (reminder.completed) return 'bg-green-50 border-green-200';
    if (reminder.isOverdue) return 'bg-red-50 border-red-200';
    return 'bg-white border-gray-200';
  };

  const getReminderTextClass = (reminder: Reminder) => {
    if (reminder.completed) return 'text-gray-500 line-through';
    if (reminder.isOverdue) return 'text-red-700';
    return 'text-gray-900';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Reminders</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b space-y-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search reminders..."
              value={filter.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Show Completed Toggle */}
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={filter.showCompleted}
              onChange={handleShowCompletedToggle}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Show completed</span>
          </label>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Filter by tags:</p>
              <div className="flex flex-wrap gap-1">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-2 py-1 text-xs rounded-full border ${
                      filter.selectedTags.includes(tag)
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div className="m-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              {error}
              <button
                onClick={() => setError('')}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredReminders.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6.334C5.597 19 5 18.403 5 17.666V4.334C5 3.597 5.597 3 6.334 3h11.332C18.403 3 19 3.597 19 4.334V11" />
              </svg>
              <p className="text-gray-500 mb-2">
                {filter.searchQuery || filter.selectedTags.length > 0 
                  ? 'No reminders match your filters' 
                  : 'No reminders yet'
                }
              </p>
              <p className="text-sm text-gray-400">
                {filter.searchQuery || filter.selectedTags.length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Click the + button below to add your first reminder'
                }
              </p>
            </div>
          )}

          {/* Reminders List */}
          {!isLoading && filteredReminders.length > 0 && (
            <div className="p-4 space-y-3">
              {filteredReminders.map(reminder => (
                <div
                  key={reminder.id}
                  className={`p-3 rounded-lg border transition-all ${getReminderStatusClass(reminder)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium truncate ${getReminderTextClass(reminder)}`}>
                        {reminder.title}
                      </h3>
                      {reminder.description && (
                        <p className={`text-sm mt-1 ${reminder.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                          {reminder.description}
                        </p>
                      )}
                      <div className="flex items-center mt-2 space-x-2">
                        <span className={`text-xs ${
                          reminder.isOverdue && !reminder.completed ? 'text-red-600 font-medium' : 'text-gray-500'
                        }`}>
                          {reminder.isOverdue && !reminder.completed && '⚠️ '}
                          {formatDateTime(reminder.dueDateTime)}
                        </span>
                        {reminder.tags.length > 0 && (
                          <div className="flex gap-1">
                            {reminder.tags.map(tag => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={() => handleToggleComplete(reminder.id)}
                        className={`p-1.5 rounded text-sm ${
                          reminder.completed
                            ? 'text-green-600 hover:bg-green-100'
                            : 'text-gray-400 hover:bg-gray-100 hover:text-green-600'
                        }`}
                        title={reminder.completed ? 'Mark as pending' : 'Mark as done'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => onEditReminder(reminder)}
                        className="p-1.5 rounded text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                        title="Edit reminder"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => handleDelete(reminder.id, reminder.title)}
                        className="p-1.5 rounded text-gray-400 hover:bg-red-100 hover:text-red-600"
                        title="Delete reminder"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Reminder Button */}
        <div className="p-4 border-t">
          <button
            onClick={onAddReminder}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Reminder</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default ReminderPanel;
