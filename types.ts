export interface ImageFile {
  data: string; // base64
  mimeType: string;
}

export interface FormState {
  productImage: ImageFile | null;
  modelImage: ImageFile | null;
  productDescription: string;
  numberOfImages: number;
  delay: number;
  style: string;
  aspectRatio: string;
}

export interface ImageResult {
  id: string;
  src: string;
  prompt: string;
  style: string;
  aspectRatio: string;
  status: 'loading' | 'success' | 'error';
  error?: string;
  videoSrc?: string;
  videoStatus?: 'idle' | 'loading' | 'success' | 'error';
  videoError?: string;
}

export interface HistoryEntry {
  id: number; // Using timestamp for simplicity
  date: string; // ISO string
  formState: FormState;
  images: ImageResult[];
}
