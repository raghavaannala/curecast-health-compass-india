const express = require('express');
const router = express.Router();
const {
  addHealthDocument,
  getHealthDocuments,
  getHealthDocumentById,
  updateHealthDocument,
  deleteHealthDocument,
  getHealthDocumentStats
} = require('../services/healthVaultService');

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
 * POST /health-vault
 * Add a new health document
 */
router.post('/', validateRequest, async (req, res) => {
  try {
    const { userId, documentType, fileUrl, fileName, description, metadata } = req.body;

    // Validate required fields
    if (!userId || !documentType || !fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, documentType, and fileUrl are required'
      });
    }

    const result = await addHealthDocument({
      userId,
      documentType,
      fileUrl,
      fileName,
      description,
      metadata
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error in POST /health-vault:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /health-vault/:userId
 * Fetch all health documents for a user
 */
router.get('/:userId', validateRequest, async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      documentType, 
      limit, 
      skip, 
      sortBy, 
      sortOrder 
    } = req.query;

    // Parse query parameters
    const options = {};
    if (documentType) options.documentType = documentType;
    if (limit) options.limit = parseInt(limit);
    if (skip) options.skip = parseInt(skip);
    if (sortBy) options.sortBy = sortBy;
    if (sortOrder) options.sortOrder = parseInt(sortOrder);

    const result = await getHealthDocuments(userId, options);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error in GET /health-vault/:userId:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /health-vault/:userId/:documentId
 * Get a specific health document by ID
 */
router.get('/:userId/:documentId', validateRequest, async (req, res) => {
  try {
    const { userId, documentId } = req.params;

    const result = await getHealthDocumentById(documentId, userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }

  } catch (error) {
    console.error('Error in GET /health-vault/:userId/:documentId:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /health-vault/:userId/:documentId
 * Update a health document
 */
router.put('/:userId/:documentId', validateRequest, async (req, res) => {
  try {
    const { userId, documentId } = req.params;
    const updateData = req.body;

    const result = await updateHealthDocument(documentId, userId, updateData);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error in PUT /health-vault/:userId/:documentId:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

/**
 * DELETE /health-vault/:userId/:documentId
 * Delete a health document
 */
router.delete('/:userId/:documentId', validateRequest, async (req, res) => {
  try {
    const { userId, documentId } = req.params;

    const result = await deleteHealthDocument(documentId, userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }

  } catch (error) {
    console.error('Error in DELETE /health-vault/:userId/:documentId:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /health-vault/:userId/stats
 * Get document statistics for a user
 */
router.get('/:userId/stats', validateRequest, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await getHealthDocumentStats(userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error in GET /health-vault/:userId/stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /health-vault/:userId/types
 * Get available document types for a user
 */
router.get('/:userId/types', validateRequest, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await getHealthDocuments(userId);
    
    if (result.success) {
      // Extract unique document types
      const documentTypes = [...new Set(result.documents.map(doc => doc.documentType))];
      
      res.status(200).json({
        success: true,
        documentTypes,
        message: 'Document types retrieved successfully'
      });
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error in GET /health-vault/:userId/types:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
