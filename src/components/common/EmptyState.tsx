import React from 'react';
import { FileSearch, Search } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function EmptyState({
  icon,
  title = "No results found",
  description = "Try adjusting your search or browse our content sections.",
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
        {icon || <Search className="w-10 h-10 text-gray-400" />}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 max-w-sm mx-auto">{description}</p>
    </div>
  );
}

export function SearchEmptyState() {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center mb-4">
        <FileSearch className="w-10 h-10 text-blue-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No content found</h3>
      <p className="text-gray-600 max-w-sm mx-auto">
        Your search didn't match any articles, videos, or FAQs. Try different keywords or browse our content sections.
      </p>
    </div>
  );
}

export default EmptyState;