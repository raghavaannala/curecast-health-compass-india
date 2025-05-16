
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, MedicalRecord } from '../types';
import { users, medicalRecords } from '../services/mockData';

type UserContextType = {
  currentUser: User | null;
  login: (phoneNumber: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Partial<User>) => Promise<boolean>;
  isAuthenticated: boolean;
  userMedicalHistory: MedicalRecord[];
  addMedicalRecord: (record: Omit<MedicalRecord, 'id' | 'userId' | 'date'>) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userMedicalHistory, setUserMedicalHistory] = useState<MedicalRecord[]>([]);
  
  // Check if user is logged in on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('curecast-user');
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
        
        // Load medical history for this user
        const userRecords = medicalRecords.filter(record => record.userId === parsedUser.id);
        setUserMedicalHistory(userRecords);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('curecast-user');
      }
    }
  }, []);

  const login = async (phoneNumber: string): Promise<boolean> => {
    // Mock API call with delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const foundUser = users.find(user => user.phoneNumber === phoneNumber);
    
    if (foundUser) {
      setCurrentUser(foundUser);
      localStorage.setItem('curecast-user', JSON.stringify(foundUser));
      
      // Load medical history for this user
      const userRecords = medicalRecords.filter(record => record.userId === foundUser.id);
      setUserMedicalHistory(userRecords);
      
      return true;
    }
    
    return false;
  };

  const register = async (userData: Partial<User>): Promise<boolean> => {
    // Mock API call with delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if phone number already exists
    if (userData.phoneNumber && users.some(u => u.phoneNumber === userData.phoneNumber)) {
      return false;
    }
    
    // Create new user
    const newUser: User = {
      id: `u${users.length + 1}`,
      name: userData.name || 'Anonymous',
      phoneNumber: userData.phoneNumber,
      age: userData.age,
      gender: userData.gender,
      language: userData.language || 'english',
      location: userData.location,
      createdAt: new Date().toISOString(),
    };
    
    // In a real app, this would be an API call to create the user
    // For mock, we'd update our local array (though this doesn't persist on reload)
    users.push(newUser);
    
    // Log user in
    setCurrentUser(newUser);
    localStorage.setItem('curecast-user', JSON.stringify(newUser));
    
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    setUserMedicalHistory([]);
    localStorage.removeItem('curecast-user');
  };

  const addMedicalRecord = (record: Omit<MedicalRecord, 'id' | 'userId' | 'date'>) => {
    if (!currentUser) return;
    
    const newRecord: MedicalRecord = {
      id: `mr${medicalRecords.length + 1}`,
      userId: currentUser.id,
      date: new Date().toISOString(),
      ...record
    };
    
    // In a real app, this would be an API call
    medicalRecords.push(newRecord);
    setUserMedicalHistory(prev => [...prev, newRecord]);
  };

  return (
    <UserContext.Provider 
      value={{ 
        currentUser, 
        login, 
        logout, 
        register, 
        isAuthenticated: !!currentUser,
        userMedicalHistory,
        addMedicalRecord
      }}
    >
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
