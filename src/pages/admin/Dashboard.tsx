import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Video,
  HelpCircle,
  MessageCircle,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Eye,
  Loader2,
  User,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { addSampleData } from "@/lib/seedData";
import { useApp } from "@/context/AppContext";
import toast from "react-hot-toast";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const navigate = useNavigate();
  const { articles, videos, faqs, feedbacks, loading: appLoading } = useApp();

  // Calculate real stats from database
  const stats = {
    total: {
      articles: articles.length,
      videos: videos.length,
      faqs: faqs.length,
      feedback: feedbacks.length,
    },
    published: {
      articles: articles.filter(a => a.status === 'published').length,
      videos: videos.filter(v => v.status === 'published').length,
      faqs: faqs.filter(f => f.status === 'published').length,
    },
    draft: {
      articles: articles.filter(a => a.status !== 'published').length,
      videos: videos.filter(v => v.status !== 'published').length,
      faqs: faqs.filter(f => f.status !== 'published').length,
    },
    unreadFeedback: feedbacks.filter(f => f.status === 'new').length
  };

  // Get recent articles (last 5)
  const recentArticles = articles
    .sort((a, b) => {
      const dateA = a.updatedAt || a.createdAt;
      const dateB = b.updatedAt || b.createdAt;
      if (dateA && dateB) {
        const timeA = dateA.toDate ? dateA.toDate().getTime() : (dateA as any);
        const timeB = dateB.toDate ? dateB.toDate().getTime() : (dateB as any);
        return (timeB as number) - (timeA as number);
      }
      return 0;
    })
    .slice(0, 5);

  const quickActions = [
    { title: "Add Article", href: "/admin/manage-articles", icon: Plus, color: "bg-blue-500" },
    { title: "Upload Video", href: "/admin/manage-videos", icon: Video, color: "bg-red-500" },
    { title: "Manage FAQs", href: "/admin/manage-faqs", icon: HelpCircle, color: "bg-green-500" },
    { title: "View Feedback", href: "/admin/manage-feedback", icon: MessageCircle, color: "bg-purple-500" },
  ];

  const handleSeedDatabase = async () => {
    try {
      setSeeding(true);
      toast.loading('Seeding database with demo content...', { id: 'seeding' });
      
      await addSampleData();
      
      toast.success('Database seeded successfully! 🎉', { id: 'seeding' });
    } catch (error) {
      console.error('Error seeding database:', error);
      toast.error('Failed to seed database', { id: 'seeding' });
    } finally {
      setSeeding(false);
    }
  };

  // Format date for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString();
    } catch (error) {
      return 'Recently';
    }
  };

  // Stats cards data with real data
  const statsData = [
    {
      title: "Total Articles",
      value: stats.total.articles.toString(),
      change: `${stats.total.articles > 0 ? '+' : ''}${stats.total.articles}`,
      changeType: "positive" as const,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Published Articles",
      value: stats.published.articles.toString(),
      change: `${stats.published.articles > 0 ? '+' : ''}${stats.published.articles}`,
      changeType: "positive" as const,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100"
    },
    {
      title: "Total Videos",
      value: stats.total.videos.toString(),
      change: `${stats.total.videos > 0 ? '+' : ''}${stats.total.videos}`,
      changeType: "positive" as const,
      icon: Video,
      color: "text-red-600",
      bgColor: "bg-red-100"
    },
    {
      title: "Total FAQs",
      value: stats.total.faqs.toString(),
      change: `${stats.total.faqs > 0 ? '+' : ''}${stats.total.faqs}`,
      changeType: "positive" as const,
      icon: HelpCircle,
      color: "text-green-600",
      bgColor: "bg-green-100"
    }
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Manage your help center content and monitor engagement
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Help Center
              </Link>
              <Button
                onClick={handleSeedDatabase}
                disabled={seeding}
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                {seeding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Seed Demo Data
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsData.map((stat) => (
              <Card key={stat.title} className="hover:shadow-medium transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-green-600">{stat.change}</span>
                    <span className="text-muted-foreground ml-1">items</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Jump to common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action) => (
                  <Link
                    key={action.title}
                    to={action.href}
                    className="group flex flex-col items-center p-6 border border-border rounded-xl hover:shadow-soft hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className={`p-3 rounded-lg ${action.color} mb-3 group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {action.title}
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Articles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Recent Articles
                  <Link 
                    to="/admin/manage-articles"
                    className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                  >
                    View All
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </CardTitle>
                <CardDescription>
                  Latest articles in the knowledge base
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gray-200 rounded h-4 w-3/4 mb-2"></div>
                        <div className="bg-gray-200 rounded h-3 w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : recentArticles.length > 0 ? (
                  <div className="space-y-4">
                    {recentArticles.map((article) => (
                      <div 
                        key={article.id} 
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/article/${article.id}`)}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 line-clamp-1">{article.title}</h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {article.author}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(article.updatedAt || article.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            article.status === 'published' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {article.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                          <ArrowUpRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No articles found.</p>
                    <p className="text-sm">Click "Seed Demo Data" to add sample content or create your first article!</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => navigate('/admin/manage-articles')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Article
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Current system health and activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-800">Help Center</span>
                    </div>
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-800">Database</span>
                    </div>
                    <span className="text-sm text-green-600">Healthy</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-800">API Services</span>
                    </div>
                    <span className="text-sm text-green-600">Operational</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-800">Real-time Data</span>
                    </div>
                    <span className="text-sm text-blue-600">Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
