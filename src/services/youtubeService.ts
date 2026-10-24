import {
  YouTubeTrack,
  YouTubePlaylist,
  YouTubePlayerState,
  GoogleUserProfile,
  YouTubeCategory,
} from '../types';

export const YOUTUBE_PRESET_TRACKS: YouTubeTrack[] = [
  {
    id: '5qap5aO4i9A',
    title: 'Synthwave Radio: Chill Retro Beats',
    artist: 'Lofi Girl',
    category: 'synthwave',
    duration: '24/7 Live',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
    description: 'Chill synthwave & retro cyberpunk stream for coding and deep space navigation.',
  },
  {
    id: 'jfKfPfyJRdk',
    title: 'Lofi Hip Hop Radio: Beats to Relax/Study',
    artist: 'Lofi Girl',
    category: 'lofi',
    duration: '24/7 Live',
    thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
    description: 'Iconic mellow lofi beats with warm vinyl crackle and soothing chords.',
  },
  {
    id: 'wOM_ep_eW68',
    title: 'Blade Runner 2049: Night City Ambient',
    artist: 'Atmospheric Cyberpunk',
    category: 'cyberpunk',
    duration: '3:00:00',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80',
    description: 'Rain drenched neon skyscrapers, holographic billboards, and synthetic analog drones.',
  },
  {
    id: 'S_MOd40tx54',
    title: 'Deep Cosmos Space Ambient Journey',
    artist: 'Stellar Soundscapes',
    category: 'space',
    duration: '4:00:00',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80',
    description: '4K orbital perspective with drifting nebulas and deep sub-bass cosmic frequencies.',
  },
  {
    id: 'UDVtMYqUAyw',
    title: 'Interstellar: Main Theme Organ Suite',
    artist: 'Hans Zimmer',
    category: 'classical',
    duration: '4:35',
    thumbnail: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&auto=format&fit=crop&q=80',
    description: 'Epic cathedral pipe organ resonance reflecting gravitational time dilation and singularity horizons.',
  },
  {
    id: 'v1K4EAXe2oo',
    title: '432 Hz Miracle Tone Harmonic Drone',
    artist: 'Harmonic Resonator',
    category: 'solfeggio',
    duration: '3:33:33',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80',
    description: 'Verdi tuning fundamental frequency calibrated for tranquility and biological cellular alignment.',
  },
  {
    id: '9ZfF_0UvZ_8',
    title: '963 Hz Pure Crown Solfeggio Frequency',
    artist: 'Neural Synthesis',
    category: 'solfeggio',
    duration: '2:22:22',
    thumbnail: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?w=400&auto=format&fit=crop&q=80',
    description: 'High-frequency pure sine matrix resonant with the polymorphic neural core.',
  },
  {
    id: '4xDzrJKXOOY',
    title: 'Night City Underbelly: Industrial Synth',
    artist: 'Cybercore Dynamics',
    category: 'cyberpunk',
    duration: '1:45:00',
    thumbnail: 'https://images.unsplash.com/photo-1515260268569-9271009adfdb?w=400&auto=format&fit=crop&q=80',
    description: 'Heavy basslines, arpeggiated synths, and futuristic industrial percussion.',
  },
  {
    id: 'mIYzp5rcTvU',
    title: 'Classical Focus: Piano & Strings Suite',
    artist: 'Bach & Chopin Enclave',
    category: 'classical',
    duration: '2:15:00',
    thumbnail: 'https://images.unsplash.com/photo-1520523839898-507127054976?w=400&auto=format&fit=crop&q=80',
    description: 'Pristine acoustic piano movements engineered for hyper-focused terminal execution.',
  },
  {
    id: '6rre0l65ZTY',
    title: 'ISS Orbital Station: Deep Cosmic Hum',
    artist: 'AeroAcoustic Lab',
    category: 'ambient',
    duration: '8:00:00',
    thumbnail: 'https://images.unsplash.com/photo-1447433589675-4aaa569f3e05?w=400&auto=format&fit=crop&q=80',
    description: 'Authentic pressurization rumble, ventilation hum, and low frequency telemetry from low Earth orbit.',
  },
];

export const CURATED_DYNAMIC_PLAYLISTS: YouTubePlaylist[] = [
  {
    id: 'pl_synthwave',
    title: '🌌 Synthwave & Retro Cyberpunk Chill Odyssey',
    description: 'Futuristic neon synth streams, deep basslines, and retro-futuristic spatial coding sounds.',
    category: 'synthwave',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
    youtubePlaylistId: 'PLrAl6sUv6n_3xWq3fJ7Dk2H_qN4V8tK_z',
    tracks: [
      YOUTUBE_PRESET_TRACKS[0], // 5qap5aO4i9A (Lofi Girl Synthwave)
      YOUTUBE_PRESET_TRACKS[2], // wOM_ep_eW68 (Blade Runner)
      YOUTUBE_PRESET_TRACKS[7], // 4xDzrJKXOOY (Night City)
      {
        id: 'MVPTGNGiI-4',
        title: 'Kavinsky - Nightcall (Retrowave Spatial Mix)',
        artist: 'Cyberwave Records',
        category: 'synthwave',
        duration: '4:20',
        thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'pl_lofi',
    title: '🎧 Lofi Girl Chill Hop Beats 24/7',
    description: 'Mellow vinyl crackles, relaxing rhodes keys, and serene lo-fi study hip hop rhythms.',
    category: 'lofi',
    thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
    youtubePlaylistId: 'PLofht4PTcKYnaH8w5gkDCtd842ma8562Z',
    tracks: [
      YOUTUBE_PRESET_TRACKS[1], // jfKfPfyJRdk (Lofi Hip Hop)
      {
        id: '7NOSDKb0HlU',
        title: 'Chillhop Yearmix - Best of Lofi Beats',
        artist: 'Chillhop Music',
        category: 'lofi',
        duration: '1:02:15',
        thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
      },
      {
        id: 'MCkTebktHVc',
        title: 'Warm Coffee & Rainy Window Lofi',
        artist: 'Mellow Dreamers',
        category: 'lofi',
        duration: '45:00',
        thumbnail: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'pl_space',
    title: '🛸 Deep Space & Orbital Station Ambient',
    description: 'Astral synthesizers, deep cosmic drones, and low-frequency orbital telemetry.',
    category: 'space',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80',
    youtubePlaylistId: 'PLk8e_b7wXU2f9W9RzU1M4k6vG7a2B4n8',
    tracks: [
      YOUTUBE_PRESET_TRACKS[3], // S_MOd40tx54 (Deep Cosmos)
      YOUTUBE_PRESET_TRACKS[9], // 6rre0l65ZTY (ISS Hum)
      YOUTUBE_PRESET_TRACKS[4], // UDVtMYqUAyw (Interstellar Organ)
      {
        id: 'sUtS52lqL5w',
        title: 'NASA Voyager Golden Record - Interstellar Sounds',
        artist: 'NASA JPL Archive',
        category: 'space',
        duration: '1:30:00',
        thumbnail: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'pl_solfeggio',
    title: '🧘 432Hz & 963Hz Solfeggio Harmonic Resonance',
    description: 'Cellular alignment frequencies, third-eye activation tones, and pure sine harmonics.',
    category: 'solfeggio',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80',
    youtubePlaylistId: 'PLvXyT384T3n8N9w0fG4E2b8N9w0fG4E2b',
    tracks: [
      YOUTUBE_PRESET_TRACKS[5], // v1K4EAXe2oo (432 Hz)
      YOUTUBE_PRESET_TRACKS[6], // 9ZfF_0UvZ_8 (963 Hz)
      {
        id: '5Z13P8n3VqM',
        title: '528 Hz Transformation & Miracles DNA Frequency',
        artist: 'Harmonic Miracle Matrix',
        category: 'solfeggio',
        duration: '2:00:00',
        thumbnail: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?w=400&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'pl_classical',
    title: '🎻 Classical Masterworks & Piano Focus',
    description: 'Deep focus acoustic compositions by Bach, Chopin, Satie, and Beethoven for mental clarity.',
    category: 'classical',
    thumbnail: 'https://images.unsplash.com/photo-1520523839898-507127054976?w=400&auto=format&fit=crop&q=80',
    youtubePlaylistId: 'PLfOs1ZtjYFMsDqIom_QdF7m7nK4h5nL3k',
    tracks: [
      YOUTUBE_PRESET_TRACKS[8], // mIYzp5rcTvU (Piano & Strings)
      YOUTUBE_PRESET_TRACKS[4], // UDVtMYqUAyw (Interstellar)
      {
        id: '4Tr0otuiQuU',
        title: 'Erik Satie - Gymnopedie No.1 & Gnossiennes Suite',
        artist: 'Acoustic Classical',
        category: 'classical',
        duration: '1:12:00',
        thumbnail: 'https://images.unsplash.com/photo-1520523839898-507127054976?w=400&auto=format&fit=crop&q=80',
      },
    ],
  },
];

export const DEFAULT_GOOGLE_USER: GoogleUserProfile = {
  email: '',
  name: 'Local YouTube Player',
  picture: '',
  isAuthenticated: false, // Never imply Google auth from a static fixture.
  lastLogin: '',
  accountType: 'guest',
  preferences: {
    defaultVideoMode: 'background',
    defaultOpacity: 0.85,
    defaultBlendWith3D: true,
    autoPlayOnLoad: true,
    harmonicFrequency: '432',
    preferredCategory: 'synthwave',
  },
};

export const DEFAULT_YOUTUBE_STATE: YouTubePlayerState = {
  active: false,
  currentTrack: YOUTUBE_PRESET_TRACKS[0],
  displayMode: 'background',
  isPlaying: false,
  volume: 75,
  isMuted: false,
  backgroundOpacity: 0.85,
  blendWith3D: true,
  showModal: false,
  activePlaylistId: 'pl_synthwave',
  currentTrackIndex: 0,
  shuffle: false,
  repeat: true,
  lastCommand: 'idle',
  userProfile: DEFAULT_GOOGLE_USER,
  customPlaylists: [],
};

class YouTubeService {
  /**
   * Extracts an 11-character YouTube video ID from any standard URL or raw string
   */
  public extractVideoId(input: string): string | null {
    if (!input) return null;
    const clean = input.trim();

    // Already 11 alphanumeric/dash/underscore chars?
    if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
      return clean;
    }

    // Standard watch URL: youtube.com/watch?v=ID or music.youtube.com/watch?v=ID
    const watchMatch = clean.match(/(?:youtube\.com|music\.youtube\.com)\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/i);
    if (watchMatch) return watchMatch[1];

    // Short URL: youtu.be/ID
    const shortMatch = clean.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
    if (shortMatch) return shortMatch[1];

    // Embed URL: youtube.com/embed/ID
    const embedMatch = clean.match(/youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})/i);
    if (embedMatch) return embedMatch[1];

    // Live URL: youtube.com/live/ID
    const liveMatch = clean.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/i);
    if (liveMatch) return liveMatch[1];

    return null;
  }

  /**
   * Extracts a YouTube Playlist ID from a URL or raw string
   */
  public extractPlaylistId(input: string): string | null {
    if (!input) return null;
    const clean = input.trim();

    // Standard playlist param: list=PL... or list=RD... or list=UU...
    const listMatch = clean.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
    if (listMatch) return listMatch[1];

    // Starts with PL, RD, UU, FL followed by alphanumeric/underscore/dash
    if (/^(PL|RD|UU|FL)[a-zA-Z0-9_-]{10,}$/i.test(clean)) {
      return clean;
    }

    return null;
  }

  /**
   * Search through presets or create a custom track if a direct URL/ID was supplied
   */
  public resolveTrack(queryOrUrl: string): YouTubeTrack {
    const extractedId = this.extractVideoId(queryOrUrl);
    if (extractedId) {
      // Check if it matches an existing preset
      const existing = YOUTUBE_PRESET_TRACKS.find((t) => t.id === extractedId);
      if (existing) return existing;

      // Create custom track
      return {
        id: extractedId,
        title: `YouTube Stream [${extractedId}]`,
        artist: 'User Selected Stream',
        category: 'custom',
        duration: 'Dynamic',
        thumbnail: `https://img.youtube.com/vi/${extractedId}/hqdefault.jpg`,
        description: `Custom YouTube stream piped directly into the HyperTerminal visual environment.`,
      };
    }

    // Try search by keyword in preset titles, artists, categories
    const q = queryOrUrl.toLowerCase().trim();
    const matched = YOUTUBE_PRESET_TRACKS.find(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
    );

    if (matched) return matched;

    // Default to the first synthwave preset if not found
    return YOUTUBE_PRESET_TRACKS[0];
  }

  /**
   * PostMessage command dispatcher to control the embedded YouTube iframe programmatically
   */
  public sendIframeCommand(iframe: HTMLIFrameElement | null, func: string, args: any[] = []): void {
    if (!iframe || !iframe.contentWindow) return;
    try {
      iframe.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func,
          args,
        }),
        'https://www.youtube-nocookie.com'
      );
    } catch {
      // Ignored for cross-origin security
    }
  }

  /**
   * Generates secure, high performance YouTube iframe embed URL for videos or native playlists
   */
  public buildEmbedUrl(
    target: { videoId?: string; playlistId?: string },
    autoplay = true,
    mute = false
  ): string {
    const params = new URLSearchParams({
      enablejsapi: '1',
      autoplay: autoplay ? '1' : '0',
      mute: mute ? '1' : '0',
      controls: '1',
      rel: '0',
      modestbranding: '1',
      iv_load_policy: '3',
      loop: '1',
      playsinline: '1',
    });

    if (target.playlistId) {
      params.set('listType', 'playlist');
      params.set('list', target.playlistId);
      if (target.videoId) {
        return `https://www.youtube-nocookie.com/embed/${target.videoId}?${params.toString()}`;
      }
      return `https://www.youtube-nocookie.com/embed?${params.toString()}`;
    }

    if (target.videoId) {
      params.set('playlist', target.videoId);
      return `https://www.youtube-nocookie.com/embed/${target.videoId}?${params.toString()}`;
    }

    return `https://www.youtube-nocookie.com/embed/${YOUTUBE_PRESET_TRACKS[0].id}?${params.toString()}`;
  }

  /**
   * Persistence helpers for Google user preferences & custom playlists
   */
  /**
   * The terminal stores player preferences only. LocalStorage is not a Google
   * OAuth session; a legacy "authenticated: true" value has no authority.
   */
  public getStoredProfile(): GoogleUserProfile {
    let saved: any = null;
    try {
      const raw = localStorage.getItem('hyperterminal_google_profile');
      if (raw) saved = JSON.parse(raw);
    } catch {}
    const prefs = saved?.preferences && typeof saved.preferences === 'object'
      ? saved.preferences : {};
    return {
      ...DEFAULT_GOOGLE_USER,
      isAuthenticated: false,
      email: '',
      name: 'Local YouTube Player',
      lastLogin: '',
      accountType: 'guest',
      preferences: { ...DEFAULT_GOOGLE_USER.preferences, ...prefs },
    };
  }

  public saveStoredProfile(profile: GoogleUserProfile): void {
    try {
      localStorage.setItem('hyperterminal_google_profile',
        JSON.stringify({ preferences: profile.preferences }));
    } catch {}
  }

  /** The real account and any login remain owned by YouTube in a top-level tab. */
  public getNativeWatchUrl(target: { videoId?: string; playlistId?: string } = {}): string {
    const video = target.videoId;
    const list = target.playlistId;
    if (video && !/^[A-Za-z0-9_-]{11}$/.test(video)) throw new TypeError('Invalid video ID');
    if (list && !/^[A-Za-z0-9_-]{12,150}$/.test(list)) throw new TypeError('Invalid playlist ID');
    const url = new URL('https://www.youtube.com/');
    if (video) {
      url.pathname = '/watch';
      url.searchParams.set('v', video);
      if (list) url.searchParams.set('list', list);
    } else if (list) {
      url.pathname = '/playlist';
      url.searchParams.set('list', list);
    }
    return url.toString();
  }

  public getStoredCustomPlaylists(): YouTubePlaylist[] {
    try {
      const stored = localStorage.getItem('hyperterminal_custom_playlists');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return [];
  }

  public saveStoredCustomPlaylists(playlists: YouTubePlaylist[]): void {
    try {
      localStorage.setItem('hyperterminal_custom_playlists', JSON.stringify(playlists));
    } catch {}
  }
}

export const youtubeService = new YouTubeService();
