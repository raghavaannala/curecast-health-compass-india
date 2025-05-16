
import { useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { Navigate } from 'react-router-dom';
import AdminDashboard from '../components/admin/AdminDashboard';

const AdminPage = () => {
  const { currentUser, isAuthenticated } = useUser();
  
  // Check if user is an admin (for demo purposes)
  const isAdmin = currentUser?.id?.startsWith('a');
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/" />;
  }
  
  return <AdminDashboard />;
};

export default AdminPage;
