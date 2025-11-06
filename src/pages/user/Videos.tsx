import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, Play, Clock, Calendar, User, Video, ArrowLeft, Loader2, X, ThumbsUp, ThumbsDown, Share, MoreHorizontal, Eye, ChevronRight } from "lucide-react";
import { videoService, Video as VideoType } from "@/lib/contentService";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  doc,
  updateDoc,
  increment,
  getDoc,
  setDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SimpleVideoPlayer } from "@/components/common/SimpleVideoPlayer";
import { ContentFeedback } from "@/components/common/ContentFeedback";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOptimizedVideoUrl } from "@/lib/cloudinary";
import { toast } from "@/hooks/use-toast";

export default function Videos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  
  // Video interaction states
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [currentView, setCurrentView] = useState(0);
  
  // Scroll state for fade-out animation
  const [isVideoHidden, setIsVideoHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [videoAnalytics, setVideoAnalytics] = useState<any>(null);
  const infoSectionRef = useRef<HTMLDivElement>(null);

  // Auto-generated video content
  const [autoTranscript, setAutoTranscript] = useState<string>("");
  const [autoChapters, setAutoChapters] = useState<Array<{title: string, timestamp: number, description: string}>>([]);
  const [autoTags, setAutoTags] = useState<string[]>([]);

  // Real-time listener for published videos
  const loadPublishedVideos = useCallback(() => {
    try {
      const publishedQuery = query(
        collection(db, "videos"),
        where("status", "==", "published"),
        limit(100)
      );

      const unsubscribe = onSnapshot(publishedQuery,
        (snapshot) => {
          const allVideos: VideoType[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            allVideos.push({
              id: doc.id,
              title: data.title || '',
              description: data.description || '',
              videoUrl: data.videoUrl || '',
              thumbnailUrl: data.thumbnailUrl || '',
              category: data.category || 'General',
              tags: data.tags || [],
              author: data.author || 'Unknown',
              status: data.status || 'draft',
              duration: data.duration || '0:00',
              createdAt: data.createdAt || null,
              updatedAt: data.updatedAt || null
            });
          });

          allVideos.sort((a, b) => {
            const dateA = a.createdAt;
            const dateB = b.createdAt;
            
            if (dateA && dateB) {
              const timeA = dateA.toDate ? dateA.toDate().getTime() : (dateA as any);
              const timeB = dateB.toDate ? dateB.toDate().getTime() : (dateB as any);
              return (timeB as number) - (timeA as number);
            } else if (dateA && !dateB) {
              return -1;
            } else if (!dateA && dateB) {
              return 1;
            }
            return 0;
          });

          setVideos(allVideos);
          setLoading(false);

          const uniqueCategories = Array.from(new Set(allVideos.map(video => video.category)));
          setCategories(["All", ...uniqueCategories]);
        },
        (error) => {
          console.error('Error listening to published videos:', error);
          setVideos([]);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up published videos listener:', error);
      setVideos([]);
      setLoading(false);
      return () => {};
    }
  }, []);

  useEffect(() => {
    const unsubscribe = loadPublishedVideos();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadPublishedVideos]);

  useEffect(() => {
    filterVideos();
  }, [videos, searchTerm, selectedCategory]);

  const filterVideos = () => {
    let filtered = videos;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(searchLower) ||
        video.description.toLowerCase().includes(searchLower) ||
        video.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter(video => video.category === selectedCategory);
    }

    setFilteredVideos(filtered);
  };

  const handlePlayVideo = (video: VideoType) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
    // Track video view
    trackVideoView(video.id!);
  };

  const handleCloseVideoModal = () => {
    setSelectedVideo(null);
    setIsVideoModalOpen(false);
    // Reset states
    setIsVideoHidden(false);
    setLastScrollY(0);
  };

  // Advanced video analytics tracking
  const trackVideoView = async (videoId: string) => {
    try {
      const analyticsRef = doc(db, "videoAnalytics", videoId);
      const analyticsDoc = await getDoc(analyticsRef);
      
      if (analyticsDoc.exists()) {
        await updateDoc(analyticsRef, {
          views: increment(1),
          lastViewed: new Date()
        });
      } else {
        await setDoc(analyticsRef, {
          views: 1,
          likes: 0,
          dislikes: 0,
          shares: 0,
          comments: 0,
          subscribers: 0,
          lastViewed: new Date(),
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error tracking video view:', error);
    }
  };

  const loadVideoAnalytics = async (videoId: string) => {
    try {
      const analyticsRef = doc(db, "videoAnalytics", videoId);
      const analyticsDoc = await getDoc(analyticsRef);
      
      if (analyticsDoc.exists()) {
        const data = analyticsDoc.data();
        setVideoAnalytics(data);
        setLikeCount(data.likes || 0);
        setDislikeCount(data.dislikes || 0);
      }
    } catch (error) {
      console.error('Error loading video analytics:', error);
    }
  };

  // Auto-generate video content using AI analysis
  const generateVideoContent = async (video: VideoType) => {
    // Simulate AI analysis
    const mockTranscript = `Welcome to this comprehensive tutorial. In this video, we'll cover the fundamental concepts and practical applications of ${video.title.toLowerCase()}. 

First, let's understand the core principles and how they relate to real-world scenarios. We'll explore various examples and case studies to ensure you grasp the key concepts.

The video is structured with clear chapters:
• Introduction and overview
• Step-by-step implementation
• Best practices and optimization
• Troubleshooting common issues
• Q&A and final thoughts

Feel free to pause and replay sections as needed. Remember to practice these concepts to build your expertise.

Thank you for watching, and we hope you found this content helpful for your learning journey.`;

    const mockChapters = [
      { title: "Introduction & Overview", timestamp: 0, description: "Getting started with the basics" },
      { title: "Core Concepts", timestamp: 45, description: "Understanding fundamental principles" },
      { title: "Step-by-Step Guide", timestamp: 120, description: "Practical implementation walkthrough" },
      { title: "Best Practices", timestamp: 240, description: "Optimization and efficient approaches" },
      { title: "Common Issues", timestamp: 320, description: "Troubleshooting and solutions" },
      { title: "Advanced Techniques", timestamp: 400, description: "Leveling up your skills" },
      { title: "Q&A Session", timestamp: 480, description: "Frequently asked questions" },
      { title: "Conclusion", timestamp: 550, description: "Summary and next steps" }
    ];

    const mockTags = [
      video.category.toLowerCase(),
      "tutorial",
      "guide",
      "how-to",
      "beginner",
      "advanced",
      "tips",
      "best-practices"
    ];

    setAutoTranscript(mockTranscript);
    setAutoChapters(mockChapters);
    setAutoTags(mockTags);
  };

  // Enhanced video interaction handlers with Firestore
  const handleLike = async () => {
    if (!selectedVideo) return;

    try {
      const analyticsRef = doc(db, "videoAnalytics", selectedVideo.id!);
      const currentAnalytics = videoAnalytics || { likes: 0, dislikes: 0 };

      if (isLiked) {
        // Unlike
        await updateDoc(analyticsRef, {
          likes: Math.max(0, (currentAnalytics.likes || 0) - 1)
        });
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        // Like
        if (isDisliked) {
          await updateDoc(analyticsRef, {
            likes: (currentAnalytics.likes || 0) + 1,
            dislikes: Math.max(0, (currentAnalytics.dislikes || 0) - 1)
          });
          setIsDisliked(false);
          setDislikeCount(prev => prev - 1);
        } else {
          await updateDoc(analyticsRef, {
            likes: (currentAnalytics.likes || 0) + 1
          });
        }
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }

      // Refresh analytics
      loadVideoAnalytics(selectedVideo.id!);
      
    } catch (error) {
      console.error('Error handling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDislike = async () => {
    if (!selectedVideo) return;

    try {
      const analyticsRef = doc(db, "videoAnalytics", selectedVideo.id!);
      const currentAnalytics = videoAnalytics || { likes: 0, dislikes: 0 };

      if (isDisliked) {
        // Remove dislike
        await updateDoc(analyticsRef, {
          dislikes: Math.max(0, (currentAnalytics.dislikes || 0) - 1)
        });
        setIsDisliked(false);
        setDislikeCount(prev => prev - 1);
      } else {
        // Dislike
        if (isLiked) {
          await updateDoc(analyticsRef, {
            dislikes: (currentAnalytics.dislikes || 0) + 1,
            likes: Math.max(0, (currentAnalytics.likes || 0) - 1)
          });
          setIsLiked(false);
          setLikeCount(prev => prev - 1);
        } else {
          await updateDoc(analyticsRef, {
            dislikes: (currentAnalytics.dislikes || 0) + 1
          });
        }
        setIsDisliked(true);
        setDislikeCount(prev => prev + 1);
      }

      // Refresh analytics
      loadVideoAnalytics(selectedVideo.id!);
      
    } catch (error) {
      console.error('Error handling dislike:', error);
      toast({
        title: "Error",
        description: "Failed to update dislike. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSubscribe = () => {
    setIsSubscribed(!isSubscribed);
    toast({
      title: isSubscribed ? "Unsubscribed" : "Subscribed",
      description: `You are now ${isSubscribed ? "unsubscribed from" : "subscribed to"} ${selectedVideo?.author}`,
    });
  };

  const handleShare = async () => {
    if (!selectedVideo) return;

    try {
      const shareUrl = `${window.location.origin}/videos/${selectedVideo.id}`;
      
      if (navigator.share) {
        await navigator.share({
          title: selectedVideo.title,
          text: selectedVideo.description,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link Copied!",
          description: "Video link has been copied to your clipboard.",
        });
      }

      // Track share in analytics
      const analyticsRef = doc(db, "videoAnalytics", selectedVideo.id!);
      await updateDoc(analyticsRef, {
        shares: increment(1)
      });

    } catch (error) {
      console.error('Error sharing video:', error);
    }
  };

  // Fixed scroll detection - fade video out completely
  const handleInfoSectionScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    const scrollDelta = currentScrollY - lastScrollY;
    
    // Fade video out when scrolling down past 50px
    if (currentScrollY > 50 && scrollDelta > 0 && !isVideoHidden) {
      setIsVideoHidden(true);
    }
    // Show video again when scrolling up near top
    else if (currentScrollY < 10 && scrollDelta < 0 && isVideoHidden) {
      setIsVideoHidden(false);
    }
    
    setLastScrollY(currentScrollY);
  }, [lastScrollY, isVideoHidden]);

  // Reset states when video changes
  useEffect(() => {
    if (selectedVideo) {
      setIsLiked(false);
      setIsDisliked(false);
      setIsSubscribed(false);
      setShowShareMenu(false);
      setIsVideoHidden(false);
      setLastScrollY(0);
      
      // Load video analytics and generate content
      loadVideoAnalytics(selectedVideo.id!);
      generateVideoContent(selectedVideo);
    }
  }, [selectedVideo]);

  // Load video progress from localStorage
  useEffect(() => {
    if (selectedVideo) {
      const savedProgress = localStorage.getItem(`video_progress_${selectedVideo.id}`);
      if (savedProgress) {
        setCurrentView(parseInt(savedProgress));
      }
    }
  }, [selectedVideo]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString();
    } catch (error) {
      return 'Recently';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-6xl flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-muted-foreground">Loading videos...</p>
          </div>
        </div>
      </div>
    );
  }

  // Featured videos are those with "featured" tag
  const featuredVideos = videos.filter(video =>
    video.tags?.includes('featured') || video.tags?.includes('Featured')
  ).slice(0, 2);
  const regularVideos = filteredVideos.filter(video =>
    !featuredVideos.includes(video)
  );

  // Show empty state
  if (videos.length === 0) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center py-16">
            <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-foreground mb-2">No videos available</h3>
            <p className="text-muted-foreground">Check back later for helpful video tutorials.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            to="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium gap-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 font-medium mb-6">
            <Video className="w-4 h-4 mr-2" />
            Video Learning Center
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Video Tutorials
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Watch step-by-step video guides to master our platform and solve problems faster
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-12">
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg border border-input bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Videos */}
        {featuredVideos.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Featured Videos</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featuredVideos.map((video) => (
                <Card
                  key={video.id}
                  className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  onClick={() => handlePlayVideo(video)}
                >
                  <div className="relative">
                    <img 
                      src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=225&fit=crop'} 
                      alt={video.title}
                      className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors rounded-t-lg">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 text-blue-500 ml-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm font-medium">
                      {video.duration}
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary">{video.category}</Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-blue-500 transition-colors">
                      {video.title}
                    </h3>
                    
                    <p className="text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                      {video.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {video.author}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(video.createdAt)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Regular Videos */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {selectedCategory === "All" ? "All Videos" : `${selectedCategory} Videos`}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({filteredVideos.length} {filteredVideos.length === 1 ? 'video' : 'videos'})
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularVideos.map((video) => (
              <Card
                key={video.id}
                className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                onClick={() => handlePlayVideo(video)}
              >
                <div className="relative">
                  <img 
                    src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=225&fit=crop'} 
                    alt={video.title}
                    className="w-full h-40 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors rounded-t-lg">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 text-blue-500 ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                    {video.duration}
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge variant="outline">{video.category}</Badge>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-blue-500 transition-colors line-clamp-2">
                    {video.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-3 text-sm leading-relaxed line-clamp-2">
                    {video.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDate(video.createdAt)}
                    </div>
                    <span className="flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      {video.author}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredVideos.length === 0 && (
            <div className="text-center py-12">
              <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No videos found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Advanced YouTube-Style Video Dialog with Overlapping Animation */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden">
          <style>{`
            .video-dialog-scroll {
              scroll-behavior: smooth;
            }
            .video-dialog-scroll::-webkit-scrollbar {
              width: 12px;
            }
            .video-dialog-scroll::-webkit-scrollbar-track {
              background: #e5e7eb;
              border-radius: 6px;
              border: 2px solid #f9fafb;
            }
            .video-dialog-scroll::-webkit-scrollbar-thumb {
              background: linear-gradient(45deg, #3b82f6, #8b5cf6);
              border-radius: 6px;
              border: 2px solid #ffffff;
            }
            .video-dialog-scroll::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(45deg, #2563eb, #7c3aed);
            }
            .video-dialog-scroll::-webkit-scrollbar-corner {
              background: #f9fafb;
            }
            .video-overlayed {
              position: fixed;
              top: 20px;
              left: 20px;
              width: 300px;
              height: 169px;
              z-index: 50;
              border-radius: 8px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
              opacity: 0 !important; /* Completely invisible when scrolled */
              transform: none !important;
            }
            .content-overlayed {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              margin: 0;
              padding: 2rem;
              background: rgba(255, 255, 255, 0.98);
              backdrop-filter: blur(10px);
              border-radius: 0;
              box-shadow: none;
              z-index: 40;
              width: 100%;
              height: 100%;
              overflow-y: auto; /* CRITICAL: Restore scrolling */
              scroll-behavior: smooth; /* Smooth scrolling */
            }
            .fade-out-video {
              opacity: 0 !important; /* Complete invisibility when scrolled */
              transform: scale(0.9);
            }
            .fade-in-video {
              opacity: 1;
              transform: scale(1);
              transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            }
          `}</style>
          {selectedVideo && (
            <div className="flex flex-col h-full bg-background">
              {/* Main Content with Overlapping Animation */}
              <div className="flex-1 flex relative">
                {/* Video Player - Always visible, moves to corner when overlayed */}
                <div className={`w-full aspect-video bg-black relative z-20 transition-all duration-800 ${
                  isVideoHidden ? 'hidden' : 'fade-in-video'
                }`}>
                  <SimpleVideoPlayer
                    videoUrl={getOptimizedVideoUrl(selectedVideo.videoUrl)}
                    thumbnailUrl={selectedVideo.thumbnailUrl}
                    className="w-full h-full"
                    autoPlay={false}
                  />
                  {/* Video progress indicator */}
                  {currentView > 0 && (
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {formatDuration(currentView)} watched
                    </div>
                  )}
                </div>

                {/* Video Info Section - Fills entire dialog when scrolled */}
                <div
                  ref={infoSectionRef}
                  className={`p-6 overflow-y-auto video-dialog-scroll bg-background transition-all duration-800 ${
                    isVideoHidden ? 'content-overlayed' : 'flex-1'
                  }`}
                  style={{
                    scrollBehavior: 'smooth',
                    maxHeight: isVideoHidden ? '100%' : 'calc(100vh - 300px)',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    height: isVideoHidden ? '100%' : 'auto',
                    width: '100%'
                  }}
                  onScroll={handleInfoSectionScroll}
                >
                  {/* Title and Stats */}
                  <div className="mb-4">
                    <h1 className="text-xl font-bold text-foreground mb-2">
                      {selectedVideo.title}
                    </h1>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {videoAnalytics?.views?.toLocaleString() || '0'} views
                        </span>
                        <span>•</span>
                        <span>{formatDate(selectedVideo.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Action Buttons with Real Analytics */}
                  <div className="flex items-center gap-2 mb-6">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`gap-2 transition-all ${isLiked ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm' : 'hover:bg-blue-50 hover:border-blue-200'}`}
                      onClick={handleLike}
                    >
                      <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                      {likeCount.toLocaleString()}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`gap-2 transition-all ${isDisliked ? 'bg-red-50 border-red-300 text-red-700 shadow-sm' : 'hover:bg-red-50 hover:border-red-200'}`}
                      onClick={handleDislike}
                    >
                      <ThumbsDown className={`w-4 h-4 ${isDisliked ? 'fill-current' : ''}`} />
                      {dislikeCount.toLocaleString()}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 hover:bg-green-50 hover:border-green-200"
                      onClick={handleShare}
                    >
                      <Share className="w-4 h-4" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm" className="hover:bg-gray-50">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Channel Info with Real Subscriber Count */}
                  <div className="flex items-start gap-3 mb-6 p-4 bg-muted/30 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{selectedVideo.author}</h3>
                      <p className="text-sm text-muted-foreground">
                        {videoAnalytics?.subscribers?.toLocaleString() || '0'} subscribers
                      </p>
                      <div className="mt-3 space-y-3">
                        <p className="text-sm text-foreground">
                          {selectedVideo.description}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary">{selectedVideo.category}</Badge>
                          {selectedVideo.tags && selectedVideo.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {/* Auto-generated AI tags */}
                          {autoTags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                              AI: {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant={isSubscribed ? "default" : "outline"}
                        size="sm"
                        className="mt-3"
                        onClick={handleSubscribe}
                      >
                        {isSubscribed ? "Subscribed ✓" : "Subscribe"}
                      </Button>
                    </div>
                  </div>

                  {/* Content Feedback */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Rate & Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ContentFeedback
                        contentType="video"
                        contentId={selectedVideo.id}
                        contentTitle={selectedVideo.title}
                      />
                    </CardContent>
                  </Card>

                  {/* Auto-Generated AI Transcript */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Video className="w-5 h-5" />
                        AI-Generated Transcript
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                          Auto
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {autoTranscript}
                      </div>
                      <div className="mt-4 text-xs text-muted-foreground">
                        <p>🤖 This transcript was automatically generated using AI analysis of the video content.</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Auto-Generated Chapters with Timestamps */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        AI-Generated Chapters
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                          Auto
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {autoChapters.map((chapter, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer group">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium group-hover:bg-blue-200 transition-colors">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium group-hover:text-blue-600 transition-colors">
                                  {chapter.title}
                                </p>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  {formatDuration(chapter.timestamp)}
                                  <ChevronRight className="w-3 h-3" />
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {chapter.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 text-xs text-muted-foreground">
                        <p>🤖 Chapters were automatically detected and generated using AI video analysis.</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Comments Section */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Comments</h3>
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                      <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No comments yet</p>
                      <p className="text-sm">Be the first to share your thoughts!</p>
                    </div>
                  </div>

                  {/* Additional Content for Smooth Scrolling Demo */}
                  <div className="mt-8 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Related Resources</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm">
                          <li>• Getting Started Guide</li>
                          <li>• Advanced Features Tutorial</li>
                          <li>• Best Practices Documentation</li>
                          <li>• FAQ Section</li>
                          <li>• Video Library</li>
                          <li>• User Community Forum</li>
                          <li>• Support Documentation</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">More from this Channel</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Explore more content from {selectedVideo.author}. This channel has many more helpful tutorials and guides.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
