import { Location } from '@/types/outbreakTypes';

export class LocationService {
  private static instance: LocationService;
  private currentLocation: Location | null = null;
  private watchId: number | null = null;

  private constructor() {}

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Get current user location using browser geolocation API
   */
  public async getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };

          try {
            // Reverse geocoding to get address details
            const addressDetails = await this.reverseGeocode(location.latitude, location.longitude);
            const enrichedLocation = { ...location, ...addressDetails };
            this.currentLocation = enrichedLocation;
            resolve(enrichedLocation);
          } catch (error) {
            // Return basic location even if reverse geocoding fails
            this.currentLocation = location;
            resolve(location);
          }
        },
        (error) => {
          let errorMessage = 'Unable to retrieve location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          reject(new Error(errorMessage));
        },
        options
      );
    });
  }

  /**
   * Watch user location for continuous updates
   */
  public watchLocation(callback: (location: Location) => void, errorCallback?: (error: Error) => void): number {
    if (!navigator.geolocation) {
      if (errorCallback) {
        errorCallback(new Error('Geolocation is not supported by this browser'));
      }
      return -1;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000 // 1 minute
    };

    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        try {
          const addressDetails = await this.reverseGeocode(location.latitude, location.longitude);
          const enrichedLocation = { ...location, ...addressDetails };
          this.currentLocation = enrichedLocation;
          callback(enrichedLocation);
        } catch (error) {
          this.currentLocation = location;
          callback(location);
        }
      },
      (error) => {
        if (errorCallback) {
          let errorMessage = 'Unable to watch location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          errorCallback(new Error(errorMessage));
        }
      },
      options
    );

    return this.watchId;
  }

  /**
   * Stop watching location
   */
  public stopWatchingLocation(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Get cached current location
   */
  public getCachedLocation(): Location | null {
    return this.currentLocation;
  }

  /**
   * Calculate distance between two locations in kilometers
   */
  public calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check if location is within radius of another location
   */
  public isWithinRadius(
    userLat: number, 
    userLon: number, 
    targetLat: number, 
    targetLon: number, 
    radiusKm: number
  ): boolean {
    const distance = this.calculateDistance(userLat, userLon, targetLat, targetLon);
    return distance <= radiusKm;
  }

  /**
   * Request location permission
   */
  public async requestLocationPermission(): Promise<PermissionState> {
    if (!navigator.permissions) {
      throw new Error('Permissions API not supported');
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state;
    } catch (error) {
      throw new Error('Unable to check location permission');
    }
  }

  /**
   * Reverse geocoding to get address from coordinates
   * Using a mock implementation - in production, integrate with Google Maps API or similar
   */
  private async reverseGeocode(latitude: number, longitude: number): Promise<Partial<Location>> {
    // Mock implementation - replace with actual geocoding service
    try {
      // This is a simplified mock - in production, use Google Maps Geocoding API
      const mockAddresses = [
        {
          lat: 28.6139, lng: 77.2090, // Delhi
          city: 'New Delhi', state: 'Delhi', country: 'India', district: 'Central Delhi', pincode: '110001'
        },
        {
          lat: 19.0760, lng: 72.8777, // Mumbai
          city: 'Mumbai', state: 'Maharashtra', country: 'India', district: 'Mumbai City', pincode: '400001'
        },
        {
          lat: 12.9716, lng: 77.5946, // Bangalore
          city: 'Bangalore', state: 'Karnataka', country: 'India', district: 'Bangalore Urban', pincode: '560001'
        },
        {
          lat: 13.0827, lng: 80.2707, // Chennai
          city: 'Chennai', state: 'Tamil Nadu', country: 'India', district: 'Chennai', pincode: '600001'
        },
        {
          lat: 22.5726, lng: 88.3639, // Kolkata
          city: 'Kolkata', state: 'West Bengal', country: 'India', district: 'Kolkata', pincode: '700001'
        }
      ];

      // Find closest mock address
      let closestAddress = mockAddresses[0];
      let minDistance = this.calculateDistance(latitude, longitude, closestAddress.lat, closestAddress.lng);

      for (const address of mockAddresses) {
        const distance = this.calculateDistance(latitude, longitude, address.lat, address.lng);
        if (distance < minDistance) {
          minDistance = distance;
          closestAddress = address;
        }
      }

      // If within 50km, use the mock address, otherwise use generic India
      if (minDistance <= 50) {
        return {
          city: closestAddress.city,
          state: closestAddress.state,
          country: closestAddress.country,
          district: closestAddress.district,
          pincode: closestAddress.pincode
        };
      } else {
        return {
          city: 'Unknown City',
          state: 'Unknown State',
          country: 'India',
          district: 'Unknown District',
          pincode: 'Unknown'
        };
      }
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return {
        city: 'Unknown City',
        state: 'Unknown State',
        country: 'India'
      };
    }
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get location from IP address (fallback method)
   */
  public async getLocationFromIP(): Promise<Partial<Location>> {
    try {
      // Mock IP-based location - in production, use a service like ipapi.co
      return {
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        latitude: 28.6139,
        longitude: 77.2090
      };
    } catch (error) {
      throw new Error('Unable to get location from IP');
    }
  }

  /**
   * Get user's preferred location from localStorage
   */
  public getSavedLocation(): Location | null {
    try {
      const saved = localStorage.getItem('userLocation');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Save user's location to localStorage
   */
  public saveLocation(location: Location): void {
    try {
      localStorage.setItem('userLocation', JSON.stringify(location));
    } catch (error) {
      console.warn('Unable to save location to localStorage:', error);
    }
  }

  /**
   * Clear saved location
   */
  public clearSavedLocation(): void {
    try {
      localStorage.removeItem('userLocation');
    } catch (error) {
      console.warn('Unable to clear saved location:', error);
    }
  }
}

export const locationService = LocationService.getInstance();
