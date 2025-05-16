
import { useUser } from '@/contexts/UserContext';
import { Navigate } from 'react-router-dom';
import RemindersView from '../components/reminders/RemindersView';

const RemindersPage = () => {
  const { isAuthenticated } = useUser();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <RemindersView />;
};

export default RemindersPage;
