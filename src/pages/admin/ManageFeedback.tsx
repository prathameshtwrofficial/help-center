import React, { useState, useEffect } from "react";
import { Search, Trash2, Eye, Calendar, User, MessageCircle, Star, Loader2, FileText, Video, HelpCircle, Reply, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { firestoreService, ContentFeedback, Comment } from "@/lib/firestore";
import { useApp } from "@/context/AppContext";
import toast from "react-hot-toast";

// Unified interface for both content feedback and regular comments
type UnifiedFeedbackItem =
  | (ContentFeedback & {
      contentTitle?: string;
      userName?: string;
      userEmail?: string;
      itemType: 'feedback';
    })
  | (Comment & {
      contentTitle?: string;
      userName?: string;
      userEmail?: string;
      itemType: 'comment';
    });

export default function ManageFeedback() {
  const { userProfile } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContentType, setSelectedContentType] = useState("All");
  const [sortBy, setSortBy] = useState("recent");
  const [deleteConfirmations, setDeleteConfirmations] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<UnifiedFeedbackItem[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<UnifiedFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<UnifiedFeedbackItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [replyingTo, setReplyingTo] = useState<UnifiedFeedbackItem | null>(null);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    rated: 0,
    commented: 0,
    avgRating: 0
  });

  useEffect(() => {
    loadContentFeedback();
  }, []);

  useEffect(() => {
    if (feedback.length > 0) {
      // Only content feedback has ratings
      const ratings = feedback
        .filter(f => f.itemType === 'feedback' && 'rating' in f && f.rating && f.rating > 0)
        .map(f => (f as any).rating);
      const avgRating = ratings.length > 0 ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;
      
      // For content feedback, we consider "new" as feedback from the last 24 hours
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);
      const newCount = feedback.filter(f => {
        const feedbackDate = f.createdAt?.toDate ? f.createdAt.toDate() : new Date();
        return feedbackDate > dayAgo;
      }).length;
      
      // Comments field differs between types
      const commented = feedback.filter(f => {
        if (f.itemType === 'feedback') {
          return (f as any).comment && (f as any).comment.length > 0;
        } else {
          return (f as any).message && (f as any).message.length > 0;
        }
      }).length;
      
      setStats({
        total: feedback.length,
        new: newCount,
        rated: ratings.length,
        commented,
        avgRating
      });
    }
    filterFeedback();
  }, [feedback, searchTerm, selectedContentType, sortBy]);

  const loadContentFeedback = async () => {
    try {
      setLoading(true);
      const [contentFeedback, allComments] = await Promise.all([
        firestoreService.getAllContentFeedback(),
        firestoreService.getAllComments()
      ]);
      
      // Process content feedback
      const feedbackWithUserInfo: UnifiedFeedbackItem[] = [];
      
      for (const fb of contentFeedback) {
        // Get user profile
        const userProfile = await firestoreService.getUserProfile(fb.userId);
        const userName = userProfile?.displayName || userProfile?.uid?.substring(0, 8) || "Unknown User";
        const userEmail = userProfile?.email || "No email";
        
        // Get content title based on content type
        let contentTitle = "Unknown Content";
        try {
          switch (fb.contentType) {
            case 'article':
              const article = await firestoreService.getArticle(fb.contentId);
              contentTitle = article?.title || "Unknown Article";
              break;
            case 'video':
              const video = await firestoreService.getVideo(fb.contentId);
              contentTitle = video?.title || "Unknown Video";
              break;
            case 'faq':
              const faq = await firestoreService.getFAQ(fb.contentId);
              contentTitle = faq?.question || "Unknown FAQ";
              break;
          }
        } catch (error) {
          console.error('Error fetching content title:', error);
        }
        
        feedbackWithUserInfo.push({
          ...fb,
          userName,
          userEmail,
          contentTitle,
          itemType: 'feedback' as const
        });
      }

      // Process regular comments (only non-deleted ones)
      for (const comment of allComments) {
        // Skip deleted comments
        if (comment.isDeleted) {
          continue;
        }
        
        // Get user profile
        const userProfile = await firestoreService.getUserProfile(comment.userId);
        const userName = comment.userName || userProfile?.displayName || userProfile?.uid?.substring(0, 8) || "Unknown User";
        const userEmail = userProfile?.email || "No email";
        
        // Get content title based on content type
        let contentTitle = "Unknown Content";
        try {
          switch (comment.contentType) {
            case 'article':
              const article = await firestoreService.getArticle(comment.contentId);
              contentTitle = article?.title || "Unknown Article";
              break;
            case 'video':
              const video = await firestoreService.getVideo(comment.contentId);
              contentTitle = video?.title || "Unknown Video";
              break;
            case 'faq':
              const faq = await firestoreService.getFAQ(comment.contentId);
              contentTitle = faq?.question || "Unknown FAQ";
              break;
          }
        } catch (error) {
          console.error('Error fetching content title:', error);
        }
        
        feedbackWithUserInfo.push({
          ...comment,
          userName,
          userEmail,
          contentTitle,
          itemType: 'comment' as const
        });
      }
      
      setFeedback(feedbackWithUserInfo);
    } catch (error) {
      console.error('Error loading content feedback:', error);
      toast.error('Failed to load feedback data');
    } finally {
      setLoading(false);
    }
  };

  const filterFeedback = () => {
    let filtered = feedback;

    if (searchTerm) {
      filtered = filtered.filter(item => {
        // Handle different comment fields for feedback vs comments
        const commentText = item.itemType === 'feedback'
          ? (item as any).comment
          : (item as any).message;
        
        return (
          (commentText && commentText.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.userName && item.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.contentTitle && item.contentTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
          item.contentType.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (selectedContentType !== "All") {
      filtered = filtered.filter(item => item.contentType === selectedContentType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return dateB - dateA;
        
        case 'most_liked':
          const likesA = (a as any).likes || 0;
          const likesB = (b as any).likes || 0;
          return likesB - likesA;
        
        case 'oldest':
          const oldDateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const oldDateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return oldDateA - oldDateB;
        
        default:
          return 0;
      }
    });

    setFilteredFeedback(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!deleteConfirmations.has(id)) {
      // First click - ask for confirmation
      setDeleteConfirmations(prev => new Set([...prev, id]));
      toast.error('Click again to permanently delete');
      setTimeout(() => {
        setDeleteConfirmations(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }, 5000);
    } else {
      // Second click - actually delete
      try {
        // Find the item to delete to determine its type
        const itemToDelete = feedback.find(item => item.id === id);
        
        if (!itemToDelete) {
          throw new Error(`Item with ID ${id} not found in current data`);
        }

        // Delete based on the item type
        if (itemToDelete.itemType === 'feedback') {
          await firestoreService.deleteContentFeedback(id);
        } else if (itemToDelete.itemType === 'comment') {
          await firestoreService.deleteComment(id);
        }
        
        toast.success('Item permanently deleted');
        setDeleteConfirmations(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        
        // Add a small delay to ensure database write is complete
        setTimeout(async () => {
          await loadContentFeedback();
        }, 1000);
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error(`Failed to delete item: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleReply = async () => {
    if (!replyingTo || !replyText.trim() || !userProfile || submittingReply) return;

    setSubmittingReply(true);
    try {
      // Get the original comment that we're replying to
      const originalComment = replyingTo;
      
      // Create a comment as admin reply (as a threaded reply)
      const commentId = await firestoreService.createComment({
        contentType: originalComment.contentType,
        contentId: originalComment.contentId,
        userId: userProfile.uid,
        userName: userProfile.displayName || "Admin",
        userEmail: userProfile.email || "",
        userAvatar: "",
        message: replyText, // Admin reply message
        mentions: [],
        likes: 0,
        likedBy: [],
        isEdited: false,
        isDeleted: false,
        parentId: originalComment.id || null // Thread to the original comment
      });

      // Create notification for the user
      try {
        // Get content title for the notification
        let contentTitle = "Unknown Content";
        try {
          switch (originalComment.contentType) {
            case 'article':
              const article = await firestoreService.getArticle(originalComment.contentId);
              contentTitle = article?.title || "Unknown Article";
              break;
            case 'video':
              const video = await firestoreService.getVideo(originalComment.contentId);
              contentTitle = video?.title || "Unknown Video";
              break;
            case 'faq':
              const faq = await firestoreService.getFAQ(originalComment.contentId);
              contentTitle = faq?.question || "Unknown FAQ";
              break;
          }
        } catch (error) {
          console.error('Error fetching content title for notification:', error);
        }

        // Create notification for the user
        await firestoreService.createNotification({
          userId: originalComment.userId, // Notify the original commenter
          type: 'admin_reply',
          title: 'Admin replied to your comment',
          message: `Admin ${userProfile.displayName || "Support"} replied to your comment on "${contentTitle}": "${replyText}"`,
          isRead: false,
          relatedCommentId: commentId,
          relatedContentId: originalComment.contentId,
          relatedContentType: originalComment.contentType as 'article' | 'video' | 'faq',
          adminId: userProfile.uid,
          adminName: userProfile.displayName || "Admin"
        });
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't fail the entire operation if notification creation fails
      }

      setReplyText("");
      setReplyingTo(null);
      setShowReplyDialog(false);
      toast.success('Reply sent successfully! User will be notified.');
      await loadContentFeedback();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setSubmittingReply(false);
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

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'faq':
        return <HelpCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading feedback data...</p>
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
              <h1 className="text-3xl font-bold text-foreground">Manage Content Feedback</h1>
              <p className="text-muted-foreground mt-1">
                Review user feedback, ratings, and comments on content
              </p>
            </div>
            <Button onClick={() => loadContentFeedback()} variant="outline">
              Refresh Data
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">New (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Rated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.rated}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">With Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.commented}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-1">
                  {stats.avgRating}
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                </div>
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
                      placeholder="Search feedback by comment, user, or content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={selectedContentType === "All" ? "default" : "outline"}
                    onClick={() => setSelectedContentType("All")}
                  >
                    All
                  </Button>
                  <Button
                    variant={selectedContentType === "article" ? "default" : "outline"}
                    onClick={() => setSelectedContentType("article")}
                  >
                    Articles
                  </Button>
                  <Button
                    variant={selectedContentType === "video" ? "default" : "outline"}
                    onClick={() => setSelectedContentType("video")}
                  >
                    Videos
                  </Button>
                  <Button
                    variant={selectedContentType === "faq" ? "default" : "outline"}
                    onClick={() => setSelectedContentType("faq")}
                  >
                    FAQs
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Recent</SelectItem>
                      <SelectItem value="most_liked">Most Liked</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback List */}
          <Card>
            <CardHeader>
              <CardTitle>Content Feedback ({filteredFeedback.length})</CardTitle>
              <CardDescription>
                User feedback, ratings, and comments on articles, videos, and FAQs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredFeedback.length > 0 ? (
                  filteredFeedback.map((feedback) => (
                    <div key={feedback.id} className="border border-border rounded-lg p-6 hover:bg-accent transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {/* Content Information */}
                          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              {getContentTypeIcon(feedback.contentType)}
                              <span className="text-sm font-medium text-blue-800">
                                {feedback.contentType.charAt(0).toUpperCase() + feedback.contentType.slice(1)}: {feedback.contentTitle}
                              </span>
                            </div>
                            <div className="text-xs text-blue-600">
                              ID: {feedback.contentId}
                            </div>
                          </div>

                          {/* Content Type Badge */}
                          <div className="flex items-center gap-2 mb-3">
                            {feedback.itemType === 'feedback' ? (
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                (feedback as any).helpful ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {(feedback as any).helpful ? 'Helpful' : 'Not Helpful'}
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                Regular Comment
                              </span>
                            )}
                          </div>

                          {/* Rating Section - Only for feedback */}
                          {feedback.itemType === 'feedback' && (feedback as any).rating && (feedback as any).rating > 0 && (
                            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-yellow-800">Rating:</span>
                                <div className="flex items-center gap-1">
                                  {getRatingStars((feedback as any).rating)}
                                  <span className="text-sm text-yellow-700 font-medium">
                                    ({(feedback as any).rating}/5)
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Comment Section */}
                          {(() => {
                            const commentText = feedback.itemType === 'feedback'
                              ? (feedback as any).comment
                              : (feedback as any).message;
                            return commentText && commentText.length > 0 ? (
                              <div className="mb-3 p-3 bg-muted rounded-lg">
                                <p className="text-sm text-foreground whitespace-pre-wrap">{commentText}</p>
                              </div>
                            ) : null;
                          })()}

                          {/* User Info */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {feedback.userName} ({feedback.userEmail})
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(feedback.createdAt)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedFeedback(feedback)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Feedback Details</DialogTitle>
                                <DialogDescription>
                                  Complete feedback information and user details
                                </DialogDescription>
                              </DialogHeader>
                              {selectedFeedback && (
                                <div className="space-y-4">
                                  {/* Content Info */}
                                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <label className="text-sm font-medium text-muted-foreground">Content</label>
                                    <p className="text-sm text-foreground flex items-center gap-2">
                                      {getContentTypeIcon(selectedFeedback.contentType)}
                                      {selectedFeedback.contentTitle}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Type: {selectedFeedback.contentType} | ID: {selectedFeedback.contentId}
                                    </p>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">User</label>
                                      <p className="text-sm text-foreground">{selectedFeedback.userName}</p>
                                      <p className="text-xs text-muted-foreground">{selectedFeedback.userEmail}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Date</label>
                                      <p className="text-sm text-foreground">{formatDate(selectedFeedback.createdAt)}</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Type</label>
                                    <p className="text-sm text-foreground">
                                      {selectedFeedback.itemType === 'feedback' ? 'Content Feedback' : 'Regular Comment'}
                                    </p>
                                  </div>
                                  
                                  {selectedFeedback.itemType === 'feedback' && (
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Helpfulness</label>
                                      <p className="text-sm text-foreground">
                                        {(selectedFeedback as any).helpful ? 'Helpful' : 'Not Helpful'}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {selectedFeedback.itemType === 'feedback' && (selectedFeedback as any).rating && (selectedFeedback as any).rating > 0 && (
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Rating</label>
                                      <div className="flex items-center gap-2 mt-1">
                                        <div className="flex items-center gap-1">
                                          {getRatingStars((selectedFeedback as any).rating)}
                                          <span className="text-sm text-foreground font-medium">
                                            ({(selectedFeedback as any).rating}/5)
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {(() => {
                                    const commentText = selectedFeedback.itemType === 'feedback'
                                      ? (selectedFeedback as any).comment
                                      : (selectedFeedback as any).message;
                                    return commentText && commentText.length > 0 ? (
                                      <div>
                                        <label className="text-sm font-medium text-muted-foreground">Comment</label>
                                        <div className="mt-1 p-3 bg-muted rounded-lg">
                                          <p className="text-sm text-foreground whitespace-pre-wrap">{commentText}</p>
                                        </div>
                                      </div>
                                    ) : null;
                                  })()}
                                  
                                  {/* Admin Reply Section */}
                                  <div className="pt-4 border-t">
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="text-sm font-medium text-muted-foreground">Reply to this feedback</label>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setReplyingTo(selectedFeedback);
                                          setShowReplyDialog(true);
                                        }}
                                      >
                                        <Reply className="w-4 h-4 mr-1" />
                                        Reply
                                      </Button>
                                    </div>
                                    {replyingTo?.id === selectedFeedback.id && (
                                      <div className="space-y-2">
                                        <Textarea
                                          placeholder="Type your reply..."
                                          value={replyText}
                                          onChange={(e) => setReplyText(e.target.value)}
                                          rows={3}
                                        />
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            onClick={handleReply}
                                            disabled={submittingReply || !replyText.trim()}
                                          >
                                            {submittingReply ? 'Sending...' : 'Send Reply'}
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              setReplyingTo(null);
                                              setReplyText("");
                                            }}
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(feedback.id!)}
                            className={deleteConfirmations.has(feedback.id!) 
                              ? "text-red-700 bg-red-100 hover:bg-red-200 animate-pulse" 
                              : "text-red-600 hover:text-red-700 hover:bg-red-50"
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                            {deleteConfirmations.has(feedback.id!) && " Click Again!"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No content feedback found.</p>
                    {feedback.length === 0 && <p>Start by having users rate your content!</p>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}