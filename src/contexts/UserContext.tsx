import React, { createContext, useContext, useState } from 'react';
import type { UserProfile } from '@/types/health';

export interface UserContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateNotificationPreferences: (updates: Partial<UserProfile['notificationPreferences']>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const updateNotificationPreferences = (updates: Partial<UserProfile['notificationPreferences']>) => {
    setUser(prev => prev ? {
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        ...updates,
      },
    } : null);
  };

  return (
    <UserContext.Provider value={{
      user,
      setUser,
      updateProfile,
      updateNotificationPreferences,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
