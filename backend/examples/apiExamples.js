/**
 * CureCast Health API Usage Examples
 * 
 * This file demonstrates how to use all the API endpoints
 * for both Health Vault and Reminders functionality.
 */

const axios = require('axios');

// Base API URL (adjust as needed)
const API_BASE_URL = 'http://localhost:3001/api';

// Example user ID for testing
const EXAMPLE_USER_ID = 'user_12345';

/**
 * Health Vault API Examples
 */
class HealthVaultExamples {
  
  /**
   * Add a new health document
   */
  static async addHealthDocument() {
    try {
      const documentData = {
        userId: EXAMPLE_USER_ID,
        documentType: 'prescription',
        fileUrl: 'https://example.com/documents/prescription_001.pdf',
        fileName: 'prescription_001.pdf',
        description: 'Blood pressure medication prescription from Dr. Smith',
        metadata: {
          doctorName: 'Dr. John Smith',
          hospitalName: 'City General Hospital',
          prescriptionDate: '2024-01-15'
        }
      };

      const response = await axios.post(`${API_BASE_URL}/health-vault`, documentData);
      console.log('✅ Document added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error adding document:', error.response?.data || error.message);
    }
  }

  /**
   * Get all health documents for a user
   */
  static async getHealthDocuments() {
    try {
      const response = await axios.get(`${API_BASE_URL}/health-vault/${EXAMPLE_USER_ID}`);
      console.log('✅ Documents retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting documents:', error.response?.data || error.message);
    }
  }

  /**
   * Get health documents with filters
   */
  static async getFilteredHealthDocuments() {
    try {
      const params = {
        documentType: 'prescription',
        limit: 10,
        sortBy: 'uploadedAt',
        sortOrder: -1
      };

      const response = await axios.get(`${API_BASE_URL}/health-vault/${EXAMPLE_USER_ID}`, { params });
      console.log('✅ Filtered documents retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting filtered documents:', error.response?.data || error.message);
    }
  }

  /**
   * Get a specific health document by ID
   */
  static async getHealthDocumentById(documentId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/health-vault/${EXAMPLE_USER_ID}/${documentId}`);
      console.log('✅ Document retrieved by ID:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting document by ID:', error.response?.data || error.message);
    }
  }

  /**
   * Update a health document
   */
  static async updateHealthDocument(documentId) {
    try {
      const updateData = {
        description: 'Updated: Blood pressure medication prescription from Dr. Smith',
        metadata: {
          doctorName: 'Dr. John Smith',
          hospitalName: 'City General Hospital',
          prescriptionDate: '2024-01-15',
          notes: 'Updated dosage instructions'
        }
      };

      const response = await axios.put(`${API_BASE_URL}/health-vault/${EXAMPLE_USER_ID}/${documentId}`, updateData);
      console.log('✅ Document updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating document:', error.response?.data || error.message);
    }
  }

  /**
   * Delete a health document
   */
  static async deleteHealthDocument(documentId) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/health-vault/${EXAMPLE_USER_ID}/${documentId}`);
      console.log('✅ Document deleted successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting document:', error.response?.data || error.message);
    }
  }

  /**
   * Get health document statistics
   */
  static async getHealthDocumentStats() {
    try {
      const response = await axios.get(`${API_BASE_URL}/health-vault/${EXAMPLE_USER_ID}/stats`);
      console.log('✅ Document statistics:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting document stats:', error.response?.data || error.message);
    }
  }
}

/**
 * Reminders API Examples
 */
class RemindersExamples {

  /**
   * Add a new reminder
   */
  static async addReminder() {
    try {
      const reminderData = {
        userId: EXAMPLE_USER_ID,
        title: 'Take Blood Pressure Medication',
        description: 'Take Lisinopril 10mg tablet with water after breakfast',
        reminderDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        type: 'medication',
        priority: 'high',
        metadata: {
          medicationName: 'Lisinopril',
          dosage: '10mg',
          frequency: 'daily'
        }
      };

      const response = await axios.post(`${API_BASE_URL}/reminders`, reminderData);
      console.log('✅ Reminder added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error adding reminder:', error.response?.data || error.message);
    }
  }

  /**
   * Get all reminders for a user
   */
  static async getReminders() {
    try {
      const response = await axios.get(`${API_BASE_URL}/reminders/${EXAMPLE_USER_ID}`);
      console.log('✅ Reminders retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting reminders:', error.response?.data || error.message);
    }
  }

  /**
   * Get reminders with filters
   */
  static async getFilteredReminders() {
    try {
      const params = {
        status: 'pending',
        type: 'medication',
        priority: 'high',
        limit: 5,
        sortBy: 'reminderDate',
        sortOrder: 1
      };

      const response = await axios.get(`${API_BASE_URL}/reminders/${EXAMPLE_USER_ID}`, { params });
      console.log('✅ Filtered reminders retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting filtered reminders:', error.response?.data || error.message);
    }
  }

  /**
   * Get a specific reminder by ID
   */
  static async getReminderById(reminderId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/reminders/${EXAMPLE_USER_ID}/${reminderId}`);
      console.log('✅ Reminder retrieved by ID:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting reminder by ID:', error.response?.data || error.message);
    }
  }

  /**
   * Update a reminder
   */
  static async updateReminder(reminderId) {
    try {
      const updateData = {
        title: 'Take Blood Pressure Medication - Updated',
        description: 'Take Lisinopril 10mg tablet with water after breakfast. Updated instructions.',
        priority: 'medium',
        metadata: {
          medicationName: 'Lisinopril',
          dosage: '10mg',
          frequency: 'daily',
          notes: 'Updated dosage timing'
        }
      };

      const response = await axios.put(`${API_BASE_URL}/reminders/${EXAMPLE_USER_ID}/${reminderId}`, updateData);
      console.log('✅ Reminder updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating reminder:', error.response?.data || error.message);
    }
  }

  /**
   * Update reminder status only
   */
  static async updateReminderStatus(reminderId, status = 'completed') {
    try {
      const response = await axios.patch(`${API_BASE_URL}/reminders/${EXAMPLE_USER_ID}/${reminderId}`, { status });
      console.log('✅ Reminder status updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating reminder status:', error.response?.data || error.message);
    }
  }

  /**
   * Delete a reminder
   */
  static async deleteReminder(reminderId) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/reminders/${EXAMPLE_USER_ID}/${reminderId}`);
      console.log('✅ Reminder deleted successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting reminder:', error.response?.data || error.message);
    }
  }

  /**
   * Get upcoming reminders
   */
  static async getUpcomingReminders(days = 7) {
    try {
      const response = await axios.get(`${API_BASE_URL}/reminders/${EXAMPLE_USER_ID}/upcoming?days=${days}`);
      console.log('✅ Upcoming reminders retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting upcoming reminders:', error.response?.data || error.message);
    }
  }

  /**
   * Get overdue reminders
   */
  static async getOverdueReminders() {
    try {
      const response = await axios.get(`${API_BASE_URL}/reminders/${EXAMPLE_USER_ID}/overdue`);
      console.log('✅ Overdue reminders retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting overdue reminders:', error.response?.data || error.message);
    }
  }

  /**
   * Get reminder statistics
   */
  static async getReminderStats() {
    try {
      const response = await axios.get(`${API_BASE_URL}/reminders/${EXAMPLE_USER_ID}/stats`);
      console.log('✅ Reminder statistics:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting reminder stats:', error.response?.data || error.message);
    }
  }

  /**
   * Add multiple reminders at once
   */
  static async addBulkReminders() {
    try {
      const reminders = [
        {
          title: 'Morning Medication',
          description: 'Take morning pills with breakfast',
          reminderDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          type: 'medication',
          priority: 'high'
        },
        {
          title: 'Doctor Appointment',
          description: 'Cardiology checkup at 2 PM',
          reminderDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          type: 'appointment',
          priority: 'high'
        },
        {
          title: 'Exercise Routine',
          description: '30 minutes of walking',
          reminderDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          type: 'exercise',
          priority: 'medium'
        }
      ];

      const response = await axios.post(`${API_BASE_URL}/reminders/${EXAMPLE_USER_ID}/bulk`, { reminders });
      console.log('✅ Bulk reminders added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error adding bulk reminders:', error.response?.data || error.message);
    }
  }
}

/**
 * Server Health Check
 */
class HealthCheckExamples {
  
  /**
   * Check server health
   */
  static async checkServerHealth() {
    try {
      const response = await axios.get('http://localhost:3001/health');
      console.log('✅ Server health check:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Server health check failed:', error.response?.data || error.message);
    }
  }
}

/**
 * Demo function to run all examples
 */
async function runAllExamples() {
  console.log('🚀 Starting CureCast Health API Examples...\n');

  // Health Check
  console.log('📊 Checking server health...');
  await HealthCheckExamples.checkServerHealth();
  console.log('\n');

  // Health Vault Examples
  console.log('🏥 Health Vault Examples:');
  const addedDocument = await HealthVaultExamples.addHealthDocument();
  await HealthVaultExamples.getHealthDocuments();
  await HealthVaultExamples.getFilteredHealthDocuments();
  await HealthVaultExamples.getHealthDocumentStats();
  
  if (addedDocument?.documentId) {
    await HealthVaultExamples.getHealthDocumentById(addedDocument.documentId);
    await HealthVaultExamples.updateHealthDocument(addedDocument.documentId);
    // Uncomment to test deletion:
    // await HealthVaultExamples.deleteHealthDocument(addedDocument.documentId);
  }
  console.log('\n');

  // Reminders Examples
  console.log('⏰ Reminders Examples:');
  const addedReminder = await RemindersExamples.addReminder();
  await RemindersExamples.getReminders();
  await RemindersExamples.getFilteredReminders();
  await RemindersExamples.getUpcomingReminders();
  await RemindersExamples.getOverdueReminders();
  await RemindersExamples.getReminderStats();
  await RemindersExamples.addBulkReminders();
  
  if (addedReminder?.reminderId) {
    await RemindersExamples.getReminderById(addedReminder.reminderId);
    await RemindersExamples.updateReminder(addedReminder.reminderId);
    await RemindersExamples.updateReminderStatus(addedReminder.reminderId, 'completed');
    // Uncomment to test deletion:
    // await RemindersExamples.deleteReminder(addedReminder.reminderId);
  }

  console.log('\n✅ All examples completed!');
}

// Export classes for individual use
module.exports = {
  HealthVaultExamples,
  RemindersExamples,
  HealthCheckExamples,
  runAllExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
