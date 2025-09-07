import React, { useState, useEffect } from 'react';
import { 
  VaccinationCalendarEvent, 
  CustomVaccinationReminder, 
  Language 
} from '../types';
import { vaccinationReminderService } from '../services/vaccinationReminderService';

interface VaccinationCalendarProps {
  userId: string;
  language: Language;
  onEventClick?: (event: VaccinationCalendarEvent) => void;
  onDateSelect?: (date: string) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: VaccinationCalendarEvent[];
}

/**
 * Interactive Vaccination Calendar Component
 * Features: Monthly/Weekly view, event management, drag-and-drop scheduling
 */
export const VaccinationCalendar: React.FC<VaccinationCalendarProps> = ({
  userId,
  language,
  onEventClick,
  onDateSelect
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [events, setEvents] = useState<VaccinationCalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Calendar navigation
  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    loadCalendarEvents();
  }, [userId, currentDate, viewMode]);

  const loadCalendarEvents = async () => {
    setLoading(true);
    try {
      const startDate = getViewStartDate();
      const endDate = getViewEndDate();
      
      const calendarEvents = await vaccinationReminderService.getCalendarEvents(
        userId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error loading calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getViewStartDate = (): Date => {
    if (viewMode === 'month') {
      const firstDay = new Date(currentYear, currentMonth, 1);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
      return startDate;
    } else {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      return startOfWeek;
    }
  };

  const getViewEndDate = (): Date => {
    if (viewMode === 'month') {
      const lastDay = new Date(currentYear, currentMonth + 1, 0);
      const endDate = new Date(lastDay);
      endDate.setDate(endDate.getDate() + (6 - lastDay.getDay())); // End on Saturday
      return endDate;
    } else {
      const endOfWeek = new Date(currentDate);
      endOfWeek.setDate(currentDate.getDate() + (6 - currentDate.getDay()));
      return endOfWeek;
    }
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const startDate = getViewStartDate();
    const endDate = getViewEndDate();
    
    let currentDay = new Date(startDate);
    
    while (currentDay <= endDate) {
      const dayEvents = events.filter(event => 
        event.date === currentDay.toISOString().split('T')[0]
      );
      
      days.push({
        date: new Date(currentDay),
        isCurrentMonth: currentDay.getMonth() === currentMonth,
        isToday: currentDay.toDateString() === today.toDateString(),
        events: dayEvents
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const handleDateClick = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    setSelectedDate(dateString);
    onDateSelect?.(dateString);
  };

  const handleEventClick = (event: VaccinationCalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventClick?.(event);
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-red-400 text-white';
      case 'medium': return 'bg-yellow-400 text-gray-900';
      case 'low': return 'bg-blue-400 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'overdue': return 'bg-red-600 text-white';
      case 'pending': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatMonthYear = (): string => {
    return currentDate.toLocaleDateString(language === 'english' ? 'en-US' : 'hi-IN', {
      month: 'long',
      year: 'numeric'
    });
  };

  const renderMonthView = () => {
    const calendarDays = generateCalendarDays();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="bg-white rounded-lg shadow">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ←
            </button>
            <h2 className="text-xl font-semibold">{formatMonthYear()}</h2>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              →
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('week')}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Week
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded"
            >
              Today
            </button>
          </div>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 border-b">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center font-medium text-gray-600 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              onClick={() => handleDateClick(day.date)}
              className={`
                min-h-[120px] p-2 border-r border-b last:border-r-0 cursor-pointer hover:bg-gray-50
                ${!day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                ${day.isToday ? 'bg-blue-50 border-blue-200' : ''}
                ${selectedDate === day.date.toISOString().split('T')[0] ? 'bg-blue-100' : ''}
              `}
            >
              <div className={`
                text-sm font-medium mb-1
                ${day.isToday ? 'text-blue-600' : ''}
              `}>
                {day.date.getDate()}
              </div>
              
              {/* Events */}
              <div className="space-y-1">
                {day.events.slice(0, 3).map((event, eventIndex) => (
                  <div
                    key={eventIndex}
                    onClick={(e) => handleEventClick(event, e)}
                    className={`
                      text-xs p-1 rounded cursor-pointer hover:opacity-80
                      ${getPriorityColor(event.priority)}
                    `}
                    title={`${event.title} - ${event.time}`}
                  >
                    <div className="truncate">{event.title}</div>
                    <div className="text-xs opacity-75">{event.time}</div>
                  </div>
                ))}
                {day.events.length > 3 && (
                  <div className="text-xs text-gray-500 p-1">
                    +{day.events.length - 3} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const calendarDays = generateCalendarDays().slice(0, 7);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="bg-white rounded-lg shadow">
        {/* Week Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ←
            </button>
            <h2 className="text-xl font-semibold">
              {calendarDays[0]?.date.toLocaleDateString()} - {calendarDays[6]?.date.toLocaleDateString()}
            </h2>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              →
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('month')}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Month
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded"
            >
              Today
            </button>
          </div>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              onClick={() => handleDateClick(day.date)}
              className={`
                min-h-[400px] p-3 border-r last:border-r-0 cursor-pointer hover:bg-gray-50
                ${day.isToday ? 'bg-blue-50' : ''}
                ${selectedDate === day.date.toISOString().split('T')[0] ? 'bg-blue-100' : ''}
              `}
            >
              <div className="text-center mb-3">
                <div className="text-sm font-medium text-gray-600">{weekDays[index]}</div>
                <div className={`
                  text-lg font-semibold
                  ${day.isToday ? 'text-blue-600' : ''}
                `}>
                  {day.date.getDate()}
                </div>
              </div>
              
              {/* Events */}
              <div className="space-y-2">
                {day.events.map((event, eventIndex) => (
                  <div
                    key={eventIndex}
                    onClick={(e) => handleEventClick(event, e)}
                    className={`
                      p-2 rounded cursor-pointer hover:opacity-80 border-l-4
                      ${getStatusColor(event.status)}
                    `}
                  >
                    <div className="font-medium text-sm">{event.title}</div>
                    <div className="text-xs opacity-75">{event.time}</div>
                    <div className="text-xs mt-1">
                      <span className={`
                        px-2 py-1 rounded-full text-xs
                        ${event.priority === 'critical' ? 'bg-red-100 text-red-800' :
                          event.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          event.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'}
                      `}>
                        {event.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLegend = () => (
    <div className="bg-white rounded-lg shadow p-4 mt-4">
      <h3 className="font-semibold mb-3">Legend</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Priority Levels</h4>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-600 rounded"></div>
              <span className="text-sm">Critical</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-400 rounded"></div>
              <span className="text-sm">High</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-400 rounded"></div>
              <span className="text-sm">Medium</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded"></div>
              <span className="text-sm">Low</span>
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-2">Status</h4>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm">Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-600 rounded"></div>
              <span className="text-sm">Overdue</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm">Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading calendar...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {viewMode === 'month' ? renderMonthView() : renderWeekView()}
      {renderLegend()}
    </div>
  );
};

export default VaccinationCalendar;
