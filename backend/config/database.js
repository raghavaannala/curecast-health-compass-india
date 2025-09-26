const { MongoClient, ServerApiVersion } = require('mongodb');

// MongoDB connection configuration
const uri = "mongodb+srv://akashswaero_db_user:<akashswaero_db_user>@curecast.l0o5ckx.mongodb.net/?retryWrites=true&w=majority&appName=CureCast"
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Database name
const DB_NAME = 'curecast_db';

// Collection names
const COLLECTIONS = {
  HEALTH_VAULT: 'health_vault',
  REMINDERS: 'reminders'
};

let db = null;

/**
 * Connect to MongoDB
 */
async function connectToDatabase() {
  try {
    if (!db) {
      await client.connect();
      db = client.db(DB_NAME);
      console.log("Successfully connected to MongoDB!");
      
      // Create indexes for better performance
      await createIndexes();
    }
    return db;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

/**
 * Create indexes for collections
 */
async function createIndexes() {
  try {
    // Index for health_vault collection
    await db.collection(COLLECTIONS.HEALTH_VAULT).createIndex({ userId: 1 });
    await db.collection(COLLECTIONS.HEALTH_VAULT).createIndex({ uploadedAt: -1 });
    
    // Index for reminders collection
    await db.collection(COLLECTIONS.REMINDERS).createIndex({ userId: 1 });
    await db.collection(COLLECTIONS.REMINDERS).createIndex({ reminderDate: 1 });
    await db.collection(COLLECTIONS.REMINDERS).createIndex({ status: 1 });
    
    console.log("Database indexes created successfully");
  } catch (error) {
    console.error("Error creating indexes:", error);
  }
}

/**
 * Get database instance
 */
function getDatabase() {
  if (!db) {
    throw new Error("Database not connected. Call connectToDatabase() first.");
  }
  return db;
}

/**
 * Close database connection
 */
async function closeDatabaseConnection() {
  try {
    if (client) {
      await client.close();
      db = null;
      console.log("Database connection closed");
    }
  } catch (error) {
    console.error("Error closing database connection:", error);
  }
}

/**
 * Health check for database connection
 */
async function pingDatabase() {
  try {
    await client.db("admin").command({ ping: 1 });
    return { status: 'connected', timestamp: new Date() };
  } catch (error) {
    return { status: 'disconnected', error: error.message, timestamp: new Date() };
  }
}

module.exports = {
  connectToDatabase,
  getDatabase,
  closeDatabaseConnection,
  pingDatabase,
  COLLECTIONS,
  DB_NAME
};
