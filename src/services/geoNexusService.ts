import { audioVoiceService } from './audioVoiceService';

/**
 * Browser-provided location is useful for TerraSphere, but never establishes
 * hardware identity or protection against mock locations on its own.
 *
 * Coordinates are session-local and are not transmitted to geocoders,
 * telemetry ingestion or GAIA Memory automatically.
 */
export interface GeoTelemetry {
  lat: number;
  lng: number;
  plusCode: string;
  address: string;
  weather: { temp: number; description: string; humidity: number; windSpeed: number } | null;
  status: 'active' | 'searching' | 'error';
  accuracyMeters?: number | null;
  observedAt?: string | null;
  source?: 'browser-geolocation' | 'none';
  deviceAttested?: false;
}
class GeoNexusService {
  private telemetry: GeoTelemetry = {
    lat: 0, lng: 0, plusCode: 'N/A', address: 'NOT_RESOLVED', weather: null,
    status: 'searching', accuracyMeters: null, observedAt: null,
    source: 'none', deviceAttested: false
  };
  private listeners = new Set<(telemetry: GeoTelemetry) => void>();
  private generation = 0;
  public onTelemetryChange(fn: (value: GeoTelemetry) => void) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }
  private notify() {
    for (const listener of this.listeners) {
      try { listener(this.getTelemetry()); } catch { /* observer isolation */ }
    }
  }
  public getTelemetry(): GeoTelemetry {
    return { ...this.telemetry, weather: this.telemetry.weather ? { ...this.telemetry.weather } : null };
  }
  public clearLocation() {
    // Revokes access to any stored coordinate inside this page instance.
    this.generation++;
    this.telemetry = {
      lat: 0, lng: 0, plusCode: 'N/A', address: 'NOT_RESOLVED',
      weather: null, status: 'searching', accuracyMeters: null,
      observedAt: null, source: 'none', deviceAttested: false
    };
    this.notify();
  }
  public async syncTerminalWithGeo(): Promise<GeoTelemetry> {
    // Must be invoked from an explicit user action; never on page load.
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.telemetry.status='error';this.notify();
      throw new Error('Geolocation unavailable in this browser');
    }
    const request = ++this.generation;
    this.telemetry.status='searching';this.notify();
    return new Promise((resolve,reject)=>{
      navigator.geolocation.getCurrentPosition(pos=>{
        if (request !== this.generation) {
          reject(new Error('Location request cancelled'));return;
        }
        const {latitude,longitude,accuracy}=pos.coords;
        if (!Number.isFinite(latitude)||!Number.isFinite(longitude)||
            latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
          this.telemetry.status='error';this.notify();reject(new Error('Invalid location reading'));return;
        }
        this.telemetry = {
          lat: latitude, lng: longitude, accuracyMeters: accuracy,
          plusCode: 'N/A', address: 'LOCAL_BROWSER_FIX',
          weather: null, status: 'active',
          observedAt: new Date(pos.timestamp||Date.now()).toISOString(),
          source: 'browser-geolocation', deviceAttested: false
        };
        this.notify();
        // Never speak latitude/longitude aloud or claim verified physical identity.
        void audioVoiceService.speak('TerraSphere location available for this session. Device attestation remains unverified.');
        resolve(this.getTelemetry());
      },err=>{
        if (request!==this.generation)return;
        this.telemetry.status='error';this.notify();
        reject(new Error('Browser geolocation not available: '+err.code));
      },{enableHighAccuracy:true,maximumAge:0,timeout:12000});
    });
  }
}
export const geoNexusService = new GeoNexusService();
