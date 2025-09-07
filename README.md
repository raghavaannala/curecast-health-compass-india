# Dr.Curecast - Multilingual Healthcare Chatbot & Voice Assistant

Dr.Curecast is a comprehensive multilingual healthcare chatbot and voice assistant designed to support healthcare management in India and internationally. It provides vaccination reminders, government health database integration, and multilingual support for major Indian and international languages.

## 🌟 Features

### 1. **Multilingual Support**
- **Indian Languages**: Hindi, Telugu, Tamil, Bengali, Marathi, Kannada, Malayalam, Gujarati, Punjabi, Urdu, Odia, Assamese
- **International Languages**: English, Spanish, French, German, Arabic, Chinese, Japanese, Russian, Portuguese
- **Auto-detection**: Automatically detects user's preferred language from text or voice input
- **Seamless switching**: Switch between chat and voice modes in any supported language
- **Fallback support**: Falls back to English if chosen language is unavailable

### 2. **Vaccination Management**
- **National schedules**: Complete Indian national vaccination schedules (BCG, DPT, Polio, Measles, etc.)
- **Custom vaccinations**: Add travel vaccines, boosters, and emergency vaccinations
- **Smart reminders**: Automated reminders via chat and voice alerts
- **History tracking**: Store and retrieve complete vaccination history
- **Certificate generation**: Generate vaccination certificates with QR codes

### 3. **Government Health Database Integration**
- **CoWIN Integration**: Sync with CoWIN vaccination records
- **Ayushman Bharat**: Connect with Ayushman Bharat health records
- **State Portals**: Integration with state health portals
- **Secure authentication**: HIPAA/GDPR compliant data handling
- **Real-time sync**: Cross-check vaccination history with government records
- **Outbreak alerts**: Receive government health advisories and outbreak notifications

### 4. **Voice Interface**
- **Speech-to-text**: Convert voice input to text in multiple languages
- **Text-to-speech**: Respond with voice in user's preferred language
- **Healthcare context**: Optimized voice parameters for medical communication
- **Accessibility**: Support for users with different abilities

### 5. **Privacy & Security**
- **Data encryption**: End-to-end encryption for sensitive health data
- **Consent management**: Explicit user consent for data sharing
- **Rate limiting**: Protection against abuse and spam
- **Input validation**: Comprehensive input sanitization and validation
- **Compliance**: HIPAA, GDPR, and Indian Health Data Guidelines compliance

## 🏗️ Architecture

### Core Services

1. **LanguageService** (`src/services/languageService.ts`)
   - Language detection using multiple methods
   - Translation services with Google Translate API integration
   - Script-based detection for Indian languages
   - Predefined translations for common healthcare phrases

2. **VoiceService** (`src/services/voiceService.ts`)
   - Cross-browser speech recognition
   - Text-to-speech with contextual voice parameters
   - Voice message processing and translation
   - Healthcare-optimized voice responses

3. **VaccinationService** (`src/services/vaccinationService.ts`)
   - National vaccination schedules for India
   - Custom vaccination management
   - Automated reminder system
   - Vaccination certificate generation

4. **GovernmentHealthService** (`src/services/governmentHealthService.ts`)
   - CoWIN API integration
   - Ayushman Bharat connectivity
   - Health alerts and outbreak notifications
   - Certificate verification

5. **UserProfileService** (`src/services/userProfileService.ts`)
   - Privacy-compliant user profiles
   - Health data management
   - Emergency contacts
   - Preference management

6. **DrCurecastService** (`src/services/drCurecastService.ts`)
   - Main orchestration service
   - Chat session management
   - Intent analysis and response generation
   - Action handling (reminders, alerts, sync)

### Security & Error Handling

- **ErrorHandler** (`src/utils/errorHandler.ts`)
  - Comprehensive error handling with user-friendly messages
  - Input validation and sanitization
  - Rate limiting and abuse prevention
  - Data encryption utilities
  - HIPAA/GDPR compliance validation

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project (for backend services)
- API keys for translation and government services

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd curecast-health-compass-india
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Firebase Configuration
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   
   # Translation Services
   REACT_APP_GOOGLE_TRANSLATE_API_KEY=your_google_translate_key
   
   # Government Health APIs
   REACT_APP_COWIN_API_KEY=your_cowin_api_key
   REACT_APP_AYUSHMAN_API_KEY=your_ayushman_api_key
   REACT_APP_STATE_PORTAL_API_KEY=your_state_portal_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

### Usage

1. **Initialize Dr.Curecast**
   ```typescript
   import { DrCurecastChat } from './components/DrCurecastChat';
   import { userProfileService } from './services/userProfileService';
   
   // Create user profile
   const user = await userProfileService.createUserProfile({
     name: 'John Doe',
     preferredLanguages: ['english', 'hindi'],
     age: 30
   });
   
   // Use the chat component
   <DrCurecastChat 
     userId={user.id}
     initialLanguage="english"
     voiceEnabled={true}
     context="general"
   />
   ```

2. **Voice Interaction**
   ```typescript
   import { voiceService } from './services/voiceService';
   
   // Start listening
   const voiceMessage = await voiceService.startListening('hindi');
   
   // Speak response
   await voiceService.speakText('आपका टीकाकरण कल है', 'hindi');
   ```

3. **Vaccination Management**
   ```typescript
   import { vaccinationService } from './services/vaccinationService';
   
   // Add custom vaccination
   const record = await vaccinationService.addCustomVaccination(
     userId,
     'COVID-19 Booster',
     new Date('2024-01-15'),
     'booster',
     'hindi'
   );
   ```

## 🔧 Configuration

### Language Configuration
Supported languages are defined in `src/services/languageService.ts`. To add a new language:

1. Add the language to the `Language` type in `src/types/index.ts`
2. Add language mapping in `languageService.ts`
3. Add display name in `getLanguageDisplayName()` method
4. Add voice language code in `voiceService.ts`

### Government API Integration
Configure government health APIs in `src/services/governmentHealthService.ts`:

- Update API endpoints for your region
- Configure authentication methods
- Add new government services as needed

### Vaccination Schedules
National vaccination schedules are defined in `src/services/vaccinationService.ts`. Update the `nationalSchedules` array to modify or add vaccination schedules.

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Test specific services:
```bash
# Test language service
npm test -- --testPathPattern=languageService

# Test voice service  
npm test -- --testPathPattern=voiceService

# Test vaccination service
npm test -- --testPathPattern=vaccinationService
```

## 📱 Deployment

### Firebase Deployment
```bash
# Build the project
npm run build

# Deploy to Firebase
firebase deploy
```

### Environment-specific Deployments
```bash
# Deploy to staging
firebase use staging
firebase deploy

# Deploy to production
firebase use production
firebase deploy
```

## 🔒 Security Considerations

### Data Privacy
- All health data is encrypted before storage
- User consent is required for government data sharing
- Data retention policies are enforced
- Users can delete their data at any time

### API Security
- Rate limiting prevents abuse
- Input validation prevents injection attacks
- API keys are securely managed
- Government APIs use secure authentication

### Compliance
- HIPAA compliance for US health data
- GDPR compliance for EU users
- Indian Health Data Guidelines compliance
- Regular security audits and updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Add comprehensive error handling
- Include unit tests for new features
- Update documentation for API changes
- Ensure HIPAA/GDPR compliance for health data

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Email: support@drCurecast.com
- Documentation: [docs.drCurecast.com](https://docs.drCurecast.com)

## 🙏 Acknowledgments

- Ministry of Health and Family Welfare, India
- CoWIN platform team
- Ayushman Bharat Digital Mission
- Open source translation services
- Healthcare workers and volunteers

---

**Dr.Curecast** - Making healthcare accessible in every language 🌍💙
