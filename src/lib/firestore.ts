import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";

// Types
export interface Article {
  id?: string;
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  author: string;
  tags?: string[];
  keywords?: string[];
  status: 'draft' | 'published' | 'scheduled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
  scheduledAt?: Timestamp; // For scheduled publication
  views?: number;
  readTime?: string;
  userViews?: string[]; // Array of user IDs who have viewed this article
}

export interface FAQ {
  id?: string;
  question: string;
  answer: string;
  category: string;
  tags?: string[];
  status: 'draft' | 'published';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
  author?: string;
  views?: number;
}

export interface Video {
  id?: string;
  title: string;
  description: string;
  url: string;
  videoUrl?: string; // Alias for URL (for backward compatibility)
  thumbnail?: string;
  thumbnailUrl?: string; // Alias for thumbnail (for backward compatibility)
  category: string;
  duration?: string;
  tags?: string[];
  keywords?: string[];
  author?: string;
  status: 'draft' | 'published';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
  views?: number;
}

export interface Feedback {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'responded';
  category?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ContentFeedback {
  id?: string;
  contentType: 'article' | 'video' | 'faq';
  contentId: string;
  userId: string;
  helpful: boolean;
  rating?: number; // 1-5 stars
  comment?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

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

// Learning progress tracking
export interface UserProgress {
  id?: string;
  userId: string;
  contentType: 'article' | 'video' | 'faq';
  contentId: string;
  completed: boolean;
  timeSpent: number; // in seconds
  progress: number; // 0-100 percentage
  lastAccessed: Timestamp;
  createdAt: Timestamp;
}

export interface Notification {
  id?: string;
  userId: string; // Who receives the notification
  type: 'admin_reply' | 'mention' | 'comment_like' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  relatedCommentId?: string; // ID of the comment that triggered this notification
  relatedContentId?: string; // ID of the content (article/video/faq)
  relatedContentType?: 'article' | 'video' | 'faq';
  adminId?: string; // ID of admin who replied
  adminName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Comment system interfaces
export interface Comment {
  id?: string;
  contentType: 'article' | 'video' | 'faq';
  contentId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  message: string;
  parentId?: string; // For replies
  mentions?: string[]; // User IDs mentioned in the comment
  likes: number;
  likedBy: string[]; // User IDs who liked this comment
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  replies?: Comment[];
}

// Firestore service
export const firestoreService = {
  // Articles
  async createArticle(article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, "articles"), {
        ...article,
        createdAt: now,
        updatedAt: now,
        views: 0, // Always start with 0 views
        userViews: [] // Initialize empty userViews array
      });
      
      return docRef.id;
    } catch (error) {
      console.error("Error creating article:", error);
      throw new Error("Failed to create article");
    }
  },

  async getArticles(publishedOnly = false) {
    try {
      
      let q;
      
      if (publishedOnly) {
        q = query(
          collection(db, "articles"),
          where("status", "==", "published")
        );
      } else {
        q = query(collection(db, "articles"));
      }
      
      const querySnapshot = await getDocs(q);
      const articles = querySnapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return { 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now()
        } as Article;
      });
      
      // Sort by createdAt descending
      articles.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : Date.now();
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : Date.now();
        return dateB - dateA;
      });
      
      
      return articles;
    } catch (error) {
      console.error("Error fetching articles:", error);
      throw new Error("Failed to fetch articles");
    }
  },

  async getArticle(id: string) {
    try {
      const docRef = doc(db, "articles", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now()
        } as Article;
      }
      return null;
    } catch (error) {
      console.error("Error fetching article:", error);
      throw new Error("Failed to fetch article");
    }
  },

  async getVideo(id: string) {
    try {
      const docRef = doc(db, "videos", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now()
        } as Video;
      }
      return null;
    } catch (error) {
      console.error("Error fetching video:", error);
      throw new Error("Failed to fetch video");
    }
  },

  async getFAQ(id: string) {
    try {
      const docRef = doc(db, "faqs", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now()
        } as FAQ;
      }
      return null;
    } catch (error) {
      console.error("Error fetching FAQ:", error);
      throw new Error("Failed to fetch FAQ");
    }
  },

  async updateArticle(id: string, updates: Partial<Article>) {
    try {
      const docRef = doc(db, "articles", id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error("Error updating article:", error);
      throw new Error("Failed to update article");
    }
  },

  async deleteArticle(id: string) {
    try {
      await deleteDoc(doc(db, "articles", id));
    } catch (error) {
      console.error("Error deleting article:", error);
      throw new Error("Failed to delete article");
    }
  },

  // FAQs
  async createFAQ(faq: Omit<FAQ, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, "faqs"), {
        ...faq,
        createdAt: now,
        updatedAt: now
      });
      
      return docRef.id;
    } catch (error) {
      console.error("Error creating FAQ:", error);
      throw new Error("Failed to create FAQ");
    }
  },

  async getFAQs(publishedOnly = false) {
    try {
      
      let q;
      
      if (publishedOnly) {
        q = query(
          collection(db, "faqs"),
          where("status", "==", "published")
        );
      } else {
        q = query(collection(db, "faqs"));
      }
      
      const querySnapshot = await getDocs(q);
      const faqs = querySnapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return { 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now()
        } as FAQ;
      });
      
      // Sort by createdAt descending
      faqs.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : Date.now();
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : Date.now();
        return dateB - dateA;
      });
      
      
      return faqs;
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      throw new Error("Failed to fetch FAQs");
    }
  },

  async updateFAQ(id: string, updates: Partial<FAQ>) {
    try {
      const docRef = doc(db, "faqs", id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error("Error updating FAQ:", error);
      throw new Error("Failed to update FAQ");
    }
  },

  async deleteFAQ(id: string) {
    try {
      await deleteDoc(doc(db, "faqs", id));
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      throw new Error("Failed to delete FAQ");
    }
  },

  // Videos
  async createVideo(video: Omit<Video, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, "videos"), {
        ...video,
        createdAt: now,
        updatedAt: now
      });
      
      return docRef.id;
    } catch (error) {
      console.error("Error creating video:", error);
      throw new Error("Failed to create video");
    }
  },

  async getVideos(publishedOnly = false) {
    try {
      
      let q;
      
      if (publishedOnly) {
        q = query(
          collection(db, "videos"),
          where("status", "==", "published")
        );
      } else {
        q = query(collection(db, "videos"));
      }
      
      const querySnapshot = await getDocs(q);
      const videos = querySnapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return { 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now()
        } as Video;
      });
      
      // Sort by createdAt descending
      videos.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : Date.now();
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : Date.now();
        return dateB - dateA;
      });
      
      
      return videos;
    } catch (error) {
      console.error("Error fetching videos:", error);
      throw new Error("Failed to fetch videos");
    }
  },

  async updateVideo(id: string, updates: Partial<Video>) {
    try {
      const docRef = doc(db, "videos", id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error("Error updating video:", error);
      throw new Error("Failed to update video");
    }
  },

  async deleteVideo(id: string) {
    try {
      await deleteDoc(doc(db, "videos", id));
    } catch (error) {
      console.error("Error deleting video:", error);
      throw new Error("Failed to delete video");
    }
  },

  // Feedback
  async createFeedback(feedback: Omit<Feedback, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, "feedback"), {
        ...feedback,
        createdAt: now,
        updatedAt: now
      });
      
      return docRef.id;
    } catch (error) {
      console.error("Error creating feedback:", error);
      throw new Error("Failed to submit feedback");
    }
  },

  async getFeedback() {
    try {
      const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const feedback = querySnapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return { 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now()
        } as Feedback;
      });
      return feedback;
    } catch (error) {
      console.error("Error fetching feedback:", error);
      throw new Error("Failed to fetch feedback");
    }
  },

  async updateFeedbackStatus(id: string, status: Feedback['status']) {
    try {
      const docRef = doc(db, "feedback", id);
      await updateDoc(docRef, {
        status,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error("Error updating feedback status:", error);
      throw new Error("Failed to update feedback status");
    }
  },

  async deleteFeedback(id: string) {
    try {
      await deleteDoc(doc(db, "feedback", id));
      
    } catch (error) {
      console.error("Error deleting feedback:", error);
      throw new Error("Failed to delete feedback");
    }
  },

  // Content Feedback (for ratings and helpfulness)
  async createContentFeedback(feedback: Omit<ContentFeedback, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, "contentFeedback"), {
        ...feedback,
        createdAt: now,
        updatedAt: now
      });
      
      // If there's a comment, also create a comment entry
      if (feedback.comment && feedback.comment.trim()) {
        try {
          await this.createComment({
            contentType: feedback.contentType,
            contentId: feedback.contentId,
            userId: feedback.userId,
            userName: "", // Will be filled by comment system
            userEmail: "",
            userAvatar: "",
            message: feedback.comment,
            mentions: [],
            likes: 0,
            likedBy: [],
            isEdited: false,
            isDeleted: false,
            parentId: null
          });
        } catch (commentError) {
          console.error("Error creating comment from feedback:", commentError);
          // Don't fail the entire operation if comment creation fails
        }
      }
      
      
      return docRef.id;
    } catch (error) {
      console.error("Error creating content feedback:", error);
      throw new Error("Failed to submit content feedback");
    }
  },

  async getContentFeedback(contentType: string, contentId: string) {
    try {
      const q = query(
        collection(db, "contentFeedback"),
        where("contentType", "==", contentType),
        where("contentId", "==", contentId)
      );
      const querySnapshot = await getDocs(q);
      const feedback = querySnapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now()
        } as ContentFeedback;
      });
      return feedback;
    } catch (error) {
      console.error("Error fetching content feedback:", error);
      throw new Error("Failed to fetch content feedback");
    }
  },

  async deleteContentFeedback(id: string) {
    try {
      await deleteDoc(doc(db, "contentFeedback", id));
    } catch (error) {
      console.error("Error deleting content feedback:", error);
      throw new Error("Failed to delete content feedback");
    }
  },

  async getAllContentFeedback() {
    try {
      const q = query(collection(db, "contentFeedback"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const feedback = querySnapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now()
        } as ContentFeedback;
      });
      return feedback;
    } catch (error) {
      console.error("Error fetching all content feedback:", error);
      throw new Error("Failed to fetch content feedback");
    }
  },

  async updateContentFeedback(id: string, updates: Partial<ContentFeedback>) {
    try {
      const docRef = doc(db, "contentFeedback", id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error("Error updating content feedback:", error);
      throw new Error("Failed to update content feedback");
    }
  },

  async upsertContentFeedback(feedback: Omit<ContentFeedback, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      // Check if user already has feedback for this content
      const existingFeedback = await this.getContentFeedback(feedback.contentType, feedback.contentId);
      const userFeedback = existingFeedback.find(f => f.userId === feedback.userId);
      
      if (userFeedback) {
        // Update existing feedback
        await this.updateContentFeedback(userFeedback.id!, {
          helpful: feedback.helpful,
          rating: feedback.rating,
          comment: feedback.comment
        });
        return userFeedback.id!;
      } else {
        // Create new feedback
        return await this.createContentFeedback(feedback);
      }
    } catch (error) {
      console.error("Error upserting content feedback:", error);
      throw new Error("Failed to upsert content feedback");
    }
  },

  // View tracking
  async trackArticleView(articleId: string, userId: string) {
    try {
      const docRef = doc(db, "articles", articleId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const articleData = docSnap.data() as Article;
        const userViews = articleData.userViews || [];
        
        // Only increment views if user hasn't viewed this article before
        if (!userViews.includes(userId)) {
          const updatedUserViews = [...userViews, userId];
          await updateDoc(docRef, {
            userViews: updatedUserViews,
            views: updatedUserViews.length,
            updatedAt: Timestamp.now()
          });
        }
      }
    } catch (error) {
      console.error("Error tracking article view:", error);
      // Don't throw error to avoid disrupting user experience
    }
  },

  // Reset all article views to 0 (admin only)
  async resetAllArticleViews() {
    try {
      
      const querySnapshot = await getDocs(collection(db, "articles"));
      let resetCount = 0;
      
      for (const articleDoc of querySnapshot.docs) {
        const articleRef = doc(db, "articles", articleDoc.id);
        await updateDoc(articleRef, {
          views: 0,
          userViews: []
        });
        resetCount++;
        
      }
      
      
      return resetCount;
    } catch (error) {
      console.error("❌ Error resetting article views:", error);
      throw error;
    }
  },

  // Comments system
  async createComment(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, "comments"), {
        ...comment,
        likes: 0,
        likedBy: [],
        isEdited: false,
        isDeleted: false,
        createdAt: now,
        updatedAt: now
      });
      
      return docRef.id;
    } catch (error) {
      console.error("Error creating comment:", error);
      throw new Error("Failed to create comment");
    }
  },

  async getComments(contentType: string, contentId: string) {
    try {
      // First get comments with basic filter
      const q = query(
        collection(db, "comments"),
        where("contentType", "==", contentType),
        where("contentId", "==", contentId)
      );
      const querySnapshot = await getDocs(q);
      let comments = querySnapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now()
        } as Comment;
      });
      
      // Filter out deleted comments and sort by createdAt
      comments = comments
        .filter(comment => !comment.isDeleted)
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : Date.now();
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : Date.now();
          return dateA - dateB; // Ascending order for comments
        });
      
      // Build comment tree with replies
      const commentMap = new Map();
      comments.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });
      
      const rootComments: Comment[] = [];
      comments.forEach(comment => {
        if (comment.parentId) {
          const parent = commentMap.get(comment.parentId);
          if (parent) {
            parent.replies.push(commentMap.get(comment.id));
          }
        } else {
          rootComments.push(commentMap.get(comment.id));
        }
      });
      
      return rootComments;
    } catch (error) {
      console.error("Error fetching comments:", error);
      throw new Error("Failed to fetch comments");
    }
  },

  async updateComment(id: string, updates: Partial<Comment>) {
    try {
      const docRef = doc(db, "comments", id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error("Error updating comment:", error);
      throw new Error("Failed to update comment");
    }
  },

  async likeComment(id: string, userId: string) {
    try {
      const docRef = doc(db, "comments", id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const commentData = docSnap.data() as Comment;
        const likedBy = commentData.likedBy || [];
        
        if (likedBy.includes(userId)) {
          // Unlike
          await updateDoc(docRef, {
            likedBy: likedBy.filter(id => id !== userId),
            likes: Math.max(0, (commentData.likes || 0) - 1),
            updatedAt: Timestamp.now()
          });
        } else {
          // Like
          await updateDoc(docRef, {
            likedBy: [...likedBy, userId],
            likes: (commentData.likes || 0) + 1,
            updatedAt: Timestamp.now()
          });
        }
      }
    } catch (error) {
      console.error("Error liking comment:", error);
      throw new Error("Failed to like comment");
    }
  },

  async deleteComment(id: string) {
    try {
      const docRef = doc(db, "comments", id);
      await updateDoc(docRef, {
        isDeleted: true,
        message: "[Comment deleted]",
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw new Error("Failed to delete comment");
    }
  },

  async getAllComments() {
    try {
      const q = query(collection(db, "comments"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const comments = querySnapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now()
        } as Comment;
      });
      return comments;
    } catch (error) {
      console.error("Error fetching all comments:", error);
      throw new Error("Failed to fetch comments");
    }
  },

  async getUserProfile(userId: string) {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  },

  // Notification methods
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, "notifications"), {
        ...notification,
        createdAt: now,
        updatedAt: now
      });
      
      return docRef.id;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw new Error("Failed to create notification");
    }
  },

  async getUserNotifications(userId: string, limitCount = 20) {
    try {
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      const notifications = querySnapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now()
        } as Notification;
      });
      return notifications;
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      throw new Error("Failed to fetch notifications");
    }
  },

  async markNotificationAsRead(notificationId: string) {
    try {
      const docRef = doc(db, "notifications", notificationId);
      await updateDoc(docRef, {
        isRead: true,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw new Error("Failed to mark notification as read");
    }
  },

  async markAllNotificationsAsRead(userId: string) {
    try {
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        where("isRead", "==", false)
      );
      const querySnapshot = await getDocs(q);
      
      const updatePromises = querySnapshot.docs.map((doc) => {
        return updateDoc(doc.ref, {
          isRead: true,
          updatedAt: Timestamp.now()
        });
      });
      
      await Promise.all(updatePromises);
      
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw new Error("Failed to mark all notifications as read");
    }
  },

  async getUnreadNotificationCount(userId: string) {
    try {
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        where("isRead", "==", false)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error("Error getting unread notification count:", error);
      return 0;
    }
  },

  async deleteNotification(notificationId: string) {
    try {
      await deleteDoc(doc(db, "notifications", notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw new Error("Failed to delete notification");
    }
  }
};