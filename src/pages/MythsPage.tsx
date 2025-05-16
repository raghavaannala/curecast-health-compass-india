
import { useUser } from '@/contexts/UserContext';
import { Navigate } from 'react-router-dom';
import MythsView from '../components/myths/MythsView';

const MythsPage = () => {
  const { isAuthenticated } = useUser();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <MythsView />;
};

export default MythsPage;
