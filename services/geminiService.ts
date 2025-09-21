import { GoogleGenAI, Modality, Part, Type } from "@google/genai";
import type { FormState, ImageFile } from '../types';

const API_KEY_STORAGE_KEY = 'gemini_api_key';
let ai: GoogleGenAI | null = null;
let currentApiKey: string | null = null;

const getApiKey = (): string | null => {
    try {
        const key = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (key) return key;
    } catch (e) {
        console.error("Could not read API key from local storage", e);
    }
    return process.env.API_KEY || null;
};

export const setApiKey = (key: string): void => {
    try {
        localStorage.setItem(API_KEY_STORAGE_KEY, key);
        ai = null; // Invalidate the old client instance
        currentApiKey = null;
    } catch (e) {
        console.error("Could not save API key to local storage", e);
    }
};

export const hasApiKey = (): boolean => {
    return !!getApiKey();
};

const getAiClient = (): GoogleGenAI => {
    const apiKey = getApiKey();

    if (ai && currentApiKey === apiKey) {
        return ai;
    }
    
    if (!apiKey) {
        throw new Error("API key not found. Please provide your key to use the application.");
    }
    
    ai = new GoogleGenAI({ apiKey });
    currentApiKey = apiKey;
    return ai;
};


const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const generateVideoFromImage = async (base64ImageDataUrl: string, aspectRatio: string): Promise<string> => {
    const client = getAiClient();
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API key not found.");

    const match = base64ImageDataUrl.match(/data:(image\/.+);base64,(.+)/);
    if (!match || match.length < 3) {
        throw new Error("Invalid base64 image data URL");
    }
    const mimeType = match[1];
    const base64Data = match[2];

    let operation = await client.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: 'Bring this image to life with subtle, realistic animation. Make the model blink, breathe, and have gentle movements as if captured in a live moment. Keep the background and product static.',
        image: {
            imageBytes: base64Data,
            mimeType: mimeType,
        },
        config: {
            numberOfVideos: 1,
            aspectRatio: aspectRatio,
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await client.operations.getVideosOperation({ operation: operation });
    }

    if (!operation.response?.generatedVideos?.[0]?.video?.uri) {
        throw new Error("Video generation failed or did not return a valid URI.");
    }
    const downloadLink = operation.response.generatedVideos[0].video.uri;

    const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!videoResponse.ok) {
        throw new Error(`Failed to download video file: ${videoResponse.statusText}`);
    }
    const videoBlob = await videoResponse.blob();

    return await blobToBase64(videoBlob);
}

export const generateDescription = async (productImage: ImageFile): Promise<string> => {
    const client = getAiClient();
    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: { data: productImage.data, mimeType: productImage.mimeType },
                    },
                    {
                        text: 'Describe this product in a concise and appealing way for a commercial website.'
                    }
                ]
            }
        });
        return response.text;
    } catch (error) {
        console.error('Error generating description:', error);
        const err = error as Error;
        throw new Error(`Failed to generate description: ${err.message}`);
    }
}

export const generatePoses = async (
  productDescription: string,
  productImage: ImageFile | null,
  numberOfPhotos: number
): Promise<string[]> => {
  const client = getAiClient();
  const parts: Part[] = [];
  if (productImage) {
      parts.push({
          inlineData: { data: productImage.data, mimeType: productImage.mimeType }
      });
  }

  const textPrompt = `You are a creative director for a commercial photoshoot. 
Based on the provided product description and image, generate a list of ${numberOfPhotos} distinct, commercially appealing poses for a model.
Product Description: "${productDescription}"
The poses should be creative, varied, and suitable for advertising.
Return the list in a JSON object with a single key "poses" which contains an array of strings. For example: {"poses": ["posing confidently with the product", "a dynamic action shot using the product"]}`;

  parts.push({ text: textPrompt });

  try {
      const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts },
          config: {
              responseMimeType: 'application/json',
              responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                      poses: {
                          type: Type.ARRAY,
                          items: {
                              type: Type.STRING
                          }
                      }
                  }
              }
          }
      });

      const jsonResponse = JSON.parse(response.text);
      if (jsonResponse.poses && Array.isArray(jsonResponse.poses)) {
          return jsonResponse.poses;
      }
      
      throw new Error("Could not parse poses from the AI response. Unexpected format.");

  } catch (error) {
      console.error('Error generating poses:', error);
      const err = error as Error;
      throw new Error(`Failed to generate poses: ${err.message}`);
  }
}

const generateImage = async (parts: Part[]) => {
  const client = getAiClient();
  try {
    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    const formatSafetyRatings = (ratings?: any[]) => {
        if (!ratings || ratings.length === 0) return '';
        const problematicRatings = ratings.filter(r => 
            r.probability && r.probability !== 'NEGLIGIBLE' && r.probability !== 'LOW'
        );
        if (problematicRatings.length === 0) return '';
        
        return 'Details: ' + problematicRatings.map(r => 
            `${r.category.replace('HARM_CATEGORY_', '')} (${r.probability})`
        ).join(', ');
    };
    
    if (response.promptFeedback?.blockReason) {
        const reason = response.promptFeedback.blockReason;
        const safetyDetails = formatSafetyRatings(response.promptFeedback.safetyRatings);
        throw new Error(`Request was blocked. Reason: ${reason}. ${safetyDetails}`);
    }

    const candidate = response.candidates?.[0];

    if (!candidate) {
        throw new Error('Generation failed: No response candidate was returned from the model.');
    }
    
    if (candidate.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
        const reason = candidate.finishReason;
        const safetyDetails = formatSafetyRatings(candidate.safetyRatings);
        
        if (reason === 'SAFETY') {
             throw new Error(`Image blocked due to safety filters. ${safetyDetails} Please adjust your prompt.`);
        }
        if (reason === 'IMAGE_SAFETY') {
            throw new Error(`Image blocked for safety reasons. ${safetyDetails} Please try a different prompt.`);
        }

        throw new Error(`Generation failed. Reason: ${reason}. ${safetyDetails}`);
    }

    for (const part of candidate.content?.parts || []) {
        if (part.inlineData?.data) {
            const base64ImageBytes = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }

    const textPart = candidate.content?.parts?.find(p => p.text);
    if (textPart?.text) {
        throw new Error(`Model returned a text response instead of an image: "${textPart.text}"`);
    }
    
    throw new Error('No image was generated in the response.');
  } catch (error) {
    console.error('Error generating image:', error);
    const err = error as Error;
    const isCustomError = [
        'Request was blocked',
        'Image blocked',
        'Generation failed',
        'Model returned a text response',
        'No image was generated'
    ].some(prefix => err.message.startsWith(prefix));

    if (isCustomError) {
      throw err;
    }
    
    throw new Error(`Failed to generate image: ${err.message}`);
  }
};

const constructPrompt = (formState: FormState, pose: string): string => {
    const { productDescription, modelImage, productImage, style, aspectRatio } = formState;
    let textPrompt = `Create a new hyper-realistic 4K commercial photoshoot image.`;

    if (productDescription) {
        textPrompt += ` The product is: "${productDescription}".`
    }

    if (modelImage && productImage) {
        textPrompt += ` Featuring the attached model posing with the attached product.`;
    } else if (modelImage) {
        textPrompt += ` Featuring the attached model in a commercial setting.`;
    } else if (productImage) {
        textPrompt += ` Featuring a fashion model posing with the attached product.`
    } else {
        textPrompt += ` Featuring a fashion model posing with a generic commercial product.`;
    }

    textPrompt += ` The model's pose is: "${pose}".`;
    textPrompt += ` The image must have a ${aspectRatio} aspect ratio.`;

    switch (style) {
        case 'e-commerce':
            textPrompt += ` The overall style should be photorealistic, clean, and professional. The background must be a completely plain, solid white background (#FFFFFF) suitable for an e-commerce product listing. The lighting should be bright and even, minimizing shadows. High-end commercial photography, sharp focus on the product and model.`;
            break;
        case 'studio-bokeh':
            textPrompt += ` The style is photorealistic. The background should be a clean studio setting with a soft, out-of-focus bokeh effect, creating a sense of depth. The lighting should be professional and flattering.`;
            break;
        case 'cinematic':
            textPrompt += ` The style should be cinematic, with dramatic, high-contrast lighting (chiaroscuro). The background should be dark and moody, suggesting a scene from a film.`;
            break;
        case 'high-fashion':
            textPrompt += ` The style should be high-fashion and avant-garde. The background must be an abstract, geometric pattern with bold colors and shapes.`;
            break;
        case 'lifestyle':
            textPrompt += ` Create a lifestyle scene with the model in a natural, candid pose. The setting should be outdoors with beautiful, warm, natural light (golden hour).`;
            break;
        case 'vintage':
            textPrompt += ` The style should be vintage, reminiscent of old film photography. Apply a sepia tone, add subtle film grain, and use soft, nostalgic lighting.`;
            break;
        case 'minimalist':
            textPrompt += ` The style must be minimalist and clean. The background should be a simple, neutral-colored studio setting with even, soft lighting.`;
            break;
        case 'dramatic':
            textPrompt += ` The style should be dramatic and theatrical. Use a single, hard light source to create deep shadows and a strong focal point. The background should be dark or black.`;
            break;
        case 'monochrome':
            textPrompt += ` The image must be in black and white (monochrome). The background should be a simple studio setting, focusing on texture, form, and light.`;
            break;
        default:
             textPrompt += ` The overall style should be ${style}. The background should be a clean studio setting with professional lighting. High-end commercial photography, sharp focus.`;
    }
    return textPrompt;
}

export const regeneratePhoto = async (
  formState: FormState, // This will have the new style
  pose: string
): Promise<string> => {
    const { productImage, modelImage } = formState;
    const parts: Part[] = [];

    if (productImage) {
        parts.push({
            inlineData: { data: productImage.data, mimeType: productImage.mimeType },
        });
    }
    if (modelImage) {
        parts.push({
            inlineData: { data: modelImage.data, mimeType: modelImage.mimeType },
        });
    }

    const textPrompt = constructPrompt(formState, pose);
    parts.push({ text: textPrompt });

    return await generateImage(parts);
};


export const generatePhotos = async (
  formState: FormState,
  poseTasks: string[],
  onSuccess: (index: number, imageUrl: string) => void,
  onError: (index: number, errorMessage: string) => void
) => {
  const { productImage, modelImage, delay } = formState;
  
  for (let index = 0; index < poseTasks.length; index++) {
    const pose = poseTasks[index];
    const parts: Part[] = [];

    if (productImage) {
        parts.push({
            inlineData: { data: productImage.data, mimeType: productImage.mimeType },
        });
    }
    if (modelImage) {
        parts.push({
            inlineData: { data: modelImage.data, mimeType: modelImage.mimeType },
        });
    }
    
    const textPrompt = constructPrompt(formState, pose);
    parts.push({ text: textPrompt });

    try {
      const imageUrl = await generateImage(parts);
      onSuccess(index, imageUrl);
    } catch (e) {
      const err = e as Error;
      onError(index, err.message || 'An unknown error occurred.');
    }

    if (index < poseTasks.length - 1 && delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay * 1000));
    }
  }
};