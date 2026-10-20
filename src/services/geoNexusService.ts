import { audioVoiceService } from './audioVoiceService';

export interface GeoTelemetry {
  lat: number;
  lng: number;
  plusCode: string;
  address: string;
  weather: {
    temp: number;
    description: string;
    humidity: number;
    windSpeed: number;
  } | null;
  status: 'active' | 'searching' | 'error';
}

class GeoNexusService {
  private telemetry: GeoTelemetry = {
    lat: 0,
    lng: 0,
    plusCode: 'N/A',
    address: 'ORBITAL_VOID',
    weather: null,
    status: 'searching'
  };

  private listeners: ((telemetry: GeoTelemetry) => void)[] = [];

  constructor() {
    this.startTracking();
  }

  public onTelemetryChange(cb: (telemetry: GeoTelemetry) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(l => l({ ...this.telemetry }));
  }

  public getTelemetry() {
    return { ...this.telemetry };
  }

  private async startTracking() {
    if (!navigator.geolocation) {
      this.telemetry.status = 'error';
      this.notify();
      return;
    }

    navigator.geolocation.watchPosition(
      (pos) => {
        this.updatePosition(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.warn('[GeoNexus] Error tracking position:', err.message);
        this.telemetry.status = 'error';
        this.notify();
      },
      { enableHighAccuracy: true }
    );
  }

  private async updatePosition(lat: number, lng: number) {
    const isNew = Math.abs(this.telemetry.lat - lat) > 0.0001 || Math.abs(this.telemetry.lng - lng) > 0.0001;
    
    this.telemetry.lat = lat;
    this.telemetry.lng = lng;
    this.telemetry.status = 'active';

    if (isNew) {
      await this.refreshGeoData(lat, lng);
    } else {
      this.notify();
    }
  }

  private async refreshGeoData(lat: number, lng: number) {
    try {
      // 1. Geocode for address and Plus Code
      const geoResp = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
      if (geoResp.ok) {
        const geoData = await geoResp.json();
        if (geoData.results && geoData.results[0]) {
          this.telemetry.address = geoData.results[0].formatted_address;
          this.telemetry.plusCode = geoData.plus_code?.global_code || 'N/A';
        }
      }

      // 2. Weather Data
      const weatherResp = await fetch(`/api/weather?lat=${lat}&lng=${lng}`);
      if (weatherResp.ok) {
        const weatherData = await weatherResp.json();
        // Assuming Weather API structure from GMP
        // CurrentConditions lookup returns an object with condition and temperature
        const current = weatherData;
        if (current) {
          this.telemetry.weather = {
            temp: current.temperature?.value || 0,
            description: current.condition?.description || 'Clear',
            humidity: current.humidity?.value || 0,
            windSpeed: current.windSpeed?.value || 0
          };
        }
      }
    } catch (err) {
      console.error('[GeoNexus] Data refresh failed:', err);
    } finally {
      this.notify();
    }
  }

  public async syncTerminalWithGeo() {
    audioVoiceService.speak(`Synchronizing terminal with physical coordinates at ${this.telemetry.plusCode}. Initializing Earth descent protocol.`);
    return this.telemetry;
  }
}

export const geoNexusService = new GeoNexusService();
