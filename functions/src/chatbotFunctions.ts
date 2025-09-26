import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { chatbotWebhookHandlers } from '../../src/api/chatbotWebhooks';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * WhatsApp Webhook Function
 * Handles incoming WhatsApp messages
 */
export const whatsappWebhook = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    if (req.method === 'GET') {
      await chatbotWebhookHandlers.whatsapp.get(req, res);
    } else if (req.method === 'POST') {
      await chatbotWebhookHandlers.whatsapp.post(req, res);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * SMS Webhook Function
 * Handles incoming SMS messages
 */
export const smsWebhook = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    if (req.method === 'POST') {
      await chatbotWebhookHandlers.sms.post(req, res);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('SMS webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Health Alert Broadcast Function
 * Sends health alerts to target populations
 */
export const broadcastHealthAlert = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify admin role (implement your own role checking logic)
  const userDoc = await admin.firestore().doc(`users/${context.auth.uid}`).get();
  const userData = userDoc.data();
  
  if (!userData || userData.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'User must be an admin');
  }

  try {
    const {
      title,
      message,
      urgency,
      targetAudience,
      location,
      language,
      channels
    } = data;

    // Validate required fields
    if (!title || !message || !urgency || !channels) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    // Log the alert broadcast
    await admin.firestore().collection('healthAlerts').add({
      title,
      message,
      urgency,
      targetAudience,
      location,
      language,
      channels,
      createdBy: context.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'broadcasting'
    });

    // This would integrate with your actual broadcast logic
    // For now, return a success response
    return {
      success: true,
      alertId: 'alert_' + Date.now(),
      estimatedReach: 1000 // Placeholder
    };

  } catch (error) {
    console.error('Broadcast alert error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to broadcast alert');
  }
});

/**
 * Analytics Function
 * Provides chatbot analytics data
 */
export const getChatbotAnalytics = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const { startDate, endDate, filters } = data;

    // This would integrate with your analytics service
    // For now, return mock data
    return {
      overview: {
        totalSessions: 1250,
        totalUsers: 890,
        averageSatisfaction: 4.2,
        intentAccuracy: 87.5,
        escalationRate: 12.3,
        resolutionRate: 78.9
      },
      trends: {
        dailySessions: [
          { date: '2024-01-01', count: 45 },
          { date: '2024-01-02', count: 52 },
          { date: '2024-01-03', count: 38 }
        ]
      }
    };

  } catch (error) {
    console.error('Analytics error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get analytics');
  }
});

/**
 * User Feedback Function
 * Handles user feedback submission
 */
export const submitFeedback = functions.https.onCall(async (data, context) => {
  try {
    const { sessionId, rating, feedback, category } = data;

    if (!sessionId || !rating) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    // Store feedback in Firestore
    await admin.firestore().collection('chatbotFeedback').add({
      userId: context.auth?.uid || 'anonymous',
      sessionId,
      rating,
      feedback,
      category,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      platform: 'web'
    });

    return { success: true };

  } catch (error) {
    console.error('Feedback submission error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to submit feedback');
  }
});

/**
 * Escalation Function
 * Handles escalation to human health workers
 */
export const escalateToHealthWorker = functions.https.onCall(async (data, context) => {
  try {
    const { sessionId, reason, urgency, symptoms } = data;

    if (!sessionId || !reason) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    // Create escalation record
    const escalationRef = await admin.firestore().collection('escalations').add({
      userId: context.auth?.uid || 'anonymous',
      sessionId,
      reason,
      urgency,
      symptoms,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      assignedWorker: null
    });

    // Find and assign health worker (simplified logic)
    const availableWorkers = await admin.firestore()
      .collection('healthWorkers')
      .where('isOnline', '==', true)
      .where('currentLoad', '<', 5)
      .limit(1)
      .get();

    if (!availableWorkers.empty) {
      const worker = availableWorkers.docs[0];
      const workerData = worker.data();

      // Assign worker
      await escalationRef.update({
        assignedWorker: worker.id,
        assignedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Increment worker's current load
      await worker.ref.update({
        currentLoad: admin.firestore.FieldValue.increment(1)
      });

      // Notify worker (you could send email, SMS, push notification here)
      console.log(`Assigned escalation ${escalationRef.id} to worker ${worker.id}`);

      return {
        success: true,
        escalationId: escalationRef.id,
        healthWorker: {
          name: workerData.name,
          specialization: workerData.specialization,
          estimatedResponseTime: '5-10 minutes'
        }
      };
    } else {
      // No workers available
      return {
        success: false,
        error: 'No health workers available',
        fallback: 'Please call emergency helpline: 108'
      };
    }

  } catch (error) {
    console.error('Escalation error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to escalate');
  }
});

/**
 * Scheduled Function: Daily Analytics Aggregation
 */
export const aggregateDailyAnalytics = functions.pubsub
  .schedule('0 1 * * *') // Run daily at 1 AM
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      // Aggregate analytics for yesterday
      const sessionsSnapshot = await admin.firestore()
        .collection('chatbotSessions')
        .where('date', '==', dateStr)
        .get();

      const analytics = {
        date: dateStr,
        totalSessions: sessionsSnapshot.size,
        totalUsers: new Set(sessionsSnapshot.docs.map(doc => doc.data().userId)).size,
        platforms: { whatsapp: 0, sms: 0, web: 0, ivr: 0 },
        languages: {},
        escalations: 0,
        resolutions: 0
      };

      // Process session data
      sessionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        analytics.platforms[data.platform]++;
        analytics.languages[data.language] = (analytics.languages[data.language] || 0) + 1;
        if (data.escalated) analytics.escalations++;
        if (data.resolved) analytics.resolutions++;
      });

      // Store aggregated analytics
      await admin.firestore()
        .collection('dailyAnalytics')
        .doc(dateStr)
        .set(analytics);

      console.log(`Aggregated analytics for ${dateStr}`);
      return null;

    } catch (error) {
      console.error('Analytics aggregation error:', error);
      return null;
    }
  });

/**
 * Scheduled Function: Health Alert Cleanup
 */
export const cleanupExpiredAlerts = functions.pubsub
  .schedule('0 2 * * *') // Run daily at 2 AM
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    try {
      const now = admin.firestore.Timestamp.now();
      
      // Find expired alerts
      const expiredAlerts = await admin.firestore()
        .collection('healthAlerts')
        .where('expiresAt', '<=', now)
        .where('status', '!=', 'expired')
        .get();

      // Mark as expired
      const batch = admin.firestore().batch();
      expiredAlerts.docs.forEach(doc => {
        batch.update(doc.ref, { status: 'expired' });
      });

      await batch.commit();
      console.log(`Marked ${expiredAlerts.size} alerts as expired`);
      return null;

    } catch (error) {
      console.error('Alert cleanup error:', error);
      return null;
    }
  });
