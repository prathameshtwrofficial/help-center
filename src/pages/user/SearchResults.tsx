import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Search, FileText, Video, HelpCircle, ArrowRight, X, Filter, Grid, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { searchEngine, SearchResult } from "@/lib/searchService";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import toast from "react-hot-toast";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const { user } = useApp();
  const { addSearch } = useSearchHistory(user?.uid || null);
  
  // State management
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'title'>('relevance');
  const [filterBy, setFilterBy] = useState<'all' | 'article' | 'video' | 'faq'>('all');

  // Search execution
  useEffect(() => {
    if (query.trim()) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [query]);

  // Filtered and sorted results
  const filteredAndSortedResults = useMemo(() => {
    let filtered = searchResults;
    
    // Apply content type filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(result => result.type === filterBy);
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'title':
        return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
      case 'date':
        return [...filtered].sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
      case 'relevance':
      default:
        return filtered; // Already sorted by relevance from search engine
    }
  }, [searchResults, filterBy, sortBy]);

  // Content type counts for filters
  const contentCounts = useMemo(() => {
    const counts = { all: searchResults.length, article: 0, video: 0, faq: 0 };
    searchResults.forEach(result => {
      if (counts[result.type as keyof typeof counts] !== undefined) {
        counts[result.type as keyof typeof counts]++;
      }
    });
    return counts;
  }, [searchResults]);

  const performSearch = async () => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setLoading(true);
    try {
      
      
      const results = await searchEngine.searchContent(query.trim(), 50);
      setSearchResults(results);
      
      // Record search
      if (user?.uid && query.trim()) {
        addSearch(query.trim());
      }
      
      // Show feedback
      if (results.length === 0) {
        toast.error('No results found. Try different keywords.');
      } else {
        toast.success(`Found ${results.length} result${results.length !== 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error("❌ Search error:", error);
      toast.error('Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileText className="w-5 h-5 text-emerald-600" />;
      case 'video':
        return <Video className="w-5 h-5 text-orange-600" />;
      case 'faq':
        return <HelpCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <Search className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'article':
        return 'emerald';
      case 'video':
        return 'orange';
      case 'faq':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getCorrectUrl = (result: SearchResult) => {
    if (result.type === 'faq') {
      return '/faqs';
    } else if (result.type === 'article') {
      return `/article/${result.id}`;
    } else if (result.type === 'video') {
      return `/video/${result.id}`;
    }
    return '/';
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Recently';
    }
  };

  const highlightQuery = (text: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:text-emerald-600 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Search Results</span>
          </div>

          {/* Title and Search Query */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Search Results
              </h1>
              {query && (
                <div className="flex items-center gap-3">
                  <p className="text-gray-600">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        Searching for "{query}"...
                      </span>
                    ) : (
                      <>
                        Found <span className="font-semibold text-emerald-600">{filteredAndSortedResults.length}</span> 
                        {filteredAndSortedResults.length === 1 ? ' result' : ' results'} for "{query}"
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {query && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/')}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Clear search"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Controls */}
      {searchResults.length > 0 && (
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Content Type Filters */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All', icon: Search, count: contentCounts.all },
                  { key: 'article', label: 'Articles', icon: FileText, count: contentCounts.article },
                  { key: 'video', label: 'Videos', icon: Video, count: contentCounts.video },
                  { key: 'faq', label: 'FAQs', icon: HelpCircle, count: contentCounts.faq },
                ].map(({ key, label, icon: Icon, count }) => (
                  <button
                    key={key}
                    onClick={() => setFilterBy(key as any)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      filterBy === key
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    <span className="text-xs bg-black/10 px-2 py-1 rounded-full">
                      {count}
                    </span>
                  </button>
                ))}
              </div>

              {/* View and Sort Controls */}
              <div className="flex items-center gap-4">
                {/* Sort Options */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="relevance">Sort by Relevance</option>
                  <option value="date">Sort by Date</option>
                  <option value="title">Sort by Title</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="relative inline-block">
              <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-500 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">Searching knowledge base...</h3>
            <p className="text-gray-600">This may take a moment</p>
          </div>
        )}

        {/* No Query State */}
        {!query && !loading && (
          <div className="text-center py-16">
            <Search className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What are you looking for?</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Enter a search term above to find articles, videos, and FAQs that can help you.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/articles"
                className="inline-flex items-center px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors gap-2"
              >
                <FileText className="w-4 h-4" />
                Browse Articles
              </Link>
              <Link
                to="/videos"
                className="inline-flex items-center px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors gap-2"
              >
                <Video className="w-4 h-4" />
                Watch Videos
              </Link>
              <Link
                to="/faqs"
                className="inline-flex items-center px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                Read FAQs
              </Link>
            </div>
          </div>
        )}

        {/* No Results State */}
        {query && !loading && filteredAndSortedResults.length === 0 && searchResults.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">No results found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              We couldn't find any content matching "{query}". Try different keywords or browse our categories.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/articles"
                className="inline-flex items-center px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors gap-2"
              >
                <FileText className="w-4 h-4" />
                Browse Articles
              </Link>
              <Link
                to="/videos"
                className="inline-flex items-center px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors gap-2"
              >
                <Video className="w-4 h-4" />
                Watch Videos
              </Link>
              <Link
                to="/faqs"
                className="inline-flex items-center px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                Read FAQs
              </Link>
            </div>
          </div>
        )}

        {/* No Results for Filter */}
        {query && !loading && filteredAndSortedResults.length === 0 && searchResults.length > 0 && (
          <div className="text-center py-16">
            <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No {filterBy !== 'all' ? filterBy + 's' : 'results'} found
            </h3>
            <p className="text-gray-600 mb-6">
              Try selecting a different filter or view all results.
            </p>
            <button
              onClick={() => setFilterBy('all')}
              className="inline-flex items-center px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors gap-2"
            >
              <Search className="w-4 h-4" />
              View All Results
            </button>
          </div>
        )}

        {/* Results Grid/List */}
        {filteredAndSortedResults.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${filterBy}-${sortBy}-${viewMode}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={
                viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {filteredAndSortedResults.map((result, index) => (
                <motion.div
                  key={`${result.type}-${result.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={viewMode === 'grid' ? "" : "flex gap-4"}
                >
                  {viewMode === 'grid' ? (
                    // Grid Card View
                    <div 
                      className="group cursor-pointer bg-white rounded-xl border border-gray-200 hover:border-emerald-300 p-6 hover:shadow-lg transition-all duration-200 h-full"
                      onClick={() => navigate(getCorrectUrl(result))}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          getTypeColor(result.type) === 'emerald' ? 'bg-emerald-100' :
                          getTypeColor(result.type) === 'orange' ? 'bg-orange-100' :
                          getTypeColor(result.type) === 'blue' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {getTypeIcon(result.type)}
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          getTypeColor(result.type) === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                          getTypeColor(result.type) === 'orange' ? 'bg-orange-100 text-orange-700' :
                          getTypeColor(result.type) === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {result.type}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="space-y-3">
                        <h3 
                          className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: highlightQuery(result.title) }}
                        />
                        <p 
                          className="text-gray-600 text-sm line-clamp-3"
                          dangerouslySetInnerHTML={{ __html: highlightQuery(result.excerpt) }}
                        />
                        
                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                          <span className="bg-gray-100 px-2 py-1 rounded-full">
                            {result.category}
                          </span>
                          <span>{formatDate(result.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // List Card View
                    <div 
                      className="group cursor-pointer bg-white rounded-xl border border-gray-200 hover:border-emerald-300 p-6 hover:shadow-lg transition-all duration-200 flex gap-6"
                      onClick={() => navigate(getCorrectUrl(result))}
                    >
                      {/* Icon */}
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        getTypeColor(result.type) === 'emerald' ? 'bg-emerald-100' :
                        getTypeColor(result.type) === 'orange' ? 'bg-orange-100' :
                        getTypeColor(result.type) === 'blue' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {getTypeIcon(result.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 
                            className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-1"
                            dangerouslySetInnerHTML={{ __html: highlightQuery(result.title) }}
                          />
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ml-4 flex-shrink-0 ${
                            getTypeColor(result.type) === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                            getTypeColor(result.type) === 'orange' ? 'bg-orange-100 text-orange-700' :
                            getTypeColor(result.type) === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {result.type}
                          </span>
                        </div>
                        <p 
                          className="text-gray-600 text-sm line-clamp-2 mb-3"
                          dangerouslySetInnerHTML={{ __html: highlightQuery(result.excerpt) }}
                        />
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="bg-gray-100 px-2 py-1 rounded-full">
                            {result.category}
                          </span>
                          <span>{formatDate(result.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
