# Firebase Security Rules Documentation

## Overview
This document outlines the comprehensive security rules implemented for the CureCast health application, covering both Firestore database and Firebase Storage security.

## Security Model
- **Authentication Required**: All operations require user authentication
- **User Isolation**: Users can only access their own data
- **Data Validation**: Strict validation for data structure and content
- **Principle of Least Privilege**: Users have minimal necessary permissions

## Firestore Security Rules

### Helper Functions
- `isAuthenticated()`: Checks if user is logged in
- `isOwner(userId)`: Verifies user owns the resource
- `isValidHealthRecord()`: Validates health record data structure
- `isValidReminder()`: Validates reminder data structure

### Collections and Access Patterns

#### 1. User Profiles (`/userProfiles/{userId}`)
- **Access**: Users can only read/write their own profile
- **Operations**: Read, Write, Create
- **Validation**: User ID must match authenticated user

#### 2. Health Records (`/healthRecords/{recordId}`)
- **Access**: Users can access their own records + shared records
- **Operations**: 
  - Read: Own records or records shared with user's email
  - Create: Only for authenticated user with valid data structure
  - Update: Only own records with valid data
  - Delete: Only own records
- **Validation**: 
  - Required fields: userId, title, category, fileName, fileSize, fileType, uploadDate, lastModified, storagePath, isPrivate
  - Valid categories: prescription, lab-report, medical-image, document, other
  - Data types: title (string), fileName (string), fileSize (number), isPrivate (bool)

#### 3. Health Reminders (`/healthReminders/{reminderId}`)
- **Access**: Users can only access their own reminders
- **Operations**: Read, Write, Create
- **Validation**:
  - Required fields: userId, title, type, scheduledTime, isActive, createdAt
  - Valid types: medication, appointment, checkup, exercise, diet, other
  - Data types: title (string), isActive (bool)

#### 4. Chat History (`/chatHistory/{userId}`)
- **Access**: Users can only access their own chat history
- **Operations**: Read, Write, Create
- **Subcollections**: `/sessions/{sessionId}` with same access rules

#### 5. Voice Transcriptions (`/voiceTranscriptions/{userId}`)
- **Access**: Users can only access their own transcriptions
- **Operations**: Read, Write, Create
- **Note**: Intended for temporary storage (24-hour cleanup)

#### 6. Prescription Analysis (`/prescriptionAnalysis/{analysisId}`)
- **Access**: Users can only access their own analysis results
- **Operations**: Read, Write, Create
- **Validation**: Required fields: userId, imageUrl, analysisResult, createdAt

#### 7. User Preferences (`/userPreferences/{userId}`)
- **Access**: Users can only access their own preferences
- **Operations**: Read, Write, Create

#### 8. Emergency Contacts (`/emergencyContacts/{userId}`)
- **Access**: Users can only access their own emergency contacts
- **Operations**: Read, Write, Create
- **Subcollections**: `/contacts/{contactId}` with same access rules

#### 9. Medical History (`/medicalHistory/{userId}`)
- **Access**: Users can only access their own medical history
- **Operations**: Read, Write, Create
- **Subcollections**: 
  - `/conditions/{conditionId}`
  - `/allergies/{allergyId}`

#### 10. Vital Signs (`/vitalSigns/{userId}`)
- **Access**: Users can only access their own vital signs
- **Operations**: Read, Write, Create
- **Subcollections**: `/readings/{readingId}`

#### 11. Symptom Tracking (`/symptomTracking/{userId}`)
- **Access**: Users can only access their own symptom logs
- **Operations**: Read, Write, Create
- **Subcollections**: `/symptoms/{symptomId}`

#### 12. Public Health Info (`/publicHealthInfo/{document}`)
- **Access**: Public read access, no write access
- **Operations**: Read only
- **Note**: For health tips and public information

#### 13. Feedback (`/feedback/{feedbackId}`)
- **Access**: Users can only access their own feedback
- **Operations**: Read, Create, Update
- **Validation**: Required fields: userId, type, message, createdAt

## Firebase Storage Security Rules

### File Organization
Files are organized by user ID to ensure complete isolation between users.

### Storage Paths and Access Rules

#### 1. Health Records (`/health-records/{userId}/{fileName}`)
- **Access**: Users can only access their own files
- **File Types**: Images, PDFs, Word docs, text files, spreadsheets
- **Size Limit**: 50MB
- **Operations**: Read, Write, Delete

#### 2. Prescription Images (`/prescription-images/{userId}/{fileName}`)
- **Access**: Users can only access their own prescription images
- **File Types**: Images only
- **Size Limit**: 50MB
- **Operations**: Read, Write, Delete
- **Purpose**: Temporary storage for OCR processing

#### 3. Profile Pictures (`/profile-pictures/{userId}/{fileName}`)
- **Access**: Users can only access their own profile pictures
- **File Types**: Images only
- **Size Limit**: 5MB
- **Operations**: Read, Write, Delete

#### 4. Temporary Uploads (`/temp-uploads/{userId}/{fileName}`)
- **Access**: Users can only access their own temporary files
- **File Types**: All valid health record types
- **Size Limit**: 10MB
- **Operations**: Read, Write, Delete
- **Purpose**: Short-term storage during processing

#### 5. Voice Recordings (`/voice-recordings/{userId}/{fileName}`)
- **Access**: Users can only access their own voice recordings
- **File Types**: Audio files only
- **Size Limit**: 10MB
- **Operations**: Read, Write, Delete

#### 6. Camera Captures (`/camera-captures/{userId}/{fileName}`)
- **Access**: Users can only access their own camera captures
- **File Types**: Images only
- **Size Limit**: 20MB
- **Operations**: Read, Write, Delete

#### 7. Shared Files (`/shared-files/{ownerId}/{fileName}`)
- **Access**: 
  - Owner: Full access (read, write, delete)
  - Others: Read-only access (sharing logic in Firestore)
- **Operations**: Owner (all), Others (read only)

#### 8. Backup Files (`/backups/{userId}/{fileName}`)
- **Access**: Users can only access their own backups
- **File Types**: JSON and ZIP files only
- **Size Limit**: 100MB
- **Operations**: Read, Write, Delete

### Supported File Types
- **Images**: JPEG, PNG, GIF, WebP, BMP, TIFF
- **Documents**: PDF, Word (.doc, .docx), Text files
- **Spreadsheets**: Excel (.xls, .xlsx), CSV
- **Audio**: All audio formats (for voice recordings)
- **Archives**: ZIP (for backups)
- **Data**: JSON (for backups)

## Security Best Practices Implemented

### 1. Authentication
- All operations require valid Firebase Authentication
- User identity verified for every request

### 2. Authorization
- Users can only access their own data
- Sharing mechanism implemented through Firestore metadata
- No cross-user data access without explicit sharing

### 3. Data Validation
- Strict validation of data structure and types
- File type and size validation for uploads
- Required field validation for all collections

### 4. Privacy Protection
- Health records are private by default
- Sharing requires explicit user action
- No public access to sensitive health data

### 5. File Security
- User-specific storage paths prevent unauthorized access
- File type restrictions prevent malicious uploads
- Size limits prevent abuse and storage bloat

## Deployment Instructions

### 1. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 2. Deploy Storage Rules
```bash
firebase deploy --only storage:rules
```

### 3. Deploy All Rules
```bash
firebase deploy --only firestore:rules,storage:rules
```

## Testing Security Rules

### 1. Firestore Rules Testing
```bash
firebase emulators:start --only firestore
# Run tests against emulator
```

### 2. Storage Rules Testing
```bash
firebase emulators:start --only storage
# Test file upload/download operations
```

## Monitoring and Maintenance

### 1. Regular Security Audits
- Review access patterns monthly
- Monitor for unusual activity
- Update rules as features are added

### 2. Performance Monitoring
- Monitor rule evaluation performance
- Optimize complex rules if needed
- Track denied requests for potential issues

### 3. Compliance
- Ensure HIPAA compliance for health data
- Regular privacy policy updates
- User consent management

## Emergency Procedures

### 1. Security Breach Response
1. Immediately revoke all access (set all rules to `allow read, write: if false`)
2. Investigate the breach
3. Notify affected users
4. Restore secure access after fixes

### 2. Rule Rollback
```bash
# Deploy previous version of rules
firebase deploy --only firestore:rules,storage:rules
```

## Contact Information
For security concerns or rule modifications, contact the development team.

---
*Last Updated: [Current Date]*
*Version: 1.0*
