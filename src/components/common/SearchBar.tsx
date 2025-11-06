import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  showClearButton?: boolean;
  autoFocus?: boolean;
}

export const SearchBar = ({
  placeholder = "Search articles, videos, FAQs...",
  className = "w-full max-w-2xl mx-auto",
  showClearButton = false,
  autoFocus = false
}: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Get query from URL params if on search page
  useEffect(() => {
    if (location.pathname === '/search') {
      const urlParams = new URLSearchParams(location.search);
      const q = urlParams.get('q');
      if (q) {
        setQuery(q);
      }
    }
  }, [location]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      // Navigate to search results page
      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  const handleClear = () => {
    setQuery("");
    if (location.pathname === '/search') {
      navigate('/search');
    }
  };

  return (
    <form onSubmit={handleSearch} className={className}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-24 h-12 text-base"
          autoFocus={autoFocus}
        />
        <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {showClearButton && query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={!query.trim()}
            className="px-4"
          >
            Search
          </Button>
        </div>
      </div>
    </form>
  );
};
