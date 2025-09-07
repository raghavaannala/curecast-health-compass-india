import React, { useState, useEffect } from 'react';
import { 
  CustomVaccinationReminder, 
  VaccinationCalendarEvent,
  Language 
} from '../types';
import { vaccinationReminderService } from '../services/vaccinationReminderService';
import { VaccinationCalendar } from './VaccinationCalendar';
import { AddVaccinationReminder } from './AddVaccinationReminder';
import { VaccinationNotificationSystem } from './VaccinationNotificationSystem';

interface VaccinationDashboardProps {
  userId: string;
  language: Language;
}

interface DashboardStats {
  totalReminders: number;
  upcomingReminders: number;
  overdueReminders: number;
  completedThisMonth: number;
}

/**
 * Main Vaccination Dashboard Component
 * Integrates calendar, reminders, notifications, and management features
 */
export const VaccinationDashboard: React.FC<VaccinationDashboardProps> = ({
  userId,
  language
}) => {
  const [reminders, setReminders] = useState<CustomVaccinationReminder[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<VaccinationCalendarEvent[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalReminders: 0,
    upcomingReminders: 0,
    overdueReminders: 0,
    completedThisMonth: 0
  });
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<CustomVaccinationReminder | undefined>();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'dashboard' | 'calendar' | 'list'>('dashboard');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Load user reminders
      const userReminders = await vaccinationReminderService.getUserReminders(userId);
      setReminders(userReminders);

      // Convert reminders to calendar events
      const events: VaccinationCalendarEvent[] = userReminders.map(reminder => ({
        id: reminder.id,
        title: reminder.name,
        date: reminder.scheduledDate,
        time: reminder.scheduledTime,
        type: 'vaccination',
        priority: reminder.priority,
        status: reminder.status,
        description: reminder.description,
        isRecurring: reminder.isRecurring,
        governmentMandated: reminder.governmentMandated
      }));
      setCalendarEvents(events);

      // Calculate statistics
      await calculateStats(userReminders);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load vaccination data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async (userReminders: CustomVaccinationReminder[]) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const upcomingReminders = await vaccinationReminderService.getUpcomingReminders(userId, 30);
    const overdueReminders = await vaccinationReminderService.getOverdueReminders(userId);
    
    const completedThisMonth = userReminders.filter(reminder => {
      if (reminder.status !== 'completed') return false;
      const completedDate = new Date(reminder.scheduledDate);
      return completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear;
    }).length;

    setStats({
      totalReminders: userReminders.length,
      upcomingReminders: upcomingReminders.length,
      overdueReminders: overdueReminders.length,
      completedThisMonth
    });
  };

  const handleAddReminder = () => {
    setEditingReminder(undefined);
    setShowAddForm(true);
  };

  const handleEditReminder = (reminder: CustomVaccinationReminder) => {
    setEditingReminder(reminder);
    setShowAddForm(true);
  };

  const handleSaveReminder = async (reminder: CustomVaccinationReminder) => {
    setShowAddForm(false);
    setEditingReminder(undefined);
    await loadDashboardData(); // Refresh data
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingReminder(undefined);
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (window.confirm('Are you sure you want to delete this vaccination reminder?')) {
      try {
        await vaccinationReminderService.deleteReminder(reminderId);
        await loadDashboardData(); // Refresh data
      } catch (error) {
        console.error('Error deleting reminder:', error);
        setError('Failed to delete reminder. Please try again.');
      }
    }
  };

  const handleMarkComplete = async (reminderId: string) => {
    try {
      await vaccinationReminderService.markCompleted(reminderId);
      await loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error marking reminder complete:', error);
      setError('Failed to mark reminder as complete. Please try again.');
    }
  };

  const handleCalendarEventClick = (event: VaccinationCalendarEvent) => {
    const reminder = reminders.find(r => r.id === event.id);
    if (reminder) {
      handleEditReminder(reminder);
    }
  };

  const handleCalendarDateSelect = (date: string) => {
    setSelectedDate(date);
    setShowAddForm(true);
  };

  const getFilteredReminders = () => {
    let filtered = reminders;

    switch (filterStatus) {
      case 'pending':
        filtered = reminders.filter(r => r.status === 'pending');
        break;
      case 'completed':
        filtered = reminders.filter(r => r.status === 'completed');
        break;
      case 'overdue':
        const today = new Date().toISOString().split('T')[0];
        filtered = reminders.filter(r => 
          r.status === 'pending' && r.scheduledDate < today
        );
        break;
      default:
        break;
    }

    return filtered.sort((a, b) => {
      // Sort by date, then by priority
      const dateCompare = a.scheduledDate.localeCompare(b.scheduledDate);
      if (dateCompare !== 0) return dateCompare;
      
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string, scheduledDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (status === 'completed') return 'text-green-600 bg-green-100';
    if (status === 'pending' && scheduledDate < today) return 'text-red-600 bg-red-100';
    return 'text-blue-600 bg-blue-100';
  };

  const getStatusLabel = (status: string, scheduledDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (status === 'completed') return 'Completed';
    if (status === 'pending' && scheduledDate < today) return 'Overdue';
    if (status === 'pending' && scheduledDate === today) return 'Due Today';
    return 'Pending';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showAddForm) {
    return (
      <AddVaccinationReminder
        userId={userId}
        language={language}
        editingReminder={editingReminder}
        onSave={handleSaveReminder}
        onCancel={handleCancelForm}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with Notification System */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vaccination Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your vaccination schedule and reminders</p>
        </div>
        <div className="flex items-center space-x-4">
          <VaccinationNotificationSystem userId={userId} language={language} />
          <button
            onClick={handleAddReminder}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            + Add Reminder
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reminders</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalReminders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Upcoming (30 days)</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.upcomingReminders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.overdueReminders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed This Month</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completedThisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('dashboard')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              viewMode === 'dashboard' 
                ? 'bg-white text-gray-900 shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              viewMode === 'calendar' 
                ? 'bg-white text-gray-900 shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              viewMode === 'list' 
                ? 'bg-white text-gray-900 shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            List View
          </button>
        </div>

        {viewMode === 'list' && (
          <div className="flex space-x-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Reminders</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-lg shadow border">
          <VaccinationCalendar
            events={calendarEvents}
            onEventClick={handleCalendarEventClick}
            onDateSelect={handleCalendarDateSelect}
          />
        </div>
      )}

      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Vaccination Reminders ({getFilteredReminders().length})
            </h2>
            
            {getFilteredReminders().length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No reminders found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first vaccination reminder.</p>
                <div className="mt-6">
                  <button
                    onClick={handleAddReminder}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Add Reminder
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredReminders().map(reminder => (
                  <div key={reminder.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{reminder.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(reminder.priority)}`}>
                            {reminder.priority}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(reminder.status, reminder.scheduledDate)}`}>
                            {getStatusLabel(reminder.status, reminder.scheduledDate)}
                          </span>
                          {reminder.governmentMandated && (
                            <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-600">
                              Government Mandated
                            </span>
                          )}
                          {reminder.isRecurring && (
                            <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-600">
                              Recurring
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">{reminder.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>📅 {new Date(reminder.scheduledDate).toLocaleDateString()}</span>
                          <span>🕐 {reminder.scheduledTime}</span>
                          {reminder.notes && <span>📝 {reminder.notes}</span>}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        {reminder.status === 'pending' && (
                          <button
                            onClick={() => handleMarkComplete(reminder.id)}
                            className="text-green-600 hover:text-green-800 p-2"
                            title="Mark as completed"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => handleEditReminder(reminder)}
                          className="text-blue-600 hover:text-blue-800 p-2"
                          title="Edit reminder"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteReminder(reminder.id)}
                          className="text-red-600 hover:text-red-800 p-2"
                          title="Delete reminder"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar Widget */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Calendar View</h2>
            </div>
            <VaccinationCalendar
              events={calendarEvents}
              onEventClick={handleCalendarEventClick}
              onDateSelect={handleCalendarDateSelect}
            />
          </div>

          {/* Recent Reminders */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Recent Reminders</h2>
              <button
                onClick={() => setViewMode('list')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                View All →
              </button>
            </div>
            <div className="p-4">
              {reminders.slice(0, 5).map(reminder => (
                <div key={reminder.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{reminder.name}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(reminder.scheduledDate).toLocaleDateString()} at {reminder.scheduledTime}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(reminder.status, reminder.scheduledDate)}`}>
                      {getStatusLabel(reminder.status, reminder.scheduledDate)}
                    </span>
                  </div>
                </div>
              ))}
              
              {reminders.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No reminders yet</p>
                  <button
                    onClick={handleAddReminder}
                    className="mt-2 text-blue-600 hover:text-blue-800"
                  >
                    Create your first reminder
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaccinationDashboard;
