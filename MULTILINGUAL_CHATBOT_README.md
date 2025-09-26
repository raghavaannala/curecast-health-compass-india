# Multilingual AI Chatbot for Rural Healthcare

## Overview

This multilingual AI chatbot is designed to provide preventive healthcare education, early disease symptom awareness, and vaccination schedules for rural and semi-urban populations in India. The chatbot supports multiple Indian languages and integrates with government health databases to provide accurate, culturally adapted health information.

## Features

### Core Features
- **Multilingual Support**: 10+ Indian languages including Hindi, Telugu, Tamil, Bengali, Marathi, Kannada, Malayalam, Gujarati, Punjabi, and Urdu
- **Preventive Healthcare Education**: Evidence-based health information and disease prevention tips
- **Symptom Triage**: AI-powered symptom checking with red flag detection for emergencies
- **Vaccination Information**: Government-approved vaccination schedules and reminders
- **Real-time Alerts**: Disease outbreak notifications and vaccination drive announcements
- **Multi-platform Support**: WhatsApp, SMS, Web, and IVR integration
- **Human Escalation**: Seamless handoff to health workers for complex queries

### Technical Features
- **NLP Processing**: Advanced natural language understanding with 80%+ accuracy
- **Knowledge Base**: Comprehensive medical FAQ database with 1000+ entries
- **Government Integration**: Real-time sync with health databases and alert systems
- **Analytics Dashboard**: Usage metrics, accuracy tracking, and performance monitoring
- **Security & Privacy**: GDPR-compliant data handling with user consent management

## Architecture

### Service Layer
```
src/services/
├── multilingualChatbotService.ts     # Core chatbot logic and NLP
├── healthKnowledgeBaseService.ts     # Medical knowledge and triage
├── whatsappService.ts                # WhatsApp Business API integration
├── smsService.ts                     # SMS gateway integration
├── governmentHealthIntegrationService.ts # Government database APIs
├── chatbotAnalyticsService.ts        # Analytics and reporting
└── languageService.ts                # Language detection and translation
```

### Component Layer
```
src/components/
├── MultilingualHealthChatbot.tsx     # Main chatbot interface
├── ChatbotAnalyticsDashboard.tsx     # Analytics dashboard
└── ChatbotManagement.tsx             # Admin management interface
```

### Type Definitions
```
src/types.ts                          # Comprehensive type definitions
```

## Installation & Setup

### Prerequisites
- Node.js 18+
- React 18+
- Firebase account
- WhatsApp Business API access
- SMS gateway account (Twilio/TextLocal/MSG91)

### Environment Variables
Create a `.env` file with the following variables:

```env
# WhatsApp Business API
REACT_APP_WHATSAPP_API_URL=https://graph.facebook.com/v18.0
REACT_APP_WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
REACT_APP_WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
REACT_APP_WHATSAPP_VERIFY_TOKEN=your_verify_token

# SMS Gateway (Twilio example)
REACT_APP_SMS_API_URL=https://api.twilio.com/2010-04-01
REACT_APP_SMS_API_KEY=your_sms_api_key
REACT_APP_TWILIO_ACCOUNT_SID=your_account_sid
REACT_APP_SMS_SENDER_ID=HEALTH

# Google Translate API (optional)
REACT_APP_GOOGLE_TRANSLATE_API_KEY=your_translate_api_key

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id

# Base URL for webhooks
REACT_APP_BASE_URL=https://your-domain.com
```

### Installation Steps

1. **Install Dependencies**
```bash
npm install
```

2. **Configure Firebase**
```bash
# Initialize Firebase
firebase init

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

3. **Set up WhatsApp Webhook**
```bash
# Configure webhook URL in WhatsApp Business API
# Webhook URL: https://your-domain.com/api/whatsapp/webhook
# Verify Token: Use the token from your .env file
```

4. **Start Development Server**
```bash
npm run dev
```

## Usage

### Basic Integration

```tsx
import { MultilingualHealthChatbot } from './components/MultilingualHealthChatbot';

function App() {
  const handleEscalation = (session) => {
    console.log('Session escalated:', session.id);
    // Handle escalation to human health worker
  };

  return (
    <MultilingualHealthChatbot
      userId="user123"
      platform="web"
      initialLanguage="english"
      onEscalation={handleEscalation}
    />
  );
}
```

### WhatsApp Integration

```typescript
import { whatsappService } from './services/whatsappService';

// Handle incoming webhook
app.post('/api/whatsapp/webhook', (req, res) => {
  whatsappService.handleWebhook(req.body);
  res.sendStatus(200);
});

// Verify webhook
app.get('/api/whatsapp/webhook', (req, res) => {
  const challenge = whatsappService.verifyWebhook(
    req.query.mode,
    req.query.verify_token,
    req.query.challenge
  );
  
  if (challenge) {
    res.send(challenge);
  } else {
    res.sendStatus(403);
  }
});
```

### SMS Integration

```typescript
import { smsService } from './services/smsService';

// Handle incoming SMS
app.post('/api/sms/webhook', (req, res) => {
  const { From, Body, MessageSid } = req.body;
  
  smsService.processIncomingSMS(From, Body, MessageSid);
  res.sendStatus(200);
});

// Send health alert
smsService.sendHealthAlert(
  ['+919876543210'],
  {
    title: 'Dengue Alert',
    message: 'Increased dengue cases reported. Take preventive measures.',
    language: 'english',
    urgency: 'high'
  }
);
```

## API Reference

### Core Services

#### MultilingualChatbotService

```typescript
// Process user message
const result = await multilingualChatbotService.processMessage(
  userId: string,
  message: string,
  platform: 'whatsapp' | 'sms' | 'web' | 'ivr',
  sessionId?: string
);

// Get active session
const session = multilingualChatbotService.getSession(sessionId);

// End session
multilingualChatbotService.endSession(sessionId);
```

#### HealthKnowledgeBaseService

```typescript
// Search knowledge base
const results = await healthKnowledgeBaseService.searchKnowledge(
  query: string,
  language: Language,
  category?: string
);

// Get symptom triage
const triage = await healthKnowledgeBaseService.getSymptomTriage(
  symptoms: string[],
  language: Language,
  patientAge?: number
);

// Get health alerts
const alerts = await healthKnowledgeBaseService.getHealthAlerts(
  location: { state: string; district?: string },
  language: Language
);
```

#### GovernmentHealthIntegrationService

```typescript
// Get vaccination schedule
const schedule = await governmentHealthIntegrationService.getGovernmentVaccinationSchedule(
  ageGroup: 'infant' | 'child' | 'adult',
  state?: string
);

// Get outbreak alerts
const alerts = await governmentHealthIntegrationService.getOutbreakAlerts(
  location: { state: string; district?: string },
  language: Language
);

// Get vaccination centers
const centers = await governmentHealthIntegrationService.getVaccinationCenters(
  location: { state: string; district: string },
  vaccineType?: string
);
```

## Language Support

### Supported Languages
- **English** (en)
- **Hindi** (hi) - हिंदी
- **Telugu** (te) - తెలుగు
- **Tamil** (ta) - தமிழ்
- **Bengali** (bn) - বাংলা
- **Marathi** (mr) - मराठी
- **Kannada** (kn) - ಕನ್ನಡ
- **Malayalam** (ml) - മലയാളം
- **Gujarati** (gu) - ગુજરાતી
- **Punjabi** (pa) - ਪੰਜਾਬੀ
- **Urdu** (ur) - اردو

### Language Detection
The system automatically detects the user's language using:
1. Script-based detection (Devanagari, Telugu, Tamil, etc.)
2. Browser language preferences
3. User profile settings
4. Manual language selection

### Translation
- Google Translate API integration for real-time translation
- Pre-translated common health phrases for offline support
- Cultural adaptation of medical terminology

## Health Content Management

### Knowledge Base Structure
```typescript
interface HealthKnowledgeBase {
  id: string;
  category: 'disease_info' | 'prevention' | 'vaccination' | 'nutrition' | 'hygiene';
  question: string;
  answer: string;
  language: Language;
  tags: string[];
  sources: string[]; // WHO, ICMR, etc.
  accuracy: number;
  relatedQuestions?: string[];
}
```

### Content Categories
1. **Disease Information**: Symptoms, causes, treatment
2. **Prevention**: Hygiene, nutrition, lifestyle
3. **Vaccination**: Schedules, importance, side effects
4. **Maternal Health**: Pregnancy care, delivery preparation
5. **Child Health**: Growth monitoring, nutrition
6. **Emergency Care**: First aid, when to seek help

### Content Sources
- World Health Organization (WHO)
- Indian Council of Medical Research (ICMR)
- Ministry of Health and Family Welfare
- State Health Departments
- Indian Academy of Pediatrics (IAP)

## Symptom Triage System

### Triage Levels
1. **Self-care** (Green): Minor symptoms, home remedies
2. **Consult Doctor** (Yellow): Non-urgent medical consultation
3. **Urgent Care** (Orange): Same-day medical attention
4. **Emergency** (Red): Immediate medical intervention

### Red Flag Symptoms
- Chest pain with breathing difficulty
- Severe headache with neck stiffness
- High fever with confusion
- Severe bleeding
- Loss of consciousness
- Severe allergic reactions

### Triage Algorithm
```typescript
interface SymptomTriageRule {
  symptoms: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  redFlags: string[];
  recommendation: 'self_care' | 'consult_doctor' | 'urgent_care' | 'emergency';
  advice: string;
  followUpQuestions?: string[];
}
```

## Government Integration

### Supported Systems
1. **CoWIN**: COVID-19 vaccination data
2. **NVBDCP**: Vector-borne disease surveillance
3. **IDSP**: Integrated Disease Surveillance Programme
4. **State Health Departments**: Local health data
5. **ABHA**: Ayushman Bharat Health Account

### Data Synchronization
- Real-time outbreak alerts
- Vaccination drive notifications
- Health statistics updates
- Policy changes and guidelines

### API Endpoints
```typescript
// Outbreak alerts
GET /api/government/outbreaks?state={state}&district={district}

// Vaccination centers
GET /api/government/centers?pincode={pincode}&vaccine={type}

// Health statistics
GET /api/government/stats?state={state}&timeframe={days}
```

## Analytics & Monitoring

### Key Metrics
1. **Usage Metrics**
   - Total sessions
   - Unique users
   - Messages per session
   - Platform distribution

2. **Performance Metrics**
   - Intent recognition accuracy
   - Response time
   - User satisfaction scores
   - Resolution rate

3. **Health Impact Metrics**
   - Vaccination reminders sent
   - Health alerts delivered
   - Emergency escalations
   - Knowledge queries answered

### Dashboard Features
- Real-time monitoring
- Historical trends
- Language-wise analytics
- Geographic distribution
- Export capabilities (CSV, JSON, Excel)

### Accuracy Tracking
```typescript
interface AccuracyReport {
  overallAccuracy: number;
  intentAccuracy: Array<{
    intent: string;
    accuracy: number;
    samples: number;
  }>;
  languageAccuracy: Array<{
    language: Language;
    accuracy: number;
    samples: number;
  }>;
  improvementSuggestions: string[];
}
```

## Security & Privacy

### Data Protection
- End-to-end encryption for sensitive health data
- GDPR-compliant data handling
- User consent management
- Data retention policies
- Secure API authentication

### Privacy Features
- Opt-in/opt-out for notifications
- Data anonymization for analytics
- Secure storage of health records
- User data deletion on request

### Compliance
- Health Insurance Portability and Accountability Act (HIPAA)
- Personal Data Protection Bill (India)
- Medical Device Rules (India)
- WHO Digital Health Guidelines

## Deployment

### Production Deployment

1. **Build Application**
```bash
npm run build
```

2. **Deploy to Firebase**
```bash
firebase deploy
```

3. **Configure Load Balancer**
```bash
# Set up nginx or cloud load balancer
# Configure SSL certificates
# Set up CDN for static assets
```

4. **Monitor Performance**
```bash
# Set up monitoring dashboards
# Configure alerting
# Monitor API usage and costs
```

### Scaling Considerations
- Horizontal scaling for high traffic
- Database sharding for large user base
- CDN for global content delivery
- Caching layers for improved performance

## Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Performance Tests
```bash
npm run test:performance
```

## Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Write comprehensive tests
3. Document all public APIs
4. Use semantic commit messages
5. Ensure accessibility compliance

### Code Review Process
1. Create feature branch
2. Implement changes with tests
3. Submit pull request
4. Code review and approval
5. Merge to main branch

## Support & Maintenance

### Health Worker Training
- Chatbot capabilities overview
- Escalation procedures
- Common user issues
- System monitoring

### Content Updates
- Regular knowledge base updates
- Government guideline changes
- Seasonal health advisories
- Language improvements

### Technical Support
- 24/7 system monitoring
- Performance optimization
- Bug fixes and patches
- Feature enhancements

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For technical support or questions:
- Email: support@healthchatbot.gov.in
- Phone: +91-11-12345678
- Documentation: https://docs.healthchatbot.gov.in

---

**Note**: This chatbot is designed to provide general health information and should not replace professional medical advice. Users should always consult healthcare professionals for serious health concerns.
