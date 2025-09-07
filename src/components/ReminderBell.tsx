import React, { useState, useEffect } from 'react';
import { reminderService } from '../services/reminderService';

interface ReminderBellProps {
  onTogglePanel: () => void;
  isPanelOpen: boolean;
}

/**
 * Notification bell icon with badge count for reminders
 */
export const ReminderBell: React.FC<ReminderBellProps> = ({
  onTogglePanel,
  isPanelOpen
}) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadCounts();
    
    // Set up interval to refresh counts every minute
    const interval = setInterval(loadCounts, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const loadCounts = async () => {
    try {
      setError('');
      const [pending, overdue] = await Promise.all([
        reminderService.getPendingCount(),
        reminderService.getOverdueCount()
      ]);
      
      setPendingCount(pending);
      setOverdueCount(overdue);
    } catch (err) {
      console.error('Failed to load reminder counts:', err);
      setError('Failed to load reminder counts');
      // Don't show error to user for counts, just log it
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    try {
      onTogglePanel();
      // Refresh counts when panel is opened
      if (!isPanelOpen) {
        loadCounts();
      }
    } catch (err) {
      console.error('Error toggling reminder panel:', err);
    }
  };

  const getBadgeColor = () => {
    if (overdueCount > 0) return 'bg-red-500';
    if (pendingCount > 0) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  const getBadgeText = () => {
    if (pendingCount > 99) return '99+';
    return pendingCount.toString();
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`
          relative p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${isPanelOpen 
            ? 'bg-blue-100 text-blue-600' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        disabled={isLoading}
        title={`${pendingCount} pending reminders${overdueCount > 0 ? `, ${overdueCount} overdue` : ''}`}
        aria-label={`Reminders: ${pendingCount} pending${overdueCount > 0 ? `, ${overdueCount} overdue` : ''}`}
      >
        {/* Bell Icon */}
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>

        {/* Badge */}
        {pendingCount > 0 && !isLoading && (
          <span 
            className={`
              absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 rounded-full min-w-[20px] h-5
              ${getBadgeColor()}
              ${overdueCount > 0 ? 'animate-pulse' : ''}
            `}
          >
            {getBadgeText()}
          </span>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute -top-1 -right-1 w-3 h-3">
            <div className="w-full h-full bg-gray-300 rounded-full animate-pulse"></div>
          </div>
        )}

        {/* Overdue indicator */}
        {overdueCount > 0 && !isLoading && (
          <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
        )}
      </button>

      {/* Error tooltip (hidden by default) */}
      {error && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded shadow-lg whitespace-nowrap z-50">
          {error}
        </div>
      )}
    </div>
  );
};

export default ReminderBell;
