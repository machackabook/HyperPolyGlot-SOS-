import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  Maximize2,
  X,
  Tv,
  Layers,
  Sparkles,
  Search,
  Sliders,
  Eye,
  ListMusic,
  UserCheck,
  LogOut,
  LogIn,
  Plus,
  Trash2,
  Check,
  FolderPlus,
  Shuffle,
  Repeat,
  Share2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  EnvironmentState,
  YouTubeTrack,
  YouTubePlaylist,
  GoogleUserProfile,
  YouTubeCategory,
} from '../types';
import {
  youtubeService,
  YOUTUBE_PRESET_TRACKS,
  CURATED_DYNAMIC_PLAYLISTS,
  DEFAULT_GOOGLE_USER,
} from '../services/youtubeService';
import { computeRgbLedState } from '../services/colorProfileService';

interface YouTubeBackgroundPlayerProps {
  envState: EnvironmentState;
  setEnvState: React.Dispatch<React.SetStateAction<EnvironmentState>>;
}

export const YouTubeBackgroundPlayer: React.FC<YouTubeBackgroundPlayerProps> = ({
  envState,
  setEnvState,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customInput, setCustomInput] = useState('');
  const [isMiniHudCollapsed, setIsMiniHudCollapsed] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'playlists' | 'tracks' | 'custom' | 'google_auth'>('playlists');

  // Custom playlist builder modal state
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [newPlaylistCategory, setNewPlaylistCategory] = useState<YouTubeCategory>('synthwave');
  const [newTrackUrl, setNewTrackUrl] = useState('');
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [activeCustomPlaylistId, setActiveCustomPlaylistId] = useState<string | null>(null);

  // Preference notification
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const yt = envState.youtube;
  const isPlaying = yt.isPlaying;
  const liveLed = envState.rgbLed?.enabled
    ? computeRgbLedState(Date.now() / 1000, envState.rgbLed)
    : null;

  // Active playlist resolution
  const allPlaylists: YouTubePlaylist[] = [
    ...CURATED_DYNAMIC_PLAYLISTS,
    ...(yt.customPlaylists || []),
  ];

  const currentPlaylist = allPlaylists.find((p) => p.id === yt.activePlaylistId) || CURATED_DYNAMIC_PLAYLISTS[0];

  // Handle Play/Pause
  const togglePlay = () => {
    const nextPlay = !isPlaying;
    setEnvState((prev) => ({
      ...prev,
      youtube: { ...prev.youtube, isPlaying: nextPlay, active: true },
    }));
    youtubeService.sendIframeCommand(iframeRef.current, nextPlay ? 'playVideo' : 'pauseVideo');
  };

  // Play a specific single track
  const playTrack = (track: YouTubeTrack, playlistId?: string, trackIndex = 0) => {
    setEnvState((prev) => ({
      ...prev,
      youtube: {
        ...prev.youtube,
        active: true,
        isPlaying: true,
        currentTrack: track,
        activePlaylistId: playlistId || prev.youtube.activePlaylistId,
        currentTrackIndex: trackIndex,
      },
    }));
  };

  // Play an entire dynamic playlist
  const playPlaylist = (playlist: YouTubePlaylist) => {
    if (playlist.tracks.length === 0) return;
    setEnvState((prev) => ({
      ...prev,
      youtube: {
        ...prev.youtube,
        active: true,
        isPlaying: true,
        activePlaylistId: playlist.id,
        currentTrack: playlist.tracks[0],
        currentTrackIndex: 0,
      },
    }));
  };

  // Next Track in active playlist
  const playNext = () => {
    const list = currentPlaylist?.tracks || YOUTUBE_PRESET_TRACKS;
    if (list.length === 0) return;
    let nextIndex = (yt.currentTrackIndex + 1) % list.length;
    if (yt.shuffle && list.length > 1) {
      nextIndex = Math.floor(Math.random() * list.length);
    }
    const nextTrack = list[nextIndex];
    playTrack(nextTrack, currentPlaylist?.id, nextIndex);
  };

  // Previous Track in active playlist
  const playPrev = () => {
    const list = currentPlaylist?.tracks || YOUTUBE_PRESET_TRACKS;
    if (list.length === 0) return;
    const prevIndex = (yt.currentTrackIndex - 1 + list.length) % list.length;
    const prevTrack = list[prevIndex];
    playTrack(prevTrack, currentPlaylist?.id, prevIndex);
  };

  // Handle Custom Input / URL / Playlist ID
  const handleLoadCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customInput.trim()) return;

    // Check if input is a playlist URL / ID
    const playlistId = youtubeService.extractPlaylistId(customInput);
    if (playlistId) {
      const dynamicPlaylist: YouTubePlaylist = {
        id: `pl_custom_${Date.now()}`,
        title: `Dynamic YouTube Playlist [${playlistId}]`,
        description: 'Dynamically imported YouTube native playlist stream.',
        category: 'custom',
        thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
        youtubePlaylistId: playlistId,
        isCustom: true,
        tracks: [
          {
            id: playlistId,
            title: `Playlist Stream [${playlistId}]`,
            artist: 'YouTube Playlist',
            category: 'custom',
            duration: 'Continuous',
            thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
          },
        ],
      };

      setEnvState((prev) => ({
        ...prev,
        youtube: {
          ...prev.youtube,
          active: true,
          isPlaying: true,
          activePlaylistId: dynamicPlaylist.id,
          currentTrack: dynamicPlaylist.tracks[0],
          customPlaylists: [dynamicPlaylist, ...(prev.youtube.customPlaylists || [])],
        },
      }));
      setCustomInput('');
      setSaveToast(`Imported dynamic playlist [${playlistId}]!`);
      setTimeout(() => setSaveToast(null), 3000);
      return;
    }

    // Otherwise resolve track
    const resolved = youtubeService.resolveTrack(customInput);
    playTrack(resolved);
    setCustomInput('');
  };

  // Google Sign-In / Switch User handler
  const handleToggleGoogleAuth = () => {
    const isCurrentlyAuth = yt.userProfile.isAuthenticated;
    const nextAuth = !isCurrentlyAuth;
    const updatedProfile: GoogleUserProfile = {
      ...yt.userProfile,
      isAuthenticated: nextAuth,
      accountType: nextAuth ? 'sovereign_operator' : 'guest',
      lastLogin: new Date().toISOString(),
    };

    setEnvState((prev) => ({
      ...prev,
      youtube: {
        ...prev.youtube,
        userProfile: updatedProfile,
      },
    }));

    youtubeService.saveStoredProfile(updatedProfile);
    setSaveToast(nextAuth ? 'Signed in with Google Account (machackabook@gmail.com)' : 'Signed out to Guest Mode');
    setTimeout(() => setSaveToast(null), 3500);
  };

  // Update User Preference Customization
  const handleUpdatePreference = <K extends keyof GoogleUserProfile['preferences']>(
    key: K,
    value: GoogleUserProfile['preferences'][K]
  ) => {
    const updatedProfile: GoogleUserProfile = {
      ...yt.userProfile,
      preferences: {
        ...yt.userProfile.preferences,
        [key]: value,
      },
    };

    setEnvState((prev) => ({
      ...prev,
      youtube: {
        ...prev.youtube,
        userProfile: updatedProfile,
        // Apply immediately if it affects player
        ...(key === 'defaultVideoMode' ? { displayMode: value as any } : {}),
        ...(key === 'defaultOpacity' ? { backgroundOpacity: value as any } : {}),
        ...(key === 'defaultBlendWith3D' ? { blendWith3D: value as any } : {}),
      },
      ...(key === 'harmonicFrequency' ? { harmonicResonance: value as any } : {}),
    }));

    youtubeService.saveStoredProfile(updatedProfile);
    setSaveToast(`Saved preference: ${String(key)} = ${String(value)}`);
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Create New Custom Playlist
  const handleCreateCustomPlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim()) return;

    const newPl: YouTubePlaylist = {
      id: `pl_user_${Date.now()}`,
      title: newPlaylistTitle.trim(),
      description: 'Personalized user playlist authenticated via Google Sovereign Account.',
      category: newPlaylistCategory,
      thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
      isCustom: true,
      createdAt: new Date().toLocaleDateString(),
      tracks: [],
    };

    const nextCustom = [...(yt.customPlaylists || []), newPl];
    setEnvState((prev) => ({
      ...prev,
      youtube: {
        ...prev.youtube,
        customPlaylists: nextCustom,
        activePlaylistId: newPl.id,
      },
    }));

    youtubeService.saveStoredCustomPlaylists(nextCustom);
    setNewPlaylistTitle('');
    setActiveCustomPlaylistId(newPl.id);
    setSaveToast(`Created custom playlist: "${newPl.title}"`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Add track to custom playlist
  const handleAddTrackToCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomPlaylistId || !newTrackUrl.trim()) return;

    const resolved = youtubeService.resolveTrack(newTrackUrl.trim());
    if (newTrackTitle.trim()) {
      resolved.title = newTrackTitle.trim();
    }

    const nextCustom = (yt.customPlaylists || []).map((pl) => {
      if (pl.id === activeCustomPlaylistId) {
        return {
          ...pl,
          tracks: [...pl.tracks, resolved],
        };
      }
      return pl;
    });

    setEnvState((prev) => ({
      ...prev,
      youtube: {
        ...prev.youtube,
        customPlaylists: nextCustom,
      },
    }));

    youtubeService.saveStoredCustomPlaylists(nextCustom);
    setNewTrackUrl('');
    setNewTrackTitle('');
    setSaveToast(`Added "${resolved.title}" to playlist!`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Delete Custom Playlist
  const handleDeleteCustomPlaylist = (playlistId: string) => {
    const nextCustom = (yt.customPlaylists || []).filter((p) => p.id !== playlistId);
    setEnvState((prev) => ({
      ...prev,
      youtube: {
        ...prev.youtube,
        customPlaylists: nextCustom,
        activePlaylistId: prev.youtube.activePlaylistId === playlistId ? CURATED_DYNAMIC_PLAYLISTS[0].id : prev.youtube.activePlaylistId,
      },
    }));
    youtubeService.saveStoredCustomPlaylists(nextCustom);
  };

  // Target object for iframe embed
  const embedTarget = currentPlaylist?.youtubePlaylistId
    ? { playlistId: currentPlaylist.youtubePlaylistId, videoId: yt.currentTrack.id }
    : { videoId: yt.currentTrack.id };

  return (
    <>
      {/* 1. BACKGROUND VIDEO LAYER (Rendered behind Three.js / Terminal) */}
      {yt.active && yt.displayMode === 'background' && (
        <div
          className="absolute inset-0 w-full h-full overflow-hidden transition-opacity duration-700 ease-in-out pointer-events-none select-none z-0"
          style={{
            opacity: yt.backgroundOpacity,
          }}
        >
          {/* Scaled Full-Bleed YouTube Iframe to avoid black bars */}
          <div className="absolute inset-0 w-full h-full flex items-center justify-center">
            <iframe
              ref={iframeRef}
              key={`${yt.currentTrack.id}-${currentPlaylist?.youtubePlaylistId || 'none'}`}
              src={youtubeService.buildEmbedUrl(embedTarget, yt.isPlaying, yt.isMuted)}
              title={yt.currentTrack.title}
              className="w-[110vw] h-[110vh] max-w-none pointer-events-none border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Ambient Vignette & RGB-LED Reactive Rim */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: liveLed
                ? `inset 0 0 100px ${liveLed.primaryHex}35, inset 0 0 40px #02050b`
                : 'inset 0 0 100px rgba(0, 242, 255, 0.25), inset 0 0 40px #02050b',
              background: 'radial-gradient(ellipse at center, transparent 40%, rgba(2, 5, 11, 0.45) 100%)',
            }}
          />
        </div>
      )}

      {/* 2. BACKGROUND VIDEO HUD CONTROLS (Discreet corner widget when in background mode) */}
      {yt.active && yt.displayMode === 'background' && (
        <div className="fixed bottom-4 right-4 z-20 font-mono text-xs select-none">
          {isMiniHudCollapsed ? (
            <button
              onClick={() => setIsMiniHudCollapsed(false)}
              className="px-3 py-1.5 rounded-xl border border-cyan-400/50 bg-black/85 backdrop-blur-md text-cyan-300 shadow-[0_0_15px_rgba(0,242,255,0.3)] flex items-center gap-2 hover:bg-cyan-500/20 text-xs font-bold transition cursor-pointer"
              title="Expand YouTube Music & Playlist Telemetry"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <Tv className="w-3.5 h-3.5 text-red-400" />
              <span className="truncate max-w-[150px]">{yt.currentTrack.title}</span>
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-black/90 backdrop-blur-xl border border-cyan-500/40 shadow-[0_0_25px_rgba(0,242,255,0.25)] flex flex-col gap-2 max-w-sm">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 border-b border-cyan-500/20 pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <Tv className="w-3.5 h-3.5 text-red-400" />
                  <span className="font-bold text-white text-[11px] truncate max-w-[160px]">
                    {yt.currentTrack.title}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setEnvState((prev) => ({
                        ...prev,
                        youtube: { ...prev.youtube, showModal: true },
                      }))
                    }
                    className="p-1 text-cyan-300 hover:text-white rounded hover:bg-cyan-500/20 cursor-pointer"
                    title="Open YouTube Music & Playlist Hub"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsMiniHudCollapsed(true)}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                    title="Collapse HUD"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Playlist info */}
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="truncate max-w-[180px] text-slate-300">
                  {currentPlaylist?.title || yt.currentTrack.artist}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 uppercase font-bold text-[9px]">
                  {yt.currentTrackIndex + 1}/{currentPlaylist?.tracks?.length || 1}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-1.5 pt-1">
                <div className="flex items-center gap-1">
                  {/* Prev */}
                  <button
                    onClick={playPrev}
                    className="p-1.5 rounded-lg bg-black/40 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                    title="Previous Track in Playlist"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>

                  {/* Play/Pause */}
                  <button
                    onClick={togglePlay}
                    className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-300 border border-cyan-500/40 cursor-pointer"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>

                  {/* Next */}
                  <button
                    onClick={playNext}
                    className="p-1.5 rounded-lg bg-black/40 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                    title="Next Track in Playlist"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>

                  {/* Mute */}
                  <button
                    onClick={() => {
                      const nextMute = !yt.isMuted;
                      setEnvState((prev) => ({
                        ...prev,
                        youtube: { ...prev.youtube, isMuted: nextMute },
                      }));
                      youtubeService.sendIframeCommand(
                        iframeRef.current,
                        nextMute ? 'mute' : 'unMute'
                      );
                    }}
                    className={`p-1.5 rounded-lg border cursor-pointer ${
                      yt.isMuted
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-black/40 text-slate-300 border-slate-800 hover:text-white'
                    }`}
                    title={yt.isMuted ? 'Unmute' : 'Mute'}
                  >
                    {yt.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* 3D Blend Toggle */}
                <button
                  onClick={() =>
                    setEnvState((prev) => ({
                      ...prev,
                      youtube: { ...prev.youtube, blendWith3D: !prev.youtube.blendWith3D },
                    }))
                  }
                  className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                    yt.blendWith3D
                      ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400 shadow-[0_0_8px_rgba(0,242,255,0.3)]'
                      : 'bg-black/40 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="Toggle 3D Visualizer Canvas Blending Over Video"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>3D BLEND</span>
                </button>

                {/* Opacity Cycle */}
                <button
                  onClick={() => {
                    const next = yt.backgroundOpacity <= 0.4 ? 0.7 : yt.backgroundOpacity <= 0.75 ? 1.0 : 0.35;
                    setEnvState((prev) => ({
                      ...prev,
                      youtube: { ...prev.youtube, backgroundOpacity: next },
                    }));
                  }}
                  className="px-2 py-1 rounded-lg bg-black/40 border border-slate-800 text-slate-300 hover:text-white text-[10px] transition cursor-pointer"
                  title="Cycle Background Video Opacity"
                >
                  {(yt.backgroundOpacity * 100).toFixed(0)}%
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. FLOATING PIP (PICTURE-IN-PICTURE) WIDGET */}
      {yt.active && yt.displayMode === 'pip' && (
        <div className="fixed top-16 right-6 z-30 w-80 rounded-2xl bg-black/90 backdrop-blur-xl border border-cyan-500/50 shadow-[0_0_30px_rgba(0,242,255,0.3)] p-3 font-mono text-xs flex flex-col gap-2">
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-cyan-500/20">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <Tv className="w-3.5 h-3.5 text-red-400" />
              <span className="font-bold text-white text-[11px] truncate max-w-[170px]">
                {yt.currentTrack.title}
              </span>
            </div>
            <button
              onClick={() =>
                setEnvState((prev) => ({
                  ...prev,
                  youtube: { ...prev.youtube, displayMode: 'background' },
                }))
              }
              className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-300 border border-cyan-400/40 text-[9px] font-bold cursor-pointer flex items-center gap-1"
              title="Transition Video into 100% Background"
            >
              <Maximize2 className="w-2.5 h-2.5" />
              <span>BG MODE</span>
            </button>
          </div>

          {/* Video Frame */}
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800">
            <iframe
              ref={iframeRef}
              src={youtubeService.buildEmbedUrl(embedTarget, yt.isPlaying, yt.isMuted)}
              title={yt.currentTrack.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Transition to Background Button */}
          <button
            onClick={() =>
              setEnvState((prev) => ({
                ...prev,
                youtube: { ...prev.youtube, displayMode: 'background' },
              }))
            }
            className="w-full py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,242,255,0.4)] cursor-pointer transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>TRANSITION TO BACKGROUND RENDERER</span>
          </button>
        </div>
      )}

      {/* 4. YOUTUBE MUSIC SELECTION, PLAYLISTS & GOOGLE AUTH HUB MODAL */}
      {yt.showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
          <div className="w-full max-w-4xl max-h-[92vh] bg-slate-950/95 border border-cyan-500/60 rounded-2xl shadow-[0_0_50px_rgba(0,242,255,0.35)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-black/60 border-b border-cyan-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.35)]">
                  <Tv className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>YOUTUBE NATIVE MUSIC & DYNAMIC PLAYLIST ENGINE</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-300 border border-red-500/40">
                      GOOGLE AUTH LINKED
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Log in natively to select dynamic video playlists and customize visual background rendering.
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setEnvState((prev) => ({
                    ...prev,
                    youtube: { ...prev.youtube, showModal: false },
                  }))
                }
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification Toast */}
            {saveToast && (
              <div className="px-4 py-2 bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>{saveToast}</span>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between px-4 bg-black/40 border-b border-cyan-500/20 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveModalTab('playlists')}
                  className={`py-2.5 px-3 font-bold border-b-2 flex items-center gap-1.5 cursor-pointer transition ${
                    activeModalTab === 'playlists'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <ListMusic className="w-3.5 h-3.5" />
                  <span>DYNAMIC PLAYLISTS</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 font-mono">
                    {allPlaylists.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveModalTab('tracks')}
                  className={`py-2.5 px-3 font-bold border-b-2 flex items-center gap-1.5 cursor-pointer transition ${
                    activeModalTab === 'tracks'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>SINGLE STREAMS</span>
                </button>

                <button
                  onClick={() => setActiveModalTab('custom')}
                  className={`py-2.5 px-3 font-bold border-b-2 flex items-center gap-1.5 cursor-pointer transition ${
                    activeModalTab === 'custom'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>CUSTOM PLAYLIST CREATOR</span>
                </button>
              </div>

              {/* Google Auth Status & Switcher Button */}
              <button
                onClick={() => setActiveModalTab('google_auth')}
                className={`py-1.5 px-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition text-[11px] ${
                  activeModalTab === 'google_auth'
                    ? 'bg-red-500/20 border-red-400 text-red-300'
                    : 'bg-black/40 border-slate-800 text-slate-300 hover:border-red-500/40'
                }`}
              >
                <div className="w-4 h-4 rounded-full overflow-hidden border border-slate-700 shrink-0">
                  <img
                    src={yt.userProfile.picture}
                    alt={yt.userProfile.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-bold truncate max-w-[130px]">
                  {yt.userProfile.isAuthenticated ? yt.userProfile.email : 'Google Sign-In'}
                </span>
                {yt.userProfile.isAuthenticated ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                ) : (
                  <LogIn className="w-3 h-3 text-slate-400" />
                )}
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Dynamic URL / Playlist ID Search Bar */}
              <form onSubmit={handleLoadCustom} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Paste ANY YouTube Playlist URL (youtube.com/playlist?list=PL...), Video link, or search keywords..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/70 border border-cyan-500/40 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,242,255,0.25)]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition cursor-pointer shadow-[0_0_15px_rgba(0,242,255,0.4)] flex items-center gap-1.5 text-xs shrink-0"
                >
                  <Play className="w-3.5 h-3.5 text-slate-950" />
                  <span>LOAD PLAYLIST / VIDEO</span>
                </button>
              </form>

              {/* TAB 1: DYNAMIC PLAYLISTS */}
              {activeModalTab === 'playlists' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-bold text-white text-xs">
                      Curated & Dynamic YouTube Video Playlists
                    </span>
                    <span className="text-[10px]">
                      Selecting a playlist streams sequential video tracks directly to the background visual mode.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {allPlaylists.map((pl) => {
                      const isActivePl = currentPlaylist?.id === pl.id;
                      return (
                        <div
                          key={pl.id}
                          onClick={() => playPlaylist(pl)}
                          className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 cursor-pointer transition ${
                            isActivePl
                              ? 'bg-cyan-500/15 border-cyan-400 shadow-[0_0_20px_rgba(0,242,255,0.25)]'
                              : 'bg-black/50 border-slate-800/80 hover:border-cyan-500/50 hover:bg-black/70'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative w-24 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-slate-800">
                              <img
                                src={pl.thumbnail}
                                alt={pl.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <ListMusic className="w-5 h-5 text-cyan-300" />
                              </div>
                              <span className="absolute bottom-1 right-1 px-1 rounded bg-black/85 text-[8px] text-cyan-300 font-mono font-bold">
                                {pl.tracks.length} VIDEOS
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="font-bold text-white text-xs truncate">{pl.title}</h4>
                                <span className="px-1.5 py-0.2 rounded text-[8px] bg-slate-800 text-cyan-300 font-mono uppercase">
                                  {pl.category}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                                {pl.description}
                              </p>
                              {pl.isCustom && (
                                <span className="inline-block mt-1 text-[9px] text-emerald-400 font-bold">
                                  ✓ Custom Saved Playlist
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Track list preview inside playlist card */}
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate max-w-[240px]">
                              <span>First:</span>
                              <span className="text-slate-200 font-bold truncate">
                                {pl.tracks[0]?.title || 'Dynamic Playlist'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              {pl.isCustom && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCustomPlaylist(pl.id);
                                  }}
                                  className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                                  title="Delete Custom Playlist"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playPlaylist(pl);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                                  isActivePl
                                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(0,242,255,0.4)]'
                                    : 'bg-slate-800 text-slate-200 hover:bg-cyan-500 hover:text-slate-950'
                                }`}
                              >
                                <Play className="w-2.5 h-2.5" />
                                <span>{isActivePl && isPlaying ? 'PLAYING NOW' : 'STREAM PLAYLIST'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: SINGLE STREAMS & PRESETS */}
              {activeModalTab === 'tracks' && (
                <div className="space-y-3">
                  {/* Category Filter Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                    {['all', 'synthwave', 'lofi', 'cyberpunk', 'space', 'solfeggio', 'classical'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                          selectedCategory === cat
                            ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(0,242,255,0.4)]'
                            : 'bg-black/50 text-slate-400 border border-slate-800 hover:text-white hover:border-cyan-500/40'
                        }`}
                      >
                        {cat.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                    {(selectedCategory === 'all'
                      ? YOUTUBE_PRESET_TRACKS
                      : YOUTUBE_PRESET_TRACKS.filter((t) => t.category === selectedCategory)
                    ).map((track) => {
                      const isCurrent = yt.currentTrack.id === track.id && yt.active;
                      return (
                        <div
                          key={track.id}
                          onClick={() => playTrack(track)}
                          className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                            isCurrent
                              ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(0,242,255,0.25)]'
                              : 'bg-black/40 border-slate-800/80 hover:border-cyan-500/50 hover:bg-black/60'
                          }`}
                        >
                          <div className="relative w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-slate-800">
                            <img
                              src={track.thumbnail}
                              alt={track.title}
                              className="w-full h-full object-cover"
                            />
                            {isCurrent && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
                              </div>
                            )}
                            <span className="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-[8px] text-cyan-300 font-mono">
                              {track.duration}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="font-bold text-white text-xs truncate">{track.title}</h4>
                              <span className="px-1.5 py-0.2 rounded text-[8px] bg-slate-800 text-cyan-300 font-mono uppercase">
                                {track.category}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate">{track.artist}</p>
                            <p className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">
                              {track.description}
                            </p>
                          </div>

                          <div className="shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playTrack(track);
                              }}
                              className={`p-2 rounded-lg transition cursor-pointer ${
                                isCurrent
                                  ? 'bg-cyan-500 text-slate-950 font-bold'
                                  : 'bg-slate-900 text-slate-300 hover:text-cyan-300 hover:bg-slate-800'
                              }`}
                            >
                              {isCurrent && isPlaying ? (
                                <Pause className="w-3.5 h-3.5" />
                              ) : (
                                <Play className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: CUSTOM PLAYLIST BUILDER */}
              {activeModalTab === 'custom' && (
                <div className="space-y-4">
                  {/* Create New Playlist Form */}
                  <form onSubmit={handleCreateCustomPlaylist} className="p-3.5 rounded-xl bg-black/40 border border-slate-800 space-y-2.5">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <FolderPlus className="w-4 h-4 text-cyan-400" />
                      <span>Create New Custom Video Playlist</span>
                    </span>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPlaylistTitle}
                        onChange={(e) => setNewPlaylistTitle(e.target.value)}
                        placeholder="Playlist Title (e.g. 'Midnight Cyberpunk Coding', '432Hz Chill')..."
                        className="flex-1 px-3 py-1.5 rounded-lg bg-black/70 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                      />
                      <select
                        value={newPlaylistCategory}
                        onChange={(e) => setNewPlaylistCategory(e.target.value as YouTubeCategory)}
                        className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs"
                      >
                        <option value="synthwave">Synthwave</option>
                        <option value="lofi">Lo-Fi</option>
                        <option value="cyberpunk">Cyberpunk</option>
                        <option value="space">Space</option>
                        <option value="solfeggio">Solfeggio</option>
                        <option value="classical">Classical</option>
                        <option value="custom">Custom</option>
                      </select>
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>CREATE</span>
                      </button>
                    </div>
                  </form>

                  {/* Add Track to Selected Playlist Form */}
                  <form onSubmit={handleAddTrackToCustom} className="p-3.5 rounded-xl bg-black/40 border border-slate-800 space-y-2.5">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-emerald-400" />
                      <span>Add Video to Selected Playlist</span>
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        value={activeCustomPlaylistId || ''}
                        onChange={(e) => setActiveCustomPlaylistId(e.target.value)}
                        className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs"
                      >
                        <option value="">Select Target Playlist...</option>
                        {(yt.customPlaylists || []).map((pl) => (
                          <option key={pl.id} value={pl.id}>
                            {pl.title} ({pl.tracks.length} items)
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={newTrackUrl}
                        onChange={(e) => setNewTrackUrl(e.target.value)}
                        placeholder="YouTube Video URL or ID (e.g. 5qap5aO4i9A)..."
                        className="px-3 py-1.5 rounded-lg bg-black/70 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                      />

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTrackTitle}
                          onChange={(e) => setNewTrackTitle(e.target.value)}
                          placeholder="Optional Custom Title..."
                          className="flex-1 px-3 py-1.5 rounded-lg bg-black/70 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                        />
                        <button
                          type="submit"
                          disabled={!activeCustomPlaylistId}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold text-xs cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>ADD</span>
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* List of Custom Playlists */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300">
                      Your Saved Custom Playlists ({(yt.customPlaylists || []).length}):
                    </span>
                    {(yt.customPlaylists || []).length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-slate-500">
                        No custom playlists created yet. Create one above to organize your personal YouTube video streams!
                      </div>
                    ) : (
                      (yt.customPlaylists || []).map((pl) => (
                        <div
                          key={pl.id}
                          className="p-3 rounded-xl bg-black/50 border border-slate-800 flex items-center justify-between gap-3"
                        >
                          <div>
                            <span className="font-bold text-white text-xs block">{pl.title}</span>
                            <span className="text-[10px] text-slate-400 block">
                              {pl.tracks.length} videos • Created on {pl.createdAt || 'session'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => playPlaylist(pl)}
                              className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-xs font-bold hover:bg-cyan-500 hover:text-slate-950 transition cursor-pointer"
                            >
                              Play Playlist
                            </button>
                            <button
                              onClick={() => handleDeleteCustomPlaylist(pl.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                              title="Delete Playlist"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: GOOGLE AUTH & SYSTEM CUSTOMIZATION FUNCTIONALITIES */}
              {activeModalTab === 'google_auth' && (
                <div className="space-y-4">
                  {/* Google Sign-in Identity Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/30 to-black/60 border border-red-500/40 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                        <img
                          src={yt.userProfile.picture}
                          alt={yt.userProfile.name}
                          className="w-full h-full object-cover"
                        />
                        {yt.userProfile.isAuthenticated && (
                          <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{yt.userProfile.name}</h4>
                          <span className="px-2 py-0.5 rounded text-[9px] bg-red-500/20 text-red-300 font-bold border border-red-500/40">
                            {yt.userProfile.accountType.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-mono">{yt.userProfile.email}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Status: {yt.userProfile.isAuthenticated ? 'Authenticated & Active' : 'Guest Mode (Unlinked)'}
                        </p>
                      </div>
                    </div>

                    {/* Sign-in / Sign-out Trigger */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleToggleGoogleAuth}
                        className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md ${
                          yt.userProfile.isAuthenticated
                            ? 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-rose-400 hover:border-rose-500/50'
                            : 'bg-white text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {yt.userProfile.isAuthenticated ? (
                          <>
                            <LogOut className="w-3.5 h-3.5 text-rose-400" />
                            <span>DISCONNECT GOOGLE ID</span>
                          </>
                        ) : (
                          <>
                            <LogIn className="w-3.5 h-3.5 text-slate-900" />
                            <span>SIGN IN WITH GOOGLE</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* System Customizations through Google Auth */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-cyan-500/20">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Google User System Customizations</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Preferences are saved to your Google identity and applied dynamically.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Default Display Mode */}
                      <div className="p-3 rounded-xl bg-black/50 border border-slate-800 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-300 block">
                          Default Video Display Mode
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => handleUpdatePreference('defaultVideoMode', 'background')}
                            className={`py-1.5 px-2 rounded text-[10px] font-bold transition cursor-pointer ${
                              yt.userProfile.preferences.defaultVideoMode === 'background'
                                ? 'bg-cyan-500 text-slate-950'
                                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            Full Background
                          </button>
                          <button
                            onClick={() => handleUpdatePreference('defaultVideoMode', 'pip')}
                            className={`py-1.5 px-2 rounded text-[10px] font-bold transition cursor-pointer ${
                              yt.userProfile.preferences.defaultVideoMode === 'pip'
                                ? 'bg-cyan-500 text-slate-950'
                                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            Floating PiP
                          </button>
                        </div>
                      </div>

                      {/* 3D Visualizer Canvas Blending */}
                      <div className="p-3 rounded-xl bg-black/50 border border-slate-800 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-300 block">
                          3D Visualizer Blending over Video
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => handleUpdatePreference('defaultBlendWith3D', true)}
                            className={`py-1.5 px-2 rounded text-[10px] font-bold transition cursor-pointer ${
                              yt.userProfile.preferences.defaultBlendWith3D
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            Blend 3D (Enabled)
                          </button>
                          <button
                            onClick={() => handleUpdatePreference('defaultBlendWith3D', false)}
                            className={`py-1.5 px-2 rounded text-[10px] font-bold transition cursor-pointer ${
                              !yt.userProfile.preferences.defaultBlendWith3D
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            Pure Video Only
                          </button>
                        </div>
                      </div>

                      {/* Default Harmonic Resonance */}
                      <div className="p-3 rounded-xl bg-black/50 border border-slate-800 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-300 block">
                          Harmonic Frequency Resonance Calibration
                        </span>
                        <div className="grid grid-cols-4 gap-1">
                          {(['432', '528', '963', 'all'] as const).map((freq) => (
                            <button
                              key={freq}
                              onClick={() => handleUpdatePreference('harmonicFrequency', freq)}
                              className={`py-1.5 px-1 rounded text-[10px] font-bold transition cursor-pointer ${
                                yt.userProfile.preferences.harmonicFrequency === freq
                                  ? 'bg-purple-500 text-slate-950'
                                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              {freq.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Default Music Genre */}
                      <div className="p-3 rounded-xl bg-black/50 border border-slate-800 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-300 block">
                          Preferred Music Category
                        </span>
                        <select
                          value={yt.userProfile.preferences.preferredCategory}
                          onChange={(e) =>
                            handleUpdatePreference('preferredCategory', e.target.value as YouTubeCategory)
                          }
                          className="w-full py-1.5 px-2 rounded bg-slate-900 border border-slate-700 text-slate-300 text-xs"
                        >
                          <option value="synthwave">Synthwave (Retro Cyberpunk)</option>
                          <option value="lofi">Lo-Fi (Chill Hop)</option>
                          <option value="space">Deep Space (Ambient)</option>
                          <option value="cyberpunk">Cyberpunk (Industrial)</option>
                          <option value="classical">Classical (Focus)</option>
                          <option value="solfeggio">Solfeggio (Miracle Tones)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Controls Deck: Transition to Full Background Video */}
              <div className="p-3.5 rounded-xl bg-cyan-950/25 border border-cyan-500/40 flex flex-wrap items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-400/40">
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block">
                      Background Rendering Transition Mode
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Stream video dynamically as the 100% full background canvas behind the HyperTerminal.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mode Selector */}
                  <div className="flex items-center p-0.5 rounded-lg bg-black/60 border border-slate-800 text-[10px]">
                    <button
                      onClick={() =>
                        setEnvState((prev) => ({
                          ...prev,
                          youtube: { ...prev.youtube, displayMode: 'background', active: true },
                        }))
                      }
                      className={`px-3 py-1 rounded font-bold transition cursor-pointer flex items-center gap-1 ${
                        yt.displayMode === 'background'
                          ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(0,242,255,0.5)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>FULL BACKGROUND</span>
                    </button>
                    <button
                      onClick={() =>
                        setEnvState((prev) => ({
                          ...prev,
                          youtube: { ...prev.youtube, displayMode: 'pip', active: true },
                        }))
                      }
                      className={`px-3 py-1 rounded font-bold transition cursor-pointer flex items-center gap-1 ${
                        yt.displayMode === 'pip'
                          ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(0,242,255,0.5)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Tv className="w-3 h-3" />
                      <span>FLOATING PIP</span>
                    </button>
                  </div>

                  {/* 3D Blend Toggle */}
                  <button
                    onClick={() =>
                      setEnvState((prev) => ({
                        ...prev,
                        youtube: { ...prev.youtube, blendWith3D: !prev.youtube.blendWith3D },
                      }))
                    }
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                      yt.blendWith3D
                        ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                        : 'bg-black/40 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                    title="Overlay 3D Three.js geometry & starfields over the video"
                  >
                    <Layers className="w-3 h-3" />
                    <span>3D BLEND: {yt.blendWith3D ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Background Opacity & Audio Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-xl bg-black/40 border border-slate-800 text-[11px]">
                {/* Opacity Slider */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Background Video Opacity:</span>
                    <span className="font-bold text-cyan-300 font-mono">
                      {(yt.backgroundOpacity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={yt.backgroundOpacity}
                    onChange={(e) =>
                      setEnvState((prev) => ({
                        ...prev,
                        youtube: { ...prev.youtube, backgroundOpacity: parseFloat(e.target.value) },
                      }))
                    }
                    className="w-32 h-1.5 accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Volume Control */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    {yt.isMuted ? (
                      <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span>Player Volume:</span>
                    <span className="font-bold text-cyan-300 font-mono">
                      {yt.isMuted ? 'MUTED' : `${yt.volume}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={yt.isMuted ? 0 : yt.volume}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setEnvState((prev) => ({
                        ...prev,
                        youtube: { ...prev.youtube, volume: val, isMuted: val === 0 },
                      }));
                      youtubeService.sendIframeCommand(iframeRef.current, 'setVolume', [val]);
                    }}
                    className="w-32 h-1.5 accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-black/60 border-t border-cyan-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-400 text-[11px] truncate max-w-[500px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="shrink-0">ACTIVE STREAM:</span>
                <span className="font-bold text-cyan-300 truncate">{yt.currentTrack.title}</span>
                <span className="text-[10px] text-slate-500 shrink-0">
                  [{currentPlaylist?.title.slice(0, 24)}... • {yt.displayMode.toUpperCase()}]
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setEnvState((prev) => ({
                      ...prev,
                      youtube: { ...prev.youtube, displayMode: 'background', active: true, showModal: false },
                    }))
                  }
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(0,242,255,0.4)]"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-950" />
                  <span>TRANSITION TO BACKGROUND & CLOSE</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
