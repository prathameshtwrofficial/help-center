import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Clock, User, Calendar, Tag, Play, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { firestoreService } from "@/lib/firestore";
import { SimpleVideoPlayer } from "@/components/common/SimpleVideoPlayer";

export default function VideoView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load video on component mount
  useEffect(() => {
    if (!id) {
      createAndUseTestVideo();
    } else {
      loadVideoById(id);
    }
  }, [id]);

  const createAndUseTestVideo = async () => {
    try {
      setLoading(true);
      console.log('🎥 Creating test video...');
      
      const testVideo = {
        title: "BrainHints Video Demo - Simple & Clean Player",
        description: "This demonstration shows our redesigned video player with simple, clean interface and reliable playback.",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
        category: "Demo",
        tags: ["demo", "test", "brainhints", "tutorial"],
        author: "BrainHints Team",
        status: "published" as const,
        duration: "9:56",
        views: 1
      };

      const videoId = await firestoreService.createVideo(testVideo);
      console.log('✅ Test video created:', videoId);
      
      setVideo({
        id: videoId,
        ...testVideo
      });
      
    } catch (error) {
      console.error('❌ Error creating test video:', error);
      setError('Failed to create test video');
    } finally {
      setLoading(false);
    }
  };

  const loadVideoById = async (videoId: string) => {
    try {
      setLoading(true);
      console.log('🎥 Loading video:', videoId);
      
      const videoData = await firestoreService.getVideo(videoId);
      
      if (videoData) {
        console.log('✅ Video found:', videoData.title);
        setVideo(videoData);
      } else {
        console.log('❌ Video not found, creating test video');
        await createAndUseTestVideo();
      }
      
    } catch (error) {
      console.error('❌ Error loading video:', error);
      setError('Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Recently';
    }
  };

  const handleProgress = (currentTime: number, duration: number) => {
    // Track progress for analytics if needed
    console.log(`Video progress: ${Math.round((currentTime / duration) * 100)}%`);
  };

  const handleError = (error: Error) => {
    console.error('Video playback error:', error);
    setError(`Video playback failed: ${error.message}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">{error || 'No video found'}</h1>
          <Button onClick={createAndUseTestVideo} className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Create Test Video
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/videos')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Videos
          </Button>
          <Badge variant="secondary">Simple Video Player</Badge>
        </div>

        {/* Layout: Large Video (3/5) + Info Panel (2/5) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* LEFT: VIDEO PLAYER (3/5 width) */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden shadow-2xl">
              <CardContent className="p-0">
                <div className="relative w-full h-[60vh] flex items-center justify-center bg-black">
                  <div className="w-full h-full">
                    <SimpleVideoPlayer
                      videoUrl={video.url}
                      thumbnailUrl={video.thumbnail}
                      onProgress={handleProgress}
                      onError={handleError}
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Details */}
            <Card className="mt-6">
              <CardHeader>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{video.category}</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span>{video.views || 0} views</span>
                    </div>
                    {video.duration && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{video.duration}</span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-2xl">{video.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{video.description}</p>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: INFO PANEL (2/5 width) */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  Video Information
                </CardTitle>
                <CardDescription>
                  ✨ Clean and simple video player interface!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Author */}
                <div>
                  <h3 className="font-semibold mb-2 text-blue-600">Author</h3>
                  <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200">
                    <User className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">{video.author}</span>
                  </div>
                </div>
                
                {/* Published Date */}
                <div>
                  <h3 className="font-semibold mb-2 text-green-600">Published</h3>
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200">
                    <Calendar className="w-5 h-5 text-green-500" />
                    <span>{video.publishedAt ? `Published ${formatDate(video.publishedAt)}` : `Created ${formatDate(video.createdAt)}`}</span>
                  </div>
                </div>
                
                {/* Tags */}
                <div>
                  <h3 className="font-semibold mb-2 text-purple-600">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {video.tags?.map((tag: string, index: number) => (
                      <Badge 
                        key={tag} 
                        variant="outline" 
                        className="hover:shadow-md transition-all duration-300 hover:scale-105 border-purple-200 text-purple-700"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Technical Info */}
                <div>
                  <h3 className="font-semibold mb-2 text-orange-600">Player Features</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        • Simple and reliable video playback
                      </p>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        • Clean, responsive controls
                      </p>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        • Error handling and recovery
                      </p>
                    </div>
                  </div>
                </div>
                
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}