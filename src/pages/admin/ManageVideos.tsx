import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Edit, Trash2, Eye, Calendar, User, Play, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { videoService, Video } from "@/lib/contentService";
import VideoEditor from "@/components/admin/VideoEditor";
import toast from "react-hot-toast";

export default function ManageVideos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{id: string, timeout: NodeJS.Timeout} | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    totalViews: 0
  });

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    filterVideos();
  }, [videos, searchTerm, selectedStatus]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const allVideos = await videoService.getAll(100);
      setVideos(allVideos);

      // Calculate stats
      const published = allVideos.filter(v => v.status === 'published').length;
      const draft = allVideos.filter(v => v.status === 'draft').length;
      
      setStats({
        total: allVideos.length,
        published,
        draft,
        totalViews: allVideos.reduce((sum, video) => sum + (video.views || 0), 0)
      });

    } catch (error) {
      console.error('Error loading videos:', error);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const filterVideos = () => {
    let filtered = videos;

    if (searchTerm) {
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus !== "All") {
      const status = selectedStatus.toLowerCase();
      filtered = filtered.filter(video => video.status === status);
    }

    setFilteredVideos(filtered);
  };

  const handleAddVideo = async () => {
    setEditingVideo(null);
    setShowVideoEditor(true);
  };

  const handleEdit = async (id: string) => {
    const videoToEdit = videos.find(v => v.id === id);
    if (videoToEdit) {
      setEditingVideo(videoToEdit);
      setShowVideoEditor(true);
    }
  };

  const handleVideoEditorSuccess = () => {
    setShowVideoEditor(false);
    setEditingVideo(null);
    loadVideos(); // Refresh the list
  };

  const handleDelete = async (id: string) => {
    // Check if this delete button was recently clicked
    if (deleteConfirmation?.id === id) {
      // Second click - actually delete
      if (deleteConfirmation.timeout) {
        clearTimeout(deleteConfirmation.timeout);
      }
      setDeleteConfirmation(null);
      
      try {
        await videoService.delete(id);
        toast.success('Video deleted successfully');
        loadVideos();
      } catch (error) {
        console.error('Error deleting video:', error);
        toast.error('Failed to delete video');
      }
    } else {
      // First click - show confirmation state
      if (deleteConfirmation?.timeout) {
        clearTimeout(deleteConfirmation.timeout);
      }
      
      const timeout = setTimeout(() => {
        setDeleteConfirmation(null);
        toast('Delete cancelled', { icon: 'ℹ️' });
      }, 3000); // 3 seconds to click again
      
      setDeleteConfirmation({ id, timeout });
      toast('Click delete again to confirm', { icon: '⚠️' });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      await videoService.update(id, { status: newStatus });
      toast.success(`Video ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
      loadVideos(); // Refresh the list
    } catch (error) {
      console.error('Error updating video status:', error);
      toast.error('Failed to update video status');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading videos...</p>
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
              <h1 className="text-3xl font-bold text-foreground">Manage Videos</h1>
              <p className="text-muted-foreground mt-1">
                Upload, edit, and manage your video tutorials
              </p>
            </div>
            <Button onClick={handleAddVideo} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Upload Video
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.published}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Draft</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search videos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setSelectedStatus("All")}
                    className={selectedStatus === "All" ? "" : "bg-transparent border border-input hover:bg-accent"}
                  >
                    All
                  </Button>
                  <Button
                    onClick={() => setSelectedStatus("Published")}
                    className={selectedStatus === "Published" ? "" : "bg-transparent border border-input hover:bg-accent"}
                  >
                    Published
                  </Button>
                  <Button
                    onClick={() => setSelectedStatus("Draft")}
                    className={selectedStatus === "Draft" ? "" : "bg-transparent border border-input hover:bg-accent"}
                  >
                    Draft
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Videos List */}
          <Card>
            <CardHeader>
              <CardTitle>Videos ({filteredVideos.length})</CardTitle>
              <CardDescription>
                Manage your video content and publication status
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-hidden">
              <div className="space-y-4 overflow-hidden">
                {filteredVideos.length > 0 ? (
                  filteredVideos.map((video) => (
                    <div key={video.id} className="border border-border rounded-lg p-4 hover:bg-accent transition-colors overflow-hidden">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0 overflow-hidden">
                          <div className="w-16 h-10 bg-gradient-to-br from-blue-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Play className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="text-lg font-semibold text-foreground truncate max-w-[300px]">
                                {video.title}
                              </h3>
                              <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                                video.status === 'published'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                              </span>
                              <span className="text-sm text-muted-foreground flex-shrink-0">
                                {video.duration || 'N/A'}
                              </span>
                            </div>
                            <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">
                              {video.description}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1 flex-shrink-0">
                                <User className="w-3 h-3" />
                                <span className="truncate max-w-[100px]">{video.author}</span>
                              </span>
                              <span className="flex items-center gap-1 flex-shrink-0">
                                <Calendar className="w-3 h-3" />
                                <span className="whitespace-nowrap">{formatDate(video.createdAt)}</span>
                              </span>
                              <span className="flex items-center gap-1 flex-shrink-0">
                                <Eye className="w-3 h-3" />
                                <span className="whitespace-nowrap">{video.views || 0} views</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            onClick={() => window.open(`/video/${video.id}`, '_blank')}
                            className="bg-transparent border border-input hover:bg-accent p-1.5 h-7 w-7"
                            title="Preview"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={() => handleEdit(video.id!)}
                            className="bg-transparent border border-input hover:bg-accent p-1.5 h-7 w-7"
                            title="Edit"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={() => handleToggleStatus(video.id!, video.status)}
                            className="bg-transparent border border-input hover:bg-accent px-1.5 h-7 text-xs whitespace-nowrap"
                            title={video.status === 'published' ? 'Unpublish' : 'Publish'}
                          >
                            {video.status === 'published' ? 'Unpub' : 'Pub'}
                          </Button>
                          <Button
                            onClick={() => handleDelete(video.id!)}
                            className="bg-transparent border border-input text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 h-7 w-7"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {videos.length === 0
                      ? "No videos found. Start by uploading your first video!"
                      : "No videos match your current filters."
                    }
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Video Editor Dialog */}
      {showVideoEditor && (
        <VideoEditor
          isOpen={showVideoEditor}
          onClose={() => setShowVideoEditor(false)}
          onSuccess={handleVideoEditorSuccess}
          video={editingVideo}
        />
      )}
    </div>
  );
}