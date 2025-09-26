import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, getLanguageByCode } from '@/config/languages';
import { Translations, getTranslation } from '@/translations';

interface GlobalLanguageContextType {
  currentLanguage: Language;
  translations: Translations;
  changeLanguage: (languageCode: string) => void;
  availableLanguages: Language[];
  t: (key: string) => string;
}

const GlobalLanguageContext = createContext<GlobalLanguageContextType | undefined>(undefined);

interface GlobalLanguageProviderProps {
  children: ReactNode;
}

export const GlobalLanguageProvider: React.FC<GlobalLanguageProviderProps> = ({ children }) => {
  // Initialize language from localStorage or default
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return getLanguageByCode(savedLanguage || DEFAULT_LANGUAGE);
  });

  const [translations, setTranslations] = useState<Translations>(() => {
    return getTranslation(currentLanguage.code);
  });

  // Change language function
  const changeLanguage = (languageCode: string) => {
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
    if (language) {
      setCurrentLanguage(language);
      setTranslations(getTranslation(languageCode));
      localStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
      document.documentElement.lang = languageCode;
      document.documentElement.dir = language.direction;
      
      // Dispatch custom event for other components to listen to language changes
      window.dispatchEvent(new CustomEvent('languageChanged', { 
        detail: { language, languageCode } 
      }));
    }
  };

  // Translation helper function with nested key support
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key; // Return the key itself if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  // Update translations when language changes
  useEffect(() => {
    setTranslations(getTranslation(currentLanguage.code));
    document.documentElement.dir = currentLanguage.direction;
    document.documentElement.lang = currentLanguage.code;
  }, [currentLanguage]);

  // Listen for storage changes (for cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LANGUAGE_STORAGE_KEY && e.newValue) {
        const language = getLanguageByCode(e.newValue);
        setCurrentLanguage(language);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const contextValue: GlobalLanguageContextType = {
    currentLanguage,
    translations,
    changeLanguage,
    availableLanguages: SUPPORTED_LANGUAGES,
    t,
  };

  return (
    <GlobalLanguageContext.Provider value={contextValue}>
      {children}
    </GlobalLanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useGlobalLanguage = (): GlobalLanguageContextType => {
  const context = useContext(GlobalLanguageContext);
  if (context === undefined) {
    throw new Error('useGlobalLanguage must be used within a GlobalLanguageProvider');
  }
  return context;
};

// HOC for components that need language context
export const withGlobalLanguage = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => (
    <GlobalLanguageProvider>
      <Component {...props} />
    </GlobalLanguageProvider>
  );
};
