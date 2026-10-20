import React, { useEffect, useState, useRef } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Map3D } from '@vis.gl/react-google-maps/3d';
import { motion, AnimatePresence } from 'framer-motion';
import { GeoTelemetry, geoNexusService } from '../services/geoNexusService';

interface EarthNasaOverlayProps {
  active: boolean;
}

export const EarthNasaOverlay: React.FC<EarthNasaOverlayProps> = ({ active }) => {
  const [telemetry, setTelemetry] = useState<GeoTelemetry>(geoNexusService.getTelemetry());
  const [cameraProps, setCameraProps] = useState({
    center: { lat: 0, lng: 0, altitude: 20000000 },
    range: 50000000,
    heading: 0,
    tilt: 0
  });

  const map3dRef = useRef<any>(null);

  useEffect(() => {
    return geoNexusService.onTelemetryChange((newTel) => {
      setTelemetry(newTel);
    });
  }, []);

  useEffect(() => {
    if (active && telemetry.status === 'active') {
      // Start Earth Descent Animation
      setTimeout(() => {
        setCameraProps({
          center: { lat: telemetry.lat, lng: telemetry.lng, altitude: 5000 },
          range: 8000,
          heading: 45,
          tilt: 65
        });
      }, 1000);
    } else {
      // Reset to Space
      setCameraProps({
        center: { lat: 0, lng: 0, altitude: 20000000 },
        range: 50000000,
        heading: 0,
        tilt: 0
      });
    }
  }, [active, telemetry.lat, telemetry.lng, telemetry.status]);

  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!API_KEY) return null;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
          className="fixed inset-0 z-5 w-full h-full pointer-events-auto"
        >
          <APIProvider apiKey={API_KEY} version="alpha">
            <Map3D
              {...cameraProps}
              mode="SATELLITE"
              defaultLabelsDisabled
              style={{ width: '100%', height: '100%' }}
              internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
            />
          </APIProvider>

          {/* GeoWeather HUD Overlay */}
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute bottom-24 right-6 z-20 p-4 bg-slate-950/80 border border-cyan-500/30 rounded-xl backdrop-blur-md text-[10px] font-mono text-cyan-300 w-64 shadow-[0_0_30px_rgba(0,242,255,0.1)]"
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1 mb-1">
                <span className="font-bold text-white tracking-widest">GEOWEATHER SUBSTRATE</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              
              <div className="space-y-0.5 opacity-80">
                <div className="flex justify-between">
                  <span>LATITUDE:</span>
                  <span className="text-white">{telemetry.lat.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span>LONGITUDE:</span>
                  <span className="text-white">{telemetry.lng.toFixed(6)}</span>
                </div>
              </div>

              <div className="pt-1 text-[9px] border-t border-cyan-500/10">
                <div className="text-cyan-400/60 uppercase">Plus Code Registry</div>
                <div className="text-white truncate">{telemetry.plusCode}</div>
              </div>

              <div className="pt-1 text-[9px] border-t border-cyan-500/10">
                <div className="text-cyan-400/60 uppercase">Sovereign Physical Node</div>
                <div className="text-white leading-tight">{telemetry.address}</div>
              </div>

              {telemetry.weather && (
                <div className="mt-2 p-2 bg-cyan-500/10 rounded border border-cyan-500/20">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-[14px] font-bold text-white">{telemetry.weather.temp}°C</span>
                    <span className="text-emerald-400 font-bold uppercase">{telemetry.weather.description}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[8px] text-cyan-300/70">
                    <div>HUMIDITY: <span className="text-white">{telemetry.weather.humidity}%</span></div>
                    <div>WIND: <span className="text-white">{telemetry.weather.windSpeed}m/s</span></div>
                  </div>
                </div>
              )}
              
              <div className="text-[8px] text-slate-500 mt-1 italic">
                Source: Google Maps Platform // Aurora Nexus
              </div>
            </div>
          </motion.div>

          {/* Crosshair / Scanline effect for Map */}
          <div className="absolute inset-0 pointer-events-none border-[40px] border-black/10 mix-blend-overlay" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none opacity-20">
             <div className="absolute inset-0 border border-cyan-500/30 rounded-full animate-ping" />
             <div className="absolute inset-0 border border-cyan-500/50 rounded-full" />
             <div className="absolute top-1/2 left-0 w-full h-[1px] bg-cyan-500/30" />
             <div className="absolute top-0 left-1/2 w-[1px] h-full bg-cyan-500/30" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
