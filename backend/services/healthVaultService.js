const { ObjectId } = require('mongodb');
const { getDatabase, COLLECTIONS } = require('../config/database');

/**
 * Add a new health document to health_vault collection
 * @param {Object} documentData - Document data
 * @param {string} documentData.userId - User ID
 * @param {string} documentData.documentType - Type of document (e.g., 'prescription', 'lab_report', 'medical_record')
 * @param {string} documentData.fileUrl - URL to the uploaded file
 * @param {string} [documentData.fileName] - Original file name
 * @param {string} [documentData.description] - Document description
 * @param {Object} [documentData.metadata] - Additional metadata
 * @returns {Object} Result object with success status and document ID
 */
async function addHealthDocument(documentData) {
  try {
    const db = getDatabase();
    const collection = db.collection(COLLECTIONS.HEALTH_VAULT);

    // Validate required fields
    if (!documentData.userId || !documentData.documentType || !documentData.fileUrl) {
      throw new Error('Missing required fields: userId, documentType, and fileUrl are required');
    }

    // Prepare document object
    const document = {
      userId: documentData.userId,
      documentType: documentData.documentType,
      fileUrl: documentData.fileUrl,
      fileName: documentData.fileName || null,
      description: documentData.description || null,
      metadata: documentData.metadata || {},
      uploadedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(document);

    return {
      success: true,
      documentId: result.insertedId,
      message: 'Health document added successfully',
      document: { ...document, _id: result.insertedId }
    };

  } catch (error) {
    console.error('Error adding health document:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to add health document'
    };
  }
}

/**
 * Fetch all health documents for a specific user
 * @param {string} userId - User ID
 * @param {Object} [options] - Query options
 * @param {string} [options.documentType] - Filter by document type
 * @param {number} [options.limit] - Limit number of results
 * @param {number} [options.skip] - Skip number of results
 * @param {string} [options.sortBy] - Sort field (default: 'uploadedAt')
 * @param {number} [options.sortOrder] - Sort order (1 for ascending, -1 for descending)
 * @returns {Object} Result object with documents array
 */
async function getHealthDocuments(userId, options = {}) {
  try {
    const db = getDatabase();
    const collection = db.collection(COLLECTIONS.HEALTH_VAULT);

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Build query
    const query = { userId };
    if (options.documentType) {
      query.documentType = options.documentType;
    }

    // Build sort options
    const sortBy = options.sortBy || 'uploadedAt';
    const sortOrder = options.sortOrder || -1; // Default: newest first
    const sort = { [sortBy]: sortOrder };

    // Execute query with options
    let cursor = collection.find(query).sort(sort);

    if (options.skip) {
      cursor = cursor.skip(options.skip);
    }

    if (options.limit) {
      cursor = cursor.limit(options.limit);
    }

    const documents = await cursor.toArray();
    const totalCount = await collection.countDocuments(query);

    return {
      success: true,
      documents,
      totalCount,
      message: `Found ${documents.length} health documents`
    };

  } catch (error) {
    console.error('Error fetching health documents:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to fetch health documents',
      documents: [],
      totalCount: 0
    };
  }
}

/**
 * Get a specific health document by ID
 * @param {string} documentId - Document ID
 * @param {string} userId - User ID (for security)
 * @returns {Object} Result object with document data
 */
async function getHealthDocumentById(documentId, userId) {
  try {
    const db = getDatabase();
    const collection = db.collection(COLLECTIONS.HEALTH_VAULT);

    if (!documentId || !userId) {
      throw new Error('Document ID and User ID are required');
    }

    const document = await collection.findOne({
      _id: new ObjectId(documentId),
      userId: userId
    });

    if (!document) {
      return {
        success: false,
        message: 'Document not found or access denied',
        document: null
      };
    }

    return {
      success: true,
      document,
      message: 'Document retrieved successfully'
    };

  } catch (error) {
    console.error('Error fetching health document by ID:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to fetch health document',
      document: null
    };
  }
}

/**
 * Update a health document
 * @param {string} documentId - Document ID
 * @param {string} userId - User ID (for security)
 * @param {Object} updateData - Data to update
 * @returns {Object} Result object
 */
async function updateHealthDocument(documentId, userId, updateData) {
  try {
    const db = getDatabase();
    const collection = db.collection(COLLECTIONS.HEALTH_VAULT);

    if (!documentId || !userId) {
      throw new Error('Document ID and User ID are required');
    }

    // Remove fields that shouldn't be updated
    const { _id, userId: _, uploadedAt, createdAt, ...allowedUpdates } = updateData;
    
    const updateObject = {
      ...allowedUpdates,
      updatedAt: new Date()
    };

    const result = await collection.updateOne(
      { _id: new ObjectId(documentId), userId: userId },
      { $set: updateObject }
    );

    if (result.matchedCount === 0) {
      return {
        success: false,
        message: 'Document not found or access denied'
      };
    }

    return {
      success: true,
      message: 'Document updated successfully',
      modifiedCount: result.modifiedCount
    };

  } catch (error) {
    console.error('Error updating health document:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to update health document'
    };
  }
}

/**
 * Delete a health document
 * @param {string} documentId - Document ID
 * @param {string} userId - User ID (for security)
 * @returns {Object} Result object
 */
async function deleteHealthDocument(documentId, userId) {
  try {
    const db = getDatabase();
    const collection = db.collection(COLLECTIONS.HEALTH_VAULT);

    if (!documentId || !userId) {
      throw new Error('Document ID and User ID are required');
    }

    const result = await collection.deleteOne({
      _id: new ObjectId(documentId),
      userId: userId
    });

    if (result.deletedCount === 0) {
      return {
        success: false,
        message: 'Document not found or access denied'
      };
    }

    return {
      success: true,
      message: 'Document deleted successfully',
      deletedCount: result.deletedCount
    };

  } catch (error) {
    console.error('Error deleting health document:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to delete health document'
    };
  }
}

/**
 * Get document statistics for a user
 * @param {string} userId - User ID
 * @returns {Object} Statistics object
 */
async function getHealthDocumentStats(userId) {
  try {
    const db = getDatabase();
    const collection = db.collection(COLLECTIONS.HEALTH_VAULT);

    if (!userId) {
      throw new Error('User ID is required');
    }

    const pipeline = [
      { $match: { userId } },
      {
        $group: {
          _id: '$documentType',
          count: { $sum: 1 },
          latestUpload: { $max: '$uploadedAt' }
        }
      }
    ];

    const stats = await collection.aggregate(pipeline).toArray();
    const totalDocuments = await collection.countDocuments({ userId });

    return {
      success: true,
      stats: {
        totalDocuments,
        byType: stats,
        lastActivity: stats.length > 0 ? Math.max(...stats.map(s => s.latestUpload)) : null
      },
      message: 'Statistics retrieved successfully'
    };

  } catch (error) {
    console.error('Error getting health document stats:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to get statistics',
      stats: null
    };
  }
}

module.exports = {
  addHealthDocument,
  getHealthDocuments,
  getHealthDocumentById,
  updateHealthDocument,
  deleteHealthDocument,
  getHealthDocumentStats
};
