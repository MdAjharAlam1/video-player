/**
 * Queries read permission status for a FileSystemDirectoryHandle.
 */
export async function checkFolderPermission(
  handle: FileSystemDirectoryHandle
): Promise<PermissionState> {
  try {
    // @ts-expect-error queryPermission is standard on FileSystemHandle
    if (typeof handle.queryPermission === 'function') {
      // @ts-expect-error queryPermission standard
      return await handle.queryPermission({ mode: 'read' });
    }
    return 'granted';
  } catch (err) {
    console.warn('Error checking folder permission:', err);
    return 'prompt';
  }
}

/**
 * Requests read permission for a FileSystemDirectoryHandle.
 */
export async function requestFolderPermission(
  handle: FileSystemDirectoryHandle
): Promise<PermissionState> {
  try {
    // @ts-expect-error requestPermission is standard on FileSystemHandle
    if (typeof handle.requestPermission === 'function') {
      // @ts-expect-error requestPermission standard
      return await handle.requestPermission({ mode: 'read' });
    }
    return 'granted';
  } catch (err) {
    console.warn('Error requesting folder permission:', err);
    return 'denied';
  }
}
