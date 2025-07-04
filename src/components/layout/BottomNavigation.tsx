import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MessageCircle, User, Bell, BookOpen, LayoutDashboard, Camera, Mic } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const BottomNavigation = () => {
  const location = useLocation();
  const { t } = useLanguage();
  
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="grid grid-cols-4 gap-4">
          {navItems.slice(0, 4).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center py-2 px-1 text-sm text-gray-600 hover:text-primary-600 transition-colors',
                location.pathname === item.path && 'text-primary-600'
              )}
            >
              <div className={cn(
                'rounded-full p-1.5 mb-1',
                location.pathname === item.path ? 'bg-primary-100' : 'bg-transparent'
              )}>
                {item.icon}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;
