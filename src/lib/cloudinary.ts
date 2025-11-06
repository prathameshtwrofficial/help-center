/**
 * Cloudinary Service Integration
 * Handles image and video uploads to Cloudinary with automatic optimization
 */

// Cloudinary configuration from environment variables
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UNSIGNED_PRESET;

// Base upload URL for Cloudinary
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

// Upload types for different media types
export type UploadType = 'image' | 'video' | 'auto';

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
  folder: string;
  created_at: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload file to Cloudinary with progress tracking
 */
export const uploadToCloudinary = (
  file: File,
  options: {
    type?: UploadType;
    folder?: string;
    transformation?: string;
    onProgress?: (progress: UploadProgress) => void;
  } = {}
): Promise<CloudinaryUploadResponse> => {
  return new Promise((resolve, reject) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      reject(new Error('Cloudinary configuration missing. Please check environment variables.'));
      return;
    }

    const { type = 'auto', folder = 'neurathon_uploads', onProgress } = options;

    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', folder);
    formData.append('resource_type', type);

    // Create XMLHttpRequest for progress tracking
    const xhr = new XMLHttpRequest();

    // Progress tracking
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded * 100) / event.total);
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage
          });
        }
      };
    }

    // Response handling
    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        reject(new Error(`Upload failed with status: ${xhr.status}`));
      }
    };

    // Error handling
    xhr.onerror = () => {
      reject(new Error('Network error during upload'));
    };

    // Timeout handling
    xhr.ontimeout = () => {
      reject(new Error('Upload timeout'));
    };

    // Set timeout (5 minutes for large files)
    xhr.timeout = 5 * 60 * 1000;

    // Send the request
    xhr.open('POST', UPLOAD_URL);
    xhr.send(formData);
  });
};

/**
 * Upload image to Cloudinary with automatic optimization
 */
export const uploadImage = (
  file: File,
  options: {
    folder?: string;
    quality?: 'auto' | 'best' | 'good' | 'eco' | 'low';
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    transformation?: string;
    onProgress?: (progress: UploadProgress) => void;
  } = {}
): Promise<CloudinaryUploadResponse> => {
  const { 
    folder = 'neurathon_uploads/images',
    quality = 'auto',
    format = 'auto',
    transformation,
    onProgress 
  } = options;

  const formDataOptions = {
    type: 'image' as UploadType,
    folder,
    transformation,
    onProgress
  };

  return uploadToCloudinary(file, formDataOptions);
};

/**
 * Upload video to Cloudinary with automatic streaming optimization
 */
export const uploadVideo = (
  file: File,
  options: {
    folder?: string;
    quality?: 'auto' | 'best' | 'good' | 'eco' | 'low';
    format?: 'auto' | 'mp4' | 'webm';
    transformation?: string;
    onProgress?: (progress: UploadProgress) => void;
  } = {}
): Promise<CloudinaryUploadResponse> => {
  const { 
    folder = 'neurathon_uploads/videos',
    quality = 'auto',
    format = 'auto',
    transformation,
    onProgress 
  } = options;

  const formDataOptions = {
    type: 'video' as UploadType,
    folder,
    transformation,
    onProgress
  };

  return uploadToCloudinary(file, formDataOptions);
};

/**
 * Delete media from Cloudinary
 */
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    // Note: This would require server-side API key for security
    // For now, we'll just return false as unsigned uploads should be managed carefully
    console.warn('Deleting from Cloudinary requires server-side implementation for security');
    return false;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
};

/**
 * Generate transformed URL for Cloudinary media
 */
export const getTransformedUrl = (
  url: string,
  transformations: {
    width?: number;
    height?: number;
    quality?: string;
    format?: string;
    crop?: string;
    gravity?: string;
  } = {}
): string => {
  const { width, height, quality, format, crop, gravity } = transformations;
  
  if (!url.includes('cloudinary.com')) {
    return url; // Not a Cloudinary URL
  }

  // Extract base URL and public_id
  const matches = url.match(/\/v\d+\/(.+)\.(\w+)$/);
  if (!matches) {
    return url; // Invalid Cloudinary URL format
  }

  const [, publicId, originalFormat] = matches;
  
  // Build transformation string
  const transforms = [];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (quality) transforms.push(`q_${quality}`);
  if (crop) transforms.push(`c_${crop}`);
  if (gravity) transforms.push(`g_${gravity}`);
  
  const transformString = transforms.length > 0 ? transforms.join(',') + '/' : '';
  const formatString = format && format !== 'auto' ? `.${format}` : '';
  
  // Reconstruct URL with transformations
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformString}${publicId}${formatString}`;
};

/**
 * Generate optimized video URL with minimal transformations for playback
 */
export const getOptimizedVideoUrl = (
  url: string,
  options: {
    quality?: 'auto' | 'auto:eco' | 'auto:good' | 'auto:best';
    format?: 'auto' | 'mp4' | 'webm';
  } = {}
): string => {
  const { quality = 'auto', format = 'mp4' } = options;

  // Return the original URL if not a Cloudinary URL to ensure playback
  if (!url.includes('cloudinary.com')) {
    return url;
  }

  // Extract base URL and public_id for basic transformation
  const matches = url.match(/\/v\d+\/(.+)\.(\w+)$/);
  if (!matches) {
    return url; // Return original if can't parse
  }

  const [, publicId, originalFormat] = matches;
  
  // Only use safe transformations that don't break video playback
  const transforms = [];
  
  // Add quality optimization only (no streaming transformations)
  if (quality !== 'auto') {
    transforms.push(`q_${quality}`);
  }
  
  // Use format conversion only if explicitly requested and different from original
  const targetFormat = format === 'auto' ? originalFormat : format;
  
  const transformString = transforms.length > 0 ? transforms.join(',') + '/' : '';
  
  // For standard video delivery, just apply minimal transformations
  if (transformString) {
    return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${transformString}${publicId}.${targetFormat}`;
  }
  
  // If no transformations needed, return original format
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${publicId}.${targetFormat}`;
};

/**
 * Generate chunked video URLs for progressive loading
 */
export const generateVideoChunks = (
  url: string,
  options: {
    chunkSize?: number;
    maxChunks?: number;
    quality?: string;
  } = {}
): string[] => {
  const { chunkSize = 5000, maxChunks = 10, quality = 'auto' } = options;
  
  if (!url.includes('cloudinary.com')) {
    return [url];
  }

  const chunks: string[] = [];
  
  // Generate URLs for different qualities
  const qualities = quality === 'auto' ? ['auto:eco', 'auto:good', 'auto:best'] : [quality];
  
  qualities.forEach(qual => {
    for (let i = 1; i <= maxChunks; i++) {
      const chunkUrl = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/q_${qual},so_${i * chunkSize},eo_${(i + 1) * chunkSize}/` +
        url.match(/\/v\d+\/(.+)\.\w+$/)?.[1] + '.mp4';
      chunks.push(chunkUrl);
    }
  });
  
  return chunks;
};

/**
 * Get video streaming metadata
 */
export const getVideoMetadata = (url: string): Promise<{
  duration: number;
  width: number;
  height: number;
  format: string;
  bitrate: number;
}> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        format: 'mp4', // This would need to be extracted from URL
        bitrate: 0 // Would need additional processing
      });
      URL.revokeObjectURL(video.src);
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
      URL.revokeObjectURL(video.src);
    };
    
    video.src = url;
  });
};

/**
 * Validate file before upload
 */
export const validateFile = (
  file: File,
  options: {
    maxSizeInMB?: number;
    allowedTypes?: string[];
    maxDurationForVideo?: number; // in seconds
  } = {}
): { valid: boolean; error?: string } => {
  const { maxSizeInMB = 50, allowedTypes, maxDurationForVideo = 300 } = options;
  
  // Check file size
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeInMB}MB`
    };
  }

  // Check file type
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];
  
  const allAllowedTypes = allowedTypes || [...allowedImageTypes, ...allowedVideoTypes];
  
  if (!allAllowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not supported`
    };
  }

  // For videos, we can't check duration without loading the file
  // This would need to be handled in the calling component

  return { valid: true };
};

/**
 * Get file type from Cloudinary response
 */
export const getFileType = (resourceType: string): 'image' | 'video' | 'other' => {
  switch (resourceType) {
    case 'image':
      return 'image';
    case 'video':
      return 'video';
    default:
      return 'other';
  }
};

export default {
  uploadToCloudinary,
  uploadImage,
  uploadVideo,
  deleteFromCloudinary,
  getTransformedUrl,
  validateFile,
  getFileType,
  getOptimizedVideoUrl,
  generateVideoChunks,
  getVideoMetadata
};