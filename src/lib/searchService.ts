import { firestoreService } from '@/lib/firestore';

export interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  type: 'article' | 'video' | 'faq';
  author: string;
  createdAt: any;
  updatedAt: any;
  published?: boolean;
}

// Direct Firestore search service that queries real database
export class SearchEngine {
  private static instance: SearchEngine;

  public static getInstance(): SearchEngine {
    if (!SearchEngine.instance) {
      SearchEngine.instance = new SearchEngine();
    }
    return SearchEngine.instance;
  }

  async searchContent(searchTerm: string, maxResults: number = 12): Promise<SearchResult[]> {
    if (!searchTerm || !searchTerm.trim()) {
      console.log('❌ SEARCH: Empty search term, returning no results');
      return [];
    }

    const searchTermLower = searchTerm.toLowerCase().trim();
    const results: SearchResult[] = [];

    try {
      console.log('🔍 SEARCH: Starting real-time Firestore search for:', searchTermLower);

      // Search Articles directly from Firestore
      const articles = await firestoreService.getArticles(true);
      console.log('📝 SEARCH: Found', articles.length, 'published articles');
      
      for (const article of articles) {
        const titleMatch = article.title?.toLowerCase().includes(searchTermLower);
        const contentMatch = article.content?.toLowerCase().includes(searchTermLower);
        const categoryMatch = article.category?.toLowerCase().includes(searchTermLower);
        const authorMatch = article.author?.toLowerCase().includes(searchTermLower);
        
        if (titleMatch || contentMatch || categoryMatch || authorMatch) {
          console.log('✅ ARTICLE MATCH:', article.title);
          results.push({
            id: article.id || 'unknown',
            title: article.title || 'Untitled Article',
            excerpt: article.excerpt || (article.content ? article.content.substring(0, 150) + '...' : 'No description available'),
            category: article.category || 'General',
            type: 'article',
            author: article.author || 'Unknown',
            createdAt: article.createdAt,
            updatedAt: article.updatedAt,
            published: true
          });
        }
      }

      // Search Videos directly from Firestore
      const videos = await firestoreService.getVideos(true);
      console.log('🎥 SEARCH: Found', videos.length, 'published videos');
      
      for (const video of videos) {
        const titleMatch = video.title?.toLowerCase().includes(searchTermLower);
        const descriptionMatch = video.description?.toLowerCase().includes(searchTermLower);
        const categoryMatch = video.category?.toLowerCase().includes(searchTermLower);
        
        if (titleMatch || descriptionMatch || categoryMatch) {
          console.log('✅ VIDEO MATCH:', video.title);
          results.push({
            id: video.id || 'unknown',
            title: video.title || 'Untitled Video',
            excerpt: video.description || 'No description available',
            category: video.category || 'General',
            type: 'video',
            author: video.author || 'Admin',
            createdAt: video.createdAt,
            updatedAt: video.updatedAt,
            published: true
          });
        }
      }

      // Search FAQs directly from Firestore
      const faqs = await firestoreService.getFAQs(true);
      console.log('❓ SEARCH: Found', faqs.length, 'published FAQs');
      
      for (const faq of faqs) {
        const questionMatch = faq.question?.toLowerCase().includes(searchTermLower);
        const answerMatch = faq.answer?.toLowerCase().includes(searchTermLower);
        const categoryMatch = faq.category?.toLowerCase().includes(searchTermLower);
        
        if (questionMatch || answerMatch || categoryMatch) {
          console.log('✅ FAQ MATCH:', faq.question);
          results.push({
            id: faq.id || 'unknown',
            title: faq.question || 'Untitled FAQ',
            excerpt: faq.answer ? faq.answer.substring(0, 150) + '...' : 'No answer available',
            category: faq.category || 'General',
            type: 'faq',
            author: faq.author || 'System',
            createdAt: faq.createdAt,
            updatedAt: faq.updatedAt,
            published: true
          });
        }
      }

      console.log('📊 SEARCH: FINAL RESULTS from Firestore:', {
        searchTerm: searchTermLower,
        totalMatches: results.length,
        resultsPreview: results.slice(0, 3).map(r => ({ 
          type: r.type, 
          title: r.title.substring(0, 30) + '...'
        }))
      });

      // Sort results by relevance
      return results
        .sort((a, b) => {
          // Title exact match first
          const aExactMatch = a.title.toLowerCase() === searchTermLower;
          const bExactMatch = b.title.toLowerCase() === searchTermLower;
          
          if (aExactMatch && !bExactMatch) return -1;
          if (!aExactMatch && bExactMatch) return 1;
          
          // Title contains search term
          const aTitleMatch = a.title.toLowerCase().includes(searchTermLower);
          const bTitleMatch = b.title.toLowerCase().includes(searchTermLower);
          
          if (aTitleMatch && !bTitleMatch) return -1;
          if (!aTitleMatch && bTitleMatch) return 1;
          
          // Fallback to title alphabetical
          return a.title.localeCompare(b.title);
        })
        .slice(0, maxResults);

    } catch (error) {
      console.error('❌ SEARCH: Error searching Firestore:', error);
      return [];
    }
  }
}

// Export singleton instance
export const searchEngine = SearchEngine.getInstance();

// Legacy useSearch hook for backward compatibility
export function useSearch() {
  return {
    searchContent: searchEngine.searchContent.bind(searchEngine)
  };
}