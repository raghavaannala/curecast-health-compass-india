
import { createContext, useContext, useState, ReactNode } from 'react';
import { Language, TranslatedStrings } from '../types';
import { translations } from '../services/mockData';

type LanguageContextType = {
  currentLanguage: Language;
  changeLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('english');

  const changeLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    // Save user preference to local storage for persistence
    localStorage.setItem('curecast-language', lang);
  };

  // Translation function
  const t = (key: keyof typeof translations): string => {
    if (translations[key] && translations[key][currentLanguage]) {
      return translations[key][currentLanguage];
    }
    // Fallback to English if translation not found
    return translations[key]?.english || key;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
