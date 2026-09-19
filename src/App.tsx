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
import { Upload } from 'lucide-react';

export function App() {
  const [rootFolder, setRootFolder] = useState<FolderNode | null>(null);
  const [allVideos, setAllVideos] = useState<VideoItem[]>([]);
  const [allSubtitles, setAllSubtitles] = useState<SubtitleItem[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(-1);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

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

  // Open Directory via File System Access API
  const handleOpenDirectory = async () => {
    try {
      // @ts-expect-error window.showDirectoryPicker standard in modern browsers
      const dirHandle = await window.showDirectoryPicker();
      const { rootFolder: root, allVideos: videos, allSubtitles: subs } =
        await scanDirectoryHandle(dirHandle);

      setRootFolder(root);
      setAllVideos(videos);
      setAllSubtitles(subs);
      if (videos.length > 0) {
        setCurrentVideoIndex(0);
      }
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

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden"
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
      />

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
          />
        )}
      </div>

      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 bg-indigo-600/30 backdrop-blur-md border-4 border-dashed border-indigo-400 z-50 flex items-center justify-center pointer-events-none animate-in fade-in duration-150">
          <div className="bg-slate-900/90 p-8 rounded-3xl text-center space-y-3 shadow-2xl border border-indigo-500/30">
            <Upload className="w-12 h-12 text-indigo-400 mx-auto animate-bounce" />
            <h3 className="text-xl font-bold text-white">Drop Folder or Video Files Here</h3>
            <p className="text-xs text-indigo-200">Release mouse to scan and start streaming</p>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

export default App;
