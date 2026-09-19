import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space / K', label: 'Play / Pause video' },
    { key: 'F', label: 'Toggle Fullscreen mode' },
    { key: 'M', label: 'Mute / Unmute audio' },
    { key: '← / →', label: 'Seek backward / forward 5 seconds' },
    { key: 'J / L', label: 'Seek backward / forward 10 seconds' },
    { key: '↑ / ↓', label: 'Volume level up / down (10%)' },
    { key: 'P', label: 'Toggle Picture-in-Picture mode' },
    { key: 'N', label: 'Next video in playlist' },
    { key: 'Shift + P', label: 'Previous video in playlist' },
    { key: '[ / ]', label: 'Decrease / Increase playback speed' },
    { key: 'S', label: 'Capture frame screenshot (PNG)' },
    { key: 'Esc', label: 'Exit fullscreen or close modal' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Keyboard Hotkeys</h3>
              <p className="text-[11px] text-slate-400">Control player directly with your keyboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2 custom-scrollbar">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2.5 bg-slate-950/50 rounded-xl border border-slate-800/60"
            >
              <span className="text-xs text-slate-300 font-medium">{s.label}</span>
              <kbd className="px-2.5 py-1 bg-slate-800 text-indigo-400 border border-slate-700/80 rounded-lg text-xs font-mono font-semibold shadow-inner">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-center">
          <button
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-xl text-xs font-semibold transition-colors"
          >
            Got it, close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
