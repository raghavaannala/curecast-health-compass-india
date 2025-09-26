const express = require('express');
const router = express.Router();
const {
  addReminder,
  getReminders,
  getReminderById,
  updateReminder,
  updateReminderStatus,
  deleteReminder,
  getUpcomingReminders,
  getOverdueReminders,
  getReminderStats
} = require('../services/remindersService');

// Middleware for request validation
const validateRequest = (req, res, next) => {
  try {
    // Add any common validation logic here
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Invalid request format'
    });
  }
};

/**
 * POST /reminders
 * Add a new reminder
 */
router.post('/', validateRequest, async (req, res) => {
  try {
    const { 
      userId, 
      title, 
      description, 
      reminderDate, 
      status, 
      type, 
      priority, 
      metadata 
    } = req.body;

    // Validate required fields
    if (!userId || !title || !description || !reminderDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, title, description, and reminderDate are required'
      });
    }

    const result = await addReminder({
      userId,
      title,
      description,
      reminderDate,
      status,
      type,
      priority,
      metadata
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error in POST /reminders:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /reminders/:userId
 * Fetch reminders for a user
 */
router.get('/:userId', validateRequest, async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      status, 
      type, 
      priority, 
      fromDate, 
      toDate, 
      limit, 
      skip, 
      sortBy, 
      sortOrder 
    } = req.query;

    // Parse query parameters
    const options = {};
    if (status) options.status = status;
    if (type) options.type = type;
    if (priority) options.priority = priority;
    if (fromDate) options.fromDate = fromDate;
    if (toDate) options.toDate = toDate;
    if (limit) options.limit = parseInt(limit);
    if (skip) options.skip = parseInt(skip);
    if (sortBy) options.sortBy = sortBy;
    if (sortOrder) options.sortOrder = parseInt(sortOrder);

    const result = await getReminders(userId, options);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error in GET /reminders/:userId:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /reminders/:userId/:reminderId
 * Get a specific reminder by ID
 */
router.get('/:userId/:reminderId', validateRequest, async (req, res) => {
  try {
    const { userId, reminderId } = req.params;

    const result = await getReminderById(reminderId, userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }

  } catch (error) {
    console.error('Error in GET /reminders/:userId/:reminderId:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /reminders/:userId/:reminderId
 * Update a reminder
 */
router.put('/:userId/:reminderId', validateRequest, async (req, res) => {
  try {
    const { userId, reminderId } = req.params;
    const updateData = req.body;

    const result = await updateReminder(reminderId, userId, updateData);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error in PUT /reminders/:userId/:reminderId:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

/**
 * PATCH /reminders/:userId/:reminderId
 * Update reminder status
 */
router.patch('/:userId/:reminderId', validateRequest, async (req, res) => {
  try {
    const { userId, reminderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required for status update'
      });
    }

    const result = await updateReminderStatus(reminderId, userId, status);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error in PATCH /reminders/:userId/:reminderId:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

/**
 * DELETE /reminders/:userId/:reminderId
 * Delete a reminder
 */
router.delete('/:userId/:reminderId', validateRequest, async (req, res) => {
  try {
    const { userId, reminderId } = req.params;

    const result = await deleteReminder(reminderId, userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }

  } catch (error) {
    console.error('Error in DELETE /reminders/:userId/:reminderId:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /reminders/:userId/upcoming
 * Get upcoming reminders for a user
 */
router.get('/:userId/upcoming', validateRequest, async (req, res) => {
  try {
    const { userId } = req.params;
    const { days } = req.query;

    const daysAhead = days ? parseInt(days) : 7;
    const result = await getUpcomingReminders(userId, daysAhead);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error in GET /reminders/:userId/upcoming:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /reminders/:userId/overdue
 * Get overdue reminders for a user
 */
router.get('/:userId/overdue', validateRequest, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await getOverdueReminders(userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error in GET /reminders/:userId/overdue:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /reminders/:userId/stats
 * Get reminder statistics for a user
 */
router.get('/:userId/stats', validateRequest, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await getReminderStats(userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error in GET /reminders/:userId/stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /reminders/:userId/bulk
 * Add multiple reminders at once
 */
router.post('/:userId/bulk', validateRequest, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reminders } = req.body;

    if (!Array.isArray(reminders) || reminders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reminders array is required and must not be empty'
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < reminders.length; i++) {
      const reminderData = { ...reminders[i], userId };
      const result = await addReminder(reminderData);
      
      if (result.success) {
        results.push(result);
      } else {
        errors.push({ index: i, error: result.error, reminder: reminderData });
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully added ${results.length} reminders`,
      results,
      errors,
      totalProcessed: reminders.length,
      successCount: results.length,
      errorCount: errors.length
    });

  } catch (error) {
    console.error('Error in POST /reminders/:userId/bulk:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
