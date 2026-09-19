import React, { useRef } from 'react';
import {
  FolderOpen,
  Search,
  Keyboard,
  Sidebar as SidebarIcon,
  Video,
  Sparkles,
  Upload,
} from 'lucide-react';

interface HeaderProps {
  onOpenDirectory: () => void;
  onOpenFiles: (files: FileList) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleSidebar: () => void;
  onOpenShortcuts: () => void;
  totalVideos: number;
  sidebarOpen: boolean;
  supportsDirectoryPicker: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDirectory,
  onOpenFiles,
  searchQuery,
  onSearchChange,
  onToggleSidebar,
  onOpenShortcuts,
  totalVideos,
  sidebarOpen,
  supportsDirectoryPicker,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onOpenFiles(e.target.files);
    }
  };

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between z-20 sticky top-0 shadow-lg select-none">
      {/* Left: Brand & Sidebar Toggle */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <SidebarIcon className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Video className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-slate-100 text-base tracking-tight flex items-center gap-1.5">
                StreamLocal <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">100% Private</span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Zero-upload local browser media player</p>
          </div>
        </div>
      </div>

      {/* Middle: Search Bar */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={totalVideos > 0 ? `Search ${totalVideos} video${totalVideos > 1 ? 's' : ''}...` : 'Search videos...'}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-2">
        {/* Total Videos Badge */}
        {totalVideos > 0 && (
          <span className="hidden md:inline-flex items-center gap-1 text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-indigo-400">{totalVideos}</span> videos loaded
          </span>
        )}

        {/* Keyboard Shortcuts Button */}
        <button
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts"
          className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 rounded-lg transition-colors border border-transparent hover:border-slate-700/50"
        >
          <Keyboard className="w-5 h-5" />
        </button>

        {/* Folder / File Input Hidden Trigger */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="video/*,.srt,.vtt"
          className="hidden"
        />
        <input
          type="file"
          ref={folderInputRef}
          onChange={handleFileChange}
          // @ts-expect-error webkitdirectory is standard for folder picker
          webkitdirectory=""
          directory=""
          multiple
          className="hidden"
        />

        {/* Primary Action Button: Open Directory */}
        {supportsDirectoryPicker ? (
          <button
            onClick={onOpenDirectory}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98] border border-indigo-400/20"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Open Folder</span>
          </button>
        ) : (
          <button
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98]"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Select Folder</span>
          </button>
        )}

        {/* Secondary Action: Select Individual Files */}
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Choose individual video files"
          className="hidden sm:flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-medium border border-slate-700 transition-all"
        >
          <Upload className="w-3.5 h-3.5 text-slate-400" />
          <span>Add Files</span>
        </button>
      </div>
    </header>
  );
};
