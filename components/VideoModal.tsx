import React, { useEffect, useRef, useState } from 'react';
import { DownloadIcon, PhotoIcon, VideoIcon } from './Icons';

interface VideoModalProps {
  videoSrc: string;
  imageSrc: string;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ videoSrc, imageSrc, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
            onClose();
        }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = videoSrc;
    link.download = `generated-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
        <div 
            ref={modalRef}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all"
        >
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-700">{showImage ? 'Original Image' : 'Generated Video'}</h3>
                 <button
                    onClick={onClose}
                    className="text-slate-400 hover:bg-slate-100 rounded-full p-1 transition-colors"
                    aria-label="Close"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="p-4 bg-slate-50 flex items-center justify-center">
                {showImage ? (
                    <img
                        src={imageSrc}
                        alt="Original source for video"
                        className="w-auto h-auto rounded-lg object-contain"
                        style={{ maxHeight: '70vh' }}
                    />
                ) : (
                    <video
                        src={videoSrc}
                        controls
                        autoPlay
                        loop
                        className="w-full h-auto rounded-lg"
                        style={{ maxHeight: '70vh' }}
                    >
                        Your browser does not support the video tag.
                    </video>
                )}
            </div>
            <div className="p-4 bg-slate-100/80 rounded-b-xl flex justify-between items-center">
                 <button
                    onClick={() => setShowImage(!showImage)}
                    className="flex items-center justify-center gap-2 bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-md shadow-sm hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-colors"
                 >
                    {showImage ? <VideoIcon className="w-5 h-5"/> : <PhotoIcon className="w-5 h-5" />}
                    {showImage ? 'View Video' : 'View Original Image'}
                 </button>
                 <button
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                    <DownloadIcon className="w-5 h-5" />
                    Download Video
                </button>
            </div>
        </div>
    </div>
  );
};