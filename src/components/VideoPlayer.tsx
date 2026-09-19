import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture2,
  Subtitles,
  Camera,
  Settings,
  Heart,
  Zap,
  Check,
} from 'lucide-react';
import type { VideoItem, SubtitleItem, PlayerSettings } from '../types/video';
import { formatDuration } from '../utils/fileSystem';
import { srtToVttBlobUrl } from '../utils/srtParser';

interface VideoPlayerProps {
  video: VideoItem;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  onUpdateHistory: (video: VideoItem, timestamp: number, duration: number) => void;
  isFavorite: boolean;
  onToggleFavorite: (videoId: string) => void;
  subtitles: SubtitleItem[];
  onAddSubtitleFile: (file: File) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  onUpdateHistory,
  isFavorite,
  onToggleFavorite,
  subtitles,
  onAddSubtitleFile,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Audio Context for Volume Booster (+200% Gain)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [buffered, setBuffered] = useState<number>(0);

  const [settings, setSettings] = useState<PlayerSettings>({
    playbackRate: 1,
    volume: 1,
    isMuted: false,
    isLooping: false,
    autoPlayNext: true,
    volumeBoost: false,
    subtitleOffset: 0,
    aspectRatio: 'contain',
  });

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const hideControlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subtitle States
  const [selectedSubUrl, setSelectedSubUrl] = useState<string | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<string>('off');

  // Popups & Dropdowns
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [showSubMenu, setShowSubMenu] = useState<boolean>(false);
  const [hoverTime, setHoverTime] = useState<{ time: number; x: number } | null>(null);
  const subtitleInputRef = useRef<HTMLInputElement>(null);

  // Create Video Object URL on video change
  const [videoSrc, setVideoSrc] = useState<string>('');

  useEffect(() => {
    let url = '';
    if (video.file) {
      url = URL.createObjectURL(video.file);
      setVideoSrc(url);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [video]);

  // Handle Web Audio API Gain Node initialization for Volume Booster
  useEffect(() => {
    if (!videoRef.current) return;

    if (settings.volumeBoost) {
      try {
        if (!audioCtxRef.current) {
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          audioCtxRef.current = new AudioContextClass();
        }

        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }

        if (!mediaSourceRef.current) {
          mediaSourceRef.current = audioCtxRef.current.createMediaElementSource(videoRef.current);
          gainNodeRef.current = audioCtxRef.current.createGain();
          mediaSourceRef.current.connect(gainNodeRef.current);
          gainNodeRef.current.connect(audioCtxRef.current.destination);
        }

        if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = 2.0;
        }
      } catch (err) {
        console.warn('AudioContext boost setup error:', err);
      }
    } else {
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = 1.0;
      }
    }
  }, [settings.volumeBoost]);

  // Auto-hide controls overlay on inactivity
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    if (isPlaying) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
        setShowSettingsMenu(false);
        setShowSubMenu(false);
      }, 3000);
    }
  };

  // Video Event Handlers
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(curr);
    setDuration(dur);

    if (Math.floor(curr) % 5 === 0) {
      onUpdateHistory(video, curr, dur);
    }

    if (videoRef.current.buffered.length > 0) {
      const bufEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBuffered((bufEnd / (dur || 1)) * 100);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (settings.autoPlayNext && hasNext) {
      onNext();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSeekRelative = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.min(Math.max(0, videoRef.current.currentTime + seconds), duration);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
      setSettings((prev) => ({
        ...prev,
        volume: newVol,
        isMuted: newVol === 0,
      }));
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuteState = !settings.isMuted;
      videoRef.current.muted = newMuteState;
      setSettings((prev) => ({ ...prev, isMuted: newMuteState }));
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setSettings((prev) => ({ ...prev, playbackRate: rate }));
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP Error:', err);
    }
  };

  const captureScreenshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1920;
    canvas.height = videoRef.current.videoHeight || 1080;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${video.name.replace(/\.[^/.]+$/, '')}_frame_${Math.floor(currentTime)}s.png`;
      link.click();
    }
  };

  const handleSelectSubtitle = async (sub: SubtitleItem | 'off') => {
    if (sub === 'off') {
      setSelectedSubId('off');
      setSelectedSubUrl(null);
      return;
    }

    setSelectedSubId(sub.id);
    const content = await sub.file.text();
    if (sub.format === 'srt') {
      const vttUrl = srtToVttBlobUrl(content, settings.subtitleOffset);
      setSelectedSubUrl(vttUrl);
    } else {
      const blob = new Blob([content], { type: 'text/vtt' });
      setSelectedSubUrl(URL.createObjectURL(blob));
    }
  };

  const handleManualSubtitleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onAddSubtitleFile(file);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'arrowleft':
          e.preventDefault();
          handleSeekRelative(-5);
          break;
        case 'arrowright':
          e.preventDefault();
          handleSeekRelative(5);
          break;
        case 'j':
          e.preventDefault();
          handleSeekRelative(-10);
          break;
        case 'l':
          e.preventDefault();
          handleSeekRelative(10);
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChange(Math.min(1, settings.volume + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, settings.volume - 0.1));
          break;
        case 'p':
          if (e.shiftKey) {
            e.preventDefault();
            if (hasPrevious) onPrevious();
          } else {
            e.preventDefault();
            togglePiP();
          }
          break;
        case 'n':
          e.preventDefault();
          if (hasNext) onNext();
          break;
        case 's':
          e.preventDefault();
          captureScreenshot();
          break;
        case '[':
          e.preventDefault();
          changePlaybackRate(Math.max(0.25, settings.playbackRate - 0.25));
          break;
        case ']':
          e.preventDefault();
          changePlaybackRate(Math.min(2.5, settings.playbackRate + 0.25));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, hasNext, hasPrevious, onNext, onPrevious, settings.volume, settings.playbackRate]);

  const getAspectRatioStyle = () => {
    switch (settings.aspectRatio) {
      case 'cover':
        return 'object-cover';
      case 'fill':
        return 'object-fill';
      case '16:9':
        return 'aspect-video object-contain';
      case '4:3':
        return 'aspect-[4/3] object-contain';
      default:
        return 'object-contain';
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative flex-1 bg-black flex flex-col justify-center items-center overflow-hidden select-none group"
    >
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        loop={settings.isLooping}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
        className={`w-full h-full max-h-screen cursor-pointer ${getAspectRatioStyle()}`}
      >
        {selectedSubUrl && (
          <track
            kind="subtitles"
            src={selectedSubUrl}
            srcLang="en"
            label="Subtitles"
            default
          />
        )}
      </video>

      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-indigo-600/80 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all z-10 border border-white/20"
        >
          <Play className="w-9 h-9 fill-current ml-1" />
        </button>
      )}

      <div
        className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-opacity duration-300 z-20 flex items-center justify-between ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center space-x-3 min-w-0">
          <span className="px-2 py-0.5 rounded-lg bg-indigo-600/60 text-white text-[10px] font-bold uppercase tracking-wider">
            {video.extension}
          </span>
          <h2 className="text-sm font-semibold text-white truncate max-w-lg drop-shadow-md">
            {video.name}
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onToggleFavorite(video.id)}
            className={`p-2 rounded-xl backdrop-blur-md border border-white/10 transition-colors ${
              isFavorite ? 'bg-rose-500/20 text-rose-500' : 'bg-black/40 text-slate-300 hover:text-white'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 z-20 flex flex-col space-y-2 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="relative group/scrubber w-full flex items-center">
          {hoverTime && (
            <div
              style={{ left: `${hoverTime.x}%` }}
              className="absolute -top-8 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border border-slate-700 shadow-lg pointer-events-none z-30"
            >
              {formatDuration(hoverTime.time)}
            </div>
          )}

          <div className="w-full h-1.5 group-hover/scrubber:h-2.5 bg-slate-800/80 rounded-full overflow-hidden relative transition-all">
            <div
              style={{ width: `${buffered}%` }}
              className="h-full bg-slate-600/50 absolute left-0 top-0 transition-all"
            />
            <div
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 absolute left-0 top-0 transition-all"
            />
          </div>

          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              setHoverTime({ time: pos * duration, x: pos * 100 });
            }}
            onMouseLeave={() => setHoverTime(null)}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2">
            <button
              onClick={onPrevious}
              disabled={!hasPrevious}
              className="p-2 text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:text-slate-300 transition-colors"
              title="Previous Video (Shift+P)"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={() => handleSeekRelative(-10)}
              className="p-2 text-slate-300 hover:text-white transition-colors"
              title="Rewind 10s (J)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition-transform active:scale-95"
              title="Play/Pause (Space)"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={() => handleSeekRelative(10)}
              className="p-2 text-slate-300 hover:text-white transition-colors"
              title="Forward 10s (L)"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              onClick={onNext}
              disabled={!hasNext}
              className="p-2 text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:text-slate-300 transition-colors"
              title="Next Video (N)"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            <div className="text-xs font-mono text-slate-300 pl-2">
              <span>{formatDuration(currentTime)}</span>
              <span className="text-slate-500 mx-1">/</span>
              <span className="text-slate-400">{formatDuration(duration)}</span>
            </div>

            <div className="flex items-center space-x-1.5 pl-3 group/volume">
              <button
                onClick={toggleMute}
                className="p-2 text-slate-300 hover:text-white transition-colors"
                title="Mute (M)"
              >
                {settings.isMuted || settings.volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.isMuted ? 0 : settings.volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />

              <button
                onClick={() =>
                  setSettings((prev) => ({ ...prev, volumeBoost: !prev.volumeBoost }))
                }
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight transition-colors border ${
                  settings.volumeBoost
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
                title="Audio Gain Booster (+200% for quiet videos)"
              >
                <Zap className="w-3 h-3 inline -mt-0.5" /> Boost
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-1 relative">
            <div className="relative">
              <button
                onClick={() => setShowSubMenu(!showSubMenu)}
                className={`p-2 rounded-lg transition-colors ${
                  selectedSubId !== 'off'
                    ? 'text-indigo-400 bg-indigo-500/10'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Subtitles"
              >
                <Subtitles className="w-4 h-4" />
              </button>

              {showSubMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-30 space-y-1 text-xs">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                    Select Subtitle Track
                  </div>
                  <button
                    onClick={() => handleSelectSubtitle('off')}
                    className={`w-full text-left px-3 py-1.5 rounded-xl flex items-center justify-between ${
                      selectedSubId === 'off' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>Off</span>
                    {selectedSubId === 'off' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {subtitles.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => handleSelectSubtitle(sub)}
                      className={`w-full text-left px-3 py-1.5 rounded-xl flex items-center justify-between ${
                        selectedSubId === sub.id ? 'bg-indigo-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{sub.name}</span>
                      {selectedSubId === sub.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}

                  <div className="border-t border-slate-800 pt-1.5">
                    <input
                      type="file"
                      ref={subtitleInputRef}
                      onChange={handleManualSubtitleUpload}
                      accept=".srt,.vtt"
                      className="hidden"
                    />
                    <button
                      onClick={() => subtitleInputRef.current?.click()}
                      className="w-full text-center py-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-xl font-medium"
                    >
                      + Load Subtitle File (.srt/.vtt)
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative group/speed">
              <button className="px-2 py-1 text-xs font-mono font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700/60">
                {settings.playbackRate}x
              </button>
              <div className="absolute right-0 bottom-full mb-2 w-28 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-30 hidden group-hover/speed:block">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => changePlaybackRate(rate)}
                    className={`w-full text-left px-3 py-1 text-xs rounded-lg ${
                      settings.playbackRate === rate ? 'text-indigo-400 bg-indigo-500/10 font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={captureScreenshot}
              className="p-2 text-slate-300 hover:text-white transition-colors"
              title="Capture Screenshot (S)"
            >
              <Camera className="w-4 h-4" />
            </button>

            <button
              onClick={togglePiP}
              className="p-2 text-slate-300 hover:text-white transition-colors"
              title="Picture in Picture (P)"
            >
              <PictureInPicture2 className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="p-2 text-slate-300 hover:text-white transition-colors"
                title="Player Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {showSettingsMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-30 space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Aspect Ratio</span>
                    <div className="grid grid-cols-3 gap-1 mt-1">
                      {(['contain', 'cover', '16:9', '4:3', 'fill'] as const).map((ratio) => (
                        <button
                          key={ratio}
                          onClick={() => setSettings((p) => ({ ...p, aspectRatio: ratio }))}
                          className={`py-1 rounded-lg text-[11px] capitalize ${
                            settings.aspectRatio === ratio
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-slate-300">Auto-play Next Video</span>
                    <button
                      onClick={() => setSettings((p) => ({ ...p, autoPlayNext: !p.autoPlayNext }))}
                      className={`w-8 h-4 rounded-full p-0.5 transition-colors ${
                        settings.autoPlayNext ? 'bg-indigo-600' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-3 h-3 bg-white rounded-full transition-transform ${
                          settings.autoPlayNext ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Repeat Single Video</span>
                    <button
                      onClick={() => setSettings((p) => ({ ...p, isLooping: !p.isLooping }))}
                      className={`w-8 h-4 rounded-full p-0.5 transition-colors ${
                        settings.isLooping ? 'bg-indigo-600' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-3 h-3 bg-white rounded-full transition-transform ${
                          settings.isLooping ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={toggleFullscreen}
              className="p-2 text-slate-300 hover:text-white transition-colors"
              title="Fullscreen (F)"
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
