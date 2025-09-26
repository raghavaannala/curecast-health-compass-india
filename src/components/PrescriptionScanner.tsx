import React, { useState, useRef, useCallback } from 'react';
import { 
  PrescriptionScanResult, 
  PrescriptionAnalysisResult, 
  MedicineAvailability,
  PharmacyLocation,
  ReservationRequest 
} from '../types/prescription';
import { ocrService } from '../services/ocrService';
import { pharmacyService } from '../services/pharmacyService';
import { prescriptionAssistantService, PrescriptionAnalysisJSON } from '../services/prescriptionAssistantService';
import { Language } from '../types';

interface PrescriptionScannerProps {
  userId: string;
  language: Language;
}

export const PrescriptionScanner: React.FC<PrescriptionScannerProps> = ({
  userId,
  language
}) => {
  const [scanResult, setScanResult] = useState<PrescriptionScanResult | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PrescriptionAnalysisResult | null>(null);
  const [structuredResult, setStructuredResult] = useState<{ json: PrescriptionAnalysisJSON; summary: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showJSON, setShowJSON] = useState(false);
  const [searchRadius, setSearchRadius] = useState(5);
  const [locationStatus, setLocationStatus] = useState<'detecting' | 'found' | 'denied' | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }, []);

  const handleScanPrescription = useCallback(async () => {
    if (!selectedFile) {
      setError('Please select a prescription image first');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('🔍 Starting prescription analysis workflow...');
      
      // Get user location for pharmacy search
      console.log('📍 Getting user location...');
      setLocationStatus('detecting');
      const location = await pharmacyService.getCurrentLocation();
      console.log('📍 User location obtained:', location);
      setUserLocation(location);
      setLocationStatus('found');
      
      // Use the new structured prescription assistant service
      console.log(`🔍 Analyzing prescription with ${searchRadius}km radius...`);
      const result = await prescriptionAssistantService.analyzePrescription(
        selectedFile,
        {
          latitude: location.latitude,
          longitude: location.longitude
        },
        searchRadius
      );

      console.log('📊 Analysis result:', result);
      setStructuredResult(result);
      console.log('✅ Prescription analysis completed successfully');

    } catch (err) {
      console.error('❌ Prescription analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to process prescription');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, searchRadius]);

  const handleReserveMedicine = async (pharmacyId: string, medicineIds: string[]) => {
    try {
      const reservationRequest: ReservationRequest = {
        userId,
        pharmacyId,
        medicines: medicineIds.map(id => ({ medicineId: id, quantity: 1 })),
        reservationDate: new Date().toISOString(),
        contactPhone: '+91-9876543210', // Should come from user profile
        notes: 'Reserved via Dr.CureCast prescription scanner'
      };

      const reservation = await pharmacyService.reserveMedicines(reservationRequest);
      
      // Show success message
      alert(`Reservation confirmed! ID: ${reservation.reservationId}. Please pickup within 24 hours.`);
    } catch (err) {
      alert('Failed to reserve medicines. Please try again.');
    }
  };

  const generateRecommendations = (
    medicines: any[],
    availability: MedicineAvailability[],
    pharmacies: PharmacyLocation[]
  ): string[] => {
    const recommendations: string[] = [];

    // Check for best prices
    const cheapestPharmacy = availability
      .filter(a => a.available && a.price)
      .sort((a, b) => (a.price || 0) - (b.price || 0))[0];

    if (cheapestPharmacy) {
      recommendations.push(`💰 Best Price: ${cheapestPharmacy.pharmacy.name} offers the most affordable options`);
    }

    // Check for nearest pharmacy
    const nearestPharmacy = pharmacies.sort((a, b) => a.distance - b.distance)[0];
    if (nearestPharmacy) {
      recommendations.push(`📍 Nearest: ${nearestPharmacy.name} is only ${nearestPharmacy.distance}km away`);
    }

    // Check for 24/7 availability
    const alwaysOpen = pharmacies.find(p => 
      p.openingHours && Object.values(p.openingHours).some(hours => hours === '24 Hours')
    );
    if (alwaysOpen) {
      recommendations.push(`🕐 24/7 Available: ${alwaysOpen.name} is open round the clock`);
    }

    // Check for delivery options
    const deliveryPharmacy = pharmacies.find(p => p.name.toLowerCase().includes('delivery'));
    if (deliveryPharmacy) {
      recommendations.push(`🚚 Home Delivery: ${deliveryPharmacy.name} delivers to your location`);
    }

    return recommendations;
  };

  const resetScanner = () => {
    setScanResult(null);
    setAnalysisResult(null);
    setStructuredResult(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setShowJSON(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          💊 Prescription Scanner
        </h1>
        <p className="text-gray-600">
          Upload your prescription to find medicines at nearby pharmacies with prices and availability
        </p>
      </div>

      {/* Configuration Section */}
      {!structuredResult && (
        <div className="mb-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                Search Radius:
              </label>
              <select
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={2}>2 km</option>
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={15}>15 km</option>
              </select>
              <span className="text-sm text-gray-600">
                Find pharmacies within {searchRadius}km radius
              </span>
            </div>
            
            {/* Location Status */}
            <div className="flex items-center space-x-2">
              {locationStatus === 'detecting' && (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-600">Detecting location...</span>
                </>
              )}
              {locationStatus === 'found' && userLocation && (
                <>
                  <span className="text-green-500">📍</span>
                  <span className="text-sm text-green-600">
                    Location found ({userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)})
                  </span>
                </>
              )}
              {locationStatus === 'denied' && (
                <>
                  <span className="text-red-500">❌</span>
                  <span className="text-sm text-red-600">Using default location</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File Upload Section */}
      {!structuredResult && (
        <div className="mb-8">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="prescription-upload"
            />
            <label 
              htmlFor="prescription-upload" 
              className="cursor-pointer block"
            >
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload Prescription Image
              </h3>
              <p className="text-gray-500 mb-4">
                Click to select or drag and drop your prescription image
              </p>
              <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                Choose File
              </div>
            </label>
          </div>

          {/* Image Preview */}
          {previewUrl && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Preview:</h3>
              <div className="flex justify-center">
                <img 
                  src={previewUrl} 
                  alt="Prescription preview" 
                  className="max-w-md max-h-64 object-contain border rounded-lg shadow-sm"
                />
              </div>
            </div>
          )}

          {/* Scan Button */}
          {selectedFile && (
            <div className="mt-6 text-center">
              <button
                onClick={handleScanPrescription}
                disabled={isProcessing}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    🔍 Scan Prescription
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="text-red-400 mr-2">⚠️</div>
            <div className="text-red-700">{error}</div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {structuredResult && (
        <div className="space-y-8">
          {/* Human-Readable Summary */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              📋 Analysis Results
            </h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {structuredResult.summary}
              </pre>
            </div>
          </div>

          {/* Interactive Medicine Cards */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              💊 Medicine Details
            </h2>
            <div className="space-y-6">
              {structuredResult.json.medicines.map((medicine, index) => {
                const availablePharmacies = medicine.pharmacies.filter(p => p.availability === 'In stock');
                const unavailablePharmacies = medicine.pharmacies.filter(p => p.availability === 'Not available');

                return (
                  <div key={`${medicine.name}_${index}`} className="bg-white border rounded-lg p-6">
                    {/* Medicine Header */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {index + 1}. {medicine.name} {medicine.strength}
                        {medicine.quantity && ` (${medicine.quantity} ${medicine.form}s)`}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Form: {medicine.form}
                      </p>
                    </div>

                    {/* Available Pharmacies */}
                    {availablePharmacies.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-green-700 mb-2">✅ Available at:</h4>
                        <div className="space-y-2">
                          {availablePharmacies
                            .sort((a, b) => (a.price || 999) - (b.price || 999))
                            .map((pharmacy, pharmIndex) => {
                              const isCheapest = pharmIndex === 0 && pharmacy.price;
                              const isOnline = pharmacy.distance_km === 0;
                              
                              return (
                                <div key={`${pharmacy.name}_${index}`} 
                                     className="flex items-center justify-between p-3 bg-green-50 rounded border">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-green-600 font-medium">{pharmacy.name}</span>
                                    <span className="text-gray-500">–</span>
                                    <span className="text-sm text-gray-600">
                                      {isOnline ? 'Online delivery' : `${pharmacy.distance_km}km away`}
                                    </span>
                                    <span className="text-gray-500">–</span>
                                    <span className="text-green-600 font-medium">{pharmacy.availability}</span>
                                    {pharmacy.price && (
                                      <>
                                        <span className="text-gray-500">–</span>
                                        <span className="font-semibold text-gray-900">
                                          ₹{pharmacy.price}
                                          {isCheapest && (
                                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                              Best Price
                                            </span>
                                          )}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => handleReserveMedicine(pharmacy.name, [medicine.name])}
                                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                    >
                                      Reserve & Buy
                                    </button>
                                    {!isOnline && (
                                      <button
                                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pharmacy.address)}`, '_blank')}
                                        className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                                      >
                                        📍 Map
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Unavailable Pharmacies */}
                    {unavailablePharmacies.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-red-700 mb-2">❌ Not available at:</h4>
                        <div className="space-y-1">
                          {unavailablePharmacies.map((pharmacy) => (
                            <div key={`unavail_${pharmacy.name}_${index}`} className="text-sm text-gray-600 p-2 bg-red-50 rounded">
                              {pharmacy.name} – {pharmacy.distance_km}km – {pharmacy.availability}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Alternatives */}
                    {medicine.alternatives.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-blue-700 mb-2">💡 Alternative Options:</h4>
                        <div className="space-y-2">
                          {medicine.alternatives.map((alt, altIndex) => (
                            <div key={`alt_${altIndex}`} className="p-3 bg-blue-50 rounded border">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium text-blue-900">{alt.name}</span>
                                  <span className="text-gray-500 ml-2">at {alt.pharmacy}</span>
                                  {alt.delivery_time && (
                                    <span className="text-sm text-blue-600 ml-2">
                                      (Available in {alt.delivery_time})
                                    </span>
                                  )}
                                </div>
                                {alt.price && (
                                  <span className="font-semibold text-blue-900">₹{alt.price}</span>
                                )}
                              </div>
                              <div className="text-xs text-blue-700 mt-1">
                                Generic: {alt.generic_composition} • {alt.substitution_reason}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Analysis Metadata */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📊 Analysis Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {structuredResult.json.analysis_metadata.total_medicines}
                </div>
                <div className="text-gray-600">Medicines Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {structuredResult.json.analysis_metadata.total_pharmacies_checked}
                </div>
                <div className="text-gray-600">Pharmacies Checked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {structuredResult.json.analysis_metadata.radius_km}km
                </div>
                <div className="text-gray-600">Search Radius</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  ₹{structuredResult.json.medicines.reduce((total, med) => {
                    const cheapestPrice = med.pharmacies
                      .filter(p => p.availability === 'In stock' && p.price)
                      .sort((a, b) => (a.price || 0) - (b.price || 0))[0]?.price || 0;
                    return total + cheapestPrice;
                  }, 0)}
                </div>
                <div className="text-gray-600">Best Total Price</div>
              </div>
            </div>
          </div>

          {/* JSON Output Section */}
          {showJSON && (
            <div className="bg-gray-900 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-white">Structured JSON Output</h3>
                <button
                  onClick={() => setShowJSON(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <pre className="text-green-400 text-sm overflow-x-auto max-h-96">
                {JSON.stringify(structuredResult.json, null, 2)}
              </pre>
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(structuredResult.json, null, 2));
                    alert('JSON copied to clipboard!');
                  }}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  📋 Copy JSON
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(structuredResult.json, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `prescription_analysis_${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  💾 Download JSON
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={resetScanner}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Scan Another Prescription
            </button>
            <button
              onClick={() => setShowJSON(!showJSON)}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              📊 {showJSON ? 'Hide' : 'Show'} JSON Output
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              📄 Save Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionScanner;
