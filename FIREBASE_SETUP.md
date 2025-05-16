# Firebase Setup for CureCast Health Compass

This document explains how to properly configure Firebase for the CureCast Health Compass application.

## Prerequisites

1. A Firebase account
2. Firebase CLI installed (`npm install -g firebase-tools`)

## Setup Steps

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the instructions to create a new project
3. Make note of your project ID

### 2. Enable Authentication

1. In the Firebase Console, go to Authentication
2. Click "Get started"
3. Enable the "Google" provider and configure it

### 3. Create a Firestore Database

1. In the Firebase Console, go to Firestore Database
2. Click "Create database"
3. Start in production mode
4. Choose a location close to your users

### 4. Deploy Firestore Rules

The application includes a `firestore.rules` file that configures security rules for the database.

To deploy these rules:

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
firebase init

# Deploy only the Firestore rules
firebase deploy --only firestore:rules
```

### 5. Update Firebase Configuration

Ensure your Firebase configuration in `src/firebase.ts` matches your Firebase project:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

You can find these values in the Firebase Console under Project Settings > General > Your apps > Firebase SDK snippet.

## Troubleshooting

### Permission Denied Errors

If you see "Permission denied" errors when trying to save profile data:

1. Verify that your Firestore rules have been deployed correctly
2. Check that the user is properly authenticated
3. Ensure the user is trying to access their own profile document

### Authentication Issues

If users cannot sign in:

1. Verify that Google authentication is enabled in the Firebase Console
2. Check the authorized domains in the Firebase Authentication settings
3. Make sure your OAuth redirect domains are configured correctly

## Data Structure

The application uses the following Firestore collections:

- `userProfiles/{userId}` - Stores user profile information 

Each profile document contains:
- name (string)
- age (string)
- gender (string)
- bloodGroup (string)
- allergies (string)
- emergencyContact (string)
- location (string) 