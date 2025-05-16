
import { User, MedicalRecord, Reminder, Myth, AdminUser } from "../types";

// Sample users data
export const users: User[] = [
  {
    id: "u1",
    name: "Rajesh Kumar",
    phoneNumber: "9876543210",
    age: 45,
    gender: "male",
    language: "hindi",
    location: "Rajasthan",
    createdAt: new Date().toISOString(),
  },
  {
    id: "u2",
    name: "Priya Sharma",
    phoneNumber: "8765432109",
    age: 32,
    gender: "female",
    language: "hindi",
    location: "Uttar Pradesh",
    createdAt: new Date().toISOString(),
  },
  {
    id: "u3",
    name: "Venkatesh Reddy",
    phoneNumber: "7654321098",
    age: 52,
    gender: "male",
    language: "telugu",
    location: "Andhra Pradesh",
    createdAt: new Date().toISOString(),
  }
];

// Sample medical records
export const medicalRecords: MedicalRecord[] = [
  {
    id: "mr1",
    userId: "u1",
    symptoms: ["fever", "cough", "fatigue"],
    diagnosis: "Common Cold",
    recommendation: "self-care",
    notes: "Rest, lots of fluids, and over-the-counter cold medicine recommended.",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mr2",
    userId: "u1",
    symptoms: ["headache", "dizziness"],
    diagnosis: "Possible Dehydration",
    recommendation: "self-care",
    notes: "Drink more water and get adequate rest.",
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mr3",
    userId: "u2",
    symptoms: ["stomach pain", "vomiting", "diarrhea"],
    diagnosis: "Gastroenteritis",
    recommendation: "clinic",
    notes: "Visit local clinic for assessment and medication.",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

// Sample reminders
export const reminders: Reminder[] = [
  {
    id: "r1",
    userId: "u1",
    title: "Take Blood Pressure Medicine",
    description: "1 tablet after breakfast",
    type: "medication",
    date: new Date().toISOString().split('T')[0],
    time: "08:00",
    recurrence: "daily",
    completed: false,
  },
  {
    id: "r2",
    userId: "u2",
    title: "Follow-up Appointment",
    description: "Visit Dr. Mehta for checkup",
    type: "appointment",
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: "10:30",
    recurrence: "none",
    completed: false,
  }
];

// Sample myths
export const myths: Myth[] = [
  {
    id: "m1",
    title: "Turmeric Cures Cancer",
    myth: "Applying turmeric on cancer affected areas can cure cancer completely.",
    reality: "While turmeric has anti-inflammatory properties, it is not a substitute for medical cancer treatments. Scientific evidence does not support turmeric as a standalone cure for cancer.",
    category: "treatments",
    source: "World Health Organization",
    translations: {
      hindi: {
        title: "हल्दी कैंसर का इलाज करती है",
        myth: "कैंसर प्रभावित क्षेत्रों पर हल्दी लगाने से कैंसर पूरी तरह से ठीक हो सकता है।",
        reality: "हालांकि हल्दी में सूजन-रोधी गुण हैं, यह चिकित्सा कैंसर उपचारों का विकल्प नहीं है। वैज्ञानिक प्रमाण हल्दी को कैंसर के लिए अकेले इलाज के रूप में समर्थन नहीं करते हैं।"
      },
      telugu: {
        title: "పసుపు క్యాన్సర్‌ను నయం చేస్తుంది",
        myth: "క్యాన్సర్ ప్రభావిత ప్రాంతాలపై పసుపును వర్తించడం వల్ల క్యాన్సర్ పూర్తిగా నయం చేయవచ్చు.",
        reality: "పసుపులో వాపు నిరోధక లక్షణాలు ఉన్నప్పటికీ, ఇది వైద్య క్యాన్సర్ చికిత్సలకు ప్రత్యామ్నాయం కాదు. శాస్త్రీయ సాక్ష్యాలు క్యాన్సర్ కోసం పసుపును స్టాండ్‌అలోన్ చికిత్సగా సమర్థించవు."
      }
    }
  },
  {
    id: "m2",
    title: "Cold Weather Causes Colds",
    myth: "Being in cold weather or getting wet can directly cause you to catch a cold.",
    reality: "Colds are caused by viruses, not by temperature or wetness. However, cold weather might lower your immune system's effectiveness and increase time spent indoors, which can increase exposure to viruses.",
    category: "illness",
    source: "Centers for Disease Control and Prevention"
  },
  {
    id: "m3",
    title: "Vaccines Cause Autism",
    myth: "Childhood vaccines can lead to autism or developmental disorders.",
    reality: "Multiple large-scale scientific studies have found no link between vaccines and autism. Vaccines undergo rigorous safety testing before approval and are constantly monitored for safety.",
    category: "vaccines",
    source: "World Health Organization"
  }
];

// Sample admin users
export const adminUsers: AdminUser[] = [
  {
    id: "a1",
    name: "Dr. Anjali Desai",
    phoneNumber: "9999888877",
    language: "english",
    role: "admin",
    adminId: "admin001",
    region: "North India",
    createdAt: new Date().toISOString(),
  },
  {
    id: "a2",
    name: "Sunita Gupta",
    phoneNumber: "8888777766",
    language: "hindi",
    role: "admin",
    adminId: "admin002",
    region: "South India",
    createdAt: new Date().toISOString(),
  }
];

// Mock symptom-to-disease mapping
export const symptomsMapping = {
  "fever": {
    possibleConditions: ["Common Cold", "Flu", "Malaria", "COVID-19"],
    severity: "medium" as const,
    recommendation: "clinic" as const
  },
  "cough": {
    possibleConditions: ["Common Cold", "Flu", "COVID-19", "Tuberculosis"],
    severity: "medium" as const,
    recommendation: "clinic" as const
  },
  "headache": {
    possibleConditions: ["Stress", "Dehydration", "Migraine", "Sinusitis"],
    severity: "low" as const,
    recommendation: "self-care" as const
  },
  "stomach pain": {
    possibleConditions: ["Indigestion", "Food Poisoning", "Gastritis", "Appendicitis"],
    severity: "medium" as const,
    recommendation: "clinic" as const
  },
  "chest pain": {
    possibleConditions: ["Heart Attack", "Angina", "Acid Reflux", "Muscle Strain"],
    severity: "high" as const,
    recommendation: "emergency" as const
  },
  "difficulty breathing": {
    possibleConditions: ["Asthma", "COVID-19", "Pneumonia", "Heart Failure"],
    severity: "high" as const,
    recommendation: "emergency" as const
  },
  "rash": {
    possibleConditions: ["Allergic Reaction", "Eczema", "Chickenpox", "Heat Rash"],
    severity: "medium" as const,
    recommendation: "clinic" as const
  },
  "fatigue": {
    possibleConditions: ["Anemia", "Depression", "Sleep Disorders", "Thyroid Issues"],
    severity: "low" as const,
    recommendation: "clinic" as const
  },
  "joint pain": {
    possibleConditions: ["Arthritis", "Gout", "Injury", "Lupus"],
    severity: "medium" as const,
    recommendation: "clinic" as const
  },
  "dizziness": {
    possibleConditions: ["Low Blood Pressure", "Dehydration", "Inner Ear Problems", "Anemia"],
    severity: "medium" as const,
    recommendation: "clinic" as const
  },
  "vomiting": {
    possibleConditions: ["Food Poisoning", "Stomach Virus", "Pregnancy", "Migraine"],
    severity: "medium" as const,
    recommendation: "clinic" as const
  },
  "diarrhea": {
    possibleConditions: ["Food Poisoning", "Viral Infection", "IBS", "Medication Side Effect"],
    severity: "medium" as const,
    recommendation: "self-care" as const
  }
};

// Translations for UI components
export const translations = {
  appName: {
    english: "CureCast: Health Companion",
    hindi: "क्योरकास्ट: स्वास्थ्य साथी",
    telugu: "క్యూర్కాస్ట్: ఆరోగ్య సహచరుడు"
  },
  chatbot: {
    english: "Health Assistant",
    hindi: "स्वास्थ्य सहायक",
    telugu: "ఆరోగ్య సహాయకుడు"
  },
  askSymptoms: {
    english: "What symptoms are you experiencing?",
    hindi: "आपको कौन से लक्षण हो रहे हैं?",
    telugu: "మీరు ఎలాంటి లక్షణాలు అనుభవిస్తున్నారు?"
  },
  profile: {
    english: "My Profile",
    hindi: "मेरी प्रोफाइल",
    telugu: "నా ప్రొఫైల్"
  },
  reminders: {
    english: "Reminders",
    hindi: "रिमाइंडर्स",
    telugu: "రిమైండర్లు"
  },
  myths: {
    english: "Health Facts & Myths",
    hindi: "स्वास्थ्य तथ्य और भ्रम",
    telugu: "ఆరోగ్య నిజాలు & అపోహలు"
  },
  admin: {
    english: "Admin Dashboard",
    hindi: "व्यवस्थापक डैशबोर्ड",
    telugu: "నిర్వాహక డాష్బోర్డ్"
  },
  send: {
    english: "Send",
    hindi: "भेजें",
    telugu: "పంపండి"
  },
  typeMessage: {
    english: "Type your message...",
    hindi: "अपना संदेश टाइप करें...",
    telugu: "మీ సందేశాన్ని టైప్ చేయండి..."
  }
};
