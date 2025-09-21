import type { ImageResult } from './types';

// Add a global declaration for JSZip, which is loaded from a CDN
declare const JSZip: any;

/**
 * Converts a data URL string (e.g., "data:image/png;base64,...") to a Blob object.
 * This is necessary for using the data with APIs like Web Share or Clipboard.
 * @param dataUrl The data URL to convert.
 * @returns A promise that resolves with the Blob.
 */
export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return blob;
};

/**
 * Attempts to share an image file using the Web Share API.
 * It first checks for browser support before proceeding.
 * @param dataUrl The data URL of the image to share.
 * @param title The title for the share dialog.
 * @returns A promise that resolves to true if sharing was initiated successfully, false otherwise.
 */
export const shareImage = async (dataUrl: string, title: string = 'Generated AI Image'): Promise<boolean> => {
  if (!navigator.share || !navigator.canShare) {
    console.warn('Web Share API is not supported in this browser.');
    alert('Sharing is not supported on your device or browser.');
    return false;
  }

  try {
    const blob = await dataUrlToBlob(dataUrl);
    const file = new File([blob], `commercial-photo.png`, { type: blob.type });

    if (navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: title,
        text: 'Check out this image I created with the Commercial Photoshoot Generator!',
        files: [file],
      });
      return true;
    } else {
      console.warn('Sharing this file type is not supported.');
      alert('Your browser does not support sharing this type of file.');
      return false;
    }
  } catch (error) {
    // Avoid showing an error if the user simply closes the share dialog
    if ((error as DOMException).name !== 'AbortError') {
        console.error('Error sharing image:', error);
        alert('An error occurred while trying to share the image.');
    }
    return false;
  }
};

/**
 * Copies an image to the user's clipboard using the Clipboard API.
 * @param dataUrl The data URL of the image to copy.
 * @returns A promise that resolves to true if the copy was successful, false otherwise.
 */
export const copyImageToClipboard = async (dataUrl: string): Promise<boolean> => {
  if (!navigator.clipboard || !navigator.clipboard.write) {
    console.warn('Clipboard API for images is not supported in this browser.');
    alert('Copying images is not supported on your device or browser.');
    return false;
  }
  try {
    const blob = await dataUrlToBlob(dataUrl);
    // The Clipboard API requires a ClipboardItem, which is constructed from a blob.
    const clipboardItem = new ClipboardItem({ [blob.type]: blob });
    await navigator.clipboard.write([clipboardItem]);
    return true;
  } catch (error) {
    console.error('Error copying image to clipboard:', error);
    alert('Failed to copy image to clipboard.');
    return false;
  }
};

/**
 * Downloads all successful images as a single zip file.
 * @param images The array of all image results.
 */
export const downloadImagesAsZip = async (images: ImageResult[]): Promise<void> => {
  const successfulImages = images.filter(img => img.status === 'success' && img.src);
  if (successfulImages.length === 0) {
    alert("No successful images to download.");
    return;
  }

  try {
    const zip = new JSZip();

    await Promise.all(successfulImages.map(async (image, index) => {
        const blob = await dataUrlToBlob(image.src);
        const fileExtension = blob.type.split('/')[1] || 'png';
        zip.file(`photo-${index + 1}-${image.id}.${fileExtension}`, blob);
    }));

    const content = await zip.generateAsync({ type: 'blob' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'commercial-photoshoot.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

  } catch (error) {
    console.error("Error creating zip file:", error);
    alert("An error occurred while creating the zip file.");
  }
};