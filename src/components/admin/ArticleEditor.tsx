import * as React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './RichEditor.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Save, Eye, Calendar, Clock, Tag, BookOpen, Wand2, Loader2, CheckCircle, AlertCircle, Type, Hash, Image, Code, Link, FileText, Upload, RefreshCw, Target, Settings, BarChart3, ImageIcon, CloudUpload, Timer } from 'lucide-react';
import { Article } from '@/lib/firestore';
import { firestoreService } from '@/lib/firestore';
import { Timestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import CloudinaryUploader from './CloudinaryUploader';
import { MediaEditor, MediaElement } from './MediaEditor';

// Utility functions
const calculateReadTime = (content: string): string => {
  const wordsPerMinute = 200;
  const text = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const wordCount = text.split(' ').length;
  const readTime = Math.ceil(wordCount / wordsPerMinute);
  return `${readTime} min read`;
};

const calculateWordCount = (content: string): number => {
  const text = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return text.split(' ').filter(word => word.length > 0).length;
};

const calculateCharacterCount = (content: string): number => {
  return content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().length;
};

const extractKeywords = (content: string): string[] => {
  const text = content.replace(/<[^>]*>/g, '').toLowerCase();
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
    .slice(0, 15)
    .map(([word]) => word);
};

const extractExcerpt = (content: string, maxLength: number = 200): string => {
  const text = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

interface ArticleEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  article?: Article | null;
}

export const ArticleEditor: React.FC<ArticleEditorProps> = ({
  isOpen,
  onClose,
  onSuccess,
  article
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    tags: [] as string[],
    author: 'Admin',
    excerpt: '',
    keywords: [] as string[]
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [schedulePublish, setSchedulePublish] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [mediaElements, setMediaElements] = useState<MediaElement[]>([]);
  const [showMediaEditor, setShowMediaEditor] = useState(false);
  const quillRef = useRef<ReactQuill>(null);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categories = [
    'General',
    'Getting Started',
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
    'Development',
    'Tutorials',
    'Updates'
  ];

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title || '',
        content: article.content || '',
        category: article.category || 'General',
        tags: article.tags || [],
        author: article.author || 'Admin',
        excerpt: article.excerpt || '',
        keywords: article.keywords || []
      });
      setHasUnsavedChanges(false);
    } else {
      setFormData({
        title: '',
        content: '',
        category: 'General',
        tags: [],
        author: 'Admin',
        excerpt: '',
        keywords: []
      });
    }
  }, [article]);

  // Enhanced editor modules for better formatting with image upload
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'align': [] }],
        ['blockquote', 'code-block'],
        [{ 'table': [] }],
        [{ 'image': [] }],
        ['link', 'video'],
        ['formula'],
        ['clean']
      ],
    },
    clipboard: {
      matchVisual: false,
    },
    syntax: false,
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'color', 'background',
    'code-block', 'formula',
    'direction', 'align',
    'table'
  ];

  const insertImageAtCursor = (imageUrl: string) => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection();
      const index = range ? range.index : quill.getLength();
      console.log('Inserting image at index:', index, 'URL:', imageUrl);
      quill.insertEmbed(index, 'image', imageUrl);
      quill.setSelection(index + 1, 0);
      
      // Update content state after insertion
      
      
    }
  };

  const handleImageUpload = (url: string, publicId: string) => {
    insertImageAtCursor(url);
    toast({
      title: "Success",
      description: "Image uploaded successfully!",
      variant: "default",
    });
  };

  const handleImageUploadError = (error: string) => {
    toast({
      title: "Upload Failed",
      description: error,
      variant: "destructive",
    });
  };

  const handleMediaElementInsert = (element: MediaElement) => {
    // Convert media element to HTML and insert into editor
    let htmlElement = '';
    
    if (element.type === 'image') {
      htmlElement = `<img src="${element.url}" alt="${element.alt || ''}" style="width: ${element.size.width}px; height: ${element.size.height}px; transform: rotate(${element.rotation}deg); float: ${element.alignment}; margin: 10px;" />`;
    } else if (element.type === 'video') {
      htmlElement = `<video src="${element.url}" style="width: ${element.size.width}px; height: ${element.size.height}px; transform: rotate(${element.rotation}deg); float: ${element.alignment}; margin: 10px;" controls></video>`;
    }

    // Insert into Quill editor
    const quill = quillRef.current?.getEditor();
    if (quill && htmlElement) {
      const range = quill.getSelection();
      const index = range ? range.index : quill.getLength();
      quill.clipboard.dangerouslyPasteHTML(index, htmlElement);
      quill.setSelection(index + 1, 0);
      
      // Update content state
      const newContent = quill.root.innerHTML;
      setFormData(prev => ({ ...prev, content: newContent }));
      setHasUnsavedChanges(true);
    }
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
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags,
        author: formData.author || 'Admin',
        excerpt: formData.excerpt?.trim() || extractExcerpt(formData.content),
        keywords: formData.keywords.length > 0 ? formData.keywords : extractKeywords(formData.content),
        status: 'draft' as 'draft',
        updatedAt: Timestamp.now(),
        readTime: calculateReadTime(formData.content)
      };

      if (article?.id) {
        await firestoreService.updateArticle(article.id, contentData);
      }
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [formData, article, hasUnsavedChanges, autoSaveEnabled]);

  // Auto-save trigger
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    if (hasUnsavedChanges && autoSaveEnabled) {
      autoSaveTimeoutRef.current = setTimeout(autoSave, 5000); // Auto-save after 5 seconds of inactivity
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

    if (!formData.content.trim()) {
      toast({
        title: "Error",
        description: "Content is required",
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

    // Handle scheduling validation
    if (schedulePublish && (status === 'published')) {
      if (!scheduleDate || !scheduleTime) {
        toast({
          title: "Error",
          description: "Please provide both date and time for scheduled publication",
          variant: "destructive",
        });
        return;
      }

      const scheduleDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      const now = new Date();

      if (scheduleDateTime <= now) {
        toast({
          title: "Error",
          description: "Scheduled date and time must be in the future",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      let finalStatus: 'draft' | 'published' | 'scheduled' = status;
      let publishedAt = null;
      let scheduledAt = null;

      if (schedulePublish && status === 'published') {
        finalStatus = 'scheduled';
        const scheduleDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
        scheduledAt = Timestamp.fromDate(scheduleDateTime);
      } else if (status === 'published') {
        publishedAt = Timestamp.now();
      }

      const contentData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags,
        author: formData.author || 'Admin',
        excerpt: formData.excerpt?.trim() || extractExcerpt(formData.content),
        keywords: formData.keywords.length > 0 ? formData.keywords : extractKeywords(formData.content),
        status: finalStatus,
        publishedAt: publishedAt,
        scheduledAt: scheduledAt,
        readTime: calculateReadTime(formData.content),
        views: article?.views || 0,
        createdAt: article?.createdAt || Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      console.log('Saving article data:', contentData);
      console.log('Content HTML before save:', formData.content);
      
      // Check for Cloudinary URLs in content
      const cloudinaryMatches = formData.content.match(/https?:\/\/res\.cloudinary\.com\/[^"'\s>]+/g);
      console.log('Cloudinary URLs found in content:', cloudinaryMatches);

      if (article?.id) {
        await firestoreService.updateArticle(article.id, contentData);
        toast({
          title: "Success",
          description: "Article updated successfully!",
          variant: "default",
        });
      } else {
        const newArticleId = await firestoreService.createArticle(contentData);
        let message;
        if (finalStatus === 'scheduled') {
          message = `Article scheduled for ${new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString()}!`;
        } else {
          message = `Article ${finalStatus === 'published' ? 'published' : 'saved as draft'} successfully!`;
        }
        toast({
          title: "Success",
          description: message,
          variant: "default",
        });
      }
      
      // Reset form and close with success
      setFormData({
        title: '',
        content: '',
        category: 'General',
        tags: [],
        author: 'Admin',
        excerpt: '',
        keywords: []
      });
      setSchedulePublish(false);
      setScheduleDate('');
      setScheduleTime('');
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving article:', error);
      const errorMessage = error?.message || 'Failed to save article. Please try again.';
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
    if (!formData.content.trim()) {
      toast({
        title: "Error",
        description: "Please add content first",
        variant: "destructive",
      });
      return;
    }
    
    const keywords = extractKeywords(formData.content);
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

  const handleContentChange = (content: string) => {
    console.log('Content changed:', content.substring(0, 200) + '...');
    setFormData(prev => ({ ...prev, content }));
    setHasUnsavedChanges(true);
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }

    setFormData({
      title: '',
      content: '',
      category: 'General',
      tags: [],
      author: 'Admin',
      excerpt: '',
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
              <span>Article Preview</span>
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
          <div className="prose prose-slate max-w-none">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {formData.title}
              </h1>
              <div className="flex items-center gap-6 text-sm text-muted-foreground mb-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date().toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {calculateReadTime(formData.content)}
                </span>
                <span className="flex items-center gap-1">
                  <Type className="w-4 h-4" />
                  {calculateWordCount(formData.content)} words
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {formData.category}
                </span>
                {formData.excerpt && (
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    {formData.excerpt.length} chars
                  </span>
                )}
              </div>
            </div>
            <div 
              className="prose prose-lg prose-slate max-w-none leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formData.content }}
            />
            {(formData.tags.length > 0 || formData.keywords.length > 0) && (
              <div className="mt-12 pt-8 border-t">
                <h3 className="text-xl font-semibold mb-6">Tags & Keywords</h3>
                {formData.tags.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-medium mb-3 text-muted-foreground">Tags</h4>
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
                    <h4 className="text-lg font-medium mb-3 text-muted-foreground">Keywords</h4>
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
              <span>{article ? 'Edit Article' : 'Create New Article'}</span>
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
                disabled={!formData.title.trim() || !formData.content.trim()}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={() => setShowMediaEditor(true)}
                variant="outline"
              >
                <Settings className="w-4 h-4 mr-2" />
                Media Editor
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
                placeholder="Enter article title..."
                className="text-lg"
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  {formData.title.length}/100 characters
                </p>
                <p className="text-xs text-muted-foreground">
                  {calculateWordCount(formData.content)} words
                </p>
              </div>
            </div>

            {/* Rich Text Editor */}
            <div className="flex-1">
              <label className="block text-sm font-medium mb-3 text-foreground">Content *</label>
              <div className="border border-border rounded-md overflow-hidden h-80">
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={formData.content}
                  onChange={handleContentChange}
                  modules={modules}
                  formats={formats}
                  style={{
                    height: '100%',
                    fontSize: '14px'
                  }}
                  className="bg-background"
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  📝 Write your article content. Excerpt will be auto-generated.
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{calculateCharacterCount(formData.content)} characters</span>
                  <span>{calculateReadTime(formData.content)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 overflow-y-auto">
            {/* Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Article Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Words:</span>
                  <span className="font-medium">{calculateWordCount(formData.content)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Characters:</span>
                  <span className="font-medium">{calculateCharacterCount(formData.content)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Read Time:</span>
                  <span className="font-medium">{calculateReadTime(formData.content)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tags:</span>
                  <span className="font-medium">{formData.tags.length}</span>
                </div>
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
                  disabled={!formData.content.trim()}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Keywords
                </Button>
                <p className="text-xs text-muted-foreground">
                  Automatically extract relevant keywords from content
                </p>
              </CardContent>
            </Card>

            {/* Image Upload */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Image Upload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CloudinaryUploader
                  type="image"
                  onUpload={handleImageUpload}
                  onError={handleImageUploadError}
                  maxSize={10}
                  label="Click to upload images"
                  className="mb-4"
                />
              </CardContent>
            </Card>

            {/* Scheduling */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Timer className="w-4 h-4" />
                  Scheduling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="schedule-publish"
                    checked={schedulePublish}
                    onChange={(e) => setSchedulePublish(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="schedule-publish" className="text-sm font-medium">
                    Schedule publication
                  </label>
                </div>
                
                {schedulePublish && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Date</label>
                      <Input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Time</label>
                      <Input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Article will be automatically published at the scheduled date and time
                    </p>
                  </div>
                )}
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

            {/* Excerpt */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Excerpt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, excerpt: e.target.value }));
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="Auto-generated from content or custom excerpt..."
                  className="w-full p-2 border border-border rounded-md bg-background text-foreground text-sm resize-none"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.excerpt.length}/200 characters
                </p>
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
              {isSubmitting ? 'Publishing...' : 'Publish Article'}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Media Editor Modal */}
      <MediaEditor
        isOpen={showMediaEditor}
        onClose={() => setShowMediaEditor(false)}
        elements={mediaElements}
        onElementsChange={setMediaElements}
        onInsertElement={handleMediaElementInsert}
        content={formData.content}
      />
    </Dialog>
  );
};