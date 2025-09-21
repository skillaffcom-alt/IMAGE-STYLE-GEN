import React, { useEffect, useRef, useCallback } from 'react';
import type { ImageResult } from '../types';
import { DownloadIcon, ShareIcon, CopyIcon, CheckIcon, EnterFullscreenIcon, ExitFullscreenIcon } from './Icons';
import { shareImage, copyImageToClipboard } from '../utils';

interface ImageModalProps {
  image: ImageResult | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasMultipleImages: boolean;
}

export const ImageModal: React.FC<ImageModalProps> = ({ image, onClose, onNext, onPrev, hasMultipleImages }) => {
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [copyStatus, setCopyStatus] = React.useState<'idle' | 'success'>('idle');
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
    if (hasMultipleImages) {
        if (event.key === 'ArrowRight') {
            onNext();
        }
        if (event.key === 'ArrowLeft') {
            onPrev();
        }
    }
  }, [onClose, onNext, onPrev, hasMultipleImages]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  const handleClickOutside = (event: MouseEvent) => {
      if (document.fullscreenElement) return;

      if (modalContentRef.current && !modalContentRef.current.contains(event.target as Node)) {
          onClose();
      }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [onClose]);
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!image) return null;
  
  const handleToggleFullscreen = () => {
    if (!modalContentRef.current) return;
    if (!document.fullscreenElement) {
        modalContentRef.current.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.src;
    link.download = `generated-photo-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleShare = async () => {
      await shareImage(image.src, image.prompt);
  };

  const handleCopy = async () => {
    const success = await copyImageToClipboard(image.src);
    if (success) {
        setCopyStatus('success');
        setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="relative w-full h-full flex items-center justify-center">

        {hasMultipleImages && (
            <>
              <button onClick={onPrev} className="absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition z-10" aria-label="Previous image">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={onNext} className="absolute right-0 sm:right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition z-10" aria-label="Next image">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
        )}
        
        <div ref={modalContentRef} className="bg-white rounded-xl shadow-2xl w-auto max-w-4xl max-h-[90vh] flex flex-col transform transition-all">
          <div className="p-4 flex-shrink-0 flex items-center justify-center bg-slate-100/50 rounded-t-xl">
            <img
              src={image.src}
              alt={image.prompt}
              className="w-auto h-auto rounded-lg object-contain"
              style={{ maxHeight: 'calc(90vh - 150px)' }} // Adjust based on header/footer height
            />
          </div>
          <div className="p-4 bg-white rounded-b-xl border-t border-slate-200 space-y-3">
             <p className="text-sm text-slate-600 leading-snug max-h-20 overflow-y-auto">{image.prompt}</p>
             <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <button onClick={handleDownload} className="flex items-center justify-center gap-2 bg-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-md shadow-sm hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition-colors text-sm"><DownloadIcon className="w-4 h-4" /> Download</button>
                    <button onClick={handleShare} className="flex items-center justify-center gap-2 bg-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-md shadow-sm hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition-colors text-sm"><ShareIcon className="w-4 h-4" /> Share</button>
                    <button onClick={handleCopy} disabled={copyStatus !== 'idle'} className="flex items-center justify-center gap-2 bg-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-md shadow-sm hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition-colors text-sm min-w-[80px]">
                        {copyStatus === 'success' ? <CheckIcon className="w-4 h-4 text-green-600" /> : <CopyIcon className="w-4 h-4" />}
                        {copyStatus === 'success' ? 'Copied' : 'Copy'}
                    </button>
                     <button 
                        onClick={handleToggleFullscreen}
                        className="flex items-center justify-center gap-2 bg-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-md shadow-sm hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition-colors text-sm"
                        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                     >
                        {isFullscreen ? <ExitFullscreenIcon className="w-4 h-4" /> : <EnterFullscreenIcon className="w-4 h-4" />}
                    </button>
                 </div>
                 <button onClick={onClose} className="text-slate-500 font-semibold py-2 px-3 hover:bg-slate-200 rounded-md transition-colors text-sm" aria-label="Close">Close</button>
             </div>
          </div>
        </div>

        <button onClick={onClose} className="absolute top-2 right-2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition" aria-label="Close modal">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
};