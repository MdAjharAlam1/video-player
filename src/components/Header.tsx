import React, { useRef } from 'react';
import {
  FolderOpen,
  Search,
  Keyboard,
  Sidebar as SidebarIcon,
  Video,
  Sparkles,
  Upload,
  RotateCw,
  KeyRound,
  Sun,
  Moon,
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
  permissionState?: 'granted' | 'prompt' | 'denied' | 'none';
  onGrantPermission?: () => void;
  onRefreshLibrary?: () => void;
  hasSavedLibrary?: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
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
  permissionState = 'none',
  onGrantPermission,
  onRefreshLibrary,
  hasSavedLibrary = false,
  theme,
  onToggleTheme,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onOpenFiles(e.target.files);
    }
  };

  const isDark = theme === 'dark';

  return (
    <header
      className={`px-4 py-3 flex items-center justify-between z-20 sticky top-0 shadow-lg select-none backdrop-blur-md transition-colors duration-300 ${
        isDark
          ? 'bg-slate-900/80 border-b border-slate-800/80 text-slate-100 shadow-slate-950/50'
          : 'bg-white/85 border-b border-slate-200/80 text-slate-800 shadow-slate-200/50'
      }`}
    >
      {/* Left: Brand & Sidebar Toggle */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          className={`p-2 rounded-xl transition-colors focus:outline-none ${
            isDark
              ? 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <SidebarIcon className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center">
            <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
              <Video className="w-5 h-5 text-indigo-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className={`font-bold text-base tracking-tight flex items-center gap-1.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                StreamLocal{' '}
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                  isDark
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                }`}>
                  100% Private
                </span>
              </h1>
            </div>
            <p className={`text-[11px] hidden sm:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Zero-upload local browser media player
            </p>
          </div>
        </div>
      </div>

      {/* Middle: Search Bar */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder={totalVideos > 0 ? `Search ${totalVideos} video${totalVideos > 1 ? 's' : ''}...` : 'Search videos...'}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none transition-all ${
              isDark
                ? 'bg-slate-950/70 border border-slate-800 text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                : 'bg-slate-100/90 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
                isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'
              }`}
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
          <span className={`hidden md:inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border font-medium ${
            isDark
              ? 'text-slate-300 bg-slate-800/80 border-slate-700/50'
              : 'text-slate-700 bg-slate-100 border-slate-200'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold text-indigo-500">{totalVideos}</span> videos loaded
          </span>
        )}

        {/* Rescan / Refresh Button */}
        {hasSavedLibrary && permissionState === 'granted' && onRefreshLibrary && (
          <button
            onClick={onRefreshLibrary}
            title="Refresh / Rescan Folder"
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`p-2 rounded-xl border transition-all duration-300 active:scale-90 ${
            isDark
              ? 'text-amber-400 hover:bg-slate-800 border-slate-800 hover:border-slate-700'
              : 'text-indigo-600 hover:bg-slate-100 border-slate-200 hover:border-slate-300'
          }`}
        >
          {isDark ? <Sun className="w-5 h-5 transition-transform duration-300 hover:rotate-45" /> : <Moon className="w-5 h-5 transition-transform duration-300 hover:-rotate-12" />}
        </button>

        {/* Keyboard Shortcuts Button */}
        <button
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts"
          className={`p-2 rounded-xl transition-colors border ${
            isDark
              ? 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 border-transparent hover:border-slate-700/50'
              : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100 border-transparent hover:border-slate-200'
          }`}
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
          // @ts-expect-error webkitdirectory standard
          webkitdirectory=""
          directory=""
          multiple
          className="hidden"
        />

        {/* Permission Actions or Folder Open Button */}
        {permissionState === 'prompt' ? (
          <button
            onClick={onGrantPermission}
            className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-amber-600/30 transition-all border border-amber-400/30 animate-pulse"
          >
            <KeyRound className="w-4 h-4" />
            <span>Grant Folder Access</span>
          </button>
        ) : permissionState === 'denied' ? (
          <button
            onClick={onOpenDirectory}
            className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 transition-all"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Select Folder Again</span>
          </button>
        ) : supportsDirectoryPicker ? (
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
          className={`hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
          }`}
        >
          <Upload className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <span>Add Files</span>
        </button>
      </div>
    </header>
  );
};
