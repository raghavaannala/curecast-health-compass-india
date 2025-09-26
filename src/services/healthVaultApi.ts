/**
 * Health Vault API Service
 * Frontend service for interacting with the Health Vault MongoDB API
 */

import {
  HealthDocument,
  HealthDocumentInput,
  HealthDocumentResponse,
  HealthDocumentsResponse,
  HealthDocumentStatsResponse,
  HealthDocumentQueryOptions
} from '../types/mongodb';

export class HealthVaultAPI {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001/api/health-vault') {
    this.baseUrl = baseUrl;
  }

  /**
   * Add a new health document
   */
  async addDocument(data: HealthDocumentInput): Promise<HealthDocumentResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding health document:', error);
      throw error;
    }
  }

  /**
   * Get all health documents for a user
   */
  async getDocuments(
    userId: string,
    options?: HealthDocumentQueryOptions
  ): Promise<HealthDocumentsResponse> {
    try {
      const params = new URLSearchParams();
      
      if (options) {
        Object.entries(options).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, value.toString());
          }
        });
      }

      const url = `${this.baseUrl}/${userId}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching health documents:', error);
      throw error;
    }
  }

  /**
   * Get a specific health document by ID
   */
  async getDocumentById(userId: string, documentId: string): Promise<HealthDocumentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/${documentId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching health document by ID:', error);
      throw error;
    }
  }

  /**
   * Update a health document
   */
  async updateDocument(
    userId: string,
    documentId: string,
    updateData: Partial<HealthDocumentInput>
  ): Promise<HealthDocumentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating health document:', error);
      throw error;
    }
  }

  /**
   * Delete a health document
   */
  async deleteDocument(userId: string, documentId: string): Promise<HealthDocumentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting health document:', error);
      throw error;
    }
  }

  /**
   * Get health document statistics for a user
   */
  async getDocumentStats(userId: string): Promise<HealthDocumentStatsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/stats`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching health document stats:', error);
      throw error;
    }
  }

  /**
   * Get available document types for a user
   */
  async getDocumentTypes(userId: string): Promise<{ success: boolean; documentTypes: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/types`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching document types:', error);
      throw error;
    }
  }

  /**
   * Search documents by text
   */
  async searchDocuments(
    userId: string,
    searchTerm: string,
    options?: HealthDocumentQueryOptions
  ): Promise<HealthDocumentsResponse> {
    try {
      const allDocuments = await this.getDocuments(userId, options);
      
      if (!allDocuments.success || !allDocuments.documents) {
        return allDocuments;
      }

      // Client-side search filtering
      const filteredDocuments = allDocuments.documents.filter(doc => 
        doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(doc.metadata).toLowerCase().includes(searchTerm.toLowerCase())
      );

      return {
        ...allDocuments,
        documents: filteredDocuments,
        totalCount: filteredDocuments.length,
        message: `Found ${filteredDocuments.length} documents matching "${searchTerm}"`
      };
    } catch (error) {
      console.error('Error searching health documents:', error);
      throw error;
    }
  }
}

// Create a singleton instance
export const healthVaultApi = new HealthVaultAPI();

// Export default instance
export default healthVaultApi;
