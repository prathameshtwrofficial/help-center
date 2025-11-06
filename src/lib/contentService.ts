import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';

export interface Article {
  id?: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  status: 'draft' | 'published';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  publishedAt?: Timestamp;
  views?: number;
  readTime?: string;
  keywords?: string[];
  seoDescription?: string;
}

export interface Video {
  id?: string;
  title: string;
  description: string;
  videoUrl?: string;
  url?: string; // For backward compatibility
  thumbnailUrl?: string;
  thumbnail?: string; // For backward compatibility
  category: string;
  tags?: string[];
  keywords?: string[];
  author?: string;
  status: 'draft' | 'published';
  duration?: string;
  views?: number;
  publishedAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FAQ {
  id?: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  author: string;
  status: 'draft' | 'published';
  order?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  helpful?: number; // Number of helpful votes
}

export interface Feedback {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'responded';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  // Article-related feedback fields
  articleId?: string;
  articleTitle?: string;
  articleType?: 'article' | 'video' | 'faq';
  rating: number;
  category: string;
}

export interface SupportTicket {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: 'technical' | 'billing' | 'account' | 'feature-request' | 'bug-report' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  description: string;
  attachments?: string[];
  assignedTo?: string;
  resolvedAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  responses?: TicketResponse[];
}

export interface TicketResponse {
  id?: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorType: 'user' | 'admin';
  message: string;
  createdAt?: Timestamp;
}

// Generic CRUD Operations
class ContentService<T extends { id?: string; status: 'draft' | 'published'; createdAt?: Timestamp; updatedAt?: Timestamp }> {
  private collection: string;

  constructor(collectionName: string) {
    this.collection = collectionName;
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collection), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  async getAll(limitCount: number = 50): Promise<T[]> {
    try {
      const q = query(
        collection(db, this.collection),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  }

  async getByStatus(status: 'draft' | 'published'): Promise<T[]> {
    try {
      const q = query(
        collection(db, this.collection),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error('Error fetching documents by status:', error);
      return [];
    }
  }

  async getById(id: string): Promise<T | null> {
    try {
      const docRef = doc(db, this.collection, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      console.error('Error fetching document:', error);
      return null;
    }
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    try {
      const docRef = doc(db, this.collection, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collection, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  async search(searchTerm: string, fields: string[]): Promise<T[]> {
    try {
      // Note: This is a basic search. For production, consider using Firestore indexes or Algolia
      const allDocs = await this.getAll(100);
      
      return allDocs.filter((doc: any) => {
        return fields.some(field => {
          const value = doc[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchTerm.toLowerCase());
          }
          return false;
        });
      });
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  }
}

// Feedback-specific service (doesn't use generic constraint)
class FeedbackService {
  private collection: string;

  constructor(collectionName: string) {
    this.collection = collectionName;
  }

  async create(data: Omit<Feedback, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collection), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating feedback:', error);
      throw error;
    }
  }

  async getAll(limitCount: number = 50): Promise<Feedback[]> {
    try {
      const q = query(
        collection(db, this.collection),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data()
      })) as Feedback[];
    } catch (error) {
      console.error('Error fetching feedback:', error);
      return [];
    }
  }

  async getByStatus(status: string): Promise<Feedback[]> {
    try {
      const q = query(
        collection(db, this.collection),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data()
      })) as Feedback[];
    } catch (error) {
      console.error('Error fetching feedback by status:', error);
      return [];
    }
  }

  async update(id: string, data: Partial<Feedback>): Promise<void> {
    try {
      const docRef = doc(db, this.collection, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating feedback:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collection, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting feedback:', error);
      throw error;
    }
  }
}

// Specific services for each content type
export const articleService = new ContentService<Article>('articles');
export const videoService = new ContentService<Video>('videos');
export const faqService = new ContentService<FAQ>('faqs');
export const feedbackService = new FeedbackService('feedback');

// Support Ticket Service
class SupportTicketService {
  async create(data: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'supportTickets'), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        responses: []
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw error;
    }
  }

  async getAll(limitCount: number = 50): Promise<SupportTicket[]> {
    try {
      const q = query(
        collection(db, 'supportTickets'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data()
      })) as SupportTicket[];
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      return [];
    }
  }

  async getByUser(userId: string): Promise<SupportTicket[]> {
    try {
      // SECURITY ENHANCEMENT: Additional validation and logging
      if (!userId || typeof userId !== 'string') {
        console.error('SECURITY: Invalid userId provided to getByUser:', userId);
        return [];
      }

      let tickets: SupportTicket[];
      
      // First try the indexed query with security validation
      try {
        const q = query(
          collection(db, 'supportTickets'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        tickets = querySnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
          id: doc.id,
          ...doc.data()
        })) as SupportTicket[];
      } catch (indexError: any) {
        // If composite index is missing, fall back to client-side filtering
        
        
        const allTicketsQuery = query(
          collection(db, 'supportTickets'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(allTicketsQuery);
        const allTickets = querySnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
          id: doc.id,
          ...doc.data()
        })) as SupportTicket[];
        
        // SECURITY: Filter on client side with additional validation
        tickets = allTickets.filter(ticket => {
          // Verify ticket belongs to the requesting user
          if (ticket.userId !== userId) {
            return false;
          }
          return true;
        });
      }

      // SECURITY: Final validation - ensure all tickets belong to the user
      const securityValidatedTickets = tickets.filter(ticket => {
        if (ticket.userId !== userId) {
          console.error('SECURITY: Critical validation failure - ticket belongs to different user', {
            ticketId: ticket.id,
            ticketUserId: ticket.userId,
            expectedUserId: userId
          });
          return false;
        }
        return true;
      });

      // Log for audit purposes
      if (securityValidatedTickets.length !== tickets.length) {
        console.warn('SECURITY: Filtered out invalid tickets during final validation');
      }

      
      return securityValidatedTickets;
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      return [];
    }
  }

  async getByStatus(status: string): Promise<SupportTicket[]> {
    try {
      // First try the indexed query
      try {
        const q = query(
          collection(db, 'supportTickets'),
          where('status', '==', status),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
          id: doc.id,
          ...doc.data()
        })) as SupportTicket[];
      } catch (indexError: any) {
        // If composite index is missing, fall back to client-side filtering
        
        
        const allTicketsQuery = query(
          collection(db, 'supportTickets'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(allTicketsQuery);
        const allTickets = querySnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
          id: doc.id,
          ...doc.data()
        })) as SupportTicket[];
        
        // Filter on client side
        return allTickets.filter(ticket => ticket.status === status);
      }
    } catch (error) {
      console.error('Error fetching tickets by status:', error);
      return [];
    }
  }

  async update(id: string, data: Partial<SupportTicket>): Promise<void> {
    try {
      const docRef = doc(db, 'supportTickets', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating support ticket:', error);
      throw error;
    }
  }

  async addResponse(ticketId: string, response: Omit<TicketResponse, 'id' | 'createdAt'>): Promise<void> {
    try {
      const ticketRef = doc(db, 'supportTickets', ticketId);
      const ticketSnap = await getDoc(ticketRef);
      
      if (ticketSnap.exists()) {
        const ticketData = ticketSnap.data() as SupportTicket;
        const responses = ticketData.responses || [];
        responses.push({
          ...response,
          createdAt: Timestamp.now()
        });
        
        await updateDoc(ticketRef, {
          responses,
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error('Error adding ticket response:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'supportTickets', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting support ticket:', error);
      throw error;
    }
  }
}

export const supportTicketService = new SupportTicketService();

// Statistics and analytics
export async function getContentStats() {
  try {
    const [articles, videos, faqs, feedback] = await Promise.all([
      articleService.getAll(),
      videoService.getAll(),
      faqService.getAll(),
      feedbackService.getAll()
    ]);

    const published = await Promise.all([
      articleService.getByStatus('published'),
      videoService.getByStatus('published'),
      faqService.getByStatus('published')
    ]);

    const draft = await Promise.all([
      articleService.getByStatus('draft'),
      videoService.getByStatus('draft'),
      faqService.getByStatus('draft')
    ]);

    const unreadFeedback = await feedbackService.getByStatus('new');

    return {
      total: {
        articles: articles.length,
        videos: videos.length,
        faqs: faqs.length,
        feedback: feedback.length
      },
      published: {
        articles: published[0].length,
        videos: published[1].length,
        faqs: published[2].length
      },
      draft: {
        articles: draft[0].length,
        videos: draft[1].length,
        faqs: draft[2].length
      },
      unreadFeedback: unreadFeedback.length
    };
  } catch (error) {
    console.error('Error fetching content stats:', error);
    return {
      total: { articles: 0, videos: 0, faqs: 0, feedback: 0 },
      published: { articles: 0, videos: 0, faqs: 0 },
      draft: { articles: 0, videos: 0, faqs: 0 },
      unreadFeedback: 0
    };
  }
}