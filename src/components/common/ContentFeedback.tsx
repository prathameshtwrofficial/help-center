import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, Star, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { firestoreService, type ContentFeedback as ContentFeedbackType } from "@/lib/firestore";
import { useApp } from "@/context/AppContext";
import toast from "react-hot-toast";

interface ContentFeedbackProps {
  contentType: 'article' | 'video' | 'faq';
  contentId: string;
  contentTitle: string;
}

export const ContentFeedback = ({ contentType, contentId, contentTitle }: ContentFeedbackProps) => {
  const { user, userProfile } = useApp();
  const [hasVoted, setHasVoted] = useState(false);
  const [currentRating, setCurrentRating] = useState<number | null>(null);
  const [feedbackData, setFeedbackData] = useState<ContentFeedbackType | null>(null);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({
    helpful: 0,
    notHelpful: 0,
    averageRating: 0,
    totalRatings: 0
  });

  useEffect(() => {
    if (user && contentId) {
      loadUserFeedback();
      loadFeedbackStats();
    }
  }, [user, contentId]);

  const loadUserFeedback = async () => {
    try {
      const feedback = await firestoreService.getContentFeedback(contentType, contentId);
      const userFeedback = feedback.find(f => f.userId === user?.uid);
      
      if (userFeedback) {
        setHasVoted(true);
        setCurrentRating(userFeedback.rating || null);
        setFeedbackData(userFeedback);
        setComment(userFeedback.comment || "");
      }
    } catch (error) {
      
    }
  };

  const loadFeedbackStats = async () => {
    try {
      const feedback = await firestoreService.getContentFeedback(contentType, contentId);
      
      const helpful = feedback.filter(f => f.helpful).length;
      const notHelpful = feedback.filter(f => !f.helpful).length;
      const ratingsWithValues = feedback.filter(f => f.rating);
      const averageRating = ratingsWithValues.length > 0 
        ? ratingsWithValues.reduce((sum, f) => sum + (f.rating || 0), 0) / ratingsWithValues.length 
        : 0;

      setStats({
        helpful,
        notHelpful,
        averageRating,
        totalRatings: ratingsWithValues.length
      });
    } catch (error) {
      
    }
  };

  const submitFeedback = async (helpful: boolean, rating?: number, commentText?: string) => {
    if (!user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const feedbackId = await firestoreService.upsertContentFeedback({
        contentType,
        contentId,
        userId: user.uid,
        helpful,
        rating,
        comment: commentText || comment
      });

      setHasVoted(true);
      setCurrentRating(rating || null);
      if (commentText) setComment(commentText);
      
      toast.success('Thank you for your feedback!');
      await loadFeedbackStats();
    } catch (error) {
      
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (helpful: boolean) => {
    await submitFeedback(helpful, currentRating);
  };

  const handleRating = async (rating: number) => {
    setCurrentRating(rating);
    // When a user rates (clicks stars), consider it as helpful feedback
    await submitFeedback(true, rating, comment);
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;
    // When a user submits a comment, consider it as helpful feedback
    await submitFeedback(true, currentRating, comment);
    setShowCommentDialog(false);
  };

  if (!user) {
    return (
      <Card className="mt-8">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please sign in to provide feedback on this content.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-lg">Was this helpful?</CardTitle>
        <CardDescription>
          Help us improve by rating this {contentType}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Rating Stars */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Rate this content</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                key={star}
                variant="ghost"
                size="sm"
                className="p-1 h-auto"
                onClick={() => handleRating(star)}
                disabled={isSubmitting}
              >
                <Star 
                  className={`w-5 h-5 ${
                    star <= (currentRating || 0) 
                      ? 'fill-yellow-400 text-yellow-400' 
                      : 'text-gray-300'
                  }`} 
                />
              </Button>
            ))}
            {stats.totalRatings > 0 && (
              <span className="text-sm text-muted-foreground ml-2">
                ({stats.averageRating.toFixed(1)}/5 from {stats.totalRatings} ratings)
              </span>
            )}
          </div>
        </div>

        {/* Helpful/Not Helpful Voting */}
        {!hasVoted ? (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleVote(true)}
              disabled={isSubmitting}
              className="flex-1"
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Yes, helpful ({stats.helpful})
            </Button>
            <Button
              variant="outline"
              onClick={() => handleVote(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              No, not helpful ({stats.notHelpful})
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="secondary">
              {feedbackData?.helpful ? 'You found this helpful' : 'You found this not helpful'}
            </Badge>
            {currentRating && (
              <Badge variant="outline">
                Your rating: {currentRating}/5
              </Badge>
            )}
          </div>
        )}

        {/* Comments are now handled by the CommentSystem component below */}
        <div className="text-xs text-muted-foreground text-center py-2">
          Comments are available below
        </div>

        {/* Feedback Summary */}
        <div className="pt-4 border-t">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Overall helpfulness: {stats.helpful + stats.notHelpful > 0 ? Math.round((stats.helpful / (stats.helpful + stats.notHelpful)) * 100) : 0}% positive</span>
            <span>{stats.helpful + stats.notHelpful} total votes</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};