import { firestoreService } from './firestore';
import { Timestamp } from 'firebase/firestore';
import { ContentFeedback } from './firestore';

// User interaction tracking
export interface UserInteraction {
  id?: string;
  userId: string;
  contentType: 'article' | 'video' | 'faq';
  contentId: string;
  action: 'view' | 'helpful' | 'not_helpful' | 'rating' | 'comment';
  rating?: number;
  comment?: string;
  timestamp: Timestamp;
}

// Content analytics
export interface ContentAnalytics {
  contentType: 'article' | 'video' | 'faq';
  contentId: string;
  totalViews: number;
  helpfulVotes: number;
  notHelpfulVotes: number;
  averageRating: number;
  totalRatings: number;
  comments: number;
  lastUpdated: Timestamp;
}

export const feedbackService = {
  // Submit content feedback
  async submitFeedback(feedback: Omit<ContentFeedback, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const now = Timestamp.now();
      
      // Create content feedback document using the correct method
      const feedbackId = await firestoreService.createContentFeedback({
        contentType: feedback.contentType,
        contentId: feedback.contentId,
        userId: feedback.userId,
        helpful: feedback.helpful,
        rating: feedback.rating,
        comment: feedback.comment
      });

      // Track user interaction
      await this.trackUserInteraction({
        userId: feedback.userId,
        contentType: feedback.contentType,
        contentId: feedback.contentId,
        action: feedback.helpful ? 'helpful' : 'not_helpful',
        rating: feedback.rating,
        comment: feedback.comment,
        timestamp: now
      });

      // Update content analytics
      await this.updateContentAnalytics(feedback.contentType, feedback.contentId);

      return feedbackId;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw new Error('Failed to submit feedback');
    }
  },

  // Track user interaction
  async trackUserInteraction(interaction: Omit<UserInteraction, 'id' | 'timestamp'>) {
    try {
      const now = Timestamp.now();
      // This would create a new collection for user interactions
      console.log('Tracking user interaction:', interaction);
      // In a real implementation, you'd save this to Firestore
    } catch (error) {
      console.error('Error tracking user interaction:', error);
    }
  },

  // Update content analytics
  async updateContentAnalytics(contentType: string, contentId: string) {
    try {
      // Calculate and update analytics for the content
      console.log(`Updating analytics for ${contentType}:${contentId}`);
      // In a real implementation, you'd query feedback and update metrics
    } catch (error) {
      console.error('Error updating content analytics:', error);
    }
  },

  // Get feedback for specific content
  async getFeedbackForContent(contentType: string, contentId: string) {
    try {
      // Use the existing firestoreService method
      const feedback = await firestoreService.getContentFeedback(contentType, contentId);
      
      // Aggregate the feedback data
      const helpfulVotes = feedback.filter(f => f.helpful).length;
      const notHelpfulVotes = feedback.filter(f => !f.helpful).length;
      const ratings = feedback.filter(f => f.rating && f.rating > 0).map(f => f.rating!);
      const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      const comments = feedback.filter(f => f.comment && f.comment.trim().length > 0).map(f => f.comment!);

      return {
        helpfulVotes,
        notHelpfulVotes,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        totalRatings: ratings.length,
        comments
      };
    } catch (error) {
      console.error('Error getting feedback:', error);
      return null;
    }
  },

  // Get user's feedback history
  async getUserFeedbackHistory(userId: string) {
    try {
      // Get all feedback submitted by user
      console.log(`Getting feedback history for user: ${userId}`);
      // In a real implementation, you'd query Firestore for user's feedback
      return [];
    } catch (error) {
      console.error('Error getting user feedback history:', error);
      return [];
    }
  }
};