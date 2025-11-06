import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Edit, Trash2, Eye, Calendar, User, Loader2, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { PageLoader } from "@/components/common/PageLoader";
import { firestoreService, Article } from "@/lib/firestore";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";

export default function ManageArticles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    totalViews: 0
  });

  // Real-time articles listener with enhanced error handling
  const loadArticles = useCallback(() => {
    let timeoutId: NodeJS.Timeout;
    let retryCount = 0;
    const maxRetries = 3;
    
    const setupListener = () => {
      try {
        console.log('Setting up articles listener...');
        
        // Simple collection reference without complex queries to avoid index issues
        const articlesRef = collection(db, "articles");
        
        const unsubscribe = onSnapshot(
          articlesRef,
          (snapshot) => {
            console.log(`✅ Articles snapshot received: ${snapshot.size} documents`);
            const allArticles: Article[] = [];
            
            snapshot.forEach((doc) => {
              const data = doc.data();
              try {
                const article: Article = {
                  id: doc.id,
                  title: data.title || '',
                  content: data.content || '',
                  excerpt: data.excerpt || '',
                  author: data.author || 'Unknown',
                  category: data.category || 'General',
                  tags: data.tags || [],
                  keywords: data.keywords || [],
                  status: data.status || 'draft',
                  createdAt: data.createdAt || Timestamp.now(),
                  updatedAt: data.updatedAt || Timestamp.now(),
                  publishedAt: data.publishedAt || null,
                  views: data.views || 0,
                  readTime: data.readTime || '',
                  userViews: data.userViews || []
                };
                allArticles.push(article);
              } catch (docError) {
                console.warn('⚠️  Error processing document:', doc.id, docError);
              }
            });
            
            // Sort by createdAt timestamp (newest first)
            allArticles.sort((a, b) => {
              const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : Date.now();
              const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : Date.now();
              return timeB - timeA;
            });
            
            setArticles(allArticles);
            setLoading(false);
            
            // Update stats
            const publishedCount = allArticles.filter(article => article.status === 'published').length;
            const draftCount = allArticles.filter(article => article.status === 'draft').length;
            const totalViews = allArticles.reduce((sum, article) => sum + (article.views || 0), 0);
            
            setStats({
              total: allArticles.length,
              published: publishedCount,
              draft: draftCount,
              totalViews: totalViews
            });
            
            console.log(`✅ Successfully processed ${allArticles.length} articles`);
          },
          (error) => {
            console.error('❌ Firestore listener error:', error);
            retryCount++;
            
            // Handle different error types
            if (error.code === 'permission-denied') {
              console.warn('🔒 Permission denied - checking Firestore security rules');
              toast({
                title: "Permission Error",
                description: "Unable to access articles. Please check your Firestore security rules.",
                variant: "destructive",
              });
            } else if (error.code === 'unavailable') {
              console.warn('🔄 Service unavailable - will retry');
              if (retryCount <= maxRetries) {
                toast({
                  title: "Connection Issue",
                  description: `Retrying... (${retryCount}/${maxRetries})`,
                  variant: "default",
                });
                setTimeout(setupListener, 2000 * retryCount);
                return;
              }
              toast({
                title: "Connection Failed",
                description: "Unable to connect to database after multiple attempts.",
                variant: "destructive",
              });
            } else if (error.code === 'failed-precondition') {
              console.warn('📋 Index missing - setting up basic listener');
              // For missing indices, try a basic collection read
              basicCollectionRead();
              return;
            } else {
              console.error('❌ Unexpected Firestore error:', error);
              toast({
                title: "Database Error",
                description: "An unexpected error occurred. Please refresh the page.",
                variant: "destructive",
              });
            }
            
            setArticles([]);
            setLoading(false);
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error('❌ Error in loadArticles:', error);
        setLoading(false);
        return () => {};
      }
    };

    const basicCollectionRead = async () => {
      try {
        console.log('🔄 Attempting basic collection read...');
        const { getDocs } = await import('firebase/firestore');
        const articlesQuery = query(collection(db, "articles"));
        const querySnapshot = await getDocs(articlesQuery);
        
        const allArticles: Article[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          allArticles.push({
            id: doc.id,
            title: data.title || '',
            content: data.content || '',
            excerpt: data.excerpt || '',
            author: data.author || 'Unknown',
            category: data.category || 'General',
            tags: data.tags || [],
            keywords: data.keywords || [],
            status: data.status || 'draft',
            createdAt: data.createdAt || Timestamp.now(),
            updatedAt: data.updatedAt || Timestamp.now(),
            publishedAt: data.publishedAt || null,
            views: data.views || 0,
            readTime: data.readTime || '',
            userViews: data.userViews || []
          });
        });
        
        console.log(`✅ Basic read successful: ${allArticles.length} articles`);
        setArticles(allArticles);
        setLoading(false);
        
        // Update stats
        const publishedCount = allArticles.filter(article => article.status === 'published').length;
        const draftCount = allArticles.filter(article => article.status === 'draft').length;
        const totalViews = allArticles.reduce((sum, article) => sum + (article.views || 0), 0);
        
        setStats({
          total: allArticles.length,
          published: publishedCount,
          draft: draftCount,
          totalViews: totalViews
        });
      } catch (error) {
        console.error('❌ Basic collection read failed:', error);
        setArticles([]);
        setLoading(false);
        
        if ((error as any).code === 'permission-denied') {
          toast({
            title: "Access Denied",
            description: "Please check your Firebase configuration and security rules.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Failed to Load",
            description: "Unable to load articles. Please check your database connection.",
            variant: "destructive",
          });
        }
      }
    };

    // Set up timeout for initial loading
    timeoutId = setTimeout(() => {
      console.warn('⏰ Loading timeout - switching to basic read');
      basicCollectionRead();
    }, 10000); // 10 second timeout

    const unsubscribe = setupListener();
    
    // Cleanup function
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = loadArticles();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadArticles]);

  useEffect(() => {
    filterArticles();
  }, [articles, searchTerm, selectedStatus]);

  const filterArticles = () => {
    let filtered = articles;

    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus !== "All") {
      const status = selectedStatus.toLowerCase();
      if (status === 'published') {
        filtered = filtered.filter(article => article.status === 'published');
      } else if (status === 'draft') {
        filtered = filtered.filter(article => article.status === 'draft');
      }
    }

    setFilteredArticles(filtered);
  };

  const handleAddArticle = async () => {
    setEditingArticle(null);
    setEditorOpen(true);
  };

  const handleEdit = async (article: Article) => {
    setEditingArticle(article);
    setEditorOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      try {
        await firestoreService.deleteArticle(id);
        toast({
          title: "Success",
          description: "Article deleted successfully",
          variant: "default",
        });
        setDeleteConfirm(null);
      } catch (error) {
        console.error('Error deleting article:', error);
        toast({
          title: "Error",
          description: "Failed to delete article",
          variant: "destructive",
        });
        setDeleteConfirm(null);
      }
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000); // Auto-cancel after 3 seconds
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      await firestoreService.updateArticle(id, { status: newStatus });
      toast({
        title: "Success",
        description: `Article ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating article status:', error);
      toast({
        title: "Error",
        description: "Failed to update article status",
        variant: "destructive",
      });
    }
  };

  const handlePreview = (article: Article) => {
    setPreviewArticle(article);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewArticle(null);
    setPreviewOpen(false);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1">
          <PageLoader text="Loading articles..." fullScreen={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Manage Articles</h1>
              <p className="text-muted-foreground mt-1">
                Create, edit, and manage your help center articles
              </p>
            </div>
            <Button onClick={handleAddArticle} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Article
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Articles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.published}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Draft</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search articles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setSelectedStatus("All")}
                  >
                    All
                  </Button>
                  <Button
                    onClick={() => setSelectedStatus("Published")}
                  >
                    Published
                  </Button>
                  <Button
                    onClick={() => setSelectedStatus("Draft")}
                  >
                    Draft
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Articles Table */}
          <Card>
            <CardHeader>
              <CardTitle>Articles ({filteredArticles.length})</CardTitle>
              <CardDescription>
                Manage your article content and publication status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredArticles.length > 0 ? (
                  filteredArticles.map((article) => (
                    <div key={article.id} className="border border-border rounded-lg p-6 hover:bg-accent transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-foreground truncate">
                              {article.title}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              article.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {article.status === 'published' ? 'Published' : 'Draft'}
                            </span>
                          </div>
                          <p className="text-muted-foreground mb-3 line-clamp-2">
                            {article.excerpt}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {article.author}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(article.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {article.views || 0} views
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            onClick={() => handlePreview(article)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleEdit(article)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleToggleStatus(article.id!, article.status)}
                          >
                            {article.status === 'published' ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button
                            onClick={() => handleDelete(article.id!)}
                            className={deleteConfirm === article.id
                              ? "bg-red-600 text-white hover:bg-red-700"
                              : "text-red-600 hover:text-red-700 hover:bg-red-50"
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                            {deleteConfirm === article.id ? 'Click again' : ''}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {articles.length === 0
                      ? "No articles found. Start by creating your first article!"
                      : "No articles match your current filters."
                    }
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Article Editor Modal */}
      <ArticleEditor
        isOpen={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingArticle(null);
        }}
        onSuccess={() => {
          loadArticles();
          setEditorOpen(false);
          setEditingArticle(null);
        }}
        article={editingArticle}
      />

      {/* Article Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Article Preview</span>
              <Button onClick={handleClosePreview}>
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            </DialogTitle>
          </DialogHeader>
          {previewArticle && (
            <div className="prose prose-slate max-w-none">
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-4">{previewArticle.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {previewArticle.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(previewArticle.createdAt)}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    previewArticle.status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {previewArticle.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
              <div 
                className="rich-content"
                dangerouslySetInnerHTML={{ __html: previewArticle.content }}
              />
              {previewArticle.tags && previewArticle.tags.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {previewArticle.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}