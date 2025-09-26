# CureCast MongoDB Integration - Complete Setup Guide

## 🎉 Integration Complete!

Your CureCast healthcare project now has a comprehensive MongoDB integration with the following features:

### ✅ What's Been Implemented

#### 1. **Database Architecture**
- **Database Name**: `curecast_db`
- **Collections**: 
  - `health_vault` - User medical documents storage
  - `reminders` - Health reminders and notifications

#### 2. **Backend API Server**
- **Express.js server** with comprehensive error handling
- **RESTful API endpoints** for all CRUD operations
- **MongoDB connection management** with automatic reconnection
- **Request validation and sanitization**
- **CORS configuration** for frontend integration

#### 3. **Frontend Integration**
- **TypeScript types** for type-safe development
- **API service classes** for clean data fetching
- **React hooks** for easy component integration
- **Error handling and loading states**

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Update MongoDB password in config/database.js
# Replace <password> with your actual MongoDB password

# Start development server
./scripts/start-dev.sh
```

### 2. Frontend Integration

```typescript
// Example: Using in a React component
import { useHealthDocuments, useReminders } from '../hooks';

function HealthDashboard({ userId }: { userId: string }) {
  const { documents, addDocument, loading } = useHealthDocuments(userId);
  const { reminders, addReminder } = useReminders(userId);

  // Your component logic here
}
```

## 📚 API Endpoints Reference

### Health Vault API
```
POST   /api/health-vault                    # Add document
GET    /api/health-vault/:userId            # Get user documents
GET    /api/health-vault/:userId/:docId     # Get specific document
PUT    /api/health-vault/:userId/:docId     # Update document
DELETE /api/health-vault/:userId/:docId     # Delete document
GET    /api/health-vault/:userId/stats      # Get statistics
```

### Reminders API
```
POST   /api/reminders                       # Add reminder
GET    /api/reminders/:userId               # Get user reminders
GET    /api/reminders/:userId/:reminderId   # Get specific reminder
PUT    /api/reminders/:userId/:reminderId   # Update reminder
PATCH  /api/reminders/:userId/:reminderId   # Update status only
DELETE /api/reminders/:userId/:reminderId   # Delete reminder
GET    /api/reminders/:userId/upcoming      # Get upcoming reminders
GET    /api/reminders/:userId/overdue       # Get overdue reminders
GET    /api/reminders/:userId/stats         # Get statistics
POST   /api/reminders/:userId/bulk          # Add multiple reminders
```

## 💡 Usage Examples

### Adding a Health Document

```typescript
import { healthVaultApi } from '../services/healthVaultApi';

const addPrescription = async () => {
  const result = await healthVaultApi.addDocument({
    userId: "user_123",
    documentType: "prescription",
    fileUrl: "https://example.com/prescription.pdf",
    fileName: "prescription_001.pdf",
    description: "Blood pressure medication",
    metadata: {
      doctorName: "Dr. Smith",
      hospitalName: "City Hospital",
      prescriptionDate: "2024-01-15"
    }
  });
  
  if (result.success) {
    console.log("Document added:", result.document);
  }
};
```

### Adding a Reminder

```typescript
import { remindersApi } from '../services/remindersApi';

const addMedicationReminder = async () => {
  const result = await remindersApi.addReminder({
    userId: "user_123",
    title: "Take Blood Pressure Medication",
    description: "Take Lisinopril 10mg with water",
    reminderDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    type: "medication",
    priority: "high",
    metadata: {
      medicationName: "Lisinopril",
      dosage: "10mg",
      frequency: "daily"
    }
  });
  
  if (result.success) {
    console.log("Reminder added:", result.reminder);
  }
};
```

### Using React Hooks

```typescript
import { useHealthDocuments, useUpcomingReminders } from '../hooks';

function HealthOverview({ userId }: { userId: string }) {
  // Get user's health documents
  const { 
    documents, 
    loading: documentsLoading, 
    addDocument 
  } = useHealthDocuments(userId);

  // Get upcoming reminders
  const { 
    reminders, 
    loading: remindersLoading 
  } = useUpcomingReminders(userId, 7); // Next 7 days

  if (documentsLoading || remindersLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Health Documents ({documents.length})</h2>
      {documents.map(doc => (
        <div key={doc._id}>
          <h3>{doc.fileName}</h3>
          <p>{doc.description}</p>
          <span>{doc.documentType}</span>
        </div>
      ))}

      <h2>Upcoming Reminders ({reminders.length})</h2>
      {reminders.map(reminder => (
        <div key={reminder._id}>
          <h3>{reminder.title}</h3>
          <p>{reminder.description}</p>
          <span>{new Date(reminder.reminderDate).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  );
}
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb+srv://akashswaero_db_user:YOUR_PASSWORD@curecast.l0o5ckx.mongodb.net/?retryWrites=true&w=majority&appName=CureCast
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### MongoDB Connection

Update the password in `backend/config/database.js`:

```javascript
const uri = "mongodb+srv://akashswaero_db_user:YOUR_ACTUAL_PASSWORD@curecast.l0o5ckx.mongodb.net/?retryWrites=true&w=majority&appName=CureCast";
```

## 🧪 Testing

### Test the API

```bash
# Start the backend server
cd backend
npm run dev

# Test health check
curl http://localhost:3001/health

# Test adding a document
curl -X POST http://localhost:3001/api/health-vault \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "documentType": "prescription",
    "fileUrl": "https://example.com/test.pdf",
    "description": "Test prescription"
  }'
```

### Run Examples

```bash
cd backend
node examples/apiExamples.js
```

## 🔗 Integration with Existing CureCast Features

### With Prescription Scanner
```typescript
// In your prescription scanner component
import { healthVaultApi } from '../services/healthVaultApi';

const savePrescription = async (ocrResult: any, fileUrl: string) => {
  await healthVaultApi.addDocument({
    userId: currentUser.id,
    documentType: "prescription",
    fileUrl,
    fileName: "scanned_prescription.pdf",
    description: "OCR extracted prescription",
    metadata: {
      extractedText: ocrResult.text,
      medicines: ocrResult.medicines,
      scanDate: new Date().toISOString()
    }
  });
};
```

### With Multilingual Support
```typescript
// The API supports metadata in multiple languages
import { useGlobalLanguage } from '../contexts/GlobalLanguageContext';

const { language } = useGlobalLanguage();

const addLocalizedReminder = async () => {
  await remindersApi.addReminder({
    userId: currentUser.id,
    title: translations[language].medicationReminder,
    description: translations[language].medicationDescription,
    reminderDate: new Date(),
    type: "medication",
    priority: "high",
    metadata: {
      language: language,
      localizedContent: true
    }
  });
};
```

## 📊 Monitoring and Health Checks

### Server Health
Visit `http://localhost:3001/health` to check:
- Server status
- Database connection
- Memory usage
- Uptime

### Database Indexes
The system automatically creates optimized indexes:
- `userId` indexes for fast user queries
- `reminderDate` indexes for time-based queries
- `uploadedAt` indexes for chronological sorting

## 🔒 Security Features

- **User-based access control**: All operations require userId validation
- **Input validation**: Comprehensive validation for all inputs
- **Error handling**: Proper error responses without exposing internals
- **CORS protection**: Configurable cross-origin resource sharing
- **Request sanitization**: Protection against injection attacks

## 🚀 Production Deployment

### Environment Setup
```bash
# Set production environment
export NODE_ENV=production

# Install production dependencies
npm install --production

# Start production server
npm start
```

### Database Optimization
- Connection pooling is automatically configured
- Indexes are created on first connection
- Automatic reconnection on connection loss

## 📈 Performance Features

- **Pagination support**: All list endpoints support limit/skip
- **Filtering**: Advanced filtering options for all queries
- **Sorting**: Configurable sorting on any field
- **Search**: Text search across document content
- **Caching**: Built-in response caching capabilities

## 🤝 Support and Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check your internet connection
   - Verify the MongoDB URI and password
   - Ensure your IP is whitelisted in MongoDB Atlas

2. **CORS Errors**
   - Update `ALLOWED_ORIGINS` in your .env file
   - Ensure frontend URL matches the allowed origins

3. **Port Already in Use**
   - Change the PORT in .env file
   - Kill any existing processes on port 3001

### Getting Help

1. Check the server logs for detailed error messages
2. Use the health check endpoint to verify system status
3. Review the examples in `backend/examples/apiExamples.js`
4. Test individual API endpoints using curl or Postman

## 🎯 Next Steps

Your MongoDB integration is now complete! You can:

1. **Start the backend server** and test the API endpoints
2. **Integrate the React hooks** into your existing components
3. **Add file upload functionality** for health documents
4. **Implement push notifications** for reminders
5. **Add data analytics** and reporting features
6. **Scale the system** with additional collections as needed

---

**🎉 Congratulations!** Your CureCast project now has a robust, scalable MongoDB backend that seamlessly integrates with your existing healthcare features. The system is ready for development and can easily scale to production when needed.
