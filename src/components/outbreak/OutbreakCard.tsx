import React, { useState } from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  Calendar, 
  Users, 
  Phone, 
  Shield, 
  Volume2, 
  VolumeX,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Heart,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OutbreakAlert, Precaution } from '@/types/outbreakTypes';

interface OutbreakCardProps {
  alert: OutbreakAlert;
  selectedLanguage: string;
  onTextToSpeech?: (text: string) => void;
  isTextToSpeechEnabled?: boolean;
  onViewDetails?: (alertId: string) => void;
  className?: string;
}

const OutbreakCard: React.FC<OutbreakCardProps> = ({
  alert,
  selectedLanguage,
  onTextToSpeech,
  isTextToSpeechEnabled = false,
  onViewDetails,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Get translated content
  const getTranslatedContent = () => {
    if (selectedLanguage === 'en' || !alert.translations[selectedLanguage]) {
      return {
        title: alert.title,
        description: alert.description,
        disease: alert.disease,
        symptoms: alert.symptoms,
        transmissionMode: alert.transmissionMode,
        riskFactors: alert.riskFactors,
        governmentGuidelines: alert.governmentGuidelines
      };
    }
    
    const translation = alert.translations[selectedLanguage];
    return {
      title: translation.title,
      description: translation.description,
      disease: translation.disease,
      symptoms: translation.symptoms,
      transmissionMode: translation.transmissionMode,
      riskFactors: translation.riskFactors,
      governmentGuidelines: translation.governmentGuidelines
    };
  };

  const content = getTranslatedContent();

  // Get severity color and icon
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: '🚨',
          textColor: 'text-red-700'
        };
      case 'high':
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          icon: '⚠️',
          textColor: 'text-orange-700'
        };
      case 'medium':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: '⚡',
          textColor: 'text-yellow-700'
        };
      case 'low':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: 'ℹ️',
          textColor: 'text-blue-700'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: '📋',
          textColor: 'text-gray-700'
        };
    }
  };

  const severityConfig = getSeverityConfig(alert.severity);

  // Handle text-to-speech
  const handleTextToSpeech = () => {
    if (!onTextToSpeech) return;
    
    const textToSpeak = `${content.title}. ${content.description}. Disease: ${content.disease}. 
    Confirmed cases: ${alert.confirmedCases}. Location: ${alert.location.city}, ${alert.location.state}.`;
    
    setIsSpeaking(true);
    onTextToSpeech(textToSpeak);
    
    // Reset speaking state after estimated time
    setTimeout(() => setIsSpeaking(false), 5000);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(selectedLanguage === 'hi' ? 'hi-IN' : 'en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get precautions for current selectedLanguage
  const getTranslatedPrecautions = (precautions: Precaution[]) => {
    return precautions.map(precaution => ({
      ...precaution,
      title: precaution.translations[selectedLanguage]?.title || precaution.title,
      description: precaution.translations[selectedLanguage]?.description || precaution.description
    }));
  };

  return (
    <Card className={`w-full shadow-lg hover:shadow-xl transition-all duration-300 ${severityConfig.borderColor} border-2`}>
      <CardHeader className={`${severityConfig.bgColor} rounded-t-lg`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{severityConfig.icon}</span>
              <Badge className={`${severityConfig.color} font-semibold text-sm px-3 py-1`}>
                {alert.severity.toUpperCase()}
              </Badge>
              {alert.isUrgent && (
                <Badge className="bg-red-600 text-white animate-pulse">
                  URGENT
                </Badge>
              )}
              <Badge variant="outline" className={`${severityConfig.textColor} border-current`}>
                {alert.status.toUpperCase()}
              </Badge>
            </div>
            <CardTitle className={`text-xl font-bold ${severityConfig.textColor} mb-2`}>
              {content.title}
            </CardTitle>
            <p className={`text-sm ${severityConfig.textColor} opacity-90`}>
              {content.description}
            </p>
          </div>
          
          {isTextToSpeechEnabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTextToSpeech}
              className={`ml-2 ${severityConfig.textColor} hover:bg-white/20`}
              disabled={isSpeaking}
            >
              {isSpeaking ? (
                <Volume2 className="h-4 w-4 animate-pulse" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Key Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Activity className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs text-blue-600 font-medium">Disease</p>
              <p className="text-sm font-semibold text-blue-800">{content.disease}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
            <Users className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-xs text-red-600 font-medium">Confirmed Cases</p>
              <p className="text-sm font-semibold text-red-800">{alert.confirmedCases.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <Heart className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-xs text-green-600 font-medium">Recoveries</p>
              <p className="text-sm font-semibold text-green-800">{(alert.recoveries || 0).toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
            <MapPin className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-xs text-purple-600 font-medium">Location</p>
              <p className="text-sm font-semibold text-purple-800">{alert.location.city}</p>
            </div>
          </div>
        </div>

        {/* Affected Areas */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Affected Areas
          </h4>
          <div className="flex flex-wrap gap-2">
            {alert.affectedAreas.map((area, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {area}
              </Badge>
            ))}
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Calendar className="h-3 w-3" />
          Last updated: {formatDate(alert.lastUpdated)}
        </div>

        {/* Quick Precautions */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Key Precautions
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getTranslatedPrecautions(alert.precautions.slice(0, 4)).map((precaution, index) => (
              <div key={precaution.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-lg">{precaution.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{precaution.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{precaution.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contacts */}
        {alert.emergencyContacts.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Emergency Contacts
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {alert.emergencyContacts.slice(0, 2).map((contact, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded border border-red-200">
                  <Phone className="h-3 w-3 text-red-600" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-red-800">{contact.name}</p>
                    <a 
                      href={`tel:${contact.phone}`}
                      className="text-xs text-red-600 hover:underline font-mono"
                    >
                      {contact.phone}
                    </a>
                  </div>
                  {contact.available24x7 && (
                    <Badge className="bg-green-100 text-green-800 text-xs">24/7</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expandable Details */}
        <div className="border-t pt-4">
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-2 text-sm"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show Less Details
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show More Details
              </>
            )}
          </Button>

          {isExpanded && (
            <div className="mt-4 space-y-4">
              {/* Symptoms */}
              {content.symptoms && content.symptoms.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">Symptoms to Watch For:</h5>
                  <div className="flex flex-wrap gap-2">
                    {content.symptoms.map((symptom, index) => (
                      <Badge key={index} variant="outline" className="text-xs border-red-300 text-red-700">
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Transmission Mode */}
              {content.transmissionMode && content.transmissionMode.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">How it Spreads:</h5>
                  <div className="flex flex-wrap gap-2">
                    {content.transmissionMode.map((mode, index) => (
                      <Badge key={index} variant="outline" className="text-xs border-orange-300 text-orange-700">
                        {mode}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Factors */}
              {content.riskFactors && content.riskFactors.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">Risk Factors:</h5>
                  <div className="flex flex-wrap gap-2">
                    {content.riskFactors.map((factor, index) => (
                      <Badge key={index} variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Government Guidelines */}
              {content.governmentGuidelines && (
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Government Guidelines:</strong> {content.governmentGuidelines}
                  </AlertDescription>
                </Alert>
              )}

              {/* Vaccination Info */}
              {alert.vaccinationInfo && alert.vaccinationInfo.isVaccineAvailable && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                    💉 Vaccination Available
                  </h5>
                  <p className="text-sm text-green-700 mb-2">
                    Vaccines: {alert.vaccinationInfo.vaccineNames.join(', ')}
                  </p>
                  {alert.vaccinationInfo.bookingUrl && (
                    <a
                      href={alert.vaccinationInfo.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-green-600 hover:underline"
                    >
                      Book Vaccination <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t">
          <Button
            onClick={() => onViewDetails?.(alert.id)}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Full Details
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(`https://maps.google.com/?q=${alert.location.coordinates.latitude},${alert.location.coordinates.longitude}`, '_blank')}
            className="flex-1"
          >
            <MapPin className="h-4 w-4 mr-2" />
            View on Map
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OutbreakCard;
