const translations = {
  // Common
  appName: "CureCast: Health Companion",
  loading: "Loading...",
  error: "An error occurred",
  submit: "Submit",
  cancel: "Cancel",
  
  // Navigation
  nav: {
    home: "Home",
    chat: "Chat",
    profile: "Profile",
    health: "Health",
    camera: "Camera",
    voice: "Voice",
    education: "Education",
    about: "About"
  },
  
  // Home page
  home: {
    hero: {
      title: "Your Health Companion",
      subtitle: "CureCast offers healthcare guidance, resources, and support designed for everyone"
    },
    features: {
      title: "Main Features",
      aiAssistant: {
        title: "Dr. CureCast AI",
        description: "Get instant health guidance and expert advice for your concerns",
        cta: "Chat Now"
      },
      voice: {
        title: "Voice Interface",
        description: "Speak naturally with our AI in your preferred language",
        cta: "Start Speaking"
      },
      camera: {
        title: "Camera Diagnostics",
        description: "Upload or take photos for instant medical analysis",
        cta: "Analyze Image"
      }
    },
    useCases: {
      title: "Popular Health Use Cases",
      subtitle: "Get AI-powered guidance for common health concerns",
      diabetes: {
        title: "Diabetes Checker",
        description: "Check symptoms & get diet recommendations",
        cta: "Check Now"
      },
      bp: {
        title: "Blood Pressure Monitor",
        description: "Track BP readings & lifestyle advice",
        cta: "Check Now"
      },
      skin: {
        title: "Skin Disease Analyzer",
        description: "Upload images for AI-powered analysis",
        cta: "Check Now"
      }
    }
  },
  
  // Health pages
  health: {
    diabetes: {
      title: "Diabetes Symptom Checker",
      subtitle: "Enter your symptoms to get guidance and diet recommendations",
      inputLabel: "Describe your symptoms",
      inputPlaceholder: "E.g., frequent urination, increased thirst, unexplained weight loss, fatigue, blurred vision...",
      submitButton: "Check Symptoms",
      loadingButton: "Analyzing...",
      assessment: "Assessment",
      dietRecommendations: "Diet Recommendations",
      voiceButton: "Speak Symptoms"
    },
    bloodPressure: {
      title: "Blood Pressure Checker",
      subtitle: "Enter your blood pressure readings to assess risk level and get lifestyle tips",
      systolicLabel: "Systolic (mm Hg)",
      systolicHelper: "The top number",
      diastolicLabel: "Diastolic (mm Hg)",
      diastolicHelper: "The bottom number",
      submitButton: "Check Blood Pressure",
      loadingButton: "Analyzing...",
      riskLevel: "Risk Level",
      reading: "Your Reading",
      lifestyleTips: "Lifestyle Tips",
      voiceButton: "Speak BP Reading"
    },
    skinDisease: {
      title: "Skin Disease Checker",
      subtitle: "Upload an image and describe your skin condition for AI analysis",
      uploadLabel: "Upload Image",
      uploadHelper: "Click to upload or drag and drop",
      uploadTypes: "JPG, PNG (max 5MB)",
      descriptionLabel: "Describe your skin condition",
      descriptionPlaceholder: "E.g., I've had this red, itchy rash on my arm for 3 days. It's slightly raised and feels warm to touch...",
      submitButton: "Analyze Skin Condition",
      loadingButton: "Analyzing...",
      analysisResults: "Analysis Results",
      voiceButton: "Speak Description"
    }
  },
  
  // About pages
  about: {
    architecture: {
      title: "CureCast Architecture",
      subtitle: "Technical overview of how CureCast is built and operates",
      frontend: {
        title: "Frontend",
        subtitle: "User interface and client-side technologies"
      },
      backend: {
        title: "Backend",
        subtitle: "Server-side technologies and services"
      },
      ai: {
        title: "AI Integration",
        subtitle: "Artificial Intelligence capabilities"
      },
      dataSources: {
        title: "AI Data Sources",
        subtitle: "Sources of medical information"
      },
      importantNote: {
        title: "Important Note",
        content: "CureCast uses the Gemini API for inference only, not training. This means our AI system makes predictions based on pre-trained models and does not learn from user interactions. Your data privacy is important to us."
      }
    }
  },
  
  // Disclaimer
  disclaimer: "⚠️ CureCast provides AI-based guidance only. Please consult a doctor for medical decisions."
};

export default translations;