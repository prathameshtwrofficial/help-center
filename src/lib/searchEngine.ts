// New Search Engine - Recoded from scratch
import { articleService, videoService, faqService } from "./contentService";
import { firestoreService } from "./firestore";

// Enhanced search with better matching and routing
export interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  type: 'article' | 'video' | 'faq';
  category: string;
  url: string;
  thumbnail?: string;
  content?: string;
  author?: string;
  createdAt?: any;
}

export interface SearchResults {
  articles: SearchResult[];
  videos: SearchResult[];
  faqs: SearchResult[];
  total: number;
}

export async function searchAllContent(query: string): Promise<SearchResults> {
  try {
    console.log('🔍 Starting search for:', query);
    
    if (!query || query.trim().length === 0) {
      return { articles: [], videos: [], faqs: [], total: 0 };
    }

    const searchTerm = query.toLowerCase().trim();
    const results: SearchResults = {
      articles: [],
      videos: [],
      faqs: [],
      total: 0
    };

    // Search articles from Firestore
    console.log('📄 Searching articles...');
    const articles = await articleService.getByStatus('published');
    const articleResults = articles.filter((article: any) => {
      return (
        article.title?.toLowerCase().includes(searchTerm) ||
        article.excerpt?.toLowerCase().includes(searchTerm) ||
        article.content?.toLowerCase().includes(searchTerm) ||
        article.category?.toLowerCase().includes(searchTerm) ||
        article.author?.toLowerCase().includes(searchTerm) ||
        (article.tags && article.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm))) ||
        (article.keywords && article.keywords.some((keyword: string) => keyword.toLowerCase().includes(searchTerm)))
      );
    }).map((article: any) => ({
      id: article.id,
      title: article.title,
      excerpt: article.excerpt || article.content?.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
      type: 'article' as const,
      category: article.category,
      url: `/article/${article.id}`,
      content: article.content,
      author: article.author,
      createdAt: article.createdAt
    }));
    
    console.log('📄 Found articles:', articleResults.length);
    results.articles = articleResults;

    // Search videos
    console.log('🎥 Searching videos...');
    const videos = await videoService.getByStatus('published');
    const videoResults = videos.filter((video: any) => {
      return (
        video.title?.toLowerCase().includes(searchTerm) ||
        video.description?.toLowerCase().includes(searchTerm) ||
        video.category?.toLowerCase().includes(searchTerm) ||
        (video.tags && video.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm)))
      );
    }).map((video: any) => ({
      id: video.id,
      title: video.title,
      excerpt: video.description,
      type: 'video' as const,
      category: video.category,
      url: `/video/${video.id}`,
      content: video.description,
      author: video.author,
      createdAt: video.createdAt
    }));
    
    console.log('🎥 Found videos:', videoResults.length);
    results.videos = videoResults;

    // Search FAQs
    console.log('❓ Searching FAQs...');
    const faqs = await faqService.getByStatus('published');
    const faqResults = faqs.filter((faq: any) => {
      return (
        faq.question?.toLowerCase().includes(searchTerm) ||
        faq.answer?.toLowerCase().includes(searchTerm) ||
        faq.category?.toLowerCase().includes(searchTerm)
      );
    }).map((faq: any) => ({
      id: faq.id,
      title: faq.question,
      excerpt: faq.answer?.substring(0, 200) + '...',
      type: 'faq' as const,
      category: faq.category,
      url: `/faq/${faq.id}`,
      content: faq.answer,
      author: faq.author,
      createdAt: faq.createdAt
    }));
    
    console.log('❓ Found FAQs:', faqResults.length);
    results.faqs = faqResults;

    results.total = results.articles.length + results.videos.length + results.faqs.length;
    
    console.log('🔍 Search complete. Total results:', results.total);
    return results;
    
  } catch (error) {
    console.error('❌ Search error:', error);
    return { articles: [], videos: [], faqs: [], total: 0 };
  }
}

// Get detailed content by ID and type
export async function getContentById(id: string, type: string) {
  try {
    console.log(`📋 Fetching ${type} with ID:`, id);
    
    switch (type) {
      case 'article':
        const article = await articleService.getById(id);
        if (article && article.status === 'published') {
          return { ...article, type: 'article' };
        }
        break;
        
      case 'video':
        const video = await videoService.getById(id);
        if (video && video.status === 'published') {
          return { ...video, type: 'video' };
        }
        break;
        
      case 'faq':
        const faq = await faqService.getById(id);
        if (faq && faq.status === 'published') {
          return { ...faq, type: 'faq' };
        }
        break;
        
      default:
        console.warn('Unknown content type:', type);
        return null;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching ${type}:`, error);
    return null;
  }
}

// Enhanced content view component data
export async function getContentViewData(type: string, id: string) {
  const content = await getContentById(id, type);
  
  if (!content) {
    return null;
  }
  
  // Use type assertion to handle different content types safely
  const normalizedContent = {
    id: content.id,
    type,
    // Safe property access with fallbacks
    title: (content as any).title || (content as any).question || 'Untitled',
    excerpt: (content as any).excerpt || (content as any).description || (content as any).answer || '',
    content: (content as any).content || (content as any).description || (content as any).answer || '',
    category: content.category || 'General',
    author: content.author || 'Unknown',
    createdAt: content.createdAt,
    updatedAt: content.updatedAt,
    status: content.status,
    tags: content.tags || []
  };
  
  return normalizedContent;
}