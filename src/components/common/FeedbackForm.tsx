import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { postFeedback } from "@/api/helpCenterAPI";
import { useToast } from "@/hooks/use-toast";

interface FeedbackFormProps {
  contentId: string;
  contentType: "article" | "video";
}

export const FeedbackForm = ({ contentId, contentType }: FeedbackFormProps) => {
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [showComment, setShowComment] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFeedback = async (isHelpful: boolean) => {
    setHelpful(isHelpful);
    if (!isHelpful) {
      setShowComment(true);
    } else {
      await submitFeedback(isHelpful, "");
    }
  };

  const submitFeedback = async (isHelpful: boolean, feedbackComment: string) => {
    try {
      await postFeedback({
        contentId,
        contentType,
        helpful: isHelpful,
        comment: feedbackComment,
      });
      setSubmitted(true);
      toast({
        title: "Thank you for your feedback!",
        description: "Your input helps us improve our content.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCommentSubmit = () => {
    if (helpful !== null) {
      submitFeedback(helpful, comment);
    }
  };

  if (submitted) {
    return (
      <Card className="p-6 bg-accent/50">
        <p className="text-center text-foreground font-medium">
          Thank you for your feedback! 🎉
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Was this helpful?
        </h3>

        <div className="flex gap-3">
          <Button
            variant={helpful === true ? "default" : "outline"}
            onClick={() => handleFeedback(true)}
            className="flex-1"
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            Yes
          </Button>
          <Button
            variant={helpful === false ? "default" : "outline"}
            onClick={() => handleFeedback(false)}
            className="flex-1"
          >
            <ThumbsDown className="h-4 w-4 mr-2" />
            No
          </Button>
        </div>

        {showComment && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
            <p className="text-sm text-muted-foreground">
              We're sorry this wasn't helpful. Please tell us how we can improve:
            </p>
            <Textarea
              placeholder="Your feedback..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button onClick={handleCommentSubmit} className="flex-1">
                Submit Feedback
              </Button>
              <Button variant="outline" onClick={() => navigate("/contact")} className="flex-1">
                Contact Support
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
