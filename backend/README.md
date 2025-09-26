# CureCast Health API - MongoDB Integration

A comprehensive Node.js/Express.js API server with MongoDB integration for the CureCast healthcare platform, providing health document management and reminder functionality.

## 🏗️ Architecture Overview

```
backend/
├── config/
│   └── database.js          # MongoDB connection and configuration
├── services/
│   ├── healthVaultService.js # Health document business logic
│   └── remindersService.js   # Reminders business logic
├── routes/
│   ├── healthVaultRoutes.js  # Health vault API endpoints
│   └── remindersRoutes.js    # Reminders API endpoints
├── examples/
│   └── apiExamples.js        # Usage examples and testing
├── package.json              # Dependencies and scripts
├── server.js                 # Main Express server
└── README.md                 # This file
```

## 📊 Database Schema

### Collections

#### `health_vault` Collection
```javascript
{
  _id: ObjectId,
  userId: String,           // User identifier
  documentType: String,     // e.g., 'prescription', 'lab_report', 'medical_record'
  fileUrl: String,          // URL to the uploaded file
  fileName: String,         // Original file name
  description: String,      // Document description
  metadata: Object,         // Additional metadata (doctor, hospital, etc.)
  uploadedAt: Date,         // Upload timestamp
  createdAt: Date,          // Creation timestamp
  updatedAt: Date           // Last update timestamp
}
```

#### `reminders` Collection
```javascript
{
  _id: ObjectId,
  userId: String,           // User identifier
  title: String,            // Reminder title
  description: String,      // Reminder description
  reminderDate: Date,       // When to remind
  status: String,           // 'pending', 'completed', 'cancelled', 'missed'
  type: String,             // 'medication', 'appointment', 'checkup', 'exercise', etc.
  priority: String,         // 'low', 'medium', 'high'
  metadata: Object,         // Additional metadata
  createdAt: Date,          // Creation timestamp
  updatedAt: Date,          // Last update timestamp
  completedAt: Date         // Completion timestamp (if completed)
}
```

## 🚀 Quick Start

### 1. Installation

```bash
cd backend
npm install
```

### 2. Environment Setup

Update the MongoDB connection string in `config/database.js`:

```javascript
const uri = "mongodb+srv://akashswaero_db_user:<YOUR_PASSWORD>@curecast.l0o5ckx.mongodb.net/?retryWrites=true&w=majority&appName=CureCast";
```

### 3. Start the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001`

### 4. Health Check

Visit `http://localhost:3001/health` to verify the server and database connection.

## 📚 API Endpoints

### Health Vault API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/health-vault` | Add a new health document |
| GET | `/api/health-vault/:userId` | Get all documents for a user |
| GET | `/api/health-vault/:userId/:documentId` | Get a specific document |
| PUT | `/api/health-vault/:userId/:documentId` | Update a document |
| DELETE | `/api/health-vault/:userId/:documentId` | Delete a document |
| GET | `/api/health-vault/:userId/stats` | Get document statistics |

### Reminders API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reminders` | Add a new reminder |
| GET | `/api/reminders/:userId` | Get all reminders for a user |
| GET | `/api/reminders/:userId/:reminderId` | Get a specific reminder |
| PUT | `/api/reminders/:userId/:reminderId` | Update a reminder |
| PATCH | `/api/reminders/:userId/:reminderId` | Update reminder status |
| DELETE | `/api/reminders/:userId/:reminderId` | Delete a reminder |
| GET | `/api/reminders/:userId/upcoming` | Get upcoming reminders |
| GET | `/api/reminders/:userId/overdue` | Get overdue reminders |
| GET | `/api/reminders/:userId/stats` | Get reminder statistics |
| POST | `/api/reminders/:userId/bulk` | Add multiple reminders |

## 💡 Usage Examples

### Adding a Health Document

```javascript
const documentData = {
  userId: "user_12345",
  documentType: "prescription",
  fileUrl: "https://example.com/documents/prescription_001.pdf",
  fileName: "prescription_001.pdf",
  description: "Blood pressure medication prescription",
  metadata: {
    doctorName: "Dr. John Smith",
    hospitalName: "City General Hospital",
    prescriptionDate: "2024-01-15"
  }
};

const response = await fetch('http://localhost:3001/api/health-vault', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(documentData)
});

const result = await response.json();
console.log(result);
```

### Adding a Reminder

```javascript
const reminderData = {
  userId: "user_12345",
  title: "Take Blood Pressure Medication",
  description: "Take Lisinopril 10mg tablet with water after breakfast",
  reminderDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  type: "medication",
  priority: "high",
  metadata: {
    medicationName: "Lisinopril",
    dosage: "10mg",
    frequency: "daily"
  }
};

const response = await fetch('http://localhost:3001/api/reminders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(reminderData)
});

const result = await response.json();
console.log(result);
```

### Getting User Documents with Filters

```javascript
const userId = "user_12345";
const params = new URLSearchParams({
  documentType: "prescription",
  limit: "10",
  sortBy: "uploadedAt",
  sortOrder: "-1"
});

const response = await fetch(`http://localhost:3001/api/health-vault/${userId}?${params}`);
const result = await response.json();
console.log(result);
```

### Updating Reminder Status

```javascript
const userId = "user_12345";
const reminderId = "reminder_id_here";

const response = await fetch(`http://localhost:3001/api/reminders/${userId}/${reminderId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'completed' })
});

const result = await response.json();
console.log(result);
```

## 🧪 Testing

Run the comprehensive examples:

```bash
cd backend
node examples/apiExamples.js
```

This will demonstrate all API endpoints with sample data.

## 🔧 Service Functions

### Health Vault Service Functions

```javascript
const {
  addHealthDocument,
  getHealthDocuments,
  getHealthDocumentById,
  updateHealthDocument,
  deleteHealthDocument,
  getHealthDocumentStats
} = require('./services/healthVaultService');
```

### Reminders Service Functions

```javascript
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
} = require('./services/remindersService');
```

## 🔒 Security Features

- **User-based access control**: All operations require userId validation
- **Input validation**: Comprehensive validation for all inputs
- **Error handling**: Proper error responses and logging
- **CORS configuration**: Configurable cross-origin resource sharing
- **Rate limiting**: Built-in rate limiting middleware
- **Request logging**: Comprehensive request/response logging

## 🚀 Deployment

### Environment Variables

Create a `.env` file in the backend directory:

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://akashswaero_db_user:<password>@curecast.l0o5ckx.mongodb.net/?retryWrites=true&w=majority&appName=CureCast
```

### Production Deployment

```bash
# Install dependencies
npm install --production

# Start the server
npm start
```

## 📈 Performance Features

- **Database indexing**: Optimized indexes for fast queries
- **Connection pooling**: Efficient MongoDB connection management
- **Compression**: Response compression for better performance
- **Caching**: Built-in response caching capabilities
- **Pagination**: Support for paginated results

## 🔍 Monitoring

### Health Check Endpoint

The `/health` endpoint provides comprehensive server status:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": {
    "status": "connected",
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "uptime": 3600,
  "memory": {
    "rss": 50331648,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1048576
  },
  "version": "v18.17.0"
}
```

## 🤝 Integration with Frontend

### React/TypeScript Integration

```typescript
// types/api.ts
export interface HealthDocument {
  _id: string;
  userId: string;
  documentType: string;
  fileUrl: string;
  fileName?: string;
  description?: string;
  metadata?: Record<string, any>;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reminder {
  _id: string;
  userId: string;
  title: string;
  description: string;
  reminderDate: Date;
  status: 'pending' | 'completed' | 'cancelled' | 'missed';
  type: string;
  priority: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// services/healthVaultApi.ts
export class HealthVaultAPI {
  private baseUrl = 'http://localhost:3001/api/health-vault';

  async addDocument(data: Partial<HealthDocument>): Promise<HealthDocument> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return result.document;
  }

  async getDocuments(userId: string): Promise<HealthDocument[]> {
    const response = await fetch(`${this.baseUrl}/${userId}`);
    const result = await response.json();
    return result.documents;
  }
}
```

## 📝 Error Handling

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Detailed error message",
  "message": "User-friendly error message"
}
```

## 🔄 Data Migration

If you need to migrate existing data:

```javascript
// migration/migrateData.js
const { connectToDatabase } = require('../config/database');

async function migrateExistingData() {
  const db = await connectToDatabase();
  
  // Your migration logic here
  // Example: Add new fields to existing documents
  await db.collection('health_vault').updateMany(
    { metadata: { $exists: false } },
    { $set: { metadata: {} } }
  );
}
```

## 🛟 Support

For issues or questions:

1. Check the examples in `examples/apiExamples.js`
2. Review the API documentation above
3. Test endpoints using the health check
4. Check server logs for detailed error information

## 📄 License

This project is part of the CureCast Health Compass platform.

---

**Ready to integrate!** 🎉

Your MongoDB integration is now complete with:
- ✅ Robust database connection management
- ✅ Comprehensive CRUD operations
- ✅ RESTful API endpoints
- ✅ Error handling and validation
- ✅ Performance optimizations
- ✅ Complete documentation and examples
