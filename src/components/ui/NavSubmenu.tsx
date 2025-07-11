import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  id: string;
  path: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

interface NavSubmenuProps {
  parentItem: NavItem;
  childItems: NavItem[];
  onNavigate: (path: string) => void;
}

const NavSubmenu: React.FC<NavSubmenuProps> = ({ parentItem, childItems, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if any child path is active
  const isChildActive = childItems.some(item => location.pathname === item.path);
  
  // Check if parent path is active
  const isParentActive = location.pathname === parentItem.path;
  
  // Toggle submenu
  const toggleSubmenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };
  
  // Navigate to parent path
  const navigateToParent = () => {
    onNavigate(parentItem.path);
  };
  
  return (
    <div className="relative">
      <Button
        variant={isParentActive ? "default" : "ghost"}
        size="sm"
        className={`flex items-center gap-3 py-3 px-3 w-full justify-between rounded-lg ${
          isParentActive || isChildActive 
            ? "bg-primary-600 text-white" 
            : "text-gray-600 hover:bg-gray-100"
        }`}
        onClick={navigateToParent}
      >
        <div className="flex items-center gap-3">
          <div className={`rounded-full p-1.5 ${
            isParentActive || isChildActive 
              ? 'bg-white bg-opacity-20' 
              : parentItem.color
          }`}>
            <parentItem.icon className={`h-5 w-5 ${
              isParentActive || isChildActive ? 'text-white' : ''
            }`} />
          </div>
          <span className="font-medium">{parentItem.label}</span>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className={`p-0 hover:bg-transparent ${
            isParentActive || isChildActive ? 'text-white' : 'text-gray-500'
          }`}
          onClick={toggleSubmenu}
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </Button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden pl-4 ml-2 border-l border-gray-200"
          >
            {childItems.map((item) => (
              <Button
                key={item.id}
                variant={location.pathname === item.path ? "default" : "ghost"}
                size="sm"
                className={`flex items-center gap-3 py-2 px-3 w-full justify-start rounded-lg mt-1 ${
                  location.pathname === item.path 
                    ? "bg-primary-600 text-white" 
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => onNavigate(item.path)}
              >
                <div className={`rounded-full p-1 ${
                  location.pathname === item.path 
                    ? 'bg-white bg-opacity-20' 
                    : item.color
                }`}>
                  <item.icon className={`h-4 w-4 ${
                    location.pathname === item.path ? 'text-white' : ''
                  }`} />
                </div>
                <span className="font-medium text-sm">{item.label}</span>
              </Button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NavSubmenu; 