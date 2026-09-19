import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  theme = 'dark',
}) => {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

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
    <div className={`fixed inset-0 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 ${
      isDark ? 'bg-slate-950/80' : 'bg-slate-900/40'
    }`}>
      <div className={`border rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Modal Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl border border-indigo-500/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Keyboard Hotkeys</h3>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Control player directly with your keyboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors ${
              isDark ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2 custom-scrollbar">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className={`flex items-center justify-between p-2.5 rounded-xl border ${
                isDark ? 'bg-slate-950/50 border-slate-800/60' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{s.label}</span>
              <kbd className={`px-2.5 py-1 text-indigo-500 border rounded-lg text-xs font-mono font-semibold shadow-inner ${
                isDark ? 'bg-slate-800 border-slate-700/80' : 'bg-white border-slate-200'
              }`}>
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={`p-3 border-t text-center ${
          isDark ? 'border-slate-800/80 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
        }`}>
          <button
            onClick={onClose}
            className={`w-full py-2 rounded-xl text-xs font-semibold transition-colors ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            Got it, close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
