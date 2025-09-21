import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { GeneratorForm } from './components/GeneratorForm';
import { ImageGallery } from './components/ImageGallery';
import { Header } from './components/Header';
import { VideoModal } from './components/VideoModal';
import { ImageModal } from './components/ImageModal';
import { HistoryPanel } from './components/HistoryPanel';
import { ApiKeyModal } from './components/ApiKeyModal';
import { useHistory } from './hooks/useHistory';
import { generatePhotos, generatePoses, regeneratePhoto, generateVideoFromImage, generateDescription, hasApiKey, setApiKey } from './services/geminiService';
import type { ImageResult, FormState, HistoryEntry } from './types';

interface ViewingVideoState {
  videoSrc: string;
  imageSrc: string;
}

const App: React.FC = () => {
  const [formState, setFormState] = useState<FormState>({
    productImage: null,
    modelImage: null,
    productDescription: '',
    numberOfImages: 3,
    delay: 1,
    style: 'e-commerce',
    aspectRatio: '9:16',
  });
  const [images, setImages] = useState<ImageResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDescriptionLoading, setIsDescriptionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUsedFormState, setLastUsedFormState] = useState<FormState | null>(null);
  const [viewingVideo, setViewingVideo] = useState<ViewingVideoState | null>(null);
  const [viewingImageId, setViewingImageId] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  const { history, addToHistory, removeFromHistory, clearHistory } = useHistory();
  const prevIsLoading = useRef(false);

  useEffect(() => {
    // Check for API Key on initial load
    if (!hasApiKey()) {
      setIsApiKeyModalOpen(true);
    }
  }, []);

  useEffect(() => {
    // This effect runs when isLoading changes to save history upon completion.
    if (prevIsLoading.current && !isLoading && lastUsedFormState) {
      // A generation job just finished.
      addToHistory({ formState: lastUsedFormState, images });
    }
    prevIsLoading.current = isLoading;
  }, [isLoading, lastUsedFormState, images, addToHistory]);

  const handleApiKeySave = (key: string) => {
    setApiKey(key);
    setIsApiKeyModalOpen(false);
    // A quick reload ensures the geminiService is re-initialized with the new key.
    window.location.reload(); 
  };

  const handleGenerate = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setImages([]);
    setLastUsedFormState(formState);

    try {
      const poses = await generatePoses(
        formState.productDescription,
        formState.productImage,
        formState.numberOfImages
      );

      if (!poses || poses.length === 0) {
        throw new Error("The AI failed to generate any poses. Try adjusting the description.");
      }

      const poseTasks: string[] = poses;

      const initialImages: ImageResult[] = poseTasks.map((pose, index) => ({
        id: `${Date.now()}-${index}`,
        src: '',
        prompt: pose,
        style: formState.style,
        aspectRatio: formState.aspectRatio,
        status: 'loading',
        videoStatus: 'idle',
      }));
      setImages(initialImages);
      
      await generatePhotos(
        formState,
        poseTasks, 
        (index, imageUrl) => {
          setImages(prevImages =>
            prevImages.map((img, i) =>
              i === index ? { ...img, src: imageUrl, status: 'success' } : img
            )
          );
        },
        (index, errorMessage) => {
           setImages(prevImages =>
            prevImages.map((img, i) =>
              i === index ? { ...img, status: 'error', error: errorMessage } : img
            )
          );
        }
      );
    } catch (e) {
        const err = e as Error;
        if (err.message.includes('API key not found')) {
            setIsApiKeyModalOpen(true);
        }
        setError(`An unexpected error occurred: ${err.message}`);
        setImages(prevImages => prevImages.length > 0 ? prevImages.map(img => ({...img, status: 'error', error: 'Generation failed'})) : []);
    } finally {
        setIsLoading(false);
    }
  }, [formState]);

  const handleRegenerate = useCallback(async (imageId: string, updates: { newStyle: string; newPrompt: string }) => {
    if (!lastUsedFormState) {
        setError("Cannot regenerate. Original form data not found.");
        return;
    }

    const imageToUpdate = images.find(img => img.id === imageId);
    if (!imageToUpdate) return;
    
    if (updates.newStyle === imageToUpdate.style && updates.newPrompt === imageToUpdate.prompt) {
        return;
    }

    setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, status: 'loading', style: updates.newStyle, prompt: updates.newPrompt, videoStatus: 'idle', videoSrc: undefined, videoError: undefined } : img
    ));

    try {
        const newFormState = { ...lastUsedFormState, style: updates.newStyle };
        const imageUrl = await regeneratePhoto(newFormState, updates.newPrompt);
        
        setImages(prev => prev.map(img => 
            img.id === imageId ? { ...img, src: imageUrl, status: 'success' } : img
        ));

    } catch (e) {
        const err = e as Error;
        if (err.message.includes('API key not found')) {
            setIsApiKeyModalOpen(true);
        }
        const errorMessage = `Failed to regenerate image: ${err.message}`;
        setError(errorMessage);
        setImages(prev => prev.map(img => 
            img.id === imageId ? { ...img, status: 'error', error: err.message } : img
        ));
    }
  }, [lastUsedFormState, images]);

  const handleVideoAction = useCallback(async (imageId: string, aspectRatio: string) => {
    const imageToUpdate = images.find(img => img.id === imageId);
    if (!imageToUpdate || imageToUpdate.status !== 'success') return;

    if (imageToUpdate.videoStatus === 'success' && imageToUpdate.videoSrc) {
      setViewingVideo({ videoSrc: imageToUpdate.videoSrc, imageSrc: imageToUpdate.src });
      return;
    }

    if (imageToUpdate.videoStatus === 'loading') {
      return; 
    }

    setImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, videoStatus: 'loading', videoError: undefined } : img
    ));
    setError(null);

    try {
      const videoSrc = await generateVideoFromImage(imageToUpdate.src, aspectRatio);
      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, videoStatus: 'success', videoSrc: videoSrc } : img
      ));
      setViewingVideo({ videoSrc: videoSrc, imageSrc: imageToUpdate.src });
    } catch (e) {
      const err = e as Error;
      if (err.message.includes('API key not found')) {
            setIsApiKeyModalOpen(true);
        }
      const errorMessage = `Failed to generate video: ${err.message}`;
      setError(errorMessage);
      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, videoStatus: 'error', videoError: err.message } : img
      ));
    }
  }, [images]);

  const handleGenerateDescription = useCallback(async () => {
    if (!formState.productImage) return;
    setIsDescriptionLoading(true);
    setError(null);
    try {
      const desc = await generateDescription(formState.productImage);
      setFormState(prev => ({ ...prev, productDescription: desc }));
    } catch (e) {
      if ((e as Error).message.includes('API key not found')) {
            setIsApiKeyModalOpen(true);
        }
      setError(`Failed to generate description: ${(e as Error).message}`);
    } finally {
      setIsDescriptionLoading(false);
    }
  }, [formState.productImage]);
  
  const handleViewHistoryItem = useCallback((entry: HistoryEntry) => {
    setFormState(entry.formState);
    setImages(entry.images);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const successfulImages = useMemo(() => images.filter(img => img.status === 'success'), [images]);
  const viewingImageIndex = useMemo(() => 
      viewingImageId ? successfulImages.findIndex(img => img.id === viewingImageId) : -1
  , [successfulImages, viewingImageId]);
  
  const viewingImage = viewingImageIndex !== -1 ? successfulImages[viewingImageIndex] : null;

  const handleViewImage = useCallback((imageId: string) => {
      setViewingImageId(imageId);
  }, []);

  const handleCloseImageModal = useCallback(() => {
      setViewingImageId(null);
  }, []);

  const handleNextImage = useCallback(() => {
      if (successfulImages.length > 1 && viewingImageIndex !== -1) {
          const nextIndex = (viewingImageIndex + 1) % successfulImages.length;
          setViewingImageId(successfulImages[nextIndex].id);
      }
  }, [successfulImages, viewingImageIndex]);

  const handlePrevImage = useCallback(() => {
      if (successfulImages.length > 1 && viewingImageIndex !== -1) {
          const prevIndex = (viewingImageIndex - 1 + successfulImages.length) % successfulImages.length;
          setViewingImageId(successfulImages[prevIndex].id);
      }
  }, [successfulImages, viewingImageIndex]);


  return (
    <div className="min-h-screen bg-slate-100/50 font-sans text-slate-800">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <div className="space-y-8">
              <GeneratorForm 
                formState={formState}
                onFormChange={setFormState}
                onSubmit={handleGenerate} 
                isLoading={isLoading}
                onGenerateDescription={handleGenerateDescription}
                isDescriptionLoading={isDescriptionLoading}
              />
              <HistoryPanel
                history={history}
                onView={handleViewHistoryItem}
                onDelete={removeFromHistory}
                onClearAll={clearHistory}
              />
            </div>
          </div>
          <div className="lg:col-span-8">
            <ImageGallery 
              images={images} 
              isLoading={isLoading} 
              onRegenerate={handleRegenerate}
              onVideoAction={handleVideoAction}
              onView={handleViewImage}
            />
          </div>
        </div>
        {error && (
            <div className="fixed bottom-5 right-5 bg-red-500 text-white p-4 rounded-lg shadow-lg" role="alert">
                <p className="font-bold">Error</p>
                <p>{error}</p>
            </div>
        )}
        {viewingVideo && <VideoModal videoSrc={viewingVideo.videoSrc} imageSrc={viewingVideo.imageSrc} onClose={() => setViewingVideo(null)} />}
        {viewingImage && (
            <ImageModal 
                image={viewingImage}
                onClose={handleCloseImageModal}
                onNext={handleNextImage}
                onPrev={handlePrevImage}
                hasMultipleImages={successfulImages.length > 1}
            />
        )}
        {isApiKeyModalOpen && <ApiKeyModal onSave={handleApiKeySave} />}
      </main>
    </div>
  );
};

export default App;