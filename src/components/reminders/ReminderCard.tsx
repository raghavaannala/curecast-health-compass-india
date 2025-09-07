import React, { useState } from 'react';
import { Calendar, Clock, Edit3, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { firebaseReminderService, type Reminder } from '../../services/firebaseReminderService';

interface ReminderCardProps {
  reminder: Reminder;
  onEdit: (reminder: Reminder) => void;
  onDelete: (reminderId: string) => void;
  userId: string;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onEdit,
  onDelete,
  userId
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { date, time, isOverdue } = firebaseReminderService.formatReminderDate(reminder.date_time);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await firebaseReminderService.deleteReminder(reminder.id, userId);
      onDelete(reminder.id);
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      alert('Failed to delete reminder. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getCardStyles = () => {
    if (isOverdue) {
      return 'border-red-200 bg-red-50 shadow-red-100';
    }
    
    const reminderDate = new Date(reminder.date_time);
    const now = new Date();
    const hoursDiff = (reminderDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff <= 24) {
      return 'border-yellow-200 bg-yellow-50 shadow-yellow-100';
    }
    
    return 'border-gray-200 bg-white shadow-gray-100';
  };

  const getStatusIcon = () => {
    if (isOverdue) {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
    
    const reminderDate = new Date(reminder.date_time);
    const now = new Date();
    const hoursDiff = (reminderDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff <= 24) {
      return <Clock className="w-5 h-5 text-yellow-500" />;
    }
    
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  const getStatusText = () => {
    if (isOverdue) {
      return 'Overdue';
    }
    
    const reminderDate = new Date(reminder.date_time);
    const now = new Date();
    const hoursDiff = (reminderDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff <= 1) {
      const minutes = Math.round(hoursDiff * 60);
      return `In ${minutes} min${minutes !== 1 ? 's' : ''}`;
    } else if (hoursDiff <= 24) {
      const hours = Math.round(hoursDiff);
      return `In ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.round(hoursDiff / 24);
      return `In ${days} day${days !== 1 ? 's' : ''}`;
    }
  };

  return (
    <div className={`rounded-lg border-2 shadow-lg transition-all duration-200 hover:shadow-xl ${getCardStyles()}`}>
      <div className="p-4">
        {/* Header with Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${
              isOverdue ? 'text-red-600' : 
              getStatusText().includes('hour') ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {getStatusText()}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(reminder)}
              className="p-2 h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-100"
              title="Edit reminder"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-100"
              title="Delete reminder"
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {reminder.title}
        </h3>

        {/* Date and Time */}
        <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>{date}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>{time}</span>
          </div>
        </div>

        {/* Description */}
        {reminder.description && (
          <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
            {reminder.description}
          </p>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Reminder</h3>
                <p className="text-sm text-gray-600">This action cannot be undone.</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete "<strong>{reminder.title}</strong>"?
            </p>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </div>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReminderCard;
