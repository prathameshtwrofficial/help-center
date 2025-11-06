import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "firebase/auth";
import { firestoreService, Article, Video, FAQ, Feedback } from "@/lib/firestore";
import { authService, UserProfile } from "@/lib/auth";

// Re-export types from firestore
export type { Article, Video, FAQ, Feedback } from "@/lib/firestore";

interface AppContextType {
  // User state
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;

  // Data
  articles: Article[];
  videos: Video[];
  faqs: FAQ[];
  feedbacks: Feedback[];

  // Auth methods
  loginUser: (email: string, password: string) => Promise<void>;
  registerUser: (email: string, password: string, displayName: string) => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  // Data refresh methods
  refreshArticles: () => Promise<void>;
  refreshVideos: () => Promise<void>;
  refreshFAQs: () => Promise<void>;
  refreshFeedback: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Computed state
  const isAdmin = userProfile?.role === 'admin';

  // Data state
  const [articles, setArticles] = useState<Article[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [faqs, setFAQs] = useState<FAQ[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  // Auth methods
  const loginUser = async (email: string, password: string) => {
    try {
      const { user, profile } = await authService.loginUser(email, password);
      setUser(user);
      setUserProfile(profile);
    } catch (error) {
      throw error;
    }
  };

  const registerUser = async (email: string, password: string, displayName: string) => {
    try {
      const { user, profile } = await authService.registerUser(email, password, displayName);
      setUser(user);
      setUserProfile(profile);
    } catch (error) {
      throw error;
    }
  };

  const loginAdmin = async (email: string, password: string) => {
    try {
      const { user, profile } = await authService.loginAdmin(email, password);
      setUser(user);
      setUserProfile(profile);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      throw error;
    }
  };

  // Data fetching methods
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Always fetch data - even for non-authenticated users
      const isAdminUser = userProfile?.role === 'admin';
      const [articlesData, videosData, faqsData, feedbackData] = await Promise.all([
        firestoreService.getArticles(!isAdminUser),
        firestoreService.getVideos(!isAdminUser),
        firestoreService.getFAQs(!isAdminUser),
        userProfile ? firestoreService.getFeedback() : Promise.resolve([])
      ]);
      
      setArticles(articlesData);
      setVideos(videosData);
      setFAQs(faqsData);
      setFeedbacks(feedbackData);
    } catch (error) {
      // Set empty arrays if fetch fails
      setArticles([]);
      setVideos([]);
      setFAQs([]);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshArticles = async () => {
    try {
      const articlesData = await firestoreService.getArticles(userProfile?.role === 'admin' ? false : true);
      setArticles(articlesData);
    } catch (error) {
      // Silent error handling for refresh operations
    }
  };

  const refreshVideos = async () => {
    try {
      const videosData = await firestoreService.getVideos(userProfile?.role === 'admin' ? false : true);
      setVideos(videosData);
    } catch (error) {
      // Silent error handling for refresh operations
    }
  };

  const refreshFAQs = async () => {
    try {
      const faqsData = await firestoreService.getFAQs(userProfile?.role === 'admin' ? false : true);
      setFAQs(faqsData);
    } catch (error) {
      // Silent error handling for refresh operations
    }
  };

  const refreshFeedback = async () => {
    try {
      const feedbackData = await firestoreService.getFeedback();
      setFeedbacks(feedbackData);
    } catch (error) {
      // Silent error handling for refresh operations
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user, profile) => {
      setUser(user);
      setUserProfile(profile);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch data when user profile changes or on initial load
  useEffect(() => {
    if (!loading) {
      fetchData();
    }
  }, [userProfile]);

  // Initial data fetch for non-authenticated users
  useEffect(() => {
    if (!loading && !user) {
      fetchData();
    }
  }, [loading, user]);

  return (
    <AppContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAdmin,
        articles,
        videos,
        faqs,
        feedbacks,
        loginUser,
        registerUser,
        loginAdmin,
        logout,
        refreshArticles,
        refreshVideos,
        refreshFAQs,
        refreshFeedback,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
