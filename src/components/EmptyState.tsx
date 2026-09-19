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
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onOpenDirectory,
  onOpenFiles,
  supportsDirectoryPicker,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const folderInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onOpenFiles(e.target.files);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-slate-950 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

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
        // @ts-expect-error webkitdirectory standard fallback
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
      />

      <div className="max-w-xl w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Animated Icon Header */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-xl shadow-indigo-600/30 flex items-center justify-center group hover:scale-105 transition-transform duration-300">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Film className="w-10 h-10 text-indigo-400 group-hover:text-pink-400 transition-colors" />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center justify-center gap-2">
            Local Video Player <Sparkles className="w-5 h-5 text-amber-400" />
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
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
            className="w-full sm:w-auto px-5 py-3.5 bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 rounded-2xl font-semibold text-sm border border-slate-700 transition-all flex items-center justify-center space-x-2"
          >
            <Upload className="w-4 h-4 text-slate-400" />
            <span>Select Video Files</span>
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/60 text-left">
          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
            <ShieldCheck className="w-5 h-5 text-emerald-400 mb-1.5" />
            <p className="text-xs font-bold text-slate-200">100% Private</p>
            <p className="text-[10px] text-slate-500">No server uploads</p>
          </div>

          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
            <Zap className="w-5 h-5 text-amber-400 mb-1.5" />
            <p className="text-xs font-bold text-slate-200">Fast Playback</p>
            <p className="text-[10px] text-slate-500">Instant file reading</p>
          </div>

          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
            <Subtitles className="w-5 h-5 text-indigo-400 mb-1.5" />
            <p className="text-xs font-bold text-slate-200">Subtitles</p>
            <p className="text-[10px] text-slate-500">Auto .SRT & .VTT</p>
          </div>

          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
            <Volume2 className="w-5 h-5 text-purple-400 mb-1.5" />
            <p className="text-xs font-bold text-slate-200">Volume Boost</p>
            <p className="text-[10px] text-slate-500">+200% Gain control</p>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 italic">
          💡 Tip: You can also drag & drop any folder or video files directly onto this screen!
        </p>
      </div>
    </div>
  );
};
