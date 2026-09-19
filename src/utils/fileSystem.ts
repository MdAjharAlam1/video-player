import type { VideoItem, FolderNode, SubtitleItem } from '../types/video';

export const VIDEO_EXTENSIONS = new Set([
  'mp4',
  'webm',
  'mov',
  'mkv',
  'avi',
  'm4v',
  'ogv',
  '3gp',
  'flv',
  'wmv',
]);

export const SUBTITLE_EXTENSIONS = new Set(['srt', 'vtt']);

export function isVideoFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return VIDEO_EXTENSIONS.has(ext);
}

export function isSubtitleFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return SUBTITLE_EXTENSIONS.has(ext);
}

export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => String(n).padStart(2, '0');

  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${mins}:${pad(secs)}`;
}

/**
 * Scans a DirectoryHandle recursively using the File System Access API.
 */
export async function scanDirectoryHandle(
  dirHandle: FileSystemDirectoryHandle,
  parentPath = ''
): Promise<{ rootFolder: FolderNode; allVideos: VideoItem[]; allSubtitles: SubtitleItem[] }> {
  const allVideos: VideoItem[] = [];
  const allSubtitles: SubtitleItem[] = [];

  async function processDirectory(
    handle: FileSystemDirectoryHandle,
    currentPath: string
  ): Promise<FolderNode> {
    const videos: VideoItem[] = [];
    const subfolders: FolderNode[] = [];

    // Iterating directory handle values
    for await (const entry of (handle as unknown as AsyncIterable<FileSystemHandle>)) {
      if (entry.kind === 'file') {
        const fileHandle = entry as FileSystemFileHandle;
        if (isVideoFile(entry.name)) {
          const file = await fileHandle.getFile();
          const video: VideoItem = {
            id: `${currentPath}/${entry.name}`,
            name: entry.name,
            path: `${currentPath}/${entry.name}`,
            file,
            handle: fileHandle,
            size: file.size,
            lastModified: file.lastModified,
            extension: getFileExtension(entry.name),
            parentFolderPath: currentPath,
          };
          videos.push(video);
          allVideos.push(video);
        } else if (isSubtitleFile(entry.name)) {
          const file = await fileHandle.getFile();
          const ext = getFileExtension(entry.name) as 'srt' | 'vtt';
          const sub: SubtitleItem = {
            id: `${currentPath}/${entry.name}`,
            name: entry.name,
            language: entry.name.split('.')[0] || 'Default',
            file,
            url: '',
            format: ext,
          };
          allSubtitles.push(sub);
        }
      } else if (entry.kind === 'directory') {
        const subDirHandle = entry as FileSystemDirectoryHandle;
        const subFolderNode = await processDirectory(
          subDirHandle,
          currentPath ? `${currentPath}/${entry.name}` : entry.name
        );
        if (subFolderNode.videos.length > 0 || subFolderNode.subfolders.length > 0) {
          subfolders.push(subFolderNode);
        }
      }
    }

    // Sort videos by name
    videos.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    subfolders.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    return {
      id: currentPath || handle.name,
      name: handle.name,
      path: currentPath || handle.name,
      videos,
      subfolders,
      isOpen: true,
    };
  }

  const rootFolder = await processDirectory(dirHandle, parentPath || dirHandle.name);
  return { rootFolder, allVideos, allSubtitles };
}

/**
 * Scans standard HTML FileList (from input[type=file webkitdirectory] or Drag and Drop)
 */
export async function scanFileList(
  files: FileList | File[]
): Promise<{ rootFolder: FolderNode; allVideos: VideoItem[]; allSubtitles: SubtitleItem[] }> {
  const fileArray = Array.from(files);
  const allVideos: VideoItem[] = [];
  const allSubtitles: SubtitleItem[] = [];

  const folderMap = new Map<string, { videos: VideoItem[]; subfolderPaths: Set<string> }>();

  let rootName = 'Selected Folder';

  for (const file of fileArray) {
    const relPath = file.webkitRelativePath || file.name;
    const pathParts = relPath.split('/');

    if (pathParts.length > 1 && !rootName) {
      rootName = pathParts[0];
    }

    const fileName = file.name;
    const parentPath = pathParts.slice(0, -1).join('/') || 'Root';

    if (isVideoFile(fileName)) {
      const video: VideoItem = {
        id: relPath,
        name: fileName,
        path: relPath,
        file,
        size: file.size,
        lastModified: file.lastModified,
        extension: getFileExtension(fileName),
        parentFolderPath: parentPath,
      };
      allVideos.push(video);

      if (!folderMap.has(parentPath)) {
        folderMap.set(parentPath, { videos: [], subfolderPaths: new Set() });
      }
      folderMap.get(parentPath)!.videos.push(video);
    } else if (isSubtitleFile(fileName)) {
      const ext = getFileExtension(fileName) as 'srt' | 'vtt';
      allSubtitles.push({
        id: relPath,
        name: fileName,
        language: fileName.split('.')[0] || 'Default',
        file,
        url: '',
        format: ext,
      });
    }

    for (let i = 0; i < pathParts.length - 1; i++) {
      const currentFolderPath = pathParts.slice(0, i + 1).join('/');
      if (!folderMap.has(currentFolderPath)) {
        folderMap.set(currentFolderPath, { videos: [], subfolderPaths: new Set() });
      }
      if (i < pathParts.length - 2) {
        const childFolderPath = pathParts.slice(0, i + 2).join('/');
        folderMap.get(currentFolderPath)!.subfolderPaths.add(childFolderPath);
      }
    }
  }

  function buildTree(path: string): FolderNode {
    const data = folderMap.get(path) || { videos: [], subfolderPaths: new Set() };
    const name = path.split('/').pop() || path;

    const subfolders: FolderNode[] = [];
    for (const subPath of data.subfolderPaths) {
      subfolders.push(buildTree(subPath));
    }

    data.videos.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    subfolders.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    return {
      id: path,
      name,
      path,
      videos: data.videos,
      subfolders,
      isOpen: true,
    };
  }

  const rootPathKeys = Array.from(folderMap.keys()).sort((a, b) => a.length - b.length);
  const rootPath = rootPathKeys[0] || 'Root';

  const rootFolder = buildTree(rootPath);
  return { rootFolder, allVideos, allSubtitles };
}

export function findMatchingSubtitles(video: VideoItem, subtitles: SubtitleItem[]): SubtitleItem[] {
  const videoBaseName = video.name.substring(0, video.name.lastIndexOf('.')).toLowerCase();

  return subtitles.filter((sub) => {
    const subBaseName = sub.name.substring(0, sub.name.lastIndexOf('.')).toLowerCase();
    return subBaseName.startsWith(videoBaseName) || sub.id.startsWith(video.parentFolderPath);
  });
}
