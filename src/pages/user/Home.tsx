import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Video, HelpCircle, ArrowRight, TrendingUp, Search, X, Calendar, User, Eye, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { SearchPopup } from "@/components/common/SearchPopup";
import AuthDialog from "@/components/common/AuthDialog";
import TimeGreeting from "@/components/common/TimeGreeting";
import { SearchEmptyState } from "@/components/common/EmptyState";
import { ArticleCard } from "@/components/user/ArticleCard";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { searchEngine, SearchResult } from "@/lib/searchService";
import { useApp } from "@/context/AppContext";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

const categories = [
  { name: "Getting Started", icon: BookOpen, color: "text-emerald-600" },
  { name: "Features", icon: TrendingUp, color: "text-coral-600" },
  { name: "Troubleshooting", icon: HelpCircle, color: "text-indigo-600" },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchPopupOpen, setSearchPopupOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'articles' | 'videos' | 'faqs'>('articles');
  const [searchDialog, setSearchDialog] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { user, userProfile } = useApp();
  const { addSearch } = useSearchHistory(user?.uid || null);
  const { articles, videos, faqs, loading } = useApp();
  const navigate = useNavigate();

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

  // Get category-based gradient colors
  const getCategoryColor = (category: string) => {
    const categoryLower = category?.toLowerCase() || '';
    
    if (categoryLower.includes('getting started') || categoryLower.includes('basics')) {
      return 'from-emerald-50 via-teal-50 to-cyan-50';
    } else if (categoryLower.includes('feature') || categoryLower.includes('advanced')) {
      return 'from-orange-50 via-amber-50 to-yellow-50';
    } else if (categoryLower.includes('troubleshoot') || categoryLower.includes('help')) {
      return 'from-indigo-50 via-blue-50 to-sky-50';
    } else if (categoryLower.includes('video') || categoryLower.includes('media')) {
      return 'from-purple-50 via-violet-50 to-fuchsia-50';
    } else if (categoryLower.includes('article') || categoryLower.includes('tutorial')) {
      return 'from-emerald-50 via-green-50 to-lime-50';
    } else {
      return 'from-gray-50 via-slate-50 to-zinc-50';
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setSearchPopupOpen(true);
      return;
    }

    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    try {
      setIsSearching(true);
      setShowSearchResults(false);
      
      // Record search
      addSearch(searchQuery);
      
      // Use the NEW direct Firestore search engine (async)
      const results = await searchEngine.searchContent(searchQuery.trim(), 12);
      
      setSearchResults(results);
      setShowSearchResults(true);
      
      if (results.length > 0) {
        toast.success(`Found ${results.length} results`);
      } else {
        toast.error('No results found. Try different keywords.');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchBarClick = () => {
    if (!user) {
      setSearchPopupOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            How can we
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-indigo-600"> help you </span>
            today?
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Discover articles, videos, and FAQs designed to help you succeed.
            Your comprehensive learning and support platform awaits.
          </p>

          {/* Simple Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search articles, videos, FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={handleSearchBarClick}
                  className="w-full pl-16 pr-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 shadow-lg hover:shadow-xl"
                />
              </div>
              <button
                type="submit"
                disabled={!user || !searchQuery.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                Search
              </button>
            </form>
            {!user && (
              <p className="text-sm text-gray-500 mt-3">
                Please sign in to access search functionality
              </p>
            )}
          </div>

          {/* Time-based greeting for logged-in users */}
          {user && (
            <div className="max-w-2xl mx-auto mb-12">
              <TimeGreeting userName={userProfile?.displayName || 'User'} />
            </div>
          )}

          {/* Search Results Section - Recoded with enhanced visibility */}
          {showSearchResults && (
            <div className="max-w-6xl mx-auto mb-16">
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden"
                style={{ zIndex: 50 }}
              >
                {/* Solid background for better visibility */}
                <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-white"></div>
                
                {/* Enhanced border accent */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-purple-500/10 rounded-3xl"></div>
                
                {/* Content with improved spacing */}
                <div className="relative p-8 lg:p-12">
                  {/* Enhanced Header Section */}
                  <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-6">
                      {/* Enhanced icon with glow effect */}
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl">
                          <Search className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-indigo-600 rounded-3xl blur opacity-20 animate-pulse"></div>
                      </div>
                      <div>
                        <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                          Search Results
                        </h2>
                        <p className="text-gray-700 text-lg font-medium">
                          {isSearching ? (
                            <span className="flex items-center gap-3">
                              <div className="w-5 h-5 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-emerald-600 font-semibold">Searching for "{searchQuery}"...</span>
                            </span>
                          ) : (
                            <span>
                              Found <span className="font-black text-emerald-600 text-xl">{searchResults.length}</span>
                              <span className="font-semibold"> result{searchResults.length !== 1 ? 's' : ''}</span>
                              <span className="text-gray-500"> for </span>
                              <span className="font-bold text-gray-900">"{searchQuery}"</span>
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    {/* Enhanced Close Button */}
                    <button
                      onClick={() => {
                        setShowSearchResults(false);
                        setSearchQuery('');
                      }}
                      className="group p-4 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all duration-300 hover:scale-110"
                      title="Close search results"
                    >
                      <X className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                  </div>

                  {/* Enhanced Loading State */}
                  {isSearching ? (
                    <div className="text-center py-24">
                      <div className="relative inline-block mb-8">
                        <div className="w-24 h-24 border-6 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 w-24 h-24 border-6 border-transparent border-r-indigo-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                        <div className="absolute inset-2 w-20 h-20 border-6 border-transparent border-b-purple-400 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-3">Searching our knowledge base...</h3>
                      <p className="text-gray-600 text-lg">Finding the best results for you</p>
                      <div className="mt-6 w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-10">
                      {/* Enhanced Filter Tabs */}
                      <div className="flex flex-wrap gap-4 justify-center">
                        {[
                          { key: 'all', label: 'All Results', icon: Search, color: 'from-gray-500 to-gray-600', bgColor: 'bg-gray-500' },
                          { key: 'articles', label: 'Articles', icon: BookOpen, color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-500' },
                          { key: 'videos', label: 'Videos', icon: Video, color: 'from-orange-500 to-red-500', bgColor: 'bg-orange-500' },
                          { key: 'faqs', label: 'FAQs', icon: HelpCircle, color: 'from-indigo-500 to-purple-500', bgColor: 'bg-indigo-500' },
                        ].map(({ key, label, icon: Icon, color, bgColor }) => {
                          const count = searchResults.filter(r => key === 'all' || r.type === key).length;
                          const isActive = key === 'all'; // Default to show all
                          
                          return (
                            <button
                              key={key}
                              className={`group relative px-8 py-4 rounded-2xl font-bold transition-all duration-300 flex items-center gap-3 overflow-hidden ${
                                isActive
                                  ? `bg-gradient-to-r ${color} text-white shadow-2xl transform scale-105`
                                  : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl'
                              }`}
                            >
                              {/* Hover effect background */}
                              {!isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              )}
                              
                              <Icon className={`w-6 h-6 relative z-10 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
                              <span className="relative z-10">{label}</span>
                              <span className={`relative z-10 px-3 py-1 text-sm rounded-full font-bold ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                              }`}>
                                {count}
                              </span>
                              
                              {/* Active indicator */}
                              {isActive && (
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full"></div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Enhanced Results Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {searchResults.slice(0, 12).map((result, index) => {
                          const getIcon = () => {
                            switch (result.type) {
                              case 'article':
                                return <BookOpen className="w-8 h-8 text-emerald-600" />;
                              case 'video':
                                return <Video className="w-8 h-8 text-orange-600" />;
                              case 'faq':
                                return <HelpCircle className="w-8 h-8 text-indigo-600" />;
                              default:
                                return <Search className="w-8 h-8 text-gray-600" />;
                            }
                          };

                          const getTypeGradient = () => {
                            switch (result.type) {
                              case 'article':
                                return 'from-emerald-50 via-teal-50 to-emerald-100 border-emerald-200 hover:border-emerald-300';
                              case 'video':
                                return 'from-orange-50 via-red-50 to-orange-100 border-orange-200 hover:border-orange-300';
                              case 'faq':
                                return 'from-indigo-50 via-purple-50 to-indigo-100 border-indigo-200 hover:border-indigo-300';
                              default:
                                return 'from-gray-50 via-slate-50 to-gray-100 border-gray-200 hover:border-gray-300';
                            }
                          };

                          const getBadgeStyle = () => {
                            switch (result.type) {
                              case 'article':
                                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
                              case 'video':
                                return 'bg-orange-100 text-orange-700 border-orange-200';
                              case 'faq':
                                return 'bg-indigo-100 text-indigo-700 border-indigo-200';
                              default:
                                return 'bg-gray-100 text-gray-700 border-gray-200';
                            }
                          };

                          const handleClick = () => {
                            if (result.type === 'article') {
                              navigate(`/article/${result.id}`);
                            } else if (result.type === 'video') {
                              navigate(`/video/${result.id}`);
                            } else if (result.type === 'faq') {
                              navigate(`/faq/${result.id}`);
                            }
                          };

                          return (
                            <motion.div
                              key={`${result.type}-${result.id}`}
                              initial={{ opacity: 0, y: 30, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                              className="group cursor-pointer"
                              onClick={handleClick}
                            >
                              <div className={`h-full bg-gradient-to-br ${getTypeGradient()} rounded-3xl border-2 p-8 hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-3 group-hover:scale-105 relative overflow-hidden`}>
                                {/* Hover glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                
                                {/* Header */}
                                <div className="flex items-start justify-between mb-6 relative z-10">
                                  <div className="w-16 h-16 bg-white/90 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                                    {getIcon()}
                                  </div>
                                  <div className={`px-4 py-2 text-sm font-bold rounded-full border ${getBadgeStyle()}`}>
                                    {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                                  </div>
                                </div>
                                
                                {/* Content */}
                                <div className="space-y-4 relative z-10">
                                  <h3 className="font-black text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-2 leading-tight text-xl">
                                    {result.title}
                                  </h3>
                                  <p className="text-gray-600 text-base line-clamp-3 leading-relaxed">
                                    {result.excerpt}
                                  </p>
                                  
                                  {/* Enhanced Category & Author */}
                                  <div className="flex items-center justify-between text-sm text-gray-500 pt-6 border-t border-gray-200/60">
                                    <span className="bg-white/80 px-4 py-2 rounded-full font-bold text-gray-700 shadow-sm">
                                      {result.category}
                                    </span>
                                    {result.author && (
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                                          <User className="w-4 h-4 text-gray-600" />
                                        </div>
                                        <span className="font-medium text-gray-700">{result.author}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                      
                      {/* Enhanced View More Results */}
                      {searchResults.length > 12 && (
                        <div className="text-center pt-12">
                          <Link
                            to={`/search?q=${encodeURIComponent(searchQuery)}`}
                            className="inline-flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500 text-white font-black text-lg rounded-3xl hover:from-emerald-600 hover:via-indigo-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl relative overflow-hidden group"
                          >
                            {/* Background animation */}
                            <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            
                            <Search className="w-6 h-6 relative z-10" />
                            <span className="relative z-10">View All {searchResults.length} Results</span>
                            <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="w-12 h-12 text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-4">No results found</h3>
                      <p className="text-gray-600 text-lg mb-8">We couldn't find any content matching "{searchQuery}". Try different keywords or browse our categories.</p>
                      <div className="flex flex-wrap gap-4 justify-center">
                        <Link
                          to="/articles"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
                        >
                          <BookOpen className="w-5 h-5" />
                          Browse Articles
                        </Link>
                        <Link
                          to="/videos"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
                        >
                          <Video className="w-5 h-5" />
                          Watch Videos
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* Content Preview Section for authenticated users only */}
          {user ? (
            <div className="max-w-4xl mx-auto">
              {/* Tab Navigation */}
              <div className="flex justify-center mb-8">
                <div className="inline-flex bg-white rounded-xl p-1 shadow-lg border border-gray-200">
                  <button
                    onClick={() => setActiveTab('articles')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                      activeTab === 'articles'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                    style={activeTab === 'articles' ? { backgroundColor: '#10b981', color: 'white' } : {}}
                  >
                    <BookOpen className="w-4 h-4" />
                    Articles
                  </button>
                  <button
                    onClick={() => setActiveTab('videos')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                      activeTab === 'videos'
                        ? 'bg-coral-500 text-white shadow-md'
                        : 'text-gray-600 hover:text-coral-600 hover:bg-coral-50'
                    }`}
                    style={activeTab === 'videos' ? { backgroundColor: '#f97316', color: 'white' } : {}}
                  >
                    <Video className="w-4 h-4" />
                    Videos
                  </button>
                  <button
                    onClick={() => setActiveTab('faqs')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                      activeTab === 'faqs'
                        ? 'bg-indigo-500 text-white shadow-md'
                        : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    FAQs
                  </button>
                </div>
              </div>

              {/* Enhanced Content Preview Cards */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                {activeTab === 'articles' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">Latest Articles</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {loading ? (
                        // Enhanced loading skeleton
                        Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl h-48 w-full mb-4"></div>
                            <div className="bg-gray-200 rounded h-4 w-3/4 mb-2"></div>
                            <div className="bg-gray-200 rounded h-3 w-full mb-2"></div>
                            <div className="bg-gray-200 rounded h-3 w-1/2"></div>
                          </div>
                        ))
                      ) : articles.filter(article => article.status === 'published').length > 0 ? (
                        articles
                          .filter(article => article.status === 'published')
                          .slice(0, 3)
                          .map((article) => (
                            <ArticleCard key={article.id} article={article} />
                          ))
                      ) : (
                        <div className="col-span-full text-center py-12 text-gray-500">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-lg font-medium text-gray-600 mb-2">No articles available yet</p>
                          <p className="text-sm text-gray-500">Check back soon for new content!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'videos' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                        <Video className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">Featured Videos</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {loading ? (
                        // Enhanced loading skeleton
                        Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl h-48 w-full mb-4"></div>
                            <div className="bg-gray-200 rounded h-4 w-3/4 mb-2"></div>
                            <div className="bg-gray-200 rounded h-3 w-full mb-2"></div>
                            <div className="bg-gray-200 rounded h-3 w-1/2"></div>
                          </div>
                        ))
                      ) : videos.filter(video => video.status === 'published').length > 0 ? (
                        videos
                          .filter(video => video.status === 'published')
                          .slice(0, 3)
                          .map((video) => (
                          <div key={video.id} className="group cursor-pointer">
                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                                 onClick={() => navigate('/videos')}>
                              
                              {/* Video Thumbnail */}
                              <div className="relative aspect-video bg-gradient-to-br from-orange-100 to-red-100 overflow-hidden">
                                {video.thumbnail || video.thumbnailUrl ? (
                                  <img
                                    src={video.thumbnail || video.thumbnailUrl}
                                    alt={video.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center relative">
                                    {/* Play Button Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg">
                                        <div className="w-0 h-0 border-l-[16px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1"></div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Video Duration */}
                                <div className="absolute bottom-3 right-3">
                                  <div className="flex items-center gap-1 px-2 py-1 bg-black/70 text-white text-xs font-medium rounded-lg">
                                    <Clock className="w-3 h-3" />
                                    <span>{video.duration || '0:00'}</span>
                                  </div>
                                </div>
                                
                                {/* Status Badge */}
                                <div className="absolute top-4 left-4">
                                  <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-white/90 text-gray-800 rounded-full shadow-lg backdrop-blur-sm">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                                    Published
                                  </span>
                                </div>
                                
                                {/* Category Badge */}
                                {video.category && (
                                  <div className="absolute top-4 right-4">
                                    <span className="inline-block px-2 py-1 text-xs font-medium bg-white/90 text-orange-700 rounded-full border border-orange-200">
                                      {video.category}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Views Overlay */}
                                <div className="absolute bottom-4 left-4">
                                  <div className="flex items-center gap-1 px-2 py-1 bg-black/70 text-white text-xs rounded-lg">
                                    <Eye className="w-3 h-3" />
                                    <span>{video.views || 0} views</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Video Content */}
                              <div className="p-5">
                                <h3 className="font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors line-clamp-2 leading-tight">
                                  {video.title}
                                </h3>
                                <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed mb-4">
                                  {video.description || 'No description available'}
                                </p>
                                
                                {/* Video Meta */}
                                <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
                                  <div className="flex items-center gap-2">
                                    {video.author && (
                                      <div className="flex items-center gap-1">
                                        <div className="w-5 h-5 bg-gradient-to-br from-orange-200 to-red-200 rounded-full flex items-center justify-center">
                                          <User className="w-3 h-3 text-orange-700" />
                                        </div>
                                        <span className="font-medium">{video.author}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{formatDate(video.createdAt)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-12 text-gray-500">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Video className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-lg font-medium text-gray-600 mb-2">No videos available yet</p>
                          <p className="text-sm text-gray-500">Check back soon for new video content!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'faqs' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <HelpCircle className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">Common Questions</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {loading ? (
                        // Enhanced loading skeleton
                        Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl h-32 w-full mb-4"></div>
                            <div className="bg-gray-200 rounded h-4 w-3/4 mb-2"></div>
                            <div className="bg-gray-200 rounded h-3 w-full mb-2"></div>
                            <div className="bg-gray-200 rounded h-3 w-1/2"></div>
                          </div>
                        ))
                      ) : faqs.filter(faq => faq.status === 'published').length > 0 ? (
                        faqs
                          .filter(faq => faq.status === 'published')
                          .slice(0, 2)
                          .map((faq) => (
                          <div key={faq.id} className="group cursor-pointer">
                            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                                 onClick={() => navigate('/faqs')}>
                              
                              {/* FAQ Header */}
                              <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                  <HelpCircle className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-indigo-500 text-white rounded-full">
                                      <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                                      Published
                                    </span>
                                  </div>
                                  <h3 className="font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                                    {faq.question}
                                  </h3>
                                </div>
                              </div>
                              
                              {/* FAQ Preview */}
                              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-4">
                                <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed">
                                  {faq.answer?.replace(/<[^>]*>/g, '').substring(0, 150)}...
                                </p>
                              </div>
                              
                              {/* FAQ Meta */}
                              <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-3">
                                  {faq.category && (
                                    <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                                      {faq.category}
                                    </span>
                                  )}
                                  {faq.author && (
                                    <div className="flex items-center gap-1">
                                      <div className="w-5 h-5 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full flex items-center justify-center">
                                        <User className="w-3 h-3 text-indigo-700" />
                                      </div>
                                      <span className="font-medium">{faq.author}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  <span>{faq.views || 0} views</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-12 text-gray-500">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <HelpCircle className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-lg font-medium text-gray-600 mb-2">No FAQs available yet</p>
                          <p className="text-sm text-gray-500">Check back soon for frequently asked questions!</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Enhanced View More Button */}
                    <div className="flex justify-center mt-8">
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-dashed border-indigo-200 rounded-xl p-6 hover:border-indigo-300 transition-all duration-300">
                        <Button
                          variant="outline"
                          className="border-none bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 px-8 py-3 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                          onClick={() => navigate('/faqs')}
                        >
                          <HelpCircle className="w-5 h-5 mr-2" />
                          Explore All FAQs
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* View More Button - Navigate to Pages */}
                <div className="flex justify-center mt-6">
                  <Link to={`/${activeTab}`}>
                    <Button className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-lg">
                      View More {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Sign in to access content</h3>
                <p className="text-gray-600 mb-6">
                  Authentication required to view articles, videos, and FAQs. Please sign in to continue.
                </p>
                <Link to="/auth">
                  <Button className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800">
                    Sign In / Sign Up
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-16 px-4 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {user ? `Welcome back, ${userProfile?.displayName || 'User'}!` : 'Why Choose BrainHints?'}
          </h2>
          <p className="text-gray-300 text-lg mb-12 max-w-2xl mx-auto">
            {user
              ? "Continue your learning journey with our comprehensive platform"
              : "Experience the next generation of learning and support platforms"
            }
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <BookOpen className="w-12 h-12 text-white mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Rich Content</h3>
              <p className="text-gray-300">Comprehensive articles and tutorials</p>
            </div>
            
            <div className="p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <Video className="w-12 h-12 text-white mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Video Learning</h3>
              <p className="text-gray-300">Step-by-step video guides</p>
            </div>
            
            <div className="p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <HelpCircle className="w-12 h-12 text-white mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">24/7 Support</h3>
              <p className="text-gray-300">Always here when you need help</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            {user ? 'Continue Learning' : 'Ready to get started?'}
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            {user
              ? 'Explore our content library and take your knowledge to the next level'
              : 'Join thousands of users who trust BrainHints for their learning needs'
            }
          </p>
          <div className="flex justify-center">
            {user ? (
              <Link
                to="/articles"
                className="inline-flex items-center px-8 py-4 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transform hover:-translate-y-1 transition-all duration-300 gap-2 shadow-lg"
              >
                Start Exploring
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center px-8 py-4 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transform hover:-translate-y-1 transition-all duration-300 gap-2 shadow-lg"
              >
                Get Started Today
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Search Popup */}
      <SearchPopup
        isOpen={searchPopupOpen}
        onClose={() => {
          setSearchPopupOpen(false);
          setAuthDialogOpen(true);
        }}
      />

      {/* Auth Dialog */}
      <AuthDialog
        isOpen={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
      />

      {/* Search Everything dialog removed - search results now shown inline below greeting */}
    </div>
  );
}
