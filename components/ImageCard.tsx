import React, { useState, useCallback, useEffect } from 'react';
import type { ImageResult } from '../types';
import { DownloadIcon, ErrorIcon, ShareIcon, CopyIcon, SparklesIcon, VideoIcon, BackIcon, CheckIcon, ZoomIcon } from './Icons';
import { shareImage, copyImageToClipboard } from '../utils';

interface ImageCardProps {
  image: ImageResult;
  onRegenerate: (updates: { newStyle: string, newPrompt: string }) => void;
  onVideoAction: (aspectRatio: string) => void;
  onView: () => void;
}

const LoadingState: React.FC<{ aspectRatio: string }> = ({ aspectRatio }) => (
    <div className={`w-full bg-slate-200 rounded-lg flex items-center justify-center animate-pulse aspect-[${aspectRatio.replace(':', '/')}]`}>
        <svg className="w-10 h-10 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

const ErrorState: React.FC<{ message: string; aspectRatio: string }> = ({ message, aspectRatio }) => {
    const parts = message.split('Details:');
    const reason = parts[0].trim();
    const details = parts[1] ? parts[1].trim() : '';

    return (
        <div className={`w-full bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center p-3 text-center aspect-[${aspectRatio.replace(':', '/')}]`}>
            <ErrorIcon className="w-8 h-8 text-red-400 mb-2 flex-shrink-0"/>
            <p className="text-sm font-semibold text-red-700 flex-shrink-0">Generation Failed</p>
            <div className="w-full mt-2 text-xs text-red-600 space-y-1 overflow-y-auto max-h-24 text-left p-2 bg-red-100 rounded-md">
               <p><span className="font-semibold">Reason:</span> {reason}</p>
               {details && <p className="mt-1"><span className="font-semibold">Details:</span> {details}</p>}
            </div>
             <p className="text-xs text-slate-500 mt-2 flex-shrink-0">Please try adjusting your prompt.</p>
        </div>
    );
};


const styleOptions = [
    { value: 'e-commerce', label: 'E-commerce (Plain White)' },
    { value: 'studio-bokeh', label: 'Photorealistic (Studio Bokeh)' },
    { value: 'cinematic', label: 'Cinematic (Dramatic Lighting)' },
    { value: 'high-fashion', label: 'High-Fashion (Geometric)' },
    { value: 'lifestyle', label: 'Lifestyle (Outdoor Natural Light)' },
    { value: 'vintage', label: 'Vintage (Sepia & Film Grain)' },
    { value: 'minimalist', label: 'Minimalist (Clean Studio)' },
    { value: 'dramatic', label: 'Dramatic (Dark & Moody)' },
    { value: 'monochrome', label: 'Monochrome (B&W Studio)' },
];

const ratioOptions = [
    { value: '3:4', label: '3:4 Portrait' },
    { value: '4:3', label: '4:3 Landscape' },
    { value: '16:9', label: '16:9 Widescreen' },
    { value: '9:16', label: '9:16 Vertical' },
    { value: '1:1', label: '1:1 Square' },
];

export const ImageCard: React.FC<ImageCardProps> = ({ image, onRegenerate, onVideoAction, onView }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success'>('idle');
  const [editedPrompt, setEditedPrompt] = useState(image.prompt);
  const [selectedStyle, setSelectedStyle] = useState(image.style);
  const [videoAspectRatio, setVideoAspectRatio] = useState(image.aspectRatio || '3:4');
  const [activePanel, setActivePanel] = useState<'none' | 'regenerate' | 'video'>('none');


  useEffect(() => {
    setEditedPrompt(image.prompt);
    setSelectedStyle(image.style);
  }, [image.prompt, image.style]);

  const handleDownload = () => {
    if (image.status !== 'success' || !image.src) return;
    const link = document.createElement('a');
    link.href = image.src;
    link.download = `generated-photo-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = useCallback(async () => {
      if (image.status !== 'success' || !image.src) return;
      await shareImage(image.src, image.prompt);
  }, [image.src, image.prompt, image.status]);

  const handleCopy = useCallback(async () => {
    if (image.status !== 'success' || !image.src) return;
    const success = await copyImageToClipboard(image.src);
    if (success) {
        setCopyStatus('success');
        setTimeout(() => setCopyStatus('idle'), 2000);
    }
  }, [image.src, image.status]);
  
  const handleRegenerateClick = () => {
    onRegenerate({ newStyle: selectedStyle, newPrompt: editedPrompt });
    setActivePanel('none');
  };

  const handleVideoClick = () => {
      onVideoAction(videoAspectRatio);
      setActivePanel('none');
  }

  const VideoButton: React.FC<{onClick: () => void}> = ({onClick}) => {
    const baseClasses = "w-full flex items-center justify-center gap-2 text-white font-semibold py-2 px-3 rounded-md text-sm transition-colors";
    
    switch (image.videoStatus) {
      case 'loading':
        return (
          <button disabled className={`${baseClasses} bg-slate-500 cursor-wait`}>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg> Generating...
          </button>
        );
      case 'success':
        return (
          <button onClick={onClick} className={`${baseClasses} bg-green-600 hover:bg-green-700`}>
            <VideoIcon className="w-4 h-4" /> View Video
          </button>
        );
      case 'error':
        return (
          <button onClick={onClick} className={`${baseClasses} bg-red-600 hover:bg-red-700`} title={image.videoError}>
            <VideoIcon className="w-4 h-4" /> Retry Video
          </button>
        );
      default:
        return (
          <button onClick={onClick} className={`${baseClasses} bg-indigo-600 hover:bg-indigo-700`}>
            <VideoIcon className="w-4 h-4" /> Generate Video
          </button>
        );
    }
  };

  const aspectRatioClass = image.aspectRatio ? `aspect-[${image.aspectRatio.replace(':', '/')}]` : 'aspect-[3/4]';

  return (
    <div 
        className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 transition-all hover:shadow-xl hover:-translate-y-1"
    >
      <div className="relative group">
        {image.status === 'loading' && <LoadingState aspectRatio={image.aspectRatio || '3:4'} />}
        {image.status === 'error' && <ErrorState message={image.error || 'Unknown error'} aspectRatio={image.aspectRatio || '3:4'} />}
        {image.status === 'success' && (
          <>
            <img
              src={image.src}
              alt={image.prompt}
              className={`w-full h-auto object-cover rounded-lg ${aspectRatioClass}`}
            />
            {image.videoStatus === 'loading' && activePanel === 'none' && (
              <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <svg className="animate-spin h-8 w-8 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <p className="font-semibold">Generating Video...</p>
                  <p className="text-xs text-slate-300">This can take a few minutes.</p>
                </div>
              </div>
            )}
          </>
        )}
        {image.status === 'success' && (
            <div className={`absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg ${activePanel !== 'none' ? '!opacity-100' : ''}`}>
               {activePanel === 'none' && (
                    <div className="p-3 flex flex-col justify-start h-full text-white">
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setActivePanel('regenerate')} className="w-8 h-8 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 rounded-full transition" aria-label="Regenerate image"><SparklesIcon className="w-4 h-4" /></button>
                            <button onClick={() => setActivePanel('video')} className="w-8 h-8 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 rounded-full transition" aria-label="Create video"><VideoIcon className="w-4 h-4" /></button>
                            <button onClick={onView} className="w-8 h-8 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 rounded-full transition" aria-label="View image"><ZoomIcon className="w-4 h-4" /></button>
                            <button onClick={handleDownload} className="w-8 h-8 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 rounded-full transition" aria-label="Download image"><DownloadIcon className="w-4 h-4" /></button>
                            <button onClick={handleShare} className="w-8 h-8 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 rounded-full transition" aria-label="Share image"><ShareIcon className="w-4 h-4" /></button>
                            <button onClick={handleCopy} disabled={copyStatus !== 'idle'} className="w-8 h-8 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 rounded-full transition" aria-label="Copy image">
                                {copyStatus === 'success' ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                )}
                {activePanel === 'regenerate' && (
                    <div className="p-3 flex flex-col h-full bg-slate-900/90 backdrop-blur-sm text-white space-y-2">
                        <div className="flex items-center mb-1 flex-shrink-0">
                            <button onClick={() => setActivePanel('none')} className="p-1 text-slate-300 hover:text-white mr-2"><BackIcon className="w-5 h-5"/></button>
                            <h4 className="font-bold text-sm">Regenerate Image</h4>
                        </div>
                        <div className="space-y-2 flex-grow flex flex-col">
                           <textarea
                                value={editedPrompt}
                                onChange={(e) => setEditedPrompt(e.target.value)}
                                rows={4}
                                className="w-full text-xs p-2 rounded-md bg-slate-800 border border-slate-600 text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
                                aria-label="Edit image prompt"
                            />
                            <select
                                value={selectedStyle}
                                onChange={(e) => setSelectedStyle(e.target.value)}
                                className="w-full bg-slate-800 text-white text-sm font-semibold py-2 px-2 rounded-md border border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                aria-label="Change image style"
                            >
                                {styleOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                         <button 
                            onClick={handleRegenerateClick}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-md text-sm transition-colors flex-shrink-0"
                            aria-label="Regenerate image with new prompt and style"
                        >
                            <SparklesIcon className="w-4 h-4"/>
                            Regenerate
                        </button>
                    </div>
                )}
                 {activePanel === 'video' && (
                    <div className="p-3 flex flex-col h-full bg-slate-900/90 backdrop-blur-sm text-white space-y-2 justify-between">
                        <div className="flex items-center mb-1">
                            <button onClick={() => setActivePanel('none')} className="p-1 text-slate-300 hover:text-white mr-2"><BackIcon className="w-5 h-5"/></button>
                            <h4 className="font-bold text-sm">Create Video</h4>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor={`ratio-select-${image.id}`} className="text-xs font-semibold text-slate-200 block">Aspect Ratio</label>
                            <select
                                id={`ratio-select-${image.id}`}
                                value={videoAspectRatio}
                                onChange={(e) => setVideoAspectRatio(e.target.value)}
                                className="w-full bg-slate-800 text-white text-sm font-semibold py-2 px-2 rounded-md border border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                aria-label="Select video aspect ratio"
                                disabled={image.videoStatus === 'loading'}
                            >
                                {ratioOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <VideoButton onClick={handleVideoClick} />
                    </div>
                 )}
            </div>
        )}
      </div>
      <p className="text-xs text-slate-500 mt-3 px-1 leading-snug truncate" title={image.prompt}>
        {image.prompt}
      </p>
    </div>
  );
};