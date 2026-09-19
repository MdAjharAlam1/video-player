import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { VideoPlayer } from './components/VideoPlayer';
import { EmptyState } from './components/EmptyState';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import type {
  VideoItem,
  FolderNode,
  SubtitleItem,
  ViewMode,
  SortOption,
  PlaybackHistory,
} from './types/video';
import {
  scanDirectoryHandle,
  scanFileList,
  findMatchingSubtitles,
} from './utils/fileSystem';
import { getSavedLibrary, saveLibrary } from './utils/db';
import { checkFolderPermission, requestFolderPermission } from './utils/permission';
import { Upload, KeyRound } from 'lucide-react';

export function App() {
  const [rootFolder, setRootFolder] = useState<FolderNode | null>(null);
  const [allVideos, setAllVideos] = useState<VideoItem[]>([]);
  const [allSubtitles, setAllSubtitles] = useState<SubtitleItem[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(-1);

  const [savedHandle, setSavedHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [permissionState, setPermissionState] = useState<'granted' | 'prompt' | 'denied' | 'none'>('none');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Theme Mode State ('dark' | 'light')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('streamlocal_theme');
      return saved === 'light' || saved === 'dark' ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    try {
      localStorage.setItem('streamlocal_theme', theme);
    } catch (e) {
      console.warn('Failed saving theme to localStorage:', e);
    }
  }, [theme]);

  // Favorites state persisted in localStorage
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('streamlocal_favorites');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // History state persisted in localStorage
  const [history, setHistory] = useState<PlaybackHistory[]>(() => {
    try {
      const saved = localStorage.getItem('streamlocal_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const supportsDirectoryPicker = 'showDirectoryPicker' in window;

  // Persist Favorites
  useEffect(() => {
    try {
      localStorage.setItem('streamlocal_favorites', JSON.stringify(Array.from(favorites)));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [favorites]);

  // Persist History
  useEffect(() => {
    try {
      localStorage.setItem('streamlocal_history', JSON.stringify(history));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [history]);

  // Refresh / Rescan Library against saved root directory handle
  const refreshLibrary = useCallback(async (handleToUse?: FileSystemDirectoryHandle) => {
    const targetHandle = handleToUse || savedHandle;
    if (!targetHandle) return;

    const perm = await checkFolderPermission(targetHandle);
    setPermissionState(perm);

    if (perm === 'granted') {
      const { rootFolder: root, allVideos: videos, allSubtitles: subs } =
        await scanDirectoryHandle(targetHandle);

      setRootFolder(root);
      setAllVideos(videos);
      setAllSubtitles(subs);

      setCurrentVideoIndex((prevIndex) => {
        if (prevIndex === -1 && videos.length > 0) return 0;
        if (prevIndex >= videos.length) return Math.max(-1, videos.length - 1);
        return prevIndex;
      });
    }
  }, [savedHandle]);

  // Restore Saved Root Folder Handle on Application Startup
  useEffect(() => {
    async function restoreSavedLibrary() {
      try {
        const record = await getSavedLibrary('main-library');
        if (record && record.directoryHandle) {
          setSavedHandle(record.directoryHandle);
          const perm = await checkFolderPermission(record.directoryHandle);
          setPermissionState(perm);

          if (perm === 'granted') {
            const { rootFolder: root, allVideos: videos, allSubtitles: subs } =
              await scanDirectoryHandle(record.directoryHandle);

            setRootFolder(root);
            setAllVideos(videos);
            setAllSubtitles(subs);
            if (videos.length > 0) {
              setCurrentVideoIndex(0);
            }
          }
        }
      } catch (err) {
        console.warn('Failed restoring stored library handle:', err);
      }
    }

    restoreSavedLibrary();
  }, []);

  // Handle explicit permission grant request
  const handleGrantPermission = async () => {
    if (!savedHandle) return;
    const newPerm = await requestFolderPermission(savedHandle);
    setPermissionState(newPerm);

    if (newPerm === 'granted') {
      refreshLibrary(savedHandle);
    }
  };

  const toggleFavorite = (videoId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(videoId)) {
        next.delete(videoId);
      } else {
        next.add(videoId);
      }
      return next;
    });
  };

  const updateHistory = useCallback((video: VideoItem, timestamp: number, duration: number) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.path !== video.path);
      const newEntry: PlaybackHistory = {
        videoName: video.name,
        path: video.path,
        timestamp,
        duration,
        lastPlayedAt: Date.now(),
      };
      return [newEntry, ...filtered].slice(0, 50);
    });
  }, []);

  // Open Directory via File System Access API & Save to IndexedDB
  const handleOpenDirectory = async () => {
    try {
      // @ts-expect-error window.showDirectoryPicker
      const dirHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({ mode: 'read' });

      await saveLibrary({
        id: 'main-library',
        name: dirHandle.name,
        directoryHandle: dirHandle,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      setSavedHandle(dirHandle);
      setPermissionState('granted');
      refreshLibrary(dirHandle);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Error opening folder:', err);
      }
    }
  };

  // Open Files / Directory via HTML File Input
  const handleOpenFiles = async (files: FileList) => {
    const { rootFolder: root, allVideos: videos, allSubtitles: subs } =
      await scanFileList(files);

    setRootFolder(root);
    setAllVideos(videos);
    setAllSubtitles(subs);
    if (videos.length > 0) {
      setCurrentVideoIndex(0);
    }
  };

  // Handle Drag & Drop files/folders onto window
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleOpenFiles(e.dataTransfer.files);
    }
  };

  // Video Navigation Handlers
  const currentVideo = currentVideoIndex >= 0 ? allVideos[currentVideoIndex] || null : null;
  const hasNext = currentVideoIndex < allVideos.length - 1;
  const hasPrevious = currentVideoIndex > 0;

  const handleNext = useCallback(() => {
    if (hasNext) {
      setCurrentVideoIndex((prev) => prev + 1);
    }
  }, [hasNext]);

  const handlePrevious = useCallback(() => {
    if (hasPrevious) {
      setCurrentVideoIndex((prev) => prev - 1);
    }
  }, [hasPrevious]);

  const handleSelectVideo = (video: VideoItem) => {
    const index = allVideos.findIndex((v) => v.id === video.id);
    if (index !== -1) {
      setCurrentVideoIndex(index);
    }
  };

  const handleAddSubtitleFile = (file: File) => {
    const newSub: SubtitleItem = {
      id: file.name,
      name: file.name,
      language: file.name.split('.')[0] || 'Custom',
      file,
      url: '',
      format: file.name.endsWith('.srt') ? 'srt' : 'vtt',
    };
    setAllSubtitles((prev) => [newSub, ...prev]);
  };

  const activeSubtitles = currentVideo
    ? findMatchingSubtitles(currentVideo, allSubtitles)
    : [];

  const isDark = theme === 'dark';

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col h-screen font-sans overflow-hidden transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100/90 text-slate-900'
      }`}
    >
      {/* Top Navigation Header */}
      <Header
        onOpenDirectory={handleOpenDirectory}
        onOpenFiles={handleOpenFiles}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        totalVideos={allVideos.length}
        sidebarOpen={sidebarOpen}
        supportsDirectoryPicker={supportsDirectoryPicker}
        permissionState={permissionState}
        onGrantPermission={handleGrantPermission}
        onRefreshLibrary={() => refreshLibrary()}
        hasSavedLibrary={!!savedHandle}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Permission Banner Prompt when access confirmation is required */}
      {permissionState === 'prompt' && savedHandle && (
        <div className="bg-gradient-to-r from-amber-600/90 to-amber-700/90 text-white px-4 py-2.5 flex items-center justify-between text-xs shadow-md z-30">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-4 h-4 animate-pulse shrink-0" />
            <span>
              Permission required to read folder <strong>"{savedHandle.name}"</strong> across browser sessions.
            </span>
          </div>
          <button
            onClick={handleGrantPermission}
            className="px-3 py-1 bg-white text-amber-900 rounded-lg font-bold text-xs hover:bg-amber-100 transition-colors shadow"
          >
            Grant Access
          </button>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar Navigation */}
        {sidebarOpen && (
          <Sidebar
            rootFolder={rootFolder}
            allVideos={allVideos}
            currentVideo={currentVideo}
            onSelectVideo={handleSelectVideo}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            history={history}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortOption={sortOption}
            onSortChange={setSortOption}
            searchQuery={searchQuery}
            theme={theme}
          />
        )}

        {/* Right Main Video Viewport or Empty State */}
        {currentVideo ? (
          <VideoPlayer
            key={currentVideo.id}
            video={currentVideo}
            onNext={handleNext}
            onPrevious={handlePrevious}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
            onUpdateHistory={updateHistory}
            isFavorite={favorites.has(currentVideo.id)}
            onToggleFavorite={toggleFavorite}
            subtitles={activeSubtitles}
            onAddSubtitleFile={handleAddSubtitleFile}
          />
        ) : (
          <EmptyState
            onOpenDirectory={handleOpenDirectory}
            onOpenFiles={handleOpenFiles}
            supportsDirectoryPicker={supportsDirectoryPicker}
            theme={theme}
          />
        )}
      </div>

      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 bg-indigo-600/30 backdrop-blur-md border-4 border-dashed border-indigo-400 z-50 flex items-center justify-center pointer-events-none animate-in fade-in duration-150">
          <div className={`p-8 rounded-3xl text-center space-y-3 shadow-2xl border ${
            isDark ? 'bg-slate-900/90 border-indigo-500/30' : 'bg-white/95 border-indigo-300'
          }`}>
            <Upload className="w-12 h-12 text-indigo-500 mx-auto animate-bounce" />
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Drop Folder or Video Files Here</h3>
            <p className={`text-xs ${isDark ? 'text-indigo-200' : 'text-indigo-600'}`}>Release mouse to scan and start streaming</p>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        theme={theme}
      />
    </div>
  );
}

export default App;
