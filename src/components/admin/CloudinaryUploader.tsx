import * as React from 'react';
import { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Image, Video, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { uploadImage, uploadVideo } from '@/lib/cloudinary';

interface CloudinaryUploaderProps {
  type: 'image' | 'video';
  onUpload: (url: string, publicId: string) => void;
  onError: (error: string) => void;
  multiple?: boolean;
  maxSize?: number;
  className?: string;
  label?: string;
  acceptedFormats?: string[];
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  url?: string;
  publicId?: string;
  error?: string;
}

export const CloudinaryUploader: React.FC<CloudinaryUploaderProps> = ({
  type,
  onUpload,
  onError,
  multiple = false,
  maxSize = 10,
  className = '',
  label,
  acceptedFormats
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const maxBytes = maxSize * 1024 * 1024;
    
    if (file.size > maxBytes) {
      return `File size must be less than ${maxSize}MB`;
    }

    const allowedFormats = acceptedFormats || (type === 'image'
      ? ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      : ['video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm']
    );

    if (!allowedFormats.includes(file.type)) {
      return `Only ${type} files are allowed`;
    }

    return null;
  };

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: UploadFile[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push({
          file,
          id: Math.random().toString(36).substr(2, 9),
          progress: 0,
          status: 'uploading'
        });
      }
    });

    if (errors.length > 0) {
      onError(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      setUploadFiles(prev => multiple ? [...prev, ...validFiles] : validFiles);
      uploadFilesToCloudinary(validFiles);
    }
  }, [onError, multiple, maxSize, type]);

  const uploadFilesToCloudinary = async (files: UploadFile[]) => {
    setIsUploading(true);

    for (const uploadFile of files) {
      try {
        let result;
        console.log('Starting upload for file:', uploadFile.file.name, 'Type:', type);
        
        if (type === 'image') {
          result = await uploadImage(uploadFile.file, {
            onProgress: (progress) => {
              updateFileProgress(uploadFile.id, progress.percentage);
            }
          });
        } else {
          result = await uploadVideo(uploadFile.file, {
            onProgress: (progress) => {
              updateFileProgress(uploadFile.id, progress.percentage);
            }
          });
        }

        console.log('Cloudinary upload success:', result);
        setUploadFiles(prev => prev.map(f =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: 'success',
                url: result.secure_url,
                publicId: result.public_id,
                progress: 100
              }
            : f
        ));

        onUpload(result.secure_url, result.public_id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'error', error: errorMessage, progress: 0 }
            : f
        ));

        onError(errorMessage);
      }
    }

    setIsUploading(false);
  };

  const updateFileProgress = (fileId: string, progress: number) => {
    setUploadFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, progress } : f
    ));
  };

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(files);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-6 w-6 text-blue-500" />;
    if (fileType.startsWith('video/')) return <Video className="h-6 w-6 text-purple-500" />;
    return <File className="h-6 w-6 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFilePicker}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={type === 'image' ? 'image/*' : 'video/*'}
          onChange={handleInputChange}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-4">
          {type === 'image' ? (
            <Image className="h-12 w-12 text-gray-400" />
          ) : (
            <Video className="h-12 w-12 text-gray-400" />
          )}
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {label || `Drop ${type}s here or click to browse`}
            </p>
            <p className="text-sm text-gray-500">
              Maximum {maxSize}MB • {type === 'image' ? 'JPG, PNG, WebP' : 'MP4, MOV, AVI'}
            </p>
          </div>
          
          <Button onClick={openFilePicker}>
            <Upload className="h-4 w-4 mr-2" />
            Choose Files
          </Button>
        </div>
      </div>

      {uploadFiles.length > 0 && (
        <div className="mt-6 space-y-4">
          <h4 className="font-medium text-gray-900">
            {isUploading ? 'Uploading...' : 'Upload Complete'}
          </h4>
          
          {uploadFiles.map((uploadFile) => (
            <div key={uploadFile.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {getFileIcon(uploadFile.file.type)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadFile.file.size)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {uploadFile.status === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {uploadFile.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <Button 
                    onClick={() => removeFile(uploadFile.id)}
                    className="p-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {uploadFile.status === 'uploading' && (
                <Progress value={uploadFile.progress} className="h-2" />
              )}
              
              {uploadFile.error && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {uploadFile.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CloudinaryUploader;