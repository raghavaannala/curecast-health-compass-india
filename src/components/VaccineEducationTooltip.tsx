import React, { useState, useRef, useEffect } from 'react';
import { VaccineEducationalInfo, Language } from '../types';

interface VaccineEducationTooltipProps {
  vaccineInfo: VaccineEducationalInfo;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click';
  language?: Language;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrow: {
    top?: number;
    left?: number;
    right?: number;
    bottom?: number;
  };
}

/**
 * Educational Tooltip Component for Vaccine Information
 * Provides comprehensive vaccine details with positioning and multilingual support
 */
export const VaccineEducationTooltip: React.FC<VaccineEducationTooltipProps> = ({
  vaccineInfo,
  children,
  position = 'top',
  trigger = 'hover',
  language = 'en'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    top: 0,
    left: 0,
    arrow: {}
  });
  
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      calculatePosition();
    }
  }, [isVisible, position]);

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    let top = 0;
    let left = 0;
    const arrow: TooltipPosition['arrow'] = {};

    switch (position) {
      case 'top':
        top = triggerRect.top + scrollTop - tooltipRect.height - 10;
        left = triggerRect.left + scrollLeft + (triggerRect.width - tooltipRect.width) / 2;
        arrow.bottom = -8;
        arrow.left = tooltipRect.width / 2 - 8;
        break;
      
      case 'bottom':
        top = triggerRect.bottom + scrollTop + 10;
        left = triggerRect.left + scrollLeft + (triggerRect.width - tooltipRect.width) / 2;
        arrow.top = -8;
        arrow.left = tooltipRect.width / 2 - 8;
        break;
      
      case 'left':
        top = triggerRect.top + scrollTop + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left + scrollLeft - tooltipRect.width - 10;
        arrow.right = -8;
        arrow.top = tooltipRect.height / 2 - 8;
        break;
      
      case 'right':
        top = triggerRect.top + scrollTop + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + scrollLeft + 10;
        arrow.left = -8;
        arrow.top = tooltipRect.height / 2 - 8;
        break;
    }

    // Ensure tooltip stays within viewport
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    if (left < 10) left = 10;
    if (left + tooltipRect.width > viewport.width - 10) {
      left = viewport.width - tooltipRect.width - 10;
    }
    if (top < 10) top = 10;
    if (top + tooltipRect.height > viewport.height + scrollTop - 10) {
      top = viewport.height + scrollTop - tooltipRect.height - 10;
    }

    setTooltipPosition({ top, left, arrow });
  };

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsVisible(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setIsVisible(!isVisible);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      trigger === 'click' &&
      tooltipRef.current &&
      triggerRef.current &&
      !tooltipRef.current.contains(event.target as Node) &&
      !triggerRef.current.contains(event.target as Node)
    ) {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    if (trigger === 'click') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [trigger]);

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-4 h-4 bg-white border transform rotate-45';
    switch (position) {
      case 'top':
        return `${baseClasses} border-t-0 border-l-0`;
      case 'bottom':
        return `${baseClasses} border-b-0 border-r-0`;
      case 'left':
        return `${baseClasses} border-l-0 border-b-0`;
      case 'right':
        return `${baseClasses} border-r-0 border-t-0`;
      default:
        return baseClasses;
    }
  };

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="cursor-help"
      >
        {children}
      </div>

      {isVisible && (
        <>
          {/* Backdrop for click outside detection */}
          {trigger === 'click' && (
            <div className="fixed inset-0 z-40" />
          )}
          
          {/* Tooltip */}
          <div
            ref={tooltipRef}
            className="fixed z-50 w-96 max-w-sm bg-white border border-gray-200 rounded-lg shadow-xl"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
            }}
          >
            {/* Arrow */}
            <div
              className={getArrowClasses()}
              style={tooltipPosition.arrow}
            />

            {/* Tooltip Content */}
            <div className="p-4 space-y-4">
              {/* Header */}
              <div className="border-b pb-3">
                <h3 className="font-semibold text-gray-900 text-lg">
                  💉 Vaccine Information
                </h3>
                <p className="text-sm text-gray-600 mt-1">{vaccineInfo.description}</p>
              </div>

              {/* Importance */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <span className="text-red-500 mr-2">⚠️</span>
                  Why It's Important
                </h4>
                <p className="text-sm text-gray-700">{vaccineInfo.importance}</p>
              </div>

              {/* Benefits */}
              {vaccineInfo.benefits && vaccineInfo.benefits.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <span className="text-green-500 mr-2">✅</span>
                    Benefits
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {vaccineInfo.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2 mt-0.5">•</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risks */}
              {vaccineInfo.risks && vaccineInfo.risks.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <span className="text-yellow-500 mr-2">⚠️</span>
                    Possible Risks
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {vaccineInfo.risks.map((risk, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-yellow-500 mr-2 mt-0.5">•</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preparation */}
              {vaccineInfo.preparation && vaccineInfo.preparation.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <span className="text-blue-500 mr-2">📋</span>
                    How to Prepare
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {vaccineInfo.preparation.map((step, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2 mt-0.5">•</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* After Care */}
              {vaccineInfo.afterCare && vaccineInfo.afterCare.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <span className="text-purple-500 mr-2">🏥</span>
                    After Vaccination
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {vaccineInfo.afterCare.map((care, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-purple-500 mr-2 mt-0.5">•</span>
                        {care}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sources */}
              {vaccineInfo.sources && vaccineInfo.sources.length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <span className="text-gray-500 mr-2">📚</span>
                    Sources
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {vaccineInfo.sources.map((source, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t pt-3 flex justify-between items-center">
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
                <div className="flex space-x-2">
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    Learn More
                  </button>
                  <button className="text-sm text-green-600 hover:text-green-800">
                    Book Appointment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VaccineEducationTooltip;
