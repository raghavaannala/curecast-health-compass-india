import React from 'react';
import { Outlet } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import BottomNavigation from './BottomNavigation';

const AppLayout = () => {
  const { currentLanguage, changeLanguage } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-end px-4 h-16">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                <span className="capitalize">{currentLanguage}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => changeLanguage('english')}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('hindi')}>
                हिन्दी (Hindi)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('telugu')}>
                తెలుగు (Telugu)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default AppLayout;
