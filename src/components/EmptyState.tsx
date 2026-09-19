import React from 'react';
import {
  FolderOpen,
  Film,
  ShieldCheck,
  Zap,
  Volume2,
  Subtitles,
  Upload,
  Sparkles,
} from 'lucide-react';

interface EmptyStateProps {
  onOpenDirectory: () => void;
  onOpenFiles: (files: FileList) => void;
  supportsDirectoryPicker: boolean;
  theme: 'dark' | 'light';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onOpenDirectory,
  onOpenFiles,
  supportsDirectoryPicker,
  theme,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const folderInputRef = React.useRef<HTMLInputElement>(null);
  const isDark = theme === 'dark';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onOpenFiles(e.target.files);
    }
  };

  return (
    <div className={`flex-1 flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100/80 text-slate-900'
    }`}>
      {/* Background Glows */}
      <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
        isDark ? 'bg-indigo-600/10' : 'bg-indigo-500/15'
      }`} />
      <div className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
        isDark ? 'bg-purple-600/10' : 'bg-purple-500/15'
      }`} />

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

      <div className={`max-w-xl w-full backdrop-blur-xl border rounded-3xl p-8 shadow-2xl relative z-10 space-y-6 transition-colors duration-300 ${
        isDark
          ? 'bg-slate-900/60 border-slate-800/80'
          : 'bg-white/90 border-slate-200/80 shadow-slate-300/40'
      }`}>
        {/* Animated Icon Header */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-xl shadow-indigo-500/30 flex items-center justify-center group hover:scale-105 transition-transform duration-300">
          <div className={`w-full h-full rounded-[14px] flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
            <Film className="w-10 h-10 text-indigo-500 group-hover:text-pink-500 transition-colors" />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h2 className={`text-2xl font-extrabold tracking-tight flex items-center justify-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            Local Video Player <Sparkles className="w-5 h-5 text-amber-500" />
          </h2>
          <p className={`text-sm max-w-md mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Select a folder or video files from your device. Play high quality MP4, WebM, MOV & MKV directly in your browser without uploading!
          </p>
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {supportsDirectoryPicker ? (
            <button
              onClick={onOpenDirectory}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2 border border-indigo-400/20"
            >
              <FolderOpen className="w-5 h-5" />
              <span>Select Local Folder</span>
            </button>
          ) : (
            <button
              onClick={() => folderInputRef.current?.click()}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2 border border-indigo-400/20"
            >
              <FolderOpen className="w-5 h-5" />
              <span>Choose Folder</span>
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className={`w-full sm:w-auto px-5 py-3.5 rounded-2xl font-semibold text-sm border transition-all flex items-center justify-center space-x-2 ${
              isDark
                ? 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 shadow-sm'
            }`}
          >
            <Upload className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <span>Select Video Files</span>
          </button>
        </div>

        {/* Feature Grid */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t text-left ${isDark ? 'border-slate-800/60' : 'border-slate-200'}`}>
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950/50 border-slate-800/50' : 'bg-slate-50 border-slate-200/80 shadow-sm'}`}>
            <ShieldCheck className="w-5 h-5 text-emerald-500 mb-1.5" />
            <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>100% Private</p>
            <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>No server uploads</p>
          </div>

          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950/50 border-slate-800/50' : 'bg-slate-50 border-slate-200/80 shadow-sm'}`}>
            <Zap className="w-5 h-5 text-amber-500 mb-1.5" />
            <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Fast Playback</p>
            <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Instant file reading</p>
          </div>

          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950/50 border-slate-800/50' : 'bg-slate-50 border-slate-200/80 shadow-sm'}`}>
            <Subtitles className="w-5 h-5 text-indigo-500 mb-1.5" />
            <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Subtitles</p>
            <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Auto .SRT & .VTT</p>
          </div>

          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950/50 border-slate-800/50' : 'bg-slate-50 border-slate-200/80 shadow-sm'}`}>
            <Volume2 className="w-5 h-5 text-purple-500 mb-1.5" />
            <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Volume Boost</p>
            <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>+200% Gain control</p>
          </div>
        </div>

        <p className={`text-[11px] italic ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          💡 Tip: You can also drag & drop any folder or video files directly onto this screen!
        </p>
      </div>
    </div>
  );
};
