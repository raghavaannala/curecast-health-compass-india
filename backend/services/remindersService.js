const { ObjectId } = require('mongodb');
const { getDatabase, COLLECTIONS } = require('../config/database');

/**
 * Add a new reminder to reminders collection
 * @param {Object} reminderData - Reminder data
 * @param {string} reminderData.userId - User ID
 * @param {string} reminderData.title - Reminder title
 * @param {string} reminderData.description - Reminder description
 * @param {Date|string} reminderData.reminderDate - Date and time for the reminder
 * @param {string} [reminderData.status] - Reminder status (default: 'pending')
 * @param {string} [reminderData.type] - Reminder type (e.g., 'medication', 'appointment', 'checkup')
 * @param {string} [reminderData.priority] - Priority level ('low', 'medium', 'high')
 * @param {Object} [reminderData.metadata] - Additional metadata
 * @returns {Object} Result object with success status and reminder ID
 */
async function addReminder(reminderData) {
  try {
    const db = getDatabase();
    const collection = db.collection(COLLECTIONS.REMINDERS);

    // Validate required fields
    if (!reminderData.userId || !reminderData.title || !reminderData.description || !reminderData.reminderDate) {
      throw new Error('Missing required fields: userId, title, description, and reminderDate are required');
    }

    // Prepare reminder object
    const reminder = {
      userId: reminderData.userId,
      title: reminderData.title.trim(),
      description: reminderData.description.trim(),
      reminderDate: new Date(reminderData.reminderDate),
      status: reminderData.status || 'pending',
      type: reminderData.type || 'general',
      priority: reminderData.priority || 'medium',
      metadata: reminderData.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null
    };

    // Validate reminder date is in the future
    if (reminder.reminderDate <= new Date()) {
      throw new Error('Reminder date must be in the future');
    }

    // Validate status
    const validStatuses = ['pending', 'completed', 'cancelled', 'missed'];
    if (!validStatuses.includes(reminder.status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(reminder.priority)) {
      throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }

    const result = await collection.insertOne(reminder);

    return {
      success: true,
      reminderId: result.insertedId,
      message: 'Reminder added successfully',
      reminder: { ...reminder, _id: result.insertedId }
    };

  } catch (error) {
    console.error('Error adding reminder:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to add reminder'
    };
  }
}

/**
 * Fetch reminders for a specific user
 * @param {string} userId - User ID
 * @param {Object} [options] - Query options
 * @param {string} [options.status] - Filter by status
 * @param {string} [options.type] - Filter by type
 * @param {string} [options.priority] - Filter by priority
 * @param {Date} [options.fromDate] - Filter reminders from this date
 * @param {Date} [options.toDate] - Filter reminders until this date
 * @param {number} [options.limit] - Limit number of results
 * @param {number} [options.skip] - Skip number of results
 * @param {string} [options.sortBy] - Sort field (default: 'reminderDate')
 * @param {number} [options.sortOrder] - Sort order (1 for ascending, -1 for descending)
 * @returns {Object} Result object with reminders array
 */
async function getReminders(userId, options = {}) {
  try {
    const db = getDatabase();
    const collection = db.collection(COLLECTIONS.REMINDERS);

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Build query
    const query = { userId };
    
    if (options.status) {
      query.status = options.status;
    }
    
    if (options.type) {
      query.type = options.type;
    }
    
    if (options.priority) {
      query.priority = options.priority;
    }

    // Date range filter
    if (options.fromDate || options.toDate) {
      query.reminderDate = {};
      if (options.fromDate) {
        query.reminderDate.$gte = new Date(options.fromDate);
      }
      if (options.toDate) {
        query.reminderDate.$lte = new Date(options.toDate);
      }
    }

    // Build sort options
    const sortBy = options.sortBy || 'reminderDate';
    const sortOrder = options.sortOrder || 1; // Default: earliest first
    const sort = { [sortBy]: sortOrder };

    // Execute query with options
    let cursor = collection.find(query).sort(sort);

    if (options.skip) {
      cursor = cursor.skip(options.skip);
    }

    if (options.limit) {
      cursor = cursor.limit(options.limit);
    }

    const reminders = await cursor.toArray();
    const totalCount = await collection.countDocuments(query);

    return {
      success: true,
      reminders,
      totalCount,
      message: `Found ${reminders.length} reminders`
    };

  } catch (error) {
    console.error('Error fetching reminders:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to fetch reminders',
      reminders: [],
      totalCount: 0
    };
  }
}

/**
 * Get a specific reminder by ID
 * @param {string} reminderId - Reminder ID
 * @param {string} userId - User ID (for security)
 * @returns {Object} Result object with reminder data
 */
async function getReminderById(reminderId, userId) {
  try {
    const db = getDatabase();
    const collection = db.collection(COLLECTIONS.REMINDERS);

    if (!reminderId || !userId) {
      throw new Error('Reminder ID and User ID are required');
    }

    const reminder = await collection.findOne({
      _id: new ObjectId(reminderId),
      userId: userId
    });

    if (!reminder) {
      return {
        success: false,
        message: 'Reminder not found or access denied',
        reminder: null
      };
    }

    return {
      success: true,
      reminder,
      message: 'Reminder retrieved successfully'
    };

  } catch (error) {
    console.error('Error fetching reminder by ID:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to fetch reminder',
      reminder: null
    };
  }
}

/**
 * Update reminder status and other fields
 * @param {string} reminderId - Reminder ID
 * @param {string} userId - User ID (for security)
 * @param {Object} updateData - Data to update
 * @param {string} [updateData.status] - New status
 * @param {string} [updateData.title] - New title
 * @param {string} [updateData.description] - New description
 * @param {Date|string} [updateData.reminderDate] - New reminder date
 * @param {string} [updateData.priority] - New priority
 * @param {Object} [updateData.metadata] - New metadata
 * @returns {Object} Result object
 */
async function updateReminder(reminderId, userId, updateData) {
  try {
    const db = getDatabase();
    const collection = db.collection(COLLECTIONS.REMINDERS);

    if (!reminderId || !userId) {
      throw new Error('Reminder ID and User ID are required');
    }

    // Remove fields that shouldn't be updated
    const { _id, userId: _, createdAt, ...allowedUpdates } = updateData;
    
    // Validate status if provided
    if (allowedUpdates.status) {
      const validStatuses = ['pending', 'completed', 'cancelled', 'missed'];
      if (!validStatuses.includes(allowedUpdates.status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      // Set completedAt if status is completed
      if (allowedUpdates.status === 'completed') {
        allowedUpdates.completedAt = new Date();
      } else if (allowedUpdates.status === 'pending') {
        allowedUpdates.completedAt = null;
      }
    }

    // Validate priority if provided
    if (allowedUpdates.priority) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(allowedUpdates.priority)) {
        throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
      }
    }

    // Convert reminderDate to Date object if provided
    if (allowedUpdates.reminderDate) {
      allowedUpdates.reminderDate = new Date(allowedUpdates.reminderDate);
    }

    const updateObject = {
      ...allowedUpdates,
      updatedAt: new Date()
    };

    const result = await collection.updateOne(
      { _id: new ObjectId(reminderId), userId: userId },
      { $set: updateObject }
    );

    if (result.matchedCount === 0) {
      return {
        success: false,
        message: 'Reminder not found or access denied'
      };
    }

    return {
      success: true,
      message: 'Reminder updated successfully',
      modifiedCount: result.modifiedCount
    };

  } catch (error) {
    console.error('Error updating reminder:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to update reminder'
    };
  }
}

/**
 * Update reminder status only (simplified function)
 * @param {string} reminderId - Reminder ID
 * @param {string} userId - User ID (for security)
 * @param {string} status - New status ('pending', 'completed', 'cancelled', 'missed')
 * @returns {Object} Result object
 */
async function updateReminderStatus(reminderId, userId, status) {
  return await updateReminder(reminderId, userId, { status });
}

/**
 * Delete a reminder
 * @param {string} reminderId - Reminder ID
 * @param {string} userId - User ID (for security)
 * @returns {Object} Result object
 */
async function deleteReminder(reminderId, userId) {
  try {
    const db = getDatabase();
    const collection = db.collection(COLLECTIONS.REMINDERS);

    if (!reminderId || !userId) {
      throw new Error('Reminder ID and User ID are required');
    }

    const result = await collection.deleteOne({
      _id: new ObjectId(reminderId),
      userId: userId
    });

    if (result.deletedCount === 0) {
      return {
        success: false,
        message: 'Reminder not found or access denied'
      };
    }

    return {
      success: true,
      message: 'Reminder deleted successfully',
      deletedCount: result.deletedCount
    };

  } catch (error) {
    console.error('Error deleting reminder:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to delete reminder'
    };
  }
}

/**
 * Get upcoming reminders for a user
 * @param {string} userId - User ID
 * @param {number} [days=7] - Number of days to look ahead
 * @returns {Object} Result object with upcoming reminders
 */
async function getUpcomingReminders(userId, days = 7) {
  try {
    const fromDate = new Date();
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + days);

    return await getReminders(userId, {
      status: 'pending',
      fromDate,
      toDate,
      sortBy: 'reminderDate',
      sortOrder: 1
    });

  } catch (error) {
    console.error('Error fetching upcoming reminders:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to fetch upcoming reminders',
      reminders: [],
      totalCount: 0
    };
  }
}

/**
 * Get overdue reminders for a user
 * @param {string} userId - User ID
 * @returns {Object} Result object with overdue reminders
 */
async function getOverdueReminders(userId) {
  try {
    const now = new Date();

    return await getReminders(userId, {
      status: 'pending',
      toDate: now,
      sortBy: 'reminderDate',
      sortOrder: 1
    });

  } catch (error) {
    console.error('Error fetching overdue reminders:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to fetch overdue reminders',
      reminders: [],
      totalCount: 0
    };
  }
}

/**
 * Get reminder statistics for a user
 * @param {string} userId - User ID
 * @returns {Object} Statistics object
 */
async function getReminderStats(userId) {
  try {
    const db = getDatabase();
    const collection = db.collection(COLLECTIONS.REMINDERS);

    if (!userId) {
      throw new Error('User ID is required');
    }

    const pipeline = [
      { $match: { userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ];

    const statusStats = await collection.aggregate(pipeline).toArray();
    const totalReminders = await collection.countDocuments({ userId });
    
    // Get upcoming and overdue counts
    const now = new Date();
    const upcomingCount = await collection.countDocuments({
      userId,
      status: 'pending',
      reminderDate: { $gte: now }
    });
    
    const overdueCount = await collection.countDocuments({
      userId,
      status: 'pending',
      reminderDate: { $lt: now }
    });

    return {
      success: true,
      stats: {
        totalReminders,
        byStatus: statusStats,
        upcoming: upcomingCount,
        overdue: overdueCount
      },
      message: 'Statistics retrieved successfully'
    };

  } catch (error) {
    console.error('Error getting reminder stats:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to get statistics',
      stats: null
    };
  }
}

module.exports = {
  addReminder,
  getReminders,
  getReminderById,
  updateReminder,
  updateReminderStatus,
  deleteReminder,
  getUpcomingReminders,
  getOverdueReminders,
  getReminderStats
};
