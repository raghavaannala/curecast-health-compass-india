
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import RegisterForm from '../components/auth/RegisterForm';

const RegisterPage = () => {
  const { isAuthenticated } = useUser();
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  return (
    <div className="min-h-screen flex flex-col p-4">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gradient my-2">CureCast</h1>
        <p className="text-muted-foreground">Your AI-powered health companion</p>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <RegisterForm />
      </div>
    </div>
  );
};

export default RegisterPage;
