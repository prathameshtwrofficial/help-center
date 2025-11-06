import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar, User, Clock, ArrowRight, BookOpen, ArrowLeft } from "lucide-react";
import { articleService, Article } from "@/lib/contentService";
import { PageLoader } from "@/components/common/PageLoader";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Articles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>(["All"]);

  // Real-time listener for published articles
  const loadPublishedArticles = useCallback(() => {
    try {
      // Only get published articles for public view
      const publishedQuery = query(
        collection(db, "articles"),
        where("status", "==", "published"),
        limit(100)
      );

      const unsubscribe = onSnapshot(publishedQuery,
        (snapshot) => {
          const allArticles: Article[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            allArticles.push({
              id: doc.id,
              title: data.title || '',
              excerpt: data.excerpt || '',
              content: data.content || '',
              author: data.author || 'Unknown',
              category: data.category || 'General',
              tags: data.tags || [],
              status: data.status || 'draft',
              createdAt: data.createdAt || null,
              updatedAt: data.updatedAt || null,
              views: data.views || 0,
              publishedAt: data.publishedAt || null,
              readTime: data.readTime || '',
              keywords: data.keywords || [],
              seoDescription: data.seoDescription || ''
            });
          });

          // Sort by publishedAt date (newest first)
          allArticles.sort((a, b) => {
            const dateA = a.publishedAt || a.createdAt;
            const dateB = b.publishedAt || b.createdAt;
            
            if (dateA && dateB) {
              const timeA = dateA.toDate ? dateA.toDate().getTime() : (dateA as any);
              const timeB = dateB.toDate ? dateB.toDate().getTime() : (dateB as any);
              return (timeB as number) - (timeA as number); // Newest first
            } else if (dateA && !dateB) {
              return -1;
            } else if (!dateA && dateB) {
              return 1;
            }
            return 0;
          });

          setArticles(allArticles);
          setLoading(false);

          // Extract unique categories
          const uniqueCategories = Array.from(new Set(allArticles.map(article => article.category)));
          setCategories(["All", ...uniqueCategories]);
        },
        (error) => {
          console.error('Error listening to published articles:', error);
          setArticles([]);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up published articles listener:', error);
      setArticles([]);
      setLoading(false);
      return () => {};
    }
  }, []);

  useEffect(() => {
    const unsubscribe = loadPublishedArticles();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadPublishedArticles]);

  useEffect(() => {
    filterArticles();
  }, [articles, searchTerm, selectedCategory]);

  const filterArticles = () => {
    let filtered = articles;

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchLower) ||
        article.excerpt.toLowerCase().includes(searchLower) ||
        article.content.toLowerCase().includes(searchLower) ||
        article.keywords?.some(keyword => keyword.toLowerCase().includes(searchLower)) ||
        article.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    setFilteredArticles(filtered);
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

  // Show loading state
  if (loading) {
    return <PageLoader text="Loading articles..." fullScreen={true} />;
  }

  // Featured articles are those with "featured" tag or first few articles
  const featuredArticles = articles.filter(article =>
    article.tags?.includes('featured') || article.tags?.includes('Featured')
  ).slice(0, 2);
  const regularArticles = filteredArticles.filter(article =>
    !featuredArticles.includes(article)
  );

  // Show empty state
  if (articles.length === 0) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-foreground mb-2">No articles available</h3>
            <p className="text-muted-foreground">Check back later for helpful articles and guides.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            to="/"
            className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium gap-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 font-medium mb-6">
            <BookOpen className="w-4 h-4 mr-2" />
            Knowledge Base Articles
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Articles & Guides
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive articles, guides, and tutorials to help you master our platform
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-12">
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg border border-input bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 border-gray-200'
                }`}
                style={selectedCategory === category ? { backgroundColor: '#10b981', color: 'white' } : {}}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Featured Articles</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featuredArticles.map((article) => (
                <article
                  key={article.id}
                  className="group bg-card border border-border rounded-2xl p-6 hover:shadow-medium transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-block px-3 py-1 bg-emerald-500 text-white rounded-full text-sm font-medium">
                      {article.category}
                    </span>
                    <span className="text-sm text-muted-foreground">{article.readTime}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-emerald-500 transition-colors">
                    {article.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {article.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="w-4 h-4 mr-1" />
                      {article.author}
                      <Calendar className="w-4 h-4 ml-3 mr-1" />
                      {formatDate(article.publishedAt || article.createdAt)}
                    </div>
                    
                    <Link 
                      to={`/article/${article.id}`}
                      className="inline-flex items-center text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
                    >
                      Read more
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Regular Articles */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {selectedCategory === "All" ? "All Articles" : `${selectedCategory} Articles`}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'})
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularArticles.map((article) => (
              <article
                key={article.id}
                className="group bg-card border border-border rounded-xl p-5 hover:shadow-soft transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-block px-2 py-1 bg-indigo-500 text-white rounded-full text-xs font-medium">
                    {article.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{article.readTime}</span>
                </div>
                
                <h3 className="text-lg font-semibold text-foreground mb-3 group-hover:text-emerald-500 transition-colors line-clamp-2">
                  {article.title}
                </h3>
                
                <p className="text-muted-foreground mb-4 text-sm leading-relaxed line-clamp-3">
                  {article.excerpt}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDate(article.publishedAt || article.createdAt)}
                  </div>
                  
                  <Link 
                    to={`/article/${article.id}`}
                    className="text-sm text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
                  >
                    Read
                  </Link>
                </div>
              </article>
            ))}
          </div>
          
          {filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No articles found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}