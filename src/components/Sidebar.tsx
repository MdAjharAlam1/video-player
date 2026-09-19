import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Film,
  List,
  FolderTree,
  Heart,
  History,
  ArrowUpDown,
  FileVideo,
  Clock,
  Play,
  Check,
} from 'lucide-react';
import type {
  VideoItem,
  FolderNode,
  ViewMode,
  SortOption,
  PlaybackHistory,
} from '../types/video';
import { formatFileSize, formatDuration } from '../utils/fileSystem';

interface SidebarProps {
  rootFolder: FolderNode | null;
  allVideos: VideoItem[];
  currentVideo: VideoItem | null;
  onSelectVideo: (video: VideoItem) => void;
  favorites: Set<string>;
  onToggleFavorite: (videoId: string) => void;
  history: PlaybackHistory[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  searchQuery: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  rootFolder,
  allVideos,
  currentVideo,
  onSelectVideo,
  favorites,
  onToggleFavorite,
  history,
  viewMode,
  onViewModeChange,
  sortOption,
  onSortChange,
  searchQuery,
}) => {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderId]: !(prev[folderId] ?? true),
    }));
  };

  // Sort helper
  const sortVideos = (videos: VideoItem[]): VideoItem[] => {
    const list = [...videos];
    switch (sortOption) {
      case 'name-asc':
        return list.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        );
      case 'name-desc':
        return list.sort((a, b) =>
          b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' })
        );
      case 'size-desc':
        return list.sort((a, b) => b.size - a.size);
      case 'date-desc':
        return list.sort((a, b) => b.lastModified - a.lastModified);
      default:
        return list;
    }
  };

  // Filter videos by search
  const filteredVideos = allVideos.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoriteVideos = allVideos.filter((v) => favorites.has(v.id));

  // Component for single video row
  const VideoItemRow: React.FC<{ video: VideoItem }> = ({ video }) => {
    const isActive = currentVideo?.id === video.id;
    const isFav = favorites.has(video.id);

    return (
      <div
        onClick={() => onSelectVideo(video)}
        className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
          isActive
            ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/20 border border-indigo-500/40 text-white font-medium shadow-md shadow-indigo-900/20'
            : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent'
        }`}
      >
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          {isActive ? (
            <div className="w-5 h-5 rounded-lg bg-indigo-500 flex items-center justify-center text-white shrink-0 animate-pulse">
              <Play className="w-3 h-3 fill-current" />
            </div>
          ) : (
            <FileVideo className="w-4 h-4 text-indigo-400/80 group-hover:text-indigo-400 shrink-0" />
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs tracking-tight">{video.name}</p>
            <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
              <span>{formatFileSize(video.size)}</span>
              <span>•</span>
              <span className="uppercase text-[9px] font-bold text-indigo-400/80">
                {video.extension}
              </span>
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(video.id);
            }}
            className={`p-1.5 rounded-lg hover:bg-slate-700/60 transition-colors ${
              isFav ? 'text-rose-500 opacity-100' : 'text-slate-400 hover:text-rose-400'
            }`}
            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    );
  };

  // Recursive Tree Node Renderer
  const RenderTreeNode: React.FC<{ node: FolderNode; level?: number }> = ({
    node,
    level = 0,
  }) => {
    const isOpen = openFolders[node.id] ?? true;
    const sortedVideos = sortVideos(node.videos);

    // Filter by search query if set
    const matchingVideos = searchQuery
      ? sortedVideos.filter((v) =>
          v.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : sortedVideos;

    return (
      <div className="select-none" style={{ paddingLeft: level > 0 ? `${level * 12}px` : 0 }}>
        {/* Folder Header */}
        <div
          onClick={() => toggleFolder(node.id)}
          className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800/60 hover:text-white cursor-pointer transition-colors"
        >
          <span className="text-slate-500">
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
          {isOpen ? (
            <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className="truncate flex-1">{node.name}</span>
          <span className="text-[10px] text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded-full font-normal">
            {node.videos.length}
          </span>
        </div>

        {/* Folder Children */}
        {isOpen && (
          <div className="mt-1 space-y-0.5">
            {/* Subfolders */}
            {node.subfolders.map((sub) => (
              <RenderTreeNode key={sub.id} node={sub} level={level + 1} />
            ))}

            {/* Direct Videos */}
            {matchingVideos.map((video) => (
              <div key={video.id} style={{ paddingLeft: `${(level + 1) * 8}px` }}>
                <VideoItemRow video={video} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-80 bg-slate-900/90 border-r border-slate-800/80 flex flex-col h-full select-none shrink-0 overflow-hidden">
      {/* Top View Selector Bar */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between gap-1 bg-slate-950/40">
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 flex-1">
          <button
            onClick={() => onViewModeChange('tree')}
            title="Folder Tree View"
            className={`flex items-center justify-center p-1.5 rounded-lg text-xs transition-all ${
              viewMode === 'tree'
                ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange('flat')}
            title="All Videos List"
            className={`flex items-center justify-center p-1.5 rounded-lg text-xs transition-all ${
              viewMode === 'flat'
                ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange('favorites')}
            title="Favorites"
            className={`flex items-center justify-center p-1.5 rounded-lg text-xs transition-all ${
              viewMode === 'favorites'
                ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange('history')}
            title="Recently Played"
            className={`flex items-center justify-center p-1.5 rounded-lg text-xs transition-all ${
              viewMode === 'history'
                ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sort Selector Dropdown */}
        <div className="relative group">
          <button
            title="Sort options"
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-xl border border-slate-800 transition-colors"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
          <div className="absolute right-0 top-full mt-1.5 w-40 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-1 z-30 hidden group-hover:block">
            <button
              onClick={() => onSortChange('name-asc')}
              className={`w-full text-left px-3 py-1.5 text-xs rounded-lg flex items-center justify-between ${
                sortOption === 'name-asc' ? 'text-indigo-400 bg-indigo-500/10 font-medium' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>Name (A - Z)</span>
              {sortOption === 'name-asc' && <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => onSortChange('name-desc')}
              className={`w-full text-left px-3 py-1.5 text-xs rounded-lg flex items-center justify-between ${
                sortOption === 'name-desc' ? 'text-indigo-400 bg-indigo-500/10 font-medium' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>Name (Z - A)</span>
              {sortOption === 'name-desc' && <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => onSortChange('size-desc')}
              className={`w-full text-left px-3 py-1.5 text-xs rounded-lg flex items-center justify-between ${
                sortOption === 'size-desc' ? 'text-indigo-400 bg-indigo-500/10 font-medium' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>Largest File Size</span>
              {sortOption === 'size-desc' && <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => onSortChange('date-desc')}
              className={`w-full text-left px-3 py-1.5 text-xs rounded-lg flex items-center justify-between ${
                sortOption === 'date-desc' ? 'text-indigo-400 bg-indigo-500/10 font-medium' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>Recently Modified</span>
              {sortOption === 'date-desc' && <Check className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main List Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {!rootFolder && allVideos.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Film className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-bounce" />
            <p className="text-xs text-slate-400 font-medium">No video folder selected</p>
            <p className="text-[11px] text-slate-500 mt-1">Click "Open Folder" above to start streaming</p>
          </div>
        ) : (
          <>
            {/* Tree View */}
            {viewMode === 'tree' && rootFolder && (
              <div className="space-y-1">
                <RenderTreeNode node={rootFolder} />
              </div>
            )}

            {/* Flat Video List */}
            {viewMode === 'flat' && (
              <div className="space-y-1">
                <div className="px-2 py-1 text-[11px] text-slate-400 font-medium uppercase tracking-wider flex items-center justify-between">
                  <span>All Videos ({filteredVideos.length})</span>
                </div>
                {sortVideos(filteredVideos).map((video) => (
                  <VideoItemRow key={video.id} video={video} />
                ))}
              </div>
            )}

            {/* Favorites View */}
            {viewMode === 'favorites' && (
              <div className="space-y-1">
                <div className="px-2 py-1 text-[11px] text-slate-400 font-medium uppercase tracking-wider flex items-center justify-between">
                  <span>Favorites ({favoriteVideos.length})</span>
                </div>
                {favoriteVideos.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    No favorite videos added yet. Click the heart icon on any video!
                  </div>
                ) : (
                  favoriteVideos.map((video) => (
                    <VideoItemRow key={video.id} video={video} />
                  ))
                )}
              </div>
            )}

            {/* History View */}
            {viewMode === 'history' && (
              <div className="space-y-2">
                <div className="px-2 py-1 text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                  Recently Played
                </div>
                {history.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    No playback history yet.
                  </div>
                ) : (
                  history.map((hItem) => {
                    const matchedVideo = allVideos.find((v) => v.id === hItem.path || v.name === hItem.videoName);
                    return (
                      <div
                        key={hItem.path + hItem.lastPlayedAt}
                        onClick={() => matchedVideo && onSelectVideo(matchedVideo)}
                        className={`p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-800/70 cursor-pointer transition-colors ${
                          matchedVideo ? '' : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <p className="text-xs text-slate-200 font-medium truncate">{hItem.videoName}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {new Date(hItem.lastPlayedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-indigo-400">
                            {formatDuration(hItem.timestamp)} / {formatDuration(hItem.duration)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
