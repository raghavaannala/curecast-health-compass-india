import { whatsappService } from '../services/whatsappService';
import { smsService } from '../services/smsService';
import { chatbotAnalyticsService } from '../services/chatbotAnalyticsService';

/**
 * API Webhook Handlers for Multilingual Chatbot
 * These would typically be implemented as serverless functions or API routes
 */

/**
 * WhatsApp Webhook Handler
 * POST /api/whatsapp/webhook
 */
export const handleWhatsAppWebhook = async (req: any, res: any) => {
  try {
    // Verify webhook signature (implement based on WhatsApp documentation)
    const signature = req.headers['x-hub-signature-256'];
    if (!verifyWhatsAppSignature(req.body, signature)) {
      return res.status(403).json({ error: 'Invalid signature' });
    }

    // Process incoming message
    await whatsappService.handleWebhook(req.body);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * WhatsApp Webhook Verification
 * GET /api/whatsapp/webhook
 */
export const verifyWhatsAppWebhook = (req: any, res: any) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verificationResult = whatsappService.verifyWebhook(mode, token, challenge);
  
  if (verificationResult) {
    res.status(200).send(verificationResult);
  } else {
    res.status(403).json({ error: 'Verification failed' });
  }
};

/**
 * SMS Webhook Handler (Twilio format - adapt for other providers)
 * POST /api/sms/webhook
 */
export const handleSMSWebhook = async (req: any, res: any) => {
  try {
    const { From, Body, MessageSid } = req.body;
    
    if (!From || !Body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Process incoming SMS
    await smsService.processIncomingSMS(From, Body, MessageSid);
    
    res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  } catch (error) {
    console.error('SMS webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Health Alert Broadcast API
 * POST /api/alerts/broadcast
 */
export const broadcastHealthAlert = async (req: any, res: any) => {
  try {
    const { 
      title, 
      message, 
      urgency, 
      targetAudience, 
      location, 
      language,
      channels // ['whatsapp', 'sms']
    } = req.body;

    // Validate required fields
    if (!title || !message || !urgency || !channels) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get target phone numbers based on criteria
    const phoneNumbers = await getTargetPhoneNumbers(targetAudience, location);
    
    const results = {
      whatsapp: { sent: 0, failed: 0 },
      sms: { sent: 0, failed: 0 }
    };

    // Send via WhatsApp if requested
    if (channels.includes('whatsapp')) {
      const whatsappResult = await whatsappService.sendHealthAlert(
        phoneNumbers,
        { title, message, language, urgency }
      );
      results.whatsapp = whatsappResult;
    }

    // Send via SMS if requested
    if (channels.includes('sms')) {
      const smsResult = await smsService.sendHealthAlert(
        phoneNumbers,
        { title, message, language, urgency }
      );
      results.sms = smsResult;
    }

    res.status(200).json({
      success: true,
      results,
      totalTargeted: phoneNumbers.length
    });

  } catch (error) {
    console.error('Broadcast alert error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Analytics API
 * GET /api/analytics/dashboard
 */
export const getAnalyticsDashboard = async (req: any, res: any) => {
  try {
    const { startDate, endDate, platform, language, state } = req.query;
    
    const dateRange = {
      startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: endDate || new Date().toISOString().split('T')[0]
    };

    const filters: any = {};
    if (platform) filters.platform = platform;
    if (language) filters.language = language;
    if (state) filters.location = { state };

    const dashboardData = await chatbotAnalyticsService.getDashboardData(
      dateRange,
      Object.keys(filters).length > 0 ? filters : undefined
    );

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * User Feedback API
 * POST /api/feedback
 */
export const submitUserFeedback = async (req: any, res: any) => {
  try {
    const { userId, sessionId, rating, feedback, category } = req.body;

    if (!userId || !sessionId || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Track user satisfaction
    await chatbotAnalyticsService.trackUserSatisfaction(
      userId,
      sessionId,
      rating,
      feedback
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Health Worker Escalation API
 * POST /api/escalate
 */
export const escalateToHealthWorker = async (req: any, res: any) => {
  try {
    const { sessionId, reason, urgency, userLocation } = req.body;

    if (!sessionId || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find available health worker
    const availableWorker = await findAvailableHealthWorker(userLocation, urgency);
    
    if (!availableWorker) {
      return res.status(503).json({ 
        error: 'No health workers available',
        fallback: 'Please call emergency helpline: 108'
      });
    }

    // Notify health worker
    await notifyHealthWorker(availableWorker.id, sessionId, reason, urgency);

    res.status(200).json({
      success: true,
      healthWorker: {
        name: availableWorker.name,
        specialization: availableWorker.specialization,
        estimatedResponseTime: '5-10 minutes'
      }
    });

  } catch (error) {
    console.error('Escalation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper functions

function verifyWhatsAppSignature(payload: any, signature: string): boolean {
  // Implement WhatsApp signature verification
  // This is a security measure to ensure requests are from WhatsApp
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WHATSAPP_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return `sha256=${expectedSignature}` === signature;
}

async function getTargetPhoneNumbers(
  targetAudience: string,
  location: { state?: string; district?: string }
): Promise<string[]> {
  // This would query your user database based on criteria
  // For now, return a placeholder array
  return [
    '+919876543210',
    '+919876543211',
    '+919876543212'
  ];
}

async function findAvailableHealthWorker(
  location: any,
  urgency: string
): Promise<any> {
  // This would query your health worker database
  // For now, return a placeholder worker
  return {
    id: 'hw_001',
    name: 'Dr. Priya Sharma',
    specialization: ['general_medicine'],
    location: location,
    isOnline: true
  };
}

async function notifyHealthWorker(
  workerId: string,
  sessionId: string,
  reason: string,
  urgency: string
): Promise<void> {
  // This would send notification to health worker
  // Could be via SMS, email, push notification, etc.
  console.log(`Notifying health worker ${workerId} about session ${sessionId} - ${reason} (${urgency})`);
}

// Export all handlers for use in your API routes
export const chatbotWebhookHandlers = {
  whatsapp: {
    post: handleWhatsAppWebhook,
    get: verifyWhatsAppWebhook
  },
  sms: {
    post: handleSMSWebhook
  },
  alerts: {
    broadcast: broadcastHealthAlert
  },
  analytics: {
    dashboard: getAnalyticsDashboard
  },
  feedback: {
    submit: submitUserFeedback
  },
  escalation: {
    escalate: escalateToHealthWorker
  }
};
