import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import { useUser } from '@/contexts/UserContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe, Stethoscope } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const AppLayout = () => {
  const { isAuthenticated } = useUser();
  const { changeLanguage, currentLanguage } = useLanguage();
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="glass-morphism px-4 py-3 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-primary/10">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient">Dr.CureCast</h1>
            <p className="text-sm text-muted-foreground">Your AI Health Expert</p>
          </div>
        </div>
        
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
      </header>
      
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      
      {isAuthenticated && <BottomNavigation />}
    </div>
  );
};

export default AppLayout;
