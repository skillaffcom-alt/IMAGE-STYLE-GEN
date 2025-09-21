import React, { useState, useMemo } from 'react';
import type { ImageResult } from '../types';
import { ImageCard } from './ImageCard';
import { PhotoIcon, DownloadIcon } from './Icons';
import { downloadImagesAsZip } from '../utils';

interface ImageGalleryProps {
  images: ImageResult[];
  isLoading: boolean;
  onRegenerate: (imageId: string, updates: { newStyle: string, newPrompt: string }) => void;
  onVideoAction: (imageId: string, aspectRatio: string) => void;
  onView: (imageId: string) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, onRegenerate, onVideoAction, onView }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const successfulImagesCount = useMemo(() => {
    return images.filter(img => img.status === 'success').length;
  }, [images]);

  const handleDownloadAll = async () => {
      setIsDownloading(true);
      try {
        await downloadImagesAsZip(images);
      } catch (error) {
        console.error("Download all failed:", error);
      } finally {
        setIsDownloading(false);
      }
  };

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
        <div className="bg-slate-100 p-4 rounded-full mb-4">
            <PhotoIcon className="w-12 h-12 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-700">Your Photoshoot Awaits</h3>
        <p className="text-slate-500 mt-2 max-w-sm">
          Fill in the details on the left and click "Generate Photos" to see your AI-powered commercial photoshoot come to life.
        </p>
      </div>
    );
  }

  return (
    <div>
        {successfulImagesCount > 0 && (
            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-700">Results</h2>
                <button
                    onClick={handleDownloadAll}
                    disabled={isDownloading}
                    className="flex items-center justify-center gap-2 bg-slate-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:bg-slate-400 disabled:cursor-wait transition-colors"
                >
                    {isDownloading ? (
                        <>
                           <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                           </svg>
                           Zipping...
                        </>
                    ) : (
                        <>
                            <DownloadIcon className="w-5 h-5" />
                            Download All ({successfulImagesCount})
                        </>
                    )}
                </button>
            </div>
        )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {images.map((image) => (
          <ImageCard 
              key={image.id} 
              image={image} 
              onRegenerate={(updates) => onRegenerate(image.id, updates)}
              onVideoAction={(aspectRatio) => onVideoAction(image.id, aspectRatio)}
              onView={() => onView(image.id)}
          />
        ))}
      </div>
    </div>
  );
};