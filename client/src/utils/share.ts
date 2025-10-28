/**
 * Web Share API utilities with graceful fallbacks
 */

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

/**
 * Check if Web Share API is supported
 */
export function canShare(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

/**
 * Check if Web Share API supports files
 */
export function canShareFiles(): boolean {
  return canShare() && navigator.canShare && navigator.canShare({ files: [] });
}

/**
 * Share content using Web Share API with fallback
 */
export async function shareContent(options: ShareOptions): Promise<boolean> {
  if (!canShare()) {
    return false;
  }

  try {
    // If sharing files, check if supported
    if (options.files && options.files.length > 0) {
      if (!canShareFiles()) {
        return false;
      }
      
      // Check if the specific files can be shared
      if (!navigator.canShare({ files: options.files })) {
        return false;
      }
    }

    await navigator.share(options);
    return true;
  } catch (error) {
    // User cancelled or error occurred
    if (error instanceof Error && error.name === 'AbortError') {
      // User cancelled - this is ok, just return false
      return false;
    }
    console.error('Share failed:', error);
    return false;
  }
}

/**
 * Share an image blob
 */
export async function shareImage(blob: Blob, filename: string = 'survivor-selfie.png'): Promise<boolean> {
  try {
    const file = new File([blob], filename, { type: blob.type });
    
    return await shareContent({
      files: [file],
      title: 'My Survivor 50 Selfie',
      text: 'Check out my Survivor 50 AR selfie! Step into the game at Survivor 50 AR Selfie Studio.',
    });
  } catch (error) {
    console.error('Failed to share image:', error);
    return false;
  }
}

/**
 * Copy image to clipboard
 */
export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  try {
    if ('clipboard' in navigator && 'write' in navigator.clipboard) {
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
