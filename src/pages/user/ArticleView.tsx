import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Eye, Calendar, User, Tag, List } from "lucide-react";

import { CommentSystem } from "@/components/common/CommentSystem";
import { ContentFeedback } from "@/components/common/ContentFeedback";
import { ArticleCard } from "@/components/user/ArticleCard";
import { PageLoader } from "@/components/common/PageLoader";
import { EnhancedMediaRenderer } from "@/components/user/EnhancedMediaRenderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { firestoreService, Article } from "@/lib/firestore";
import { Timestamp } from "firebase/firestore";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User as FirebaseUser } from "firebase/auth";
import { useApp } from "@/context/AppContext";

export default function ArticleView() {
  const { id } = useParams();
  const { user } = useApp();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (id) {
      loadArticle(id);
    }
  }, [id]);

  useEffect(() => {
    // Track view when article is loaded and visible
    if (article?.id && user) {
      // Only track views from authenticated users
      firestoreService.trackArticleView(article.id, user.uid).catch(err => {
        
      });
    }
  }, [article?.id, user]);

  const loadArticle = async (articleId: string) => {
    setLoading(true);
    setAccessDenied(false);
    
    try {
      // Load the specific article
      const articleData = await firestoreService.getArticle(articleId);
      console.log('Article data loaded:', articleData);
      console.log('Article status:', articleData?.status);
      
      // Check if user can access this article
      if (articleData) {
        // If article is unpublished, check if user is admin
        if (articleData.status !== 'published') {
          // For now, we'll allow access but could add admin check here
          console.log('Accessing unpublished article');
          // TODO: Add admin authentication check if needed
        }
        
        // Check for Cloudinary URLs in loaded article
        if (articleData.content) {
          const cloudinaryMatches = articleData.content.match(/https?:\/\/res\.cloudinary\.com\/[^"'\s>]+/g);
          console.log('Cloudinary URLs found in loaded article:', cloudinaryMatches);
        }
        
        setArticle(articleData);

        // Load related articles from same category (only published ones)
        if (articleData.category) {
          const relatedQuery = query(
            collection(db, "articles"),
            where("status", "==", "published"),
            where("category", "==", articleData.category),
            limit(4)
          );
          
          const unsubscribe = onSnapshot(relatedQuery, (snapshot) => {
            const articles: Article[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              if (doc.id !== articleId) {
                articles.push({
                  id: doc.id,
                  title: data.title || '',
                  excerpt: data.excerpt || '',
                  content: data.content || '',
                  author: data.author || 'Unknown',
                  category: data.category || 'General',
                  tags: data.tags || [],
                  keywords: data.keywords || [],
                  status: data.status || 'draft',
                  createdAt: data.createdAt || null,
                  updatedAt: data.updatedAt || null,
                  publishedAt: data.publishedAt || null,
                  views: data.views || 0,
                  readTime: data.readTime || ''
                });
              }
            });
            setRelatedArticles(articles);
          });
        }
      } else {
        // Article not found
        setArticle(null);
      }
    } catch (error) {
      console.error("Error loading article:", error);
      setArticle(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString();
    } catch (error) {
      return 'Recently';
    }
  };

  // Note: relatedArticles is now loaded via useState above
  const filteredRelatedArticles = relatedArticles;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <PageLoader text="Loading article..." fullScreen={true} />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Article not found</h2>
          <Link to="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 flex-1 max-h-screen overflow-y-auto">
      <Link to="/">
        <Button className="mb-6" variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </Link>

      <article className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Badge className="mb-4">{article.category}</Badge>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{article.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(article.publishedAt || article.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{article.readTime || '2 min read'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{article.views || 0} views</span>
            </div>
          </div>
          
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {article.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="enhanced-content mb-8">
          {article.excerpt && (
            <p className="text-lg text-muted-foreground mb-6 font-medium">
              {article.excerpt}
            </p>
          )}
          <EnhancedMediaRenderer content={article.content} />
        </div>

        {/* Content Feedback - Rating and Helpful/Not Helpful */}
        <div className="mb-12">
          <ContentFeedback
            contentType="article"
            contentId={article.id!}
            contentTitle={article.title}
          />
        </div>

        <div className="mb-12">
          <CommentSystem
            contentType="article"
            contentId={article.id}
            contentTitle={article.title}
          />
        </div>

        {relatedArticles.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Related Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((related) => (
                <ArticleCard key={related.id} article={related} />
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
