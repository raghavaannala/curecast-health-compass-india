import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MessageCircle, User, Bell, BookOpen, LayoutDashboard, Camera, Mic } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUser } from '@/contexts/UserContext';

const BottomNavigation = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const { currentUser } = useUser();

  const isAdmin = currentUser?.id?.startsWith('a');
  
  const navItems = [
    {
      path: '/',
      label: t('chatbot'),
      icon: <MessageCircle className="h-5 w-5" />,
    },
    {
      path: '/camera',
      label: t('camera'),
      icon: <Camera className="h-5 w-5" />,
    },
    {
      path: '/voice',
      label: t('voice'),
      icon: <Mic className="h-5 w-5" />,
    },
    {
      path: '/profile',
      label: t('profile'),
      icon: <User className="h-5 w-5" />,
    },
    {
      path: '/reminders',
      label: t('reminders'),
      icon: <Bell className="h-5 w-5" />,
    },
    {
      path: '/myths',
      label: t('myths'),
      icon: <BookOpen className="h-5 w-5" />,
    },
  ];
  
  // Add admin dashboard for admin users
  if (isAdmin) {
    navItems.push({
      path: '/admin',
      label: t('admin'),
      icon: <LayoutDashboard className="h-5 w-5" />,
    });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-morphism border-t border-white/10">
      <div className="flex justify-around">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-1 flex-col items-center justify-center py-2",
              location.pathname === item.path
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground transition-colors"
            )}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
