import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Search, Filter, Grid, List, RefreshCw, Users, TrendingUp, Shield, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import OutbreakCard from './OutbreakCard';
import LanguageSelector from './LanguageSelector';
import { OutbreakAlert, Location, OutbreakStatistics } from '@/types/outbreakTypes';
import { LocationService } from '@/services/locationService';
import { OutbreakAlertService } from '@/services/outbreakAlertService';
import { TextToSpeechService } from '@/services/textToSpeechService';

const OutbreakAlerts: React.FC = () => {
  // State management
  const [alerts, setAlerts] = useState<OutbreakAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<OutbreakAlert[]>([]);
  const [statistics, setStatistics] = useState<OutbreakStatistics | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [isTextToSpeechEnabled, setIsTextToSpeechEnabled] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocationLoading, setIsLocationLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Service instances
  const locationService = LocationService.getInstance();
  const outbreakService = OutbreakAlertService.getInstance();
  const ttsService = TextToSpeechService.getInstance();

  // Get user location
  const getUserLocation = async () => {
    setIsLocationLoading(true);
    try {
      const location = await locationService.getCurrentLocation();
      setUserLocation(location);
    } catch (err) {
      console.error('Failed to get location:', err);
      setError('Unable to get your location. Showing all alerts.');
      // Set a fallback location for demo purposes
      setUserLocation({
        latitude: 28.6139,
        longitude: 77.2090,
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        district: 'Central Delhi',
        pincode: '110001'
      });
    } finally {
      setIsLocationLoading(false);
    }
  };

  // Fetch outbreak alerts
  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching alerts for location:', userLocation);
      
      const alertsData = await outbreakService.getLocationBasedAlerts(userLocation || {
        latitude: 28.6139,
        longitude: 77.2090,
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India'
      });
      
      const statsData = await outbreakService.getOutbreakStatistics();
      
      console.log('Alerts fetched:', alertsData);
      console.log('Statistics:', statsData);
      
      setAlerts(alertsData);
      setFilteredAlerts(alertsData);
      setStatistics(statsData);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setError('Failed to load outbreak alerts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter alerts based on search and filters
  const filterAlerts = () => {
    let filtered = [...alerts];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(alert =>
        alert.disease.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.affectedAreas.some(area => 
          area.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Severity filter
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(alert => alert.severity === selectedSeverity);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(alert => alert.status === selectedStatus);
    }

    setFilteredAlerts(filtered);
  };

  // Handle text-to-speech
  const handleTextToSpeech = async (text: string) => {
    if (isTextToSpeechEnabled) {
      await ttsService.speak(text, selectedLanguage);
    }
  };

  // Handle view details
  const handleViewDetails = (alertId: string) => {
    // Implementation for viewing detailed alert information
    console.log('Viewing details for:', alertId);
  };

  // Effects
  useEffect(() => {
    // Initialize with fallback location immediately
    setUserLocation({
      latitude: 28.6139,
      longitude: 77.2090,
      city: 'New Delhi',
      state: 'Delhi',
      country: 'India',
      district: 'Central Delhi',
      pincode: '110001'
    });
    
    // Then try to get actual location
    getUserLocation();
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [userLocation]);

  useEffect(() => {
    filterAlerts();
  }, [searchQuery, selectedSeverity, selectedStatus, alerts]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <div className="space-y-2">
            <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">Loading Outbreak Alerts</h2>
            <p className="text-sm sm:text-base text-gray-500">Fetching the latest health information for your area...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-red-100 rounded-xl">
                <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Outbreak Alerts</h1>
                <p className="text-sm sm:text-base text-gray-600">Stay informed about health emergencies in your area</p>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <LanguageSelector 
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
                isTextToSpeechEnabled={isTextToSpeechEnabled}
                onTextToSpeechToggle={setIsTextToSpeechEnabled}
              />
            </div>
          </div>

          {/* Location Status */}
          {userLocation && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 flex-wrap">
                <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="font-medium">Current Location:</span>
                <span className="break-words">{userLocation.city}, {userLocation.state}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={getUserLocation}
                disabled={isLocationLoading}
                className="text-blue-600 hover:bg-blue-50 p-1 flex-shrink-0"
                aria-label="Refresh location"
              >
                <RefreshCw className={`h-3 w-3 ${isLocationLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          )}
        </div>

        {/* Statistics Cards - Responsive Grid */}
        {statistics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-xs sm:text-sm font-medium">Active Alerts</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold">{statistics.totalAlerts}</p>
                  </div>
                  <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-xs sm:text-sm font-medium">Critical</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold">{statistics.criticalAlerts}</p>
                  </div>
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs sm:text-sm font-medium">Affected Areas</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold">{statistics.affectedAreas}</p>
                  </div>
                  <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-xs sm:text-sm font-medium">Recovered</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold">{statistics.recoveredCases}</p>
                  </div>
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters - Responsive Layout */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 md:mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by disease or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
                aria-label="Search outbreak alerts"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="monitoring">Monitoring</SelectItem>
                  <SelectItem value="contained">Contained</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="px-3"
                  aria-label="Grid view"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="px-3"
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || selectedSeverity !== 'all' || selectedStatus !== 'all') && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600 font-medium">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  Search: "{searchQuery}"
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="ml-1 hover:text-red-600"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedSeverity !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Severity: {selectedSeverity}
                  <button 
                    onClick={() => setSelectedSeverity('all')}
                    className="ml-1 hover:text-red-600"
                    aria-label="Clear severity filter"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedStatus !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Status: {selectedStatus}
                  <button 
                    onClick={() => setSelectedStatus('all')}
                    className="ml-1 hover:text-red-600"
                    aria-label="Clear status filter"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 font-medium">Error</p>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* No Results */}
        {filteredAlerts.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No alerts found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedSeverity !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'No outbreak alerts in your area at this time.'}
            </p>
            {(searchQuery || selectedSeverity !== 'all' || selectedStatus !== 'all') && (
              <Button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSeverity('all');
                  setSelectedStatus('all');
                }}
                variant="outline"
              >
                Clear all filters
              </Button>
            )}
          </div>
        )}

        {/* Alerts Grid/List - Responsive */}
        {filteredAlerts.length > 0 && (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6' 
              : 'space-y-4'
          }>
            {filteredAlerts.map((alert) => (
              <OutbreakCard
                key={alert.id}
                alert={alert}
                selectedLanguage={selectedLanguage}
                onTextToSpeech={handleTextToSpeech}
                isTextToSpeechEnabled={isTextToSpeechEnabled}
                onViewDetails={handleViewDetails}
                className={viewMode === 'list' ? 'w-full' : ''}
              />
            ))}
          </div>
        )}

        {/* Load More Button for Large Datasets */}
        {filteredAlerts.length > 0 && filteredAlerts.length >= 20 && (
          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              size="lg"
              onClick={fetchAlerts}
              className="px-8"
            >
              Load More Alerts
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutbreakAlerts;
