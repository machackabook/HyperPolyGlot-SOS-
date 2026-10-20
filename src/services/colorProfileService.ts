/**
 * Color Profile Service & RGB-LED HSL Engine
 * Implements high-end rendering color profiles (ACEScg, DCI-P3, Rec.2020, QD-OLED, ARRI Filmic, etc.)
 * and dynamic HSL% hue gradient calculations for real-time 3D, canvas, and HUD modulation.
 */

export type RgbLedProfile =
  | 'ACEScg'
  | 'DCI-P3'
  | 'Rec.2020'
  | 'QD-OLED'
  | 'Arri-Filmic'
  | 'Cyber-Neon'
  | 'Aurora-HSL'
  | 'Bioluminescence';

export type RgbLedMode = 'cycle' | 'pulse' | 'static' | 'audio';

export interface RgbLedConfig {
  enabled: boolean;
  profile: RgbLedProfile;
  mode: RgbLedMode;
  huePercent: number; // 0 to 100% (maps to 0° - 360°)
  speed: number;      // 0.1 to 5.0x
  saturation: number; // 0 to 100%
  lightness: number;  // 0 to 100%
  spread: number;     // 10° to 180° hue gradient spread
  intensity: number;  // 0.2 to 2.5 glow multiplier
}

export interface RenderingColorProfileData {
  id: RgbLedProfile;
  name: string;
  tagline: string;
  standard: string;
  baseHue: number; // default starting hue in degrees
  palette: string[]; // key spectral gamut anchors
  gamutDescription: string;
  dynamicTone: 'linear' | 'filmic_log' | 'quantum_vivid' | 'hdr_wide' | 'phosphor';
}

export const COLOR_PROFILES: Record<RgbLedProfile, RenderingColorProfileData> = {
  'ACEScg': {
    id: 'ACEScg',
    name: 'ACEScg (AP1 Primaries)',
    tagline: 'Academy Color Encoding System - Computer Graphics Wide Gamut',
    standard: 'SMPTE ST 2065-1 / AP1',
    baseHue: 195,
    palette: ['#00e5ff', '#0c2266', '#ff7b00', '#8a2be2', '#e6fcff'],
    gamutDescription: 'Cinema VFX standard covering ultra-wide AP1 color space with filmic rolloff.',
    dynamicTone: 'filmic_log'
  },
  'DCI-P3': {
    id: 'DCI-P3',
    name: 'DCI-P3 Theatrical Cinema',
    tagline: 'SMPTE Digital Cinema Initiatives Master Theatrical Standard',
    standard: 'SMPTE RP 431-2',
    baseHue: 348,
    palette: ['#e50914', '#ffb800', '#00bd7e', '#00a8b5', '#1f0b2b'],
    gamutDescription: 'Theatrical cinema projection standard with rich deep crimsons and gold.',
    dynamicTone: 'hdr_wide'
  },
  'Rec.2020': {
    id: 'Rec.2020',
    name: 'Rec. 2020 Ultra HD HDR',
    tagline: 'ITU-R BT.2020 Wide Color Gamut Laser Projection',
    standard: 'ITU-R BT.2020',
    baseHue: 142,
    palette: ['#00ff41', '#ff0033', '#00ffff', '#9d00ff', '#ffffff'],
    gamutDescription: 'Ultra-wide laser gamut spanning pure monochromatic spectral emitters.',
    dynamicTone: 'quantum_vivid'
  },
  'QD-OLED': {
    id: 'QD-OLED',
    name: 'QD-OLED Micro-Spectral',
    tagline: 'Quantum Dot Direct RGB Emission Infinite Contrast',
    standard: 'Quantum Dot Photonic',
    baseHue: 215,
    palette: ['#2979ff', '#ff1744', '#00e676', '#aeea00', '#050a18'],
    gamutDescription: 'Pure monochromatic sub-pixel emission with razor-sharp saturation.',
    dynamicTone: 'quantum_vivid'
  },
  'Arri-Filmic': {
    id: 'Arri-Filmic',
    name: 'ARRI Wide Gamut 4 / LogC',
    tagline: 'Cinematic Filmic Tonal Roll-off & Natural Dynamic Range',
    standard: 'ARRI LogC4',
    baseHue: 32,
    palette: ['#d4883b', '#4a7b9d', '#ffb366', '#7bb29a', '#6c4f70'],
    gamutDescription: 'Tungsten and skin-tone harmonic curves with soft highlight roll-off.',
    dynamicTone: 'filmic_log'
  },
  'Cyber-Neon': {
    id: 'Cyber-Neon',
    name: 'Cyber-Neon Tokyo Lux',
    tagline: 'Hyper-saturated High-Contrast Cyberpunk Optical Profile',
    standard: 'Custom Luminescent',
    baseHue: 180,
    palette: ['#00f2ff', '#ff007f', '#39ff14', '#ffd700', '#7928ca'],
    gamutDescription: 'Ultra-saturated electric cyan, neon magenta, and radioactive lime.',
    dynamicTone: 'phosphor'
  },
  'Aurora-HSL': {
    id: 'Aurora-HSL',
    name: 'Aurora Borealis Polar HSL',
    tagline: 'Solar Wind Atmospheric Ionization Spectral Shimmer',
    standard: 'Geomagnetic Plasma',
    baseHue: 155,
    palette: ['#05ffa1', '#00e5ff', '#b967ff', '#fbee9e', '#0b1021'],
    gamutDescription: 'Ionized atmospheric wave: solar green, polar cyan, and celestial violet.',
    dynamicTone: 'linear'
  },
  'Bioluminescence': {
    id: 'Bioluminescence',
    name: 'Bioluminescent Abyssal',
    tagline: 'Deep Ocean Trench Photophore Emission Spectrum',
    standard: 'Deep Marine Bio',
    baseHue: 172,
    palette: ['#00d4ff', '#10ffa0', '#b347d9', '#ff5376', '#020817'],
    gamutDescription: 'Abyssal dinoflagellate and bathypelagic luciferyl fluorescence.',
    dynamicTone: 'phosphor'
  }
};

export const DEFAULT_RGB_LED_CONFIG: RgbLedConfig = {
  enabled: true,
  profile: 'ACEScg',
  mode: 'cycle',
  huePercent: 54, // ~195 deg (ACEScg primary base)
  speed: 1.0,
  saturation: 90,
  lightness: 54,
  spread: 72, // 72 degree aesthetic harmonic split
  intensity: 1.3
};

/**
 * Utility: Convert HSL (0-360, 0-100, 0-100) to Hex string
 */
export function hslToHex(h: number, s: number, l: number): string {
  const normH = ((h % 360) + 360) % 360;
  const normS = Math.max(0, Math.min(100, s)) / 100;
  const normL = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * normL - 1)) * normS;
  const x = c * (1 - Math.abs(((normH / 60) % 2) - 1));
  const m = normL - c / 2;
  let r = 0, g = 0, b = 0;

  if (normH >= 0 && normH < 60) {
    r = c; g = x; b = 0;
  } else if (normH >= 60 && normH < 120) {
    r = x; g = c; b = 0;
  } else if (normH >= 120 && normH < 180) {
    r = 0; g = c; b = x;
  } else if (normH >= 180 && normH < 240) {
    r = 0; g = x; b = c;
  } else if (normH >= 240 && normH < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (val: number) => {
    const hex = Math.round((val + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Compute the live RGB-LED state, hue angles, and color stops for any timestamp.
 */
export function computeRgbLedState(
  timeSeconds: number,
  config: RgbLedConfig,
  audioLevel: number = 0
) {
  if (!config.enabled) {
    return null;
  }

  const profileData = COLOR_PROFILES[config.profile] || COLOR_PROFILES['ACEScg'];

  let activeHueDeg = (config.huePercent / 100) * 360;

  switch (config.mode) {
    case 'cycle': {
      // Continuous smooth wave rotation around color wheel
      const cycleOffset = (timeSeconds * 30 * config.speed) % 360;
      activeHueDeg = (activeHueDeg + cycleOffset) % 360;
      break;
    }
    case 'pulse': {
      // Breathing sinusoidal hue oscillation around center hue
      const oscillation = Math.sin(timeSeconds * 2.5 * config.speed) * 45;
      activeHueDeg = (activeHueDeg + oscillation + 360) % 360;
      break;
    }
    case 'audio': {
      // Audio reactive hue pulse and flash
      const audioBump = audioLevel * 120 * config.speed;
      activeHueDeg = (activeHueDeg + audioBump) % 360;
      break;
    }
    case 'static':
    default:
      // Fixed at config.huePercent
      break;
  }

  const sat = Math.min(100, Math.max(20, config.saturation + (config.mode === 'audio' ? audioLevel * 20 : 0)));
  const light = Math.min(85, Math.max(25, config.lightness + (config.mode === 'audio' ? audioLevel * 25 : 0)));

  // Primary HSL color
  const primaryHsl = `hsl(${Math.round(activeHueDeg)}, ${Math.round(sat)}%, ${Math.round(light)}%)`;
  const primaryHex = hslToHex(activeHueDeg, sat, light);

  // Secondary HSL color offset by spread
  const secondaryHueDeg = (activeHueDeg + config.spread) % 360;
  const secondaryHsl = `hsl(${Math.round(secondaryHueDeg)}, ${Math.round(sat)}%, ${Math.round(light * 0.9)}%)`;
  const secondaryHex = hslToHex(secondaryHueDeg, sat, light * 0.9);

  // Tertiary accent HSL color
  const tertiaryHueDeg = (activeHueDeg + config.spread * 2) % 360;
  const tertiaryHsl = `hsl(${Math.round(tertiaryHueDeg)}, ${Math.round(sat)}%, ${Math.round(light * 1.1)}%)`;
  const tertiaryHex = hslToHex(tertiaryHueDeg, sat, light * 1.1);

  // Ambient tint (deep, rich low-light reflection)
  const ambientHsl = `hsl(${Math.round(activeHueDeg)}, ${Math.round(sat * 0.7)}%, 12%)`;
  const ambientHex = hslToHex(activeHueDeg, sat * 0.7, 12);

  // CSS gradient strings
  const cssGradient = `linear-gradient(90deg, ${primaryHsl} 0%, ${secondaryHsl} 50%, ${tertiaryHsl} 100%)`;
  const cssRadialGlow = `radial-gradient(circle at 50% 50%, ${primaryHex}22 0%, ${secondaryHex}11 50%, transparent 80%)`;

  // Hue percentage for display (0.0% to 100.0%)
  const currentHuePercent = ((activeHueDeg / 360) * 100);

  return {
    profile: profileData,
    activeHueDeg,
    currentHuePercent,
    primaryHex,
    secondaryHex,
    tertiaryHex,
    ambientHex,
    primaryHsl,
    secondaryHsl,
    tertiaryHsl,
    ambientHsl,
    cssGradient,
    cssRadialGlow,
    intensity: config.intensity,
    palette: profileData.palette
  };
}
