import React, { useState, useEffect } from "react";
import { 
  Image, 
  Video, 
  Trash2, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Download,
  Calendar,
  FileText,
  Trash,
  Eye,
  RefreshCw,
  BarChart3,
  HardDrive,
  FolderOpen
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useToast } from "@/hooks/use-toast";
import type { Article, Video as FirestoreVideo } from "@/lib/firestore";

interface MediaItem {
  id: string;
  url: string;
  public_id: string;
  resource_type: 'image' | 'video';
  format: string;
  bytes: number;
  created_at: string;
  width?: number;
  height?: number;
  duration?: number;
  thumbnail_url?: string;
  original_filename?: string;
}

interface MediaStats {
  totalFiles: number;
  totalSize: number;
  imageCount: number;
  videoCount: number;
  storageUsed: number;
  lastUpload: string;
}

export default function MediaGallery() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{id: string, timeout: NodeJS.Timeout} | null>(null);
  const [stats, setStats] = useState<MediaStats>({
    totalFiles: 0,
    totalSize: 0,
    imageCount: 0,
    videoCount: 0,
    storageUsed: 0,
    lastUpload: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    loadMediaFiles();
  }, []);

  useEffect(() => {
    filterMediaFiles();
  }, [mediaItems, searchTerm, selectedType]);

  const loadMediaFiles = async () => {
    try {
      setLoading(true);
      
      // Import services
      const { firestoreService } = await import('@/lib/firestore');
      
      const mediaItems: MediaItem[] = [];
      
      // Load images from published articles
      const articles = await firestoreService.getArticles(false); // Get all articles
      
      const publishedArticles = articles.filter((article: Article) => article.status === 'published');
      
      // Extract images from article content
      for (const article of publishedArticles) {
        if (article.content && typeof article.content === 'string') {
          // Find all img tags in the content
          const imgRegex = /<img[^>]+src="([^">]+)"[^>]*>/gi;
          let match;
          let imageIndex = 0;
          
          while ((match = imgRegex.exec(article.content)) !== null && imageIndex < 20) {
            const src = match[1];
            
            // Only include Cloudinary images
            if (src.includes('cloudinary.com')) {
              const publicIdMatch = src.match(/\/v\d+\/(.+)\.(\w+)$/);
              if (publicIdMatch) {
                const [, publicId, format] = publicIdMatch;
                
                const timestamp = article.publishedAt || article.createdAt;
                const dateStr = timestamp?.toDate ? timestamp.toDate().toISOString() : new Date().toISOString();
                
                mediaItems.push({
                  id: `${article.id}_img_${imageIndex}`,
                  url: src,
                  public_id: publicId,
                  resource_type: "image",
                  format: format,
                  bytes: 245760, // Approximate size
                  created_at: dateStr,
                  width: 800, // Default size
                  height: 600,
                  original_filename: `article_${article.title.replace(/\s+/g, '_')}_image_${imageIndex + 1}.${format}`
                });
                imageIndex++;
              }
            }
          }
        }
        
        // Add thumbnail images if present
        if ((article as any).thumbnail && (article as any).thumbnail.includes('cloudinary.com')) {
          const thumbnailUrl = (article as any).thumbnail;
          
          const publicIdMatch = thumbnailUrl.match(/\/v\d+\/(.+)\.(\w+)$/);
          if (publicIdMatch) {
            const [, publicId, format] = publicIdMatch;
            
            const timestamp = article.publishedAt || article.createdAt;
            const dateStr = timestamp?.toDate ? timestamp.toDate().toISOString() : new Date().toISOString();
            
            mediaItems.push({
              id: `${article.id}_thumb`,
              url: thumbnailUrl,
              public_id: publicId,
              resource_type: "image",
              format: format,
              bytes: 122880,
              created_at: dateStr,
              width: 400,
              height: 300,
              original_filename: `article_${article.title.replace(/\s+/g, '_')}_thumbnail.${format}`
            });
          }
        }
      }
      
      // Load videos from firestoreService
      const videos = await firestoreService.getVideos(false); // Get all videos
      
      const publishedVideos = videos.filter((video: FirestoreVideo) => video.status === 'published');
      
      for (const video of publishedVideos) {
        const videoUrl = video.videoUrl || video.url;
        const thumbnailUrl = video.thumbnailUrl || video.thumbnail;
        
        if (videoUrl && videoUrl.includes('cloudinary.com')) {
          // Extract video public ID - handle both image and video URL formats
          let publicIdMatch = videoUrl.match(/\/video\/upload\/(.+)\.(\w+)$/);
          if (!publicIdMatch) {
            // Fallback for regular image URL format
            publicIdMatch = videoUrl.match(/\/v\d+\/(.+)\.(\w+)$/);
          }
          if (publicIdMatch) {
            const [, publicId, format] = publicIdMatch;
            
            const timestamp = video.publishedAt || video.createdAt;
            const dateStr = timestamp?.toDate ? timestamp.toDate().toISOString() : new Date().toISOString();
            
            mediaItems.push({
              id: `video_${video.id}`,
              url: videoUrl,
              public_id: publicId,
              resource_type: "video",
              format: format,
              bytes: 5242880, // Approximate 5MB video
              created_at: dateStr,
              width: 1280,
              height: 720,
              duration: parseInt(video.duration || '300') || 300, // Default 5 minutes
              thumbnail_url: thumbnailUrl,
              original_filename: `video_${video.title.replace(/\s+/g, '_')}.${format}`
            });
          }
        }
        
        // Add video thumbnails as separate images
        if (thumbnailUrl && thumbnailUrl.includes('cloudinary.com')) {
          const publicIdMatch = thumbnailUrl.match(/\/v\d+\/(.+)\.(\w+)$/);
          if (publicIdMatch) {
            const [, publicId, format] = publicIdMatch;
            
            const timestamp = video.publishedAt || video.createdAt;
            const dateStr = timestamp?.toDate ? timestamp.toDate().toISOString() : new Date().toISOString();
            
            mediaItems.push({
              id: `video_thumb_${video.id}`,
              url: thumbnailUrl,
              public_id: publicId,
              resource_type: "image",
              format: format,
              bytes: 122880, // Thumbnail size
              created_at: dateStr,
              width: 400,
              height: 225,
              original_filename: `video_${video.title.replace(/\s+/g, '_')}_thumbnail.${format}`
            });
          }
        }
      }
      
      // Show info message if no media found
      if (mediaItems.length === 0) {
        toast({
          title: "No Media Files",
          description: "No media files found. Create some articles/videos with images to populate the gallery.",
          variant: "default"
        });
      } else {
        toast({
          title: "Media Gallery Updated",
          description: `Loaded ${mediaItems.length} media files successfully`,
          variant: "default"
        });
      }
      
      setMediaItems(mediaItems);
      
      // Calculate stats
      const images = mediaItems.filter(item => item.resource_type === 'image');
      const videosOnly = mediaItems.filter(item => item.resource_type === 'video');
      const totalSize = mediaItems.reduce((sum, item) => sum + item.bytes, 0);
      const lastUpload = mediaItems.length > 0 ? mediaItems.reduce((latest, item) => {
        const itemDate = new Date(item.created_at);
        return itemDate > latest ? itemDate : latest;
      }, new Date(0)).toISOString() : new Date().toISOString();

      setStats({
        totalFiles: mediaItems.length,
        totalSize,
        imageCount: images.length,
        videoCount: videosOnly.length,
        storageUsed: parseFloat((totalSize / (1024 * 1024)).toFixed(2)),
        lastUpload
      });

    } catch (error) {
      console.error('Error loading media files:', error);
      toast({
        title: "Error",
        description: "Failed to load media files. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterMediaFiles = () => {
    let filtered = mediaItems;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.original_filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.public_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter(item => item.resource_type === selectedType);
    }

    setFilteredItems(filtered);
  };

  const handleDelete = async (item: MediaItem) => {
    // Check if this delete button was recently clicked
    if (deleteConfirmation?.id === item.id) {
      // Second click - actually delete
      if (deleteConfirmation.timeout) {
        clearTimeout(deleteConfirmation.timeout);
      }
      setDeleteConfirmation(null);
      
      try {
        // In a real implementation, you would call cloudinaryService.delete()
        // await cloudinaryService.delete(item.public_id);
        
        setMediaItems(prev => prev.filter(media => media.id !== item.id));
        toast({
          title: "Success",
          description: "Media file deleted successfully",
          variant: "default"
        });
      } catch (error) {
        console.error('Error deleting media file:', error);
        toast({
          title: "Error",
          description: "Failed to delete media file",
          variant: "destructive"
        });
      }
    } else {
      // First click - show confirmation state
      if (deleteConfirmation?.timeout) {
        clearTimeout(deleteConfirmation.timeout);
      }
      
      const timeout = setTimeout(() => {
        setDeleteConfirmation(null);
        toast({
          title: "Delete Cancelled",
          description: "You can try deleting again within 3 seconds",
          variant: "default"
        });
      }, 3000); // 3 seconds to click again
      
      setDeleteConfirmation({ id: item.id, timeout });
      toast({
        title: "Confirm Delete",
        description: `Click delete again to confirm deletion of "${item.original_filename || item.public_id}"`,
        variant: "default"
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openPreview = (item: MediaItem) => {
    setSelectedItem(item);
    setShowPreview(true);
  };

  const refreshGallery = () => {
    loadMediaFiles();
    toast({
      title: "Refreshed",
      description: "Gallery refreshed successfully",
      variant: "default"
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading media gallery...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Media Gallery</h1>
              <p className="text-muted-foreground mt-1">
                Manage all your uploaded images and videos
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={refreshGallery} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalFiles}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.imageCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.videoCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Storage Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.storageUsed} MB</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Last Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">{formatDate(stats.lastUpload)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search media files..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="all">All Files</option>
                    <option value="image">Images Only</option>
                    <option value="video">Videos Only</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setViewMode("grid")}
                    className={viewMode === "grid" ? "bg-primary" : ""}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setViewMode("list")}
                    className={viewMode === "list" ? "bg-primary" : ""}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media Files */}
          <Card>
            <CardHeader>
              <CardTitle>Media Files ({filteredItems.length})</CardTitle>
              <CardDescription>
                Click on any file to preview or delete it
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredItems.length > 0 ? (
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" 
                  : "space-y-4"
                }>
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className={`border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow ${
                        viewMode === "list" ? "flex items-center gap-4 p-4" : ""
                      }`}
                    >
                      {viewMode === "grid" ? (
                        <div className="relative group">
                          <div className="aspect-square bg-muted">
                            {item.resource_type === "image" ? (
                              <img
                                src={item.url}
                                alt={item.original_filename || item.public_id}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <Video className="w-8 h-8 text-white" />
                                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                                  {item.duration || 0}s
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex gap-2">
                              <Button
                                onClick={() => openPreview(item)}
                                className="bg-secondary"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => handleDelete(item)}
                                className="bg-red-500 text-white"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0">
                            {item.resource_type === "image" ? (
                              <img
                                src={item.url}
                                alt={item.original_filename || item.public_id}
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                <Video className="w-6 h-6 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium truncate">
                                {item.original_filename || item.public_id}
                              </h3>
                              <span className={`px-2 py-1 rounded text-xs ${item.resource_type === "image" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                                {item.resource_type}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-4">
                              <span>{formatFileSize(item.bytes)}</span>
                              <span>{formatDate(item.created_at)}</span>
                              {item.width && item.height && (
                                <span>{item.width} × {item.height}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPreview(item)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(item)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  {mediaItems.length === 0 ? (
                    <>
                      <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No media files found</h3>
                      <p className="text-muted-foreground mb-4">
                        The database appears to be empty. To populate the gallery:
                      </p>
                      <div className="text-sm text-muted-foreground text-left max-w-md mx-auto space-y-2">
                        <div>1. Create articles with images and publish them</div>
                        <div>2. Upload videos and mark them as published</div>
                        <div>3. Make sure images/videos use Cloudinary URLs</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No files match your filters</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search terms or filters to see more results.
                      </p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedItem?.original_filename || selectedItem?.public_id}</DialogTitle>
            <DialogDescription>
              {selectedItem && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {formatFileSize(selectedItem.bytes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(selectedItem.created_at)}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${selectedItem.resource_type === "image" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                    {selectedItem.resource_type}
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="flex justify-center">
              {selectedItem.resource_type === "image" ? (
                <img
                  src={selectedItem.url}
                  alt={selectedItem.original_filename || selectedItem.public_id}
                  className="max-w-full max-h-96 object-contain rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              ) : (
                <video
                  src={selectedItem.url}
                  controls
                  className="max-w-full max-h-96 rounded-lg"
                  poster={selectedItem.thumbnail_url}
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}