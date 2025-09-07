import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Search, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { firebaseReminderService, type Reminder } from '../../services/firebaseReminderService';
import ReminderForm from './ReminderForm';
import ReminderCard from './ReminderCard';

interface RemindersSectionProps {
  userId: string;
  isAuthenticated: boolean;
}

type FilterType = 'all' | 'upcoming' | 'overdue' | 'today';

export const RemindersSection: React.FC<RemindersSectionProps> = ({
  userId,
  isAuthenticated
}) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filteredReminders, setFilteredReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [error, setError] = useState<string | null>(null);

  // Load reminders on component mount and when userId changes
  useEffect(() => {
    if (isAuthenticated && userId) {
      loadReminders();
    } else {
      setReminders([]);
      setFilteredReminders([]);
      setIsLoading(false);
    }
  }, [userId, isAuthenticated]);

  // Apply filters and search when reminders, search query, or filter changes
  useEffect(() => {
    applyFiltersAndSearch();
  }, [reminders, searchQuery, activeFilter]);

  const loadReminders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userReminders = await firebaseReminderService.getUserReminders(userId);
      setReminders(userReminders);
    } catch (error) {
      console.error('Failed to load reminders:', error);
      setError('Failed to load reminders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...reminders];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(reminder =>
        reminder.title.toLowerCase().includes(query) ||
        reminder.description.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (activeFilter) {
      case 'overdue':
        filtered = filtered.filter(reminder => new Date(reminder.date_time) < now);
        break;
      case 'today':
        filtered = filtered.filter(reminder => {
          const reminderDate = new Date(reminder.date_time);
          return reminderDate >= today && reminderDate < tomorrow;
        });
        break;
      case 'upcoming':
        filtered = filtered.filter(reminder => new Date(reminder.date_time) >= now);
        break;
      case 'all':
      default:
        // No additional filtering
        break;
    }

    setFilteredReminders(filtered);
  };

  const handleSaveReminder = (savedReminder: Reminder) => {
    if (editingReminder) {
      // Update existing reminder
      setReminders(prev => prev.map(r => r.id === savedReminder.id ? savedReminder : r));
    } else {
      // Add new reminder
      setReminders(prev => [savedReminder, ...prev]);
    }
    setEditingReminder(null);
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsFormOpen(true);
  };

  const handleDeleteReminder = (reminderId: string) => {
    setReminders(prev => prev.filter(r => r.id !== reminderId));
  };

  const handleAddNewReminder = () => {
    setEditingReminder(null);
    setIsFormOpen(true);
  };

  const getFilterCounts = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      all: reminders.length,
      overdue: reminders.filter(r => new Date(r.date_time) < now).length,
      today: reminders.filter(r => {
        const reminderDate = new Date(r.date_time);
        return reminderDate >= today && reminderDate < tomorrow;
      }).length,
      upcoming: reminders.filter(r => new Date(r.date_time) >= now).length
    };
  };

  const filterCounts = getFilterCounts();

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Health Reminders</h2>
          <p className="text-gray-600 mb-6">
            Sign in to create and manage your health reminders
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Health Reminders</h2>
          <p className="text-gray-600">
            Stay on top of your health with personalized reminders
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            variant="outline"
            onClick={loadReminders}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          
          <Button
            onClick={handleAddNewReminder}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Reminder</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search reminders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {([
            { key: 'all', label: 'All', count: filterCounts.all },
            { key: 'overdue', label: 'Overdue', count: filterCounts.overdue },
            { key: 'today', label: 'Today', count: filterCounts.today },
            { key: 'upcoming', label: 'Upcoming', count: filterCounts.upcoming }
          ] as const).map(({ key, label, count }) => (
            <Button
              key={key}
              variant={activeFilter === key ? "default" : "outline"}
              onClick={() => setActiveFilter(key)}
              className={`flex items-center space-x-2 ${
                activeFilter === key 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>{label}</span>
              {count > 0 && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activeFilter === key 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {count}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your reminders...</p>
        </div>
      ) : (
        <>
          {/* Reminders Grid */}
          {filteredReminders.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredReminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  onEdit={handleEditReminder}
                  onDelete={handleDeleteReminder}
                  userId={userId}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery || activeFilter !== 'all' 
                  ? 'No reminders found' 
                  : 'No reminders yet'
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || activeFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first health reminder to get started'
                }
              </p>
              {!searchQuery && activeFilter === 'all' && (
                <Button
                  onClick={handleAddNewReminder}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Your First Reminder</span>
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Reminder Form Modal */}
      <ReminderForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingReminder(null);
        }}
        onSave={handleSaveReminder}
        userId={userId}
        editingReminder={editingReminder}
      />
    </div>
  );
};

export default RemindersSection;
