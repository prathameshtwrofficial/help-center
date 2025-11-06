import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { firestoreService } from './firestore';

export interface UserActivity {
  userId: string;
  contentType: 'article' | 'video' | 'faq';
  contentId: string;
  action: 'view' | 'like' | 'bookmark' | 'share' | 'complete' | 'rate';
  timestamp: any;
  sessionId?: string;
  duration?: number; // in seconds for videos, reading time for articles
  rating?: number; // 1-5 stars
  helpful?: boolean; // for feedback
}

export interface UserProfile {
  userId: string;
  interests: string[]; // categories user is interested in
  viewedContent: {
    contentId: string;
    contentType: 'article' | 'video' | 'faq';
    category: string;
    timestamp: any;
    rating?: number;
  }[];
  preferences: {
    preferredContentLength: 'short' | 'medium' | 'long';
    preferredTopics: string[];
    learningStyle: 'visual' | 'text' | 'mixed';
  };
  stats: {
    totalViews: number;
    totalTimeSpent: number; // in seconds
    completionRate: number; // percentage of content completed
    averageRating: number;
    lastActivity: any;
  };
}

export interface RecommendationContext {
  userId: string;
  currentContent?: {
    type: 'article' | 'video' | 'faq';
    id: string;
    category: string;
  };
  searchQuery?: string;
  sessionLength: number;
}

export class UserActivityService {
  
  // Track user activity
  async trackActivity(activity: Omit<UserActivity, 'timestamp'>): Promise<void> {
    try {
      const activityRef = doc(collection(db, 'user_activities'));
      await setDoc(activityRef, {
        ...activity,
        timestamp: Timestamp.now()
      });

      // Update user profile
      await this.updateUserProfile(activity.userId, activity);
    } catch (error) {
      console.error('Error tracking user activity:', error);
    }
  }

  // Get user's recent activity
  async getUserRecentActivity(userId: string, limitCount = 20): Promise<UserActivity[]> {
    try {
      const activitiesQuery = query(
        collection(db, 'user_activities'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await new Promise<any>((resolve, reject) => {
        const unsubscribe = onSnapshot(activitiesQuery, 
          (doc) => resolve(doc),
          (error) => reject(error)
        );
        
        // Auto-unsubscribe after 5 seconds if no data
        setTimeout(() => unsubscribe(), 5000);
      });

      const activities: UserActivity[] = [];
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        activities.push({
          userId: data.userId,
          contentType: data.contentType,
          contentId: data.contentId,
          action: data.action,
          timestamp: data.timestamp,
          sessionId: data.sessionId,
          duration: data.duration,
          rating: data.rating,
          helpful: data.helpful
        });
      });

      return activities;
    } catch (error) {
      console.error('Error getting user activities:', error);
      return [];
    }
  }

  // Get user's profile and preferences
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const profileRef = doc(db, 'user_profiles', userId);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        return profileSnap.data() as UserProfile;
      }

      // Create new profile if doesn't exist
      const newProfile: UserProfile = {
        userId,
        interests: [],
        viewedContent: [],
        preferences: {
          preferredContentLength: 'medium',
          preferredTopics: [],
          learningStyle: 'mixed'
        },
        stats: {
          totalViews: 0,
          totalTimeSpent: 0,
          completionRate: 0,
          averageRating: 0,
          lastActivity: Timestamp.now()
        }
      };

      await setDoc(profileRef, newProfile);
      return newProfile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Update user profile based on activity
  private async updateUserProfile(userId: string, activity: Omit<UserActivity, 'timestamp'>): Promise<void> {
    try {
      const profileRef = doc(db, 'user_profiles', userId);
      const profileSnap = await getDoc(profileRef);
      
      if (!profileSnap.exists()) return;

      const profile = profileSnap.data() as UserProfile;
      const newProfile = { ...profile };

      // Update stats
      newProfile.stats.totalViews += activity.action === 'view' ? 1 : 0;
      newProfile.stats.lastActivity = Timestamp.now();
      
      if (activity.duration) {
        newProfile.stats.totalTimeSpent += activity.duration;
      }

      if (activity.rating) {
        const currentTotal = newProfile.stats.averageRating * newProfile.stats.totalViews;
        newProfile.stats.averageRating = (currentTotal + activity.rating) / (newProfile.stats.totalViews + 1);
        newProfile.stats.totalViews += 1;
      }

      // Add to viewed content
      const contentIndex = newProfile.viewedContent.findIndex(
        content => content.contentId === activity.contentId
      );

      if (contentIndex >= 0) {
        newProfile.viewedContent[contentIndex] = {
          ...newProfile.viewedContent[contentIndex],
          timestamp: Timestamp.now(),
          rating: activity.rating || newProfile.viewedContent[contentIndex].rating
        };
      } else {
        // Get content category
        try {
          let category = 'General';
          if (activity.contentType === 'article') {
            const articles = await firestoreService.getArticles(true);
            const article = articles.find(a => a.id === activity.contentId);
            category = article?.category || 'General';
          } else if (activity.contentType === 'video') {
            const videos = await firestoreService.getVideos(true);
            const video = videos.find(v => v.id === activity.contentId);
            category = video?.category || 'General';
          } else if (activity.contentType === 'faq') {
            const faqs = await firestoreService.getFAQs(true);
            const faq = faqs.find(f => f.id === activity.contentId);
            category = faq?.category || 'General';
          }

          newProfile.viewedContent.push({
            contentId: activity.contentId,
            contentType: activity.contentType,
            category,
            timestamp: Timestamp.now(),
            rating: activity.rating
          });

          // Keep only last 100 items
          if (newProfile.viewedContent.length > 100) {
            newProfile.viewedContent = newProfile.viewedContent.slice(-100);
          }

          // Update interests based on categories viewed
          if (!newProfile.interests.includes(category)) {
            newProfile.interests.push(category);
            // Keep only top 10 interests
            if (newProfile.interests.length > 10) {
              newProfile.interests = newProfile.interests.slice(-10);
            }
          }
        } catch (error) {
          console.error('Error updating interests:', error);
        }
      }

      await updateDoc(profileRef, newProfile);
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  }

  // Get personalized content recommendations
  async getRecommendations(context: RecommendationContext): Promise<any[]> {
    try {
      const profile = await this.getUserProfile(context.userId);
      if (!profile) return [];

      const recommendations: any[] = [];

      // Get content based on user interests
      if (profile.interests.length > 0) {
        // Get all published content
        const allArticles = await firestoreService.getArticles(true);
        const allVideos = await firestoreService.getVideos(true);
        const allFaqs = await firestoreService.getFAQs(true);
        
        for (const category of profile.interests.slice(0, 3)) { // Top 3 interests
          // Get articles from category
          const articles = allArticles.filter(article => article.category === category).slice(0, 3);
          recommendations.push(...articles.filter(article => 
            !profile.viewedContent.some(viewed => viewed.contentId === article.id)
          ));

          // Get videos from category
          const videos = allVideos.filter(video => video.category === category).slice(0, 2);
          recommendations.push(...videos.filter(video => 
            !profile.viewedContent.some(viewed => viewed.contentId === video.id)
          ));

          // Get FAQs from category
          const faqs = allFaqs.filter(faq => faq.category === category).slice(0, 2);
          recommendations.push(...faqs.filter(faq => 
            !profile.viewedContent.some(viewed => viewed.contentId === faq.id)
          ));
        }
      }

      // If user has preferences, adjust recommendations
      const filteredRecommendations = recommendations.filter(item => {
        // Remove duplicates
        const isDuplicate = recommendations.indexOf(item) !== recommendations.lastIndexOf(item);
        // Remove already viewed content
        const alreadyViewed = profile.viewedContent.some(viewed => viewed.contentId === item.id);
        
        return !isDuplicate && !alreadyViewed;
      });

      // Sort by relevance (this could be enhanced with ML algorithms)
      const sortedRecommendations = filteredRecommendations.sort((a, b) => {
        const aScore = this.calculateRelevanceScore(a, profile, context);
        const bScore = this.calculateRelevanceScore(b, profile, context);
        return bScore - aScore;
      });

      return sortedRecommendations.slice(0, 10); // Return top 10
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  // Calculate relevance score for content
  private calculateRelevanceScore(content: any, profile: UserProfile, context: RecommendationContext): number {
    let score = 0;

    // Base score for content type preference
    if (profile.preferences.learningStyle === 'visual' && content.contentType === 'video') {
      score += 10;
    } else if (profile.preferences.learningStyle === 'text' && content.contentType === 'article') {
      score += 10;
    } else if (profile.preferences.learningStyle === 'mixed') {
      score += 5;
    }

    // Interest category bonus
    if (profile.interests.includes(content.category)) {
      score += 15;
    }

    // Popular content bonus (could be enhanced with view counts)
    score += Math.random() * 5; // Placeholder for popularity score

    // Context-based scoring
    if (context.currentContent && context.currentContent.category === content.category) {
      score += 8; // Related content bonus
    }

    // Recency bonus (newer content gets slight preference)
    if (content.createdAt) {
      const daysSinceCreated = Math.floor((Date.now() - content.createdAt.toMillis()) / (1000 * 60 * 60 * 24));
      score += Math.max(0, 10 - daysSinceCreated); // Max 10 points for very recent content
    }

    return score;
  }

  // Get trending content across all users
  async getTrendingContent(limitCount = 10): Promise<any[]> {
    try {
      // This would typically use aggregated view data
      // For now, return recent high-quality content
      const allArticles = await firestoreService.getArticles(true);
      const allVideos = await firestoreService.getVideos(true);
      const allFaqs = await firestoreService.getFAQs(true);
      
      const allContent = [...allArticles, ...allVideos, ...allFaqs];
      
      return allContent
        .sort((a, b) => {
          // Sort by creation date (newest first) and then by views/ratings if available
          const dateA = a.createdAt ? a.createdAt.toMillis() : 0;
          const dateB = b.createdAt ? b.createdAt.toMillis() : 0;
          return dateB - dateA;
        })
        .slice(0, limitCount);
    } catch (error) {
      console.error('Error getting trending content:', error);
      return [];
    }
  }

  // Track session start
  async startSession(userId: string, sessionId: string): Promise<void> {
    await this.trackActivity({
      userId,
      contentType: 'article', // dummy content for session tracking
      contentId: 'session_start',
      action: 'view',
      sessionId
    });
  }

  // Track session end
  async endSession(userId: string, sessionId: string, totalDuration: number): Promise<void> {
    await this.trackActivity({
      userId,
      contentType: 'article', // dummy content for session tracking
      contentId: 'session_end',
      action: 'complete',
      sessionId,
      duration: totalDuration
    });
  }
}

export const userActivityService = new UserActivityService();