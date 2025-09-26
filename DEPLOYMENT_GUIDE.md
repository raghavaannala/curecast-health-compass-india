# Multilingual AI Chatbot - Deployment Guide

## 🚀 Quick Start Deployment

### Prerequisites
- Node.js 18+
- Firebase CLI
- WhatsApp Business API access
- SMS gateway account

### 1. Environment Setup
```bash
# Copy environment template
cp .env.chatbot.example .env

# Edit .env with your API keys
nano .env
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Deploy Everything
```bash
# Make scripts executable
chmod +x scripts/deploy-chatbot.sh scripts/test-chatbot.sh

# Run full deployment
./scripts/deploy-chatbot.sh
```

### 4. Test Deployment
```bash
# Run comprehensive tests
./scripts/test-chatbot.sh
```

## 📋 Detailed Deployment Steps

### Step 1: Configure APIs

#### WhatsApp Business API
1. Get WhatsApp Business API access from Meta
2. Set up webhook URL: `https://your-domain.com/api/whatsapp/webhook`
3. Configure verify token in `.env`

#### SMS Gateway Setup
Choose one of these Indian providers:

**TextLocal:**
```env
REACT_APP_SMS_API_URL=https://api.textlocal.in/send/
REACT_APP_SMS_API_KEY=your_textlocal_key
```

**MSG91:**
```env
REACT_APP_SMS_API_URL=https://api.msg91.com/api/v5/flow/
REACT_APP_SMS_API_KEY=your_msg91_key
```

**Fast2SMS:**
```env
REACT_APP_SMS_API_URL=https://www.fast2sms.com/dev/bulkV2
REACT_APP_SMS_API_KEY=your_fast2sms_key
```

### Step 2: Government API Integration

#### Available Government APIs
1. **CoWIN API** - COVID vaccination data
2. **NVBDCP** - Vector-borne disease surveillance
3. **State Health Departments** - Local health data

#### Configuration
```env
REACT_APP_COWIN_API_URL=https://cdn-api.co-vin.in/api
REACT_APP_MOHFW_API_URL=https://www.mohfw.gov.in/api
```

### Step 3: Firebase Configuration

#### Initialize Firebase
```bash
firebase login
firebase init
```

#### Deploy Functions
```bash
firebase deploy --only functions
```

#### Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Step 4: Content Management

#### Health Knowledge Base
1. Review medical content in `src/services/healthKnowledgeBaseService.ts`
2. Validate with medical experts
3. Add region-specific content

#### Language Content
1. Add translations in `src/i18n/locales/`
2. Test language detection
3. Validate cultural adaptations

## 🔧 Configuration Options

### Chatbot Behavior
```typescript
// In multilingualChatbotService.ts
private readonly INTENT_CONFIDENCE_THRESHOLD = 0.7;
private readonly ENTITY_CONFIDENCE_THRESHOLD = 0.6;
private readonly TRANSLATION_CONFIDENCE_THRESHOLD = 0.8;
```

### Triage Rules
```typescript
// In healthKnowledgeBaseService.ts
// Add custom symptom triage rules
const triageRules: SymptomTriageRule[] = [
  {
    symptoms: ['chest pain', 'difficulty breathing'],
    severity: 'critical',
    recommendation: 'emergency'
  }
];
```

### Analytics Settings
```typescript
// In chatbotAnalyticsService.ts
private readonly cacheTimeout = 30 * 60 * 1000; // 30 minutes
```

## 📊 Monitoring & Analytics

### Real-time Monitoring
- Access dashboard at: `/chatbot-analytics`
- Monitor key metrics:
  - Session count
  - User satisfaction
  - Intent accuracy
  - Escalation rate

### Performance Metrics
- Response time < 2 seconds
- Intent accuracy > 80%
- User satisfaction > 4.0/5
- Escalation rate < 15%

## 🔒 Security Configuration

### Data Protection
1. Enable HTTPS everywhere
2. Configure CORS properly
3. Implement rate limiting
4. Use secure headers

### Privacy Compliance
1. Implement user consent
2. Data retention policies
3. Right to deletion
4. Data anonymization

## 🌍 Multi-platform Setup

### WhatsApp Integration
```javascript
// Webhook verification
app.get('/api/whatsapp/webhook', (req, res) => {
  const challenge = whatsappService.verifyWebhook(
    req.query.mode,
    req.query.verify_token,
    req.query.challenge
  );
  res.send(challenge);
});
```

### SMS Integration
```javascript
// SMS webhook handler
app.post('/api/sms/webhook', (req, res) => {
  smsService.processIncomingSMS(
    req.body.From,
    req.body.Body,
    req.body.MessageSid
  );
  res.sendStatus(200);
});
```

## 🏥 Health Worker Integration

### Escalation Setup
1. Create health worker accounts
2. Configure availability schedules
3. Set up notification systems
4. Train on escalation procedures

### Workflow
1. User query → AI analysis
2. Red flags detected → Auto-escalate
3. Complex query → Human review
4. Emergency → Immediate escalation

## 📱 Mobile Optimization

### Progressive Web App
1. Enable service worker
2. Add to home screen
3. Offline functionality
4. Push notifications

### Responsive Design
- Mobile-first approach
- Touch-friendly interface
- Optimized for low bandwidth
- Works on feature phones (SMS)

## 🌐 Localization

### Language Support
- **Primary:** English, Hindi, Telugu, Tamil
- **Secondary:** Bengali, Marathi, Kannada, Malayalam
- **Additional:** Gujarati, Punjabi, Urdu

### Cultural Adaptation
1. Local medical terminology
2. Cultural health practices
3. Regional disease patterns
4. Local emergency numbers

## 📈 Scaling Considerations

### Infrastructure Scaling
- Auto-scaling cloud functions
- Database sharding
- CDN for global delivery
- Load balancing

### Content Scaling
- Automated content updates
- Crowd-sourced translations
- Expert review workflows
- Version control

## 🚨 Emergency Procedures

### Critical Symptoms Detection
```typescript
const criticalSymptoms = [
  'chest pain',
  'difficulty breathing',
  'severe bleeding',
  'unconscious',
  'severe allergic reaction'
];
```

### Emergency Response
1. Immediate escalation
2. Emergency contact display
3. Location-based services
4. Follow-up protocols

## 📞 Support Contacts

### Technical Support
- **Email:** tech-support@healthchatbot.gov.in
- **Phone:** +91-11-12345678
- **Documentation:** https://docs.healthchatbot.gov.in

### Medical Support
- **Emergency:** 108
- **Health Helpline:** 104
- **Poison Control:** 1066

### Government Contacts
- **ICMR:** +91-11-26588980
- **MOHFW:** +91-11-23061863
- **State Health Dept:** Contact local authorities

## 🔄 Maintenance Schedule

### Daily
- Monitor system health
- Check error logs
- Review escalations
- Update outbreak alerts

### Weekly
- Analyze user feedback
- Update knowledge base
- Review performance metrics
- Security audit

### Monthly
- Content expert review
- Language accuracy check
- Performance optimization
- Feature updates

## 📚 Training Materials

### Health Workers
1. System overview presentation
2. Escalation procedures guide
3. Common issues handbook
4. Emergency protocols

### Administrators
1. Analytics dashboard guide
2. Content management
3. User management
4. System configuration

## 🎯 Success Metrics

### Primary KPIs
- **Reach:** 100,000+ users in first year
- **Accuracy:** >80% correct responses
- **Satisfaction:** >4.0/5 user rating
- **Response Time:** <2 seconds average

### Health Impact
- **Vaccination Reminders:** 90% delivery rate
- **Health Education:** 20% knowledge improvement
- **Early Detection:** 15% increase in timely care
- **Emergency Response:** <5 minute escalation

## 🔮 Future Enhancements

### Planned Features
1. Voice input/output
2. Image-based diagnosis
3. Telemedicine integration
4. AI-powered health predictions

### Technology Roadmap
1. Advanced NLP models
2. Computer vision integration
3. IoT device connectivity
4. Blockchain for health records

---

**Ready to deploy?** Run `./scripts/deploy-chatbot.sh` to get started! 🚀
