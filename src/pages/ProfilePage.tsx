
import { useUser } from '@/contexts/UserContext';
import { Navigate } from 'react-router-dom';
import UserProfile from '../components/profile/UserProfile';

const ProfilePage = () => {
  const { isAuthenticated } = useUser();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <UserProfile />;
};

export default ProfilePage;
