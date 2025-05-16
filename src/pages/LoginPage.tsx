import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import LoginForm from '../components/auth/LoginForm';
import { Stethoscope } from 'lucide-react';

const LoginPage = () => {
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
        <div className="inline-flex items-center justify-center gap-2 mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Stethoscope className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gradient my-2">Dr.CureCast</h1>
        <p className="text-muted-foreground">Your Personal AI Health Expert</p>
        <p className="text-sm text-muted-foreground mt-2">Get instant medical guidance in your language</p>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
