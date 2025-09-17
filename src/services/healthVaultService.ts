import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll, 
  getMetadata,
  updateMetadata,
  StorageReference 
} from 'firebase/storage';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { storage, db, auth } from '@/firebase';
import { User } from 'firebase/auth';

export interface HealthRecord {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: 'prescription' | 'lab-report' | 'medical-image' | 'document' | 'other';
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadDate: Date;
  lastModified: Date;
  downloadURL?: string;
  storagePath: string;
  tags?: string[];
  isPrivate: boolean;
  sharedWith?: string[];
}

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

export class HealthVaultService {
  private static instance: HealthVaultService;
  
  public static getInstance(): HealthVaultService {
    if (!HealthVaultService.instance) {
      HealthVaultService.instance = new HealthVaultService();
    }
    return HealthVaultService.instance;
  }

  /**
   * Upload a health record file to Firebase Storage
   */
  async uploadHealthRecord(
    file: File,
    metadata: {
      title: string;
      description?: string;
      category: HealthRecord['category'];
      tags?: string[];
      isPrivate?: boolean;
    },
    onProgress?: (progress: UploadProgress) => void
  ): Promise<HealthRecord> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to upload health records');
    }

    // Validate file
    this.validateFile(file);

    // Create unique file path
    const timestamp = Date.now();
    const sanitizedFileName = this.sanitizeFileName(file.name);
    const storagePath = `health-records/${user.uid}/${timestamp}_${sanitizedFileName}`;
    
    // Create storage reference
    const storageRef = ref(storage, storagePath);
    
    // Upload file with metadata
    const uploadMetadata = {
      contentType: file.type,
      customMetadata: {
        userId: user.uid,
        title: metadata.title,
        description: metadata.description || '',
        category: metadata.category,
        tags: metadata.tags?.join(',') || '',
        isPrivate: metadata.isPrivate?.toString() || 'true',
        uploadDate: new Date().toISOString()
      }
    };

    try {
      // Upload file
      const uploadResult = await uploadBytes(storageRef, file, uploadMetadata);
      
      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      // Create health record document
      const healthRecord: Omit<HealthRecord, 'id'> = {
        userId: user.uid,
        title: metadata.title,
        description: metadata.description,
        category: metadata.category,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadDate: new Date(),
        lastModified: new Date(),
        downloadURL,
        storagePath,
        tags: metadata.tags,
        isPrivate: metadata.isPrivate ?? true,
        sharedWith: []
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'healthRecords'), {
        ...healthRecord,
        uploadDate: Timestamp.fromDate(healthRecord.uploadDate),
        lastModified: Timestamp.fromDate(healthRecord.lastModified)
      });

      return {
        ...healthRecord,
        id: docRef.id
      };
    } catch (error) {
      console.error('Error uploading health record:', error);
      throw new Error('Failed to upload health record. Please try again.');
    }
  }

  /**
   * Get all health records for the current user
   */
  async getUserHealthRecords(): Promise<HealthRecord[]> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to access health records');
    }

    try {
      console.log('Fetching health records for user:', user.uid);
      
      // Try a simple query first without ordering to test basic access
      const simpleQuery = query(
        collection(db, 'healthRecords'),
        where('userId', '==', user.uid)
      );
      
      console.log('Executing simple query without ordering...');
      const simpleSnapshot = await getDocs(simpleQuery);
      console.log('Simple query returned', simpleSnapshot.size, 'documents');
      
      // If simple query works, try with ordering
      const q = query(
        collection(db, 'healthRecords'),
        where('userId', '==', user.uid),
        orderBy('uploadDate', 'desc')
      );
      
      console.log('Executing query with ordering...');
      const querySnapshot = await getDocs(q);
      console.log('Ordered query returned', querySnapshot.size, 'documents');
      
      const records: HealthRecord[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Processing document:', doc.id, data);
        
        records.push({
          id: doc.id,
          ...data,
          uploadDate: data.uploadDate.toDate(),
          lastModified: data.lastModified.toDate()
        } as HealthRecord);
      });
      
      console.log('Successfully fetched', records.length, 'health records');
      return records;
    } catch (error) {
      console.error('Error fetching health records:', error);
      
      // If the ordered query fails due to missing index, try without ordering
      if (error instanceof Error && error.message.includes('index')) {
        console.log('Index missing, trying query without ordering...');
        try {
          const simpleQuery = query(
            collection(db, 'healthRecords'),
            where('userId', '==', user.uid)
          );
          
          const querySnapshot = await getDocs(simpleQuery);
          const records: HealthRecord[] = [];
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            records.push({
              id: doc.id,
              ...data,
              uploadDate: data.uploadDate.toDate(),
              lastModified: data.lastModified.toDate()
            } as HealthRecord);
          });
          
          // Sort manually by upload date
          records.sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());
          
          console.log('Fallback query successful, returned', records.length, 'records');
          return records;
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          throw new Error('Failed to fetch health records. Please try again.');
        }
      }
      
      throw new Error('Failed to fetch health records. Please try again.');
    }
  }

  /**
   * Get health records by category
   */
  async getHealthRecordsByCategory(category: HealthRecord['category']): Promise<HealthRecord[]> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to access health records');
    }

    try {
      const q = query(
        collection(db, 'healthRecords'),
        where('userId', '==', user.uid),
        where('category', '==', category),
        orderBy('uploadDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const records: HealthRecord[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          id: doc.id,
          ...data,
          uploadDate: data.uploadDate.toDate(),
          lastModified: data.lastModified.toDate()
        } as HealthRecord);
      });
      
      return records;
    } catch (error) {
      console.error('Error fetching health records by category:', error);
      throw new Error('Failed to fetch health records. Please try again.');
    }
  }

  /**
   * Delete a health record
   */
  async deleteHealthRecord(recordId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to delete health records');
    }

    try {
      // Get the record first to get storage path
      const records = await this.getUserHealthRecords();
      const record = records.find(r => r.id === recordId);
      
      if (!record) {
        throw new Error('Health record not found');
      }

      if (record.userId !== user.uid) {
        throw new Error('Unauthorized to delete this record');
      }

      // Delete from Storage
      const storageRef = ref(storage, record.storagePath);
      await deleteObject(storageRef);

      // Delete from Firestore
      await deleteDoc(doc(db, 'healthRecords', recordId));
    } catch (error) {
      console.error('Error deleting health record:', error);
      throw new Error('Failed to delete health record. Please try again.');
    }
  }

  /**
   * Update health record metadata
   */
  async updateHealthRecord(
    recordId: string, 
    updates: Partial<Pick<HealthRecord, 'title' | 'description' | 'category' | 'tags' | 'isPrivate'>>
  ): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to update health records');
    }

    try {
      const updateData = {
        ...updates,
        lastModified: Timestamp.fromDate(new Date())
      };

      await updateDoc(doc(db, 'healthRecords', recordId), updateData);
    } catch (error) {
      console.error('Error updating health record:', error);
      throw new Error('Failed to update health record. Please try again.');
    }
  }

  /**
   * Share a health record with another user
   */
  async shareHealthRecord(recordId: string, shareWithEmail: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to share health records');
    }

    try {
      const records = await this.getUserHealthRecords();
      const record = records.find(r => r.id === recordId);
      
      if (!record) {
        throw new Error('Health record not found');
      }

      if (record.userId !== user.uid) {
        throw new Error('Unauthorized to share this record');
      }

      const sharedWith = record.sharedWith || [];
      if (!sharedWith.includes(shareWithEmail)) {
        sharedWith.push(shareWithEmail);
        
        await updateDoc(doc(db, 'healthRecords', recordId), {
          sharedWith,
          lastModified: Timestamp.fromDate(new Date())
        });
      }
    } catch (error) {
      console.error('Error sharing health record:', error);
      throw new Error('Failed to share health record. Please try again.');
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    categoryBreakdown: Record<HealthRecord['category'], number>;
  }> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to get storage stats');
    }

    try {
      const records = await this.getUserHealthRecords();
      
      const stats = {
        totalFiles: records.length,
        totalSize: records.reduce((sum, record) => sum + record.fileSize, 0),
        categoryBreakdown: {
          'prescription': 0,
          'lab-report': 0,
          'medical-image': 0,
          'document': 0,
          'other': 0
        } as Record<HealthRecord['category'], number>
      };

      records.forEach(record => {
        stats.categoryBreakdown[record.category]++;
      });

      return stats;
    } catch (error) {
      console.error('Error getting storage stats:', error);
      throw new Error('Failed to get storage statistics. Please try again.');
    }
  }

  /**
   * Search health records
   */
  async searchHealthRecords(searchTerm: string): Promise<HealthRecord[]> {
    const records = await this.getUserHealthRecords();
    
    const searchLower = searchTerm.toLowerCase();
    return records.filter(record => 
      record.title.toLowerCase().includes(searchLower) ||
      record.description?.toLowerCase().includes(searchLower) ||
      record.fileName.toLowerCase().includes(searchLower) ||
      record.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  /**
   * Create a sample health record for testing (without file upload)
   */
  async createSampleHealthRecord(): Promise<HealthRecord> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to create health records');
    }

    try {
      console.log('Creating sample health record for user:', user.uid);
      
      // Create sample health record document
      const healthRecord: Omit<HealthRecord, 'id'> = {
        userId: user.uid,
        title: 'Sample Medical Report',
        description: 'This is a sample health record for testing purposes',
        category: 'document',
        fileName: 'sample-report.pdf',
        fileSize: 1024000, // 1MB
        fileType: 'application/pdf',
        uploadDate: new Date(),
        lastModified: new Date(),
        downloadURL: 'https://example.com/sample.pdf',
        storagePath: `health-records/${user.uid}/sample-report.pdf`,
        tags: ['sample', 'test', 'medical'],
        isPrivate: true,
        sharedWith: []
      };

      console.log('Sample health record data:', healthRecord);

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'healthRecords'), {
        ...healthRecord,
        uploadDate: Timestamp.fromDate(healthRecord.uploadDate),
        lastModified: Timestamp.fromDate(healthRecord.lastModified)
      });

      console.log('Sample health record created with ID:', docRef.id);

      return {
        ...healthRecord,
        id: docRef.id
      };
    } catch (error) {
      console.error('Error creating sample health record:', error);
      throw new Error('Failed to create sample health record. Please try again.');
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): void {
    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 50MB');
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/csv',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not supported. Please upload images, PDFs, or documents.');
    }
  }

  /**
   * Sanitize file name for storage
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
  }
}

export const healthVaultService = HealthVaultService.getInstance();
