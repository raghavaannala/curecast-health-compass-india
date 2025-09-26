/**
 * React hooks for Health Vault functionality
 * Provides easy integration with existing CureCast components
 */

import { useState, useEffect, useCallback } from 'react';
import { healthVaultApi } from '../services/healthVaultApi';
import {
  HealthDocument,
  HealthDocumentInput,
  HealthDocumentQueryOptions,
  HealthDocumentStats
} from '../types/mongodb';

// Hook for managing health documents
export const useHealthDocuments = (userId: string, options?: HealthDocumentQueryOptions) => {
  const [documents, setDocuments] = useState<HealthDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchDocuments = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await healthVaultApi.getDocuments(userId, options);
      if (response.success) {
        setDocuments(response.documents);
        setTotalCount(response.totalCount);
      } else {
        setError(response.error || 'Failed to fetch documents');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId, options]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const addDocument = useCallback(async (documentData: HealthDocumentInput) => {
    setLoading(true);
    setError(null);

    try {
      const response = await healthVaultApi.addDocument(documentData);
      if (response.success && response.document) {
        setDocuments(prev => [response.document!, ...prev]);
        setTotalCount(prev => prev + 1);
        return response.document;
      } else {
        setError(response.error || 'Failed to add document');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDocument = useCallback(async (documentId: string, updateData: Partial<HealthDocumentInput>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await healthVaultApi.updateDocument(userId, documentId, updateData);
      if (response.success) {
        setDocuments(prev => 
          prev.map(doc => doc._id === documentId ? { ...doc, ...updateData, updatedAt: new Date() } : doc)
        );
        return true;
      } else {
        setError(response.error || 'Failed to update document');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const deleteDocument = useCallback(async (documentId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await healthVaultApi.deleteDocument(userId, documentId);
      if (response.success) {
        setDocuments(prev => prev.filter(doc => doc._id !== documentId));
        setTotalCount(prev => prev - 1);
        return true;
      } else {
        setError(response.error || 'Failed to delete document');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const searchDocuments = useCallback(async (searchTerm: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await healthVaultApi.searchDocuments(userId, searchTerm, options);
      if (response.success) {
        setDocuments(response.documents);
        setTotalCount(response.totalCount);
      } else {
        setError(response.error || 'Failed to search documents');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId, options]);

  return {
    documents,
    loading,
    error,
    totalCount,
    addDocument,
    updateDocument,
    deleteDocument,
    searchDocuments,
    refetch: fetchDocuments
  };
};

// Hook for health document statistics
export const useHealthDocumentStats = (userId: string) => {
  const [stats, setStats] = useState<HealthDocumentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await healthVaultApi.getDocumentStats(userId);
      if (response.success) {
        setStats(response.stats);
      } else {
        setError(response.error || 'Failed to fetch stats');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};

// Hook for single health document
export const useHealthDocument = (userId: string, documentId: string) => {
  const [document, setDocument] = useState<HealthDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocument = useCallback(async () => {
    if (!userId || !documentId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await healthVaultApi.getDocumentById(userId, documentId);
      if (response.success && response.document) {
        setDocument(response.document);
      } else {
        setError(response.error || 'Failed to fetch document');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId, documentId]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  return {
    document,
    loading,
    error,
    refetch: fetchDocument
  };
};

// Hook for document types
export const useDocumentTypes = (userId: string) => {
  const [documentTypes, setDocumentTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocumentTypes = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await healthVaultApi.getDocumentTypes(userId);
      if (response.success) {
        setDocumentTypes(response.documentTypes);
      } else {
        setError('Failed to fetch document types');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDocumentTypes();
  }, [fetchDocumentTypes]);

  return {
    documentTypes,
    loading,
    error,
    refetch: fetchDocumentTypes
  };
};
