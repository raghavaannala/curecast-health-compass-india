import React from 'react';

const GlobalHeader: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-lg">
              <span className="text-white font-bold text-lg">🩺</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                CureCast Health Compass
              </h1>
              <p className="text-xs text-gray-600 hidden sm:block">
                AI-Powered Healthcare Platform
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;
