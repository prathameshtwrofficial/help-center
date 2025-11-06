import React, { useState, useEffect } from "react";
import { 
  ThumbsUp, 
  MessageCircle, 
  Edit3, 
  Trash2, 
  Reply, 
  Send,
  AtSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { firestoreService } from "@/lib/firestore";
import type { Comment } from "@/lib/firestore";
import { useApp } from "@/context/AppContext";
import toast from "react-hot-toast";

interface CommentSystemProps {
  contentType: 'article' | 'video' | 'faq';
  contentId: string;
  contentTitle: string;
}

export const CommentSystem: React.FC<CommentSystemProps> = ({ 
  contentType, 
  contentId, 
  contentTitle 
}) => {
  const { user, userProfile } = useApp();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [contentType, contentId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const commentsData = await firestoreService.getComments(contentType, contentId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      const mentions = extractMentions(newComment);
      await firestoreService.createComment({
        contentType,
        contentId,
        userId: user.uid,
        userName: userProfile?.displayName || user.displayName || 'Anonymous',
        userEmail: userProfile?.email || user.email || '',
        userAvatar: "",
        message: newComment,
        mentions,
        likes: 0,
        likedBy: [],
        isEdited: false,
        isDeleted: false,
        parentId: null
      });

      setNewComment("");
      await loadComments();
      toast.success('Comment posted!');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    }
  };

  const handleSubmitReply = async () => {
    if (!user || !replyingTo || !replyText.trim()) return;

    try {
      const mentions = extractMentions(replyText);
      await firestoreService.createComment({
        contentType,
        contentId,
        userId: user.uid,
        userName: userProfile?.displayName || user.displayName || 'Anonymous',
        userEmail: userProfile?.email || user.email || '',
        userAvatar: "",
        message: replyText,
        mentions,
        likes: 0,
        likedBy: [],
        isEdited: false,
        isDeleted: false,
        parentId: replyingTo.id || null
      });

      setReplyText("");
      setReplyingTo(null);
      await loadComments();
      toast.success('Reply posted!');
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    }
  };

  const handleEditComment = async (comment: Comment) => {
    if (!user || !editText.trim()) return;

    try {
      await firestoreService.updateComment(comment.id!, {
        message: editText,
        isEdited: true
      });

      setEditText("");
      setEditingComment(null);
      await loadComments();
      toast.success('Comment updated!');
    } catch (error) {
      console.error('Error editing comment:', error);
      toast.error('Failed to edit comment');
    }
  };

  const handleDeleteComment = async (comment: Comment) => {
    if (!user || !confirm('Are you sure you want to delete this comment?')) return;

    try {
      await firestoreService.deleteComment(comment.id!);
      await loadComments();
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleLikeComment = async (comment: Comment) => {
    if (!user) return;

    try {
      await firestoreService.likeComment(comment.id!, user.uid);
      await loadComments();
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment');
    }
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  const formatMentionedMessage = (message: string) => {
    return message.replace(/@(\w+)/g, '<span class="text-blue-600 font-semibold">@$1</span>');
  };

  const formatRelativeTime = (timestamp: any) => {
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
        Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        'day'
      );
    } catch (error) {
      return 'Just now';
    }
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isOwnComment = user?.uid === comment.userId;
    const hasLiked = user ? comment.likedBy?.includes(user.uid) : false;

    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 pl-4 border-l-2 border-gray-200' : ''}`}>
        <div className="flex gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={comment.userAvatar} />
            <AvatarFallback>{comment.userName?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{comment.userName}</span>
              {comment.isEdited && <Badge variant="secondary" className="text-xs">edited</Badge>}
              <span className="text-xs text-gray-500">
                {formatRelativeTime(comment.createdAt)}
              </span>
            </div>
            
            {editingComment?.id === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEditComment(comment)}
                    disabled={!editText.trim()}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingComment(null);
                      setEditText("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className="text-sm text-gray-800 mb-2"
                dangerouslySetInnerHTML={{ __html: formatMentionedMessage(comment.message) }}
              />
            )}
            
            <div className="flex items-center gap-4 text-xs">
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 px-2 ${hasLiked ? 'text-blue-600' : 'text-gray-500'}`}
                onClick={() => handleLikeComment(comment)}
              >
                <ThumbsUp className={`w-3 h-3 mr-1 ${hasLiked ? 'fill-current' : ''}`} />
                {comment.likes || 0}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-gray-500"
                onClick={() => setReplyingTo(comment)}
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>
              
              {isOwnComment && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-gray-500"
                    onClick={() => {
                      setEditingComment(comment);
                      setEditText(comment.message);
                    }}
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-red-500"
                    onClick={() => handleDeleteComment(comment)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
            
            {replyingTo?.id === comment.id && (
              <div className="mt-3 space-y-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${comment.userName}...`}
                  rows={2}
                  className="resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSubmitReply}
                    disabled={!replyText.trim()}
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Reply
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
        
        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  if (!user) {
    return (
      <Card className="mt-8">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">
            Please sign in to join the discussion.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        <h3 className="text-lg font-semibold">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Add New Comment */}
      <div className="flex gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={user.photoURL || ''} />
          <AvatarFallback>{userProfile?.displayName?.[0]?.toUpperCase() || user.displayName?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <AtSign className="w-3 h-3" />
              Use @ to mention users
            </div>
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Comment
            </Button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-4">
          <p className="text-muted-foreground">Loading comments...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map(comment => renderComment(comment))}
        </div>
      )}
    </div>
  );
};