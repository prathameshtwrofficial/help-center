import * as React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Save, Eye, Calendar, Clock, Tag, BookOpen, Wand2, Loader2, CheckCircle, AlertCircle, Type, Hash, VideoIcon, Code, Link, FileText, Upload, RefreshCw, Target, Settings, BarChart3, CloudUpload, Timer, Play, User, Image } from 'lucide-react';
import { videoService, Video as VideoType } from '@/lib/contentService';
import { Timestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import CloudinaryUploader from './CloudinaryUploader';
import EnhancedVideoPlayer from '@/components/common/EnhancedVideoPlayer';
import { getOptimizedVideoUrl, getVideoMetadata } from '@/lib/cloudinary';

// Utility functions for videos
const calculateVideoDuration = (durationInSeconds: number): string => {
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  const seconds = durationInSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const extractKeywords = (content: string): string[] => {
  const text = content.toLowerCase();
  const words = text.match(/\b\w+\b/g) || [];
  const stopWords = new Set<string>([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'about', 'after', 'all', 'also', 'any', 'as', 'back', 'been', 'but', 'can', 'come', 'could',
    'day', 'did', 'do', 'does', 'down', 'each', 'even', 'every', 'first', 'for', 'found', 'good',
    'great', 'had', 'has', 'have', 'her', 'here', 'him', 'his', 'how', 'if', 'in', 'into', 'is',
    'it', 'its', 'just', 'know', 'like', 'look', 'made', 'make', 'many', 'may', 'more', 'most',
    'much', 'my', 'new', 'no', 'not', 'now', 'of', 'on', 'one', 'only', 'or', 'other', 'our',
    'out', 'over', 'say', 'see', 'she', 'should', 'so', 'some', 'than', 'that', 'the', 'their',
    'them', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'two', 'up',
    'use', 'very', 'was', 'way', 'we', 'well', 'were', 'what', 'when', 'where', 'which', 'who',
    'will', 'with', 'would', 'you', 'your'
  ]);
  
  const filteredWords = words.filter((word: string) =>
    word.length > 3 && !stopWords.has(word) && /^[a-zA-Z]+$/.test(word)
  );
  
  const wordCount: { [key: string]: number } = {};
  filteredWords.forEach((word: string) => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
};

const extractExcerpt = (description: string, maxLength: number = 200): string => {
  const text = description.trim();
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

interface VideoEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  video?: VideoType | null;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({
  isOpen,
  onClose,
  onSuccess,
  video
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    category: 'General',
    tags: [] as string[],
    author: 'Admin',
    duration: '',
    keywords: [] as string[]
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categories = [
    'General',
    'Tutorial',
    'Getting Started',
    'Advanced',
    'Troubleshooting',
    'Features',
    'API Documentation',
    'Best Practices',
    'Security',
    'Performance',
    'Marketing',
    'Business',
    'Technology',
    'Design',
    'Development'
  ];

  useEffect(() => {
    if (video) {
      setFormData({
        title: video.title || '',
        description: video.description || '',
        videoUrl: video.videoUrl || '',
        thumbnailUrl: video.thumbnailUrl || '',
        category: video.category || 'General',
        tags: video.tags || [],
        author: video.author || 'Admin',
        duration: video.duration || '',
        keywords: video.keywords || []
      });
      setHasUnsavedChanges(false);
    } else {
      setFormData({
        title: '',
        description: '',
        videoUrl: '',
        thumbnailUrl: '',
        category: 'General',
        tags: [],
        author: 'Admin',
        duration: '',
        keywords: []
      });
    }
  }, [video]);

  const handleVideoUpload = async (url: string, publicId: string) => {
    // Generate optimized video URL for streaming
    const optimizedUrl = getOptimizedVideoUrl(url, {
      quality: 'auto',
      format: 'auto'
    });

    try {
      // Extract video metadata for better user experience
      const metadata = await getVideoMetadata(optimizedUrl);
       
      // Auto-extract duration if not manually set
      if (!formData.duration && metadata.duration) {
        setFormData(prev => ({
          ...prev,
          videoUrl: optimizedUrl,
          duration: calculateVideoDuration(metadata.duration)
        }));
      } else {
        setFormData(prev => ({ ...prev, videoUrl: optimizedUrl }));
      }

      toast({
        title: "Success",
        description: "Video uploaded successfully!",
        variant: "default",
      });
    } catch (error) {
      console.warn('Failed to extract video metadata:', error);
      setFormData(prev => ({ ...prev, videoUrl: optimizedUrl }));
      toast({
        title: "Success",
        description: "Video uploaded successfully!",
        variant: "default",
      });
    }
  };

  const handleVideoUploadError = (error: string) => {
    toast({
      title: "Upload Failed",
      description: error,
      variant: "destructive",
    });
  };

  const handleThumbnailUpload = (url: string, publicId: string) => {
    setFormData(prev => ({ ...prev, thumbnailUrl: url }));
    toast({
      title: "Success",
      description: "Thumbnail uploaded successfully!",
      variant: "default",
    });
  };

  const handleThumbnailUploadError = (error: string) => {
    toast({
      title: "Upload Failed",
      description: error,
      variant: "destructive",
    });
  };

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!hasUnsavedChanges || !autoSaveEnabled || !formData.title.trim()) {
      return;
    }

    setIsAutoSaving(true);
    
    try {
      const contentData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        videoUrl: formData.videoUrl.trim(),
        thumbnailUrl: formData.thumbnailUrl.trim(),
        category: formData.category,
        tags: formData.tags,
        author: formData.author || 'Admin',
        duration: formData.duration || '',
        keywords: formData.keywords.length > 0 ? formData.keywords : extractKeywords(formData.description),
        status: 'draft' as 'draft',
        updatedAt: Timestamp.now()
      };

      if (video?.id) {
        await videoService.update(video.id, contentData);
      }
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [formData, video, hasUnsavedChanges, autoSaveEnabled]);

  // Auto-save trigger
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    if (hasUnsavedChanges && autoSaveEnabled) {
      autoSaveTimeoutRef.current = setTimeout(autoSave, 5000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, hasUnsavedChanges, autoSaveEnabled, autoSave]);

  const handleSave = async (status: 'draft' | 'published') => {
    // Enhanced validation
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Error",
        description: "Description is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.videoUrl.trim()) {
      toast({
        title: "Error",
        description: "Video upload is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.title.length < 3) {
      toast({
        title: "Error",
        description: "Title must be at least 3 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const contentData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        videoUrl: formData.videoUrl.trim(),
        thumbnailUrl: formData.thumbnailUrl.trim(),
        category: formData.category,
        tags: formData.tags,
        author: formData.author || 'Admin',
        duration: formData.duration || '',
        keywords: formData.keywords.length > 0 ? formData.keywords : extractKeywords(formData.description),
        status: status,
        publishedAt: status === 'published' ? Timestamp.now() : null,
        views: video?.views || 0,
        createdAt: video?.createdAt || Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      console.log('Saving video data:', contentData);

      if (video?.id) {
        await videoService.update(video.id, contentData);
        toast({
          title: "Success",
          description: "Video updated successfully!",
          variant: "default",
        });
      } else {
        const newVideoId = await videoService.create(contentData);
        toast({
          title: "Success",
          description: `Video ${status === 'published' ? 'published' : 'saved as draft'} successfully!`,
          variant: "default",
        });
      }
      
      // Reset form and close with success
      setFormData({
        title: '',
        description: '',
        videoUrl: '',
        thumbnailUrl: '',
        category: 'General',
        tags: [],
        author: 'Admin',
        duration: '',
        keywords: []
      });
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving video:', error);
      const errorMessage = error?.message || 'Failed to save video. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
      setHasUnsavedChanges(true);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
    setHasUnsavedChanges(true);
  };

  const generateAIKeywords = () => {
    if (!formData.description.trim()) {
      toast({
        title: "Error",
        description: "Please add description first",
        variant: "destructive",
      });
      return;
    }
    
    const keywords = extractKeywords(formData.description);
    const updatedKeywords = [...new Set([...formData.keywords, ...keywords])];
    const updatedTags = [...new Set([...formData.tags, ...keywords])];
    
    setFormData(prev => ({ 
      ...prev, 
      keywords: updatedKeywords,
      tags: updatedTags
    }));
    setHasUnsavedChanges(true);
    toast({
      title: "Success",
      description: "AI keywords and tags generated!",
      variant: "default",
    });
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }

    setFormData({
      title: '',
      description: '',
      videoUrl: '',
      thumbnailUrl: '',
      category: 'General',
      tags: [],
      author: 'Admin',
      duration: '',
      keywords: []
    });
    setShowPreview(false);
    setHasUnsavedChanges(false);
    setLastSaved(null);
    onClose();
  };

  if (showPreview) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Video Preview</span>
              <div className="flex items-center gap-2">
                <motion.div 
                  className="flex items-center gap-1 text-sm text-muted-foreground"
                  animate={isAutoSaving ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
                  transition={{ duration: 0.8, repeat: isAutoSaving ? Infinity : 0 }}
                >
                  {isAutoSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                  {lastSaved && (
                    <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                  )}
                </motion.div>
                <Button onClick={() => setShowPreview(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Back to Edit
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="aspect-video">
              {formData.videoUrl ? (
                <EnhancedVideoPlayer
                  videoUrl={formData.videoUrl}
                  thumbnailUrl={formData.thumbnailUrl}
                  controls={true}
                  quality="auto"
                  adaptiveBitrate={true}
                  className="rounded-lg"
                />
              ) : (
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-red-500 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <Play className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-xl font-semibold">Video Preview</p>
                    <p className="text-sm opacity-80">Upload a video to see preview</p>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {formData.title}
              </h1>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date().toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formData.duration || 'Duration: N/A'}
                </span>
                <span className="flex items-center gap-1">
                  <Type className="w-4 h-4" />
                  {formData.description.split(' ').length} words
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {formData.category}
                </span>
              </div>
              
              <p className="text-lg text-gray-700 leading-relaxed">
                {formData.description}
              </p>
              
              {(formData.tags.length > 0 || formData.keywords.length > 0) && (
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-xl font-semibold mb-4">Tags & Keywords</h3>
                  {formData.tags.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-lg font-medium mb-2 text-muted-foreground">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map(tag => (
                          <span key={tag} className="px-3 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {formData.keywords.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium mb-2 text-muted-foreground">Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.keywords.map(keyword => (
                          <span key={keyword} className="px-3 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>{video ? 'Edit Video' : 'Upload New Video'}</span>
              <div className="flex items-center gap-2">
                <motion.div 
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                    hasUnsavedChanges 
                      ? 'bg-orange-100 text-orange-700' 
                      : 'bg-green-100 text-green-700'
                  }`}
                  animate={isAutoSaving ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                  transition={{ duration: 0.5, repeat: isAutoSaving ? Infinity : 0 }}
                >
                  {isAutoSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                  {isAutoSaving ? 'Saving...' : hasUnsavedChanges ? 'Unsaved' : 'Saved'}
                </motion.div>
                {lastSaved && (
                  <span className="text-xs text-muted-foreground">
                    {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowPreview(true)}
                disabled={!formData.title.trim() || !formData.description.trim()}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                className={autoSaveEnabled ? 'text-green-600' : 'text-muted-foreground'}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Auto-save {autoSaveEnabled ? 'On' : 'Off'}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[75vh] overflow-hidden">
          {/* Main Editor */}
          <div className="lg:col-span-3 space-y-4 overflow-y-auto">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, title: e.target.value }));
                  setHasUnsavedChanges(true);
                }}
                placeholder="Enter video title..."
                className="text-lg"
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  {formData.title.length}/100 characters
                </p>
                <p className="text-xs text-muted-foreground">
                  {formData.description.split(' ').filter(word => word.length > 0).length} words
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="flex-1">
              <label className="block text-sm font-medium mb-3 text-foreground">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, description: e.target.value }));
                  setHasUnsavedChanges(true);
                }}
                placeholder="Describe your video content..."
                className="w-full p-3 border border-border rounded-md bg-background text-foreground resize-none"
                rows={8}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  📝 Write a comprehensive description for your video.
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{formData.description.length} characters</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 overflow-y-auto">
            {/* Video Upload */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <VideoIcon className="w-4 h-4" />
                  Video Upload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CloudinaryUploader
                  type="video"
                  onUpload={handleVideoUpload}
                  onError={handleVideoUploadError}
                  maxSize={100}
                  label="Click to upload video"
                  className="mb-4"
                />
                {formData.videoUrl && (
                  <div className="text-xs text-green-600">
                    ✓ Video uploaded successfully
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Thumbnail Upload */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Thumbnail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CloudinaryUploader
                  type="image"
                  onUpload={handleThumbnailUpload}
                  onError={handleThumbnailUploadError}
                  maxSize={5}
                  label="Upload thumbnail"
                  className="mb-4"
                />
                {formData.thumbnailUrl && (
                  <div className="text-xs text-green-600">
                    ✓ Thumbnail uploaded
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Duration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, duration: e.target.value }));
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="e.g., 5:30 or 10m 30s"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Video duration in minutes and seconds
                </p>
              </CardContent>
            </Card>

            {/* Category */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, category: e.target.value }));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </CardContent>
            </Card>

            {/* AI Assistant */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={generateAIKeywords}
                  className="w-full"
                  disabled={!formData.description.trim()}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Keywords
                </Button>
                <p className="text-xs text-muted-foreground">
                  Automatically extract relevant keywords from description
                </p>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-3">
                  <Input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    className="flex-1 text-sm"
                  />
                  <Button onClick={addTag}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  <AnimatePresence>
                    {formData.tags.map(tag => (
                      <motion.span
                        key={tag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
                      >
                        {tag}
                        <button onClick={() => removeTag(tag)}>
                          <X className="w-3 h-3" />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>

            {/* Author */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Author
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  type="text"
                  value={formData.author}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, author: e.target.value }));
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="Author name"
                  className="text-sm"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            {autoSaveEnabled && (
              <motion.div 
                className="text-xs text-muted-foreground"
                animate={isAutoSaving ? { opacity: [1, 0.5, 1] } : { opacity: 0.7 }}
                transition={{ duration: 1, repeat: isAutoSaving ? Infinity : 0 }}
              >
                Auto-save enabled
              </motion.div>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => handleSave('draft')}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button
              onClick={() => handleSave('published')}
              disabled={isSubmitting}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Publishing...' : 'Publish Video'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoEditor;