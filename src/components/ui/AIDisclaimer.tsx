import React from 'react';
import { AlertTriangle, Info, Shield, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

interface AIDisclaimerProps {
  className?: string;
  variant?: 'default' | 'compact' | 'enhanced';
  type?: 'general' | 'diagnostic' | 'treatment';
}

const AIDisclaimer: React.FC<AIDisclaimerProps> = ({ 
  className = '', 
  variant = 'default',
  type = 'general'
}) => {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();
  
  // Get the appropriate disclaimer text based on type
  const getDisclaimerText = () => {
    switch (type) {
      case 'diagnostic':
        return "IMPORTANT MEDICAL DISCLAIMER: The information provided by CureCast is not a medical diagnosis. This AI tool uses pattern recognition to offer guidance only and should not replace professional medical evaluation. Consult a healthcare provider for proper diagnosis and treatment.";
      case 'treatment':
        return "IMPORTANT MEDICAL DISCLAIMER: The treatment suggestions provided by CureCast are for informational purposes only. This AI tool cannot prescribe medication or replace professional medical advice. Always consult a qualified healthcare provider before starting any treatment.";
      case 'general':
      default:
        return "IMPORTANT MEDICAL DISCLAIMER: CureCast provides AI-based health information for educational purposes only. This is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions regarding a medical condition.";
    }
  };
  
  // Enhanced version with icon and link
  if (variant === 'enhanced') {
    return (
      <div className={`p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg shadow-sm flex items-start gap-3 ${className}`}>
        <div className="bg-amber-100 p-1.5 rounded-full">
          <Shield className="h-5 w-5 text-amber-600 flex-shrink-0" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-amber-900 mb-1">Medical Disclaimer</h4>
          <p className="text-sm text-amber-800">
            {getDisclaimerText()}
          </p>
          <a 
            href="https://www.who.int/about/who-we-are/frequently-asked-questions" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-2 text-xs flex items-center gap-1 text-amber-700 hover:text-amber-900 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Learn more about responsible healthcare information
          </a>
        </div>
      </div>
    );
  }
  
  // Compact version for footer
  if (variant === 'compact') {
    return (
      <div className={`p-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-md flex items-center gap-2 ${className}`}>
        <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
        <p className="text-xs text-amber-800 font-medium">
          MEDICAL DISCLAIMER: CureCast provides AI-based guidance only. Always consult a healthcare professional for medical decisions.
        </p>
      </div>
    );
  }
  
  // Default version
  return (
    <div className={`p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-md flex items-start gap-2 ${className}`}>
      <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="text-sm font-medium text-amber-900 mb-1">Medical Disclaimer</h4>
        <p className="text-sm text-amber-800">
          {getDisclaimerText()}
        </p>
      </div>
    </div>
  );
};

export default AIDisclaimer; 