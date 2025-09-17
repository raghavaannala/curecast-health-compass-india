import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Clock, CheckCircle, Snooze, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Reminder } from '@/services/firebaseReminderService';

interface FloatingReminderNotificationProps {
  reminder: Reminder;
  onDismiss: () => void;
  onComplete: () => void;
  onSnooze: (minutes: number) => void;
}

export const FloatingReminderNotification: React.FC<FloatingReminderNotificationProps> = ({
  reminder,
  onDismiss,
  onComplete,
  onSnooze
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const reminderTime = new Date(reminder.date_time);
      const elapsed = Math.floor((now.getTime() - reminderTime.getTime()) / 1000 / 60); // minutes
      setTimeElapsed(elapsed);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [reminder.date_time]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Wait for animation to complete
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };

  const handleSnooze = (minutes: number) => {
    setIsVisible(false);
    setTimeout(() => onSnooze(minutes), 300);
  };

  const formatTimeElapsed = (minutes: number) => {
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getUrgencyColor = () => {
    if (timeElapsed > 60) return 'bg-red-500'; // More than 1 hour overdue
    if (timeElapsed > 15) return 'bg-orange-500'; // More than 15 minutes overdue
    return 'bg-blue-500'; // On time or just overdue
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 right-4 z-50 max-w-sm w-full"
        >
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-full ${getUrgencyColor()}`}>
                    <Bell className="h-4 w-4 text-white animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Reminder Due</h3>
                    <p className="text-xs text-gray-500">
                      {timeElapsed > 0 ? formatTimeElapsed(timeElapsed) : 'Now'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Reminder Content */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                  {reminder.title}
                </h4>
                {reminder.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {reminder.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {new Date(reminder.date_time).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Urgency Badge */}
              {timeElapsed > 15 && (
                <div className="mb-3">
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {timeElapsed > 60 ? 'Overdue' : 'Late'}
                  </Badge>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleComplete}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white h-8"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Done
                </Button>
                
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSnooze(5)}
                    className="h-8 px-2 text-xs"
                    title="Snooze for 5 minutes"
                  >
                    5m
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSnooze(15)}
                    className="h-8 px-2 text-xs"
                    title="Snooze for 15 minutes"
                  >
                    15m
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSnooze(60)}
                    className="h-8 px-2 text-xs"
                    title="Snooze for 1 hour"
                  >
                    1h
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingReminderNotification;
