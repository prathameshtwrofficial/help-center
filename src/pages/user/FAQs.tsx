import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronDown, ChevronUp, HelpCircle, BookOpen, Video, MessageCircle, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { faqService, FAQ } from "@/lib/contentService";
import { ContentFeedback } from "@/components/common/ContentFeedback";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function FAQs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  // Real-time listener for published FAQs
  const loadPublishedFAQs = useCallback(() => {
    try {
      // Only get published FAQs for public view
      const publishedQuery = query(
        collection(db, "faqs"),
        where("status", "==", "published"),
        limit(100)
      );

      const unsubscribe = onSnapshot(publishedQuery,
        (snapshot) => {
          const allFaqs: FAQ[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            allFaqs.push({
              id: doc.id,
              question: data.question || '',
              answer: data.answer || '',
              category: data.category || 'General',
              tags: data.tags || [],
              author: data.author || 'Unknown',
              status: data.status || 'draft',
              order: data.order || 0,
              createdAt: data.createdAt || null,
              updatedAt: data.updatedAt || null
            });
          });

          // Sort by order or createdAt date
          allFaqs.sort((a, b) => {
            const orderA = a.order || 0;
            const orderB = b.order || 0;
            if (orderA !== orderB) return orderA - orderB;
            
            const dateA = a.createdAt;
            const dateB = b.createdAt;
            if (dateA && dateB) {
              const timeA = dateA.toDate ? dateA.toDate().getTime() : (dateA as any);
              const timeB = dateB.toDate ? dateB.toDate().getTime() : (dateB as any);
              return (timeA as number) - (timeB as number);
            }
            return 0;
          });

          setFaqs(allFaqs);
          setLoading(false);

          // Extract unique categories
          const uniqueCategories = Array.from(new Set(allFaqs.map(faq => faq.category)));
          setCategories(["All", ...uniqueCategories]);
        },
        (error) => {
          console.error('Error listening to published FAQs:', error);
          setFaqs([]);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up published FAQs listener:', error);
      setFaqs([]);
      setLoading(false);
      return () => {};
    }
  }, []);

  useEffect(() => {
    const unsubscribe = loadPublishedFAQs();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadPublishedFAQs]);

  useEffect(() => {
    filterFaqs();
  }, [faqs, searchTerm, selectedCategory]);

  const filterFaqs = () => {
    let filtered = faqs;

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(faq =>
        faq.question.toLowerCase().includes(searchLower) ||
        faq.answer.toLowerCase().includes(searchLower) ||
        faq.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }

    setFilteredFaqs(filtered);
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

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
            <p className="text-muted-foreground">Loading FAQs...</p>
          </div>
        </div>
      </div>
    );
  }

  // Group FAQs by category
  const faqsByCategory = categories.reduce((acc, category) => {
    if (category === "All") return acc;
    const categoryFaqs = filteredFaqs.filter(faq => faq.category === category);
    if (categoryFaqs.length > 0) {
      acc[category] = categoryFaqs;
    }
    return acc;
  }, {} as Record<string, FAQ[]>);

  // Show empty state
  if (faqs.length === 0) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center py-16">
            <HelpCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-foreground mb-2">No FAQs available</h3>
            <p className="text-muted-foreground">Check back later for frequently asked questions.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            to="/"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium gap-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-indigo-100 rounded-full text-indigo-700 font-medium mb-6">
            <HelpCircle className="w-4 h-4 mr-2" />
            FAQ Center
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Find quick answers to common questions about our platform and services
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-lg border border-input bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Can't find what you're looking for?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/contact"
                className="inline-flex items-center px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Contact Support
              </Link>
              <Link 
                to="/articles"
                className="inline-flex items-center px-6 py-3 border border-gray-300 bg-white font-medium rounded-lg hover:bg-gray-50 transition-colors gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Browse Articles
              </Link>
              <Link 
                to="/videos"
                className="inline-flex items-center px-6 py-3 border border-gray-300 bg-white font-medium rounded-lg hover:bg-gray-50 transition-colors gap-2"
              >
                <Video className="w-4 h-4" />
                Watch Videos
              </Link>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border-gray-200'
                }`}
                style={selectedCategory === category ? { backgroundColor: '#6366f1', color: 'white' } : {}}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Content */}
        {selectedCategory === "All" ? (
          // Grouped by category
          <div className="space-y-8">
            {Object.entries(faqsByCategory).map(([category, categoryFaqs]) => (
              <div key={category}>
                <h2 className="text-2xl font-bold text-foreground mb-4">{category}</h2>
                <div className="space-y-3">
                  {categoryFaqs.map((faq) => (
                    <FAQItem
                      key={faq.id}
                      faq={faq}
                      isExpanded={expandedFAQ === faq.id}
                      onToggle={() => toggleFAQ(faq.id!)}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Single category view
          <div className="space-y-3">
            {filteredFaqs.map((faq) => (
              <FAQItem
                key={faq.id}
                faq={faq}
                isExpanded={expandedFAQ === faq.id}
                onToggle={() => toggleFAQ(faq.id!)}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}

        {filteredFaqs.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No FAQs found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Link 
              to="/contact"
              className="inline-flex items-center text-indigo-600 font-medium hover:text-indigo-700 transition-colors gap-1"
            >
              Contact Support
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

interface FAQItemProps {
  faq: FAQ;
  isExpanded: boolean;
  onToggle: () => void;
  formatDate: (timestamp: any) => string;
}

function FAQItem({ faq, isExpanded, onToggle, formatDate }: FAQItemProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-6 text-left hover:bg-indigo-50 transition-colors focus:outline-none focus:bg-indigo-50"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground pr-4">
            {faq.question}
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {faq.category}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-border">
          <div className="pt-4">
            <p className="text-muted-foreground leading-relaxed mb-4">
              {faq.answer}
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Asked by {faq.author}
              </span>
              <span className="text-muted-foreground">
                {formatDate(faq.createdAt)}
              </span>
            </div>
            {faq.tags && faq.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {faq.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* Content Feedback */}
            <div className="mt-6">
              <ContentFeedback
                contentType="faq"
                contentId={faq.id!}
                contentTitle={faq.question}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
