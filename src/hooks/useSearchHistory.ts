import { useState, useEffect } from 'react';

interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultsCount: number;
}

const STORAGE_KEY = 'brainHints_searchHistory';
const MAX_HISTORY_ITEMS = 50;

export function useSearchHistory(userId: string | null) {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // Load search history from localStorage when component mounts or user changes
  useEffect(() => {
    if (userId) {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSearchHistory(Array.isArray(parsed) ? parsed : []);
        } catch (error) {
          console.error('Error parsing search history:', error);
          setSearchHistory([]);
        }
      } else {
        setSearchHistory([]);
      }
    }
  }, [userId]);

  // Save search history to localStorage whenever it changes
  useEffect(() => {
    if (userId && searchHistory.length > 0) {
      localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(searchHistory));
    }
  }, [userId, searchHistory]);

  const addSearch = (query: string, resultsCount: number = 0) => {
    if (!userId || !query.trim()) return;

    const timestamp = Date.now();
    const newSearch: SearchHistoryItem = {
      query: query.trim(),
      timestamp,
      resultsCount
    };

    setSearchHistory(prev => {
      // Remove any existing search with the same query
      const filtered = prev.filter(item => 
        item.query.toLowerCase() !== newSearch.query.toLowerCase()
      );
      
      // Add new search to the beginning
      const updated = [newSearch, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      
      return updated;
    });
  };

  const clearSearchHistory = () => {
    if (userId) {
      localStorage.removeItem(`${STORAGE_KEY}_${userId}`);
      setSearchHistory([]);
    }
  };

  const removeSearchItem = (index: number) => {
    setSearchHistory(prev => prev.filter((_, i) => i !== index));
  };

  // Get most recent searches (for autocomplete)
  const getRecentSearches = (limit: number = 5): string[] => {
    return searchHistory
      .slice(0, limit)
      .map(item => item.query);
  };

  // Get searches by category (articles, videos, faqs) - for future enhancement
  const getSearchesByCategory = () => {
    // This could be enhanced to categorize searches based on results
    // For now, we'll just return the history
    return {
      all: searchHistory,
      recent: searchHistory.slice(0, 10),
    };
  };

  return {
    searchHistory,
    addSearch,
    clearSearchHistory,
    removeSearchItem,
    getRecentSearches,
    getSearchesByCategory
  };
}