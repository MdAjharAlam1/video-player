export interface VideoItem {
  id: string;
  name: string;
  path: string;
  file: File;
  handle?: FileSystemFileHandle;
  size: number;
  lastModified: number;
  extension: string;
  duration?: number;
  url?: string;
  parentFolderPath: string;
}

export interface SubtitleItem {
  id: string;
  name: string;
  language: string;
  file: File;
  url: string;
  format: 'srt' | 'vtt';
}

export interface FolderNode {
  id: string;
  name: string;
  path: string;
  videos: VideoItem[];
  subfolders: FolderNode[];
  isOpen?: boolean;
}

export type ViewMode = 'tree' | 'flat' | 'favorites' | 'history';
export type SortOption = 'name-asc' | 'name-desc' | 'size-desc' | 'date-desc';

export interface PlayerSettings {
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  isLooping: boolean;
  autoPlayNext: boolean;
  volumeBoost: boolean;
  subtitleOffset: number;
  aspectRatio: 'contain' | 'cover' | '16:9' | '4:3' | 'fill';
}

export interface PlaybackHistory {
  videoName: string;
  path: string;
  timestamp: number;
  duration: number;
  lastPlayedAt: number;
}

export interface LibraryRecord {
  id: string;
  name: string;
  directoryHandle: FileSystemDirectoryHandle;
  createdAt: number;
  updatedAt: number;
}
