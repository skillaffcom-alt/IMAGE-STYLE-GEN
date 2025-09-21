import React, { useState, useCallback } from 'react';
import type { FormState, ImageFile } from '../types';
import { SparklesIcon, UploadIcon, TrashIcon, CopyIcon } from './Icons';

interface GeneratorFormProps {
  formState: FormState;
  onFormChange: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  onGenerateDescription: () => void;
  isDescriptionLoading: boolean;
}

interface ImageUploaderProps {
  label: string;
  image: ImageFile | null;
  onImageChange: (file: ImageFile | null) => void;
}

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

const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  image,
  onImageChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        if (base64) {
          onImageChange({ data: base64, mimeType: file.type });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const onDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }
  
  const onDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  const onDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  }

  return (
    <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-600">{label}</h3>
        {image ? (
        <div className="relative group">
            <img src={`data:${image.mimeType};base64,${image.data}`} alt="Preview" className="w-full h-auto object-cover rounded-md aspect-square" />
            <button
            type="button"
            onClick={() => onImageChange(null)}
            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            aria-label="Remove image"
            >
            <TrashIcon className="w-4 h-4" />
            </button>
        </div>
        ) : (
        <label 
            className={`w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-md cursor-pointer transition-colors ${isDragging ? 'bg-indigo-50 border-indigo-400' : 'bg-slate-50 hover:bg-slate-100'}`}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            <UploadIcon className="w-8 h-8 text-slate-400 mb-1" />
            <span className="text-xs text-center text-slate-500 px-2">
            Drag & Drop or <span className="font-semibold text-indigo-600">Click</span>
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e.target.files)} />
        </label>
        )}
    </div>
  );
};


export const GeneratorForm: React.FC<GeneratorFormProps> = ({ 
    formState,
    onFormChange,
    onSubmit, 
    isLoading,
    onGenerateDescription,
    isDescriptionLoading,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleProductImageChange = useCallback((file: ImageFile | null) => {
    onFormChange(prev => ({...prev, productImage: file, productDescription: ''}));
  }, [onFormChange]);

  const handleModelImageChange = useCallback((file: ImageFile | null) => {
    onFormChange(prev => ({...prev, modelImage: file}));
  }, [onFormChange]);
  
  const handleCopy = () => {
    if (!formState.productDescription) return;
    navigator.clipboard.writeText(formState.productDescription).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 sticky top-24">
      <h2 className="text-xl font-semibold mb-4 text-slate-700">Photoshoot Details</h2>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
            <ImageUploader
              label="Product Image"
              image={formState.productImage}
              onImageChange={handleProductImageChange}
            />
            <ImageUploader
              label="Model Image"
              image={formState.modelImage}
              onImageChange={handleModelImageChange}
            />
        </div>
        <div>
            <div className="flex justify-between items-center mb-1">
                <label htmlFor="productDescription" className="block text-sm font-medium text-slate-600">
                    Auto Product Description
                </label>
                <button
                    type="button"
                    onClick={onGenerateDescription}
                    disabled={!formState.productImage || isDescriptionLoading}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 disabled:cursor-not-allowed transition"
                >
                    <SparklesIcon className="w-4 h-4" />
                    {isDescriptionLoading ? 'Generating...' : 'Generate'}
                </button>
            </div>
            <div className="relative">
                <textarea
                    id="productDescription"
                    value={formState.productDescription}
                    onChange={(e) => onFormChange(prev => ({...prev, productDescription: e.target.value}))}
                    rows={3}
                    placeholder={isDescriptionLoading ? 'Generating description...' : "Upload a product image and click 'Generate'."}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition pr-10"
                    disabled={isDescriptionLoading}
                />
                <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!formState.productDescription || isDescriptionLoading}
                    className="absolute top-2 right-2 p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                    aria-label="Copy description"
                >
                    {copySuccess ? <span className="text-xs text-indigo-600">Copied!</span> : <CopyIcon className="w-5 h-5" />}
                </button>
            </div>
        </div>

         <div className="grid grid-cols-2 gap-4">
            <div>
                 <label htmlFor="numberOfImages" className="block text-sm font-medium text-slate-600 mb-1">
                    Number of Photos
                </label>
                <input
                    type="number"
                    id="numberOfImages"
                    value={formState.numberOfImages}
                    onChange={(e) => onFormChange(prev => ({...prev, numberOfImages: parseInt(e.target.value, 10)}))}
                    min="1"
                    max="10"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
            </div>
            <div>
                 <label htmlFor="delay" className="block text-sm font-medium text-slate-600 mb-1">
                    Delay (seconds)
                </label>
                <input
                    type="number"
                    id="delay"
                    value={formState.delay}
                    onChange={(e) => onFormChange(prev => ({...prev, delay: parseInt(e.target.value, 10)}))}
                    min="0"
                    max="10"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
            </div>
        </div>
        
        <div>
            <label htmlFor="style" className="block text-sm font-medium text-slate-600 mb-1">
                Style
            </label>
             <select
                id="style"
                value={formState.style}
                onChange={(e) => onFormChange(prev => ({...prev, style: e.target.value}))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white"
            >
                {styleOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
        <div>
            <label htmlFor="aspectRatio" className="block text-sm font-medium text-slate-600 mb-1">
                Aspect Ratio
            </label>
             <select
                id="aspectRatio"
                value={formState.aspectRatio}
                onChange={(e) => onFormChange(prev => ({...prev, aspectRatio: e.target.value}))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white"
            >
                <option value="3:4">Portrait (3:4)</option>
                <option value="4:3">Landscape (4:3)</option>
                <option value="1:1">Square (1:1)</option>
                <option value="16:9">Widescreen (16:9)</option>
                <option value="9:16">Vertical (9:16)</option>
            </select>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-300 ease-in-out"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
                <SparklesIcon className="w-5 h-5" />
                Generate Photos
            </>
          )}
        </button>
      </form>
    </div>
  );
};