import React, { useState } from "react";
import { X, Search, BookOpen, Video, HelpCircle, Mail } from "lucide-react";
import { Link } from "react-router-dom";

interface SearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSignUp?: () => void;
}

export function SearchPopup({ isOpen, onClose, onSignUp }: SearchPopupProps) {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Search Popup */}
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-strong animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Sign Up Required</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Search Feature Locked
            </h3>
            <p className="text-muted-foreground">
              Please sign up to access our search functionality and discover amazing content.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-accent rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Articles</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Browse our comprehensive article collection
              </p>
            </div>
            
            <div className="p-4 bg-accent rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Video className="h-5 w-5 text-green-600" />
                <span className="font-medium">Videos</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Watch step-by-step video tutorials
              </p>
            </div>
            
            <div className="p-4 bg-accent rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <HelpCircle className="h-5 w-5 text-orange-600" />
                <span className="font-medium">FAQs</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Find answers to common questions
              </p>
            </div>
            
            <div className="p-4 bg-accent rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Contact</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Get personalized help from our team
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-center"
              onClick={() => {
                onClose();
                onSignUp?.();
              }}
            >
              Sign Up Now
            </button>
            <button
              className="flex-1 border border-border text-foreground font-medium py-3 px-6 rounded-lg hover:bg-accent transition-colors text-center"
              onClick={() => {
                onClose();
                onSignUp?.();
              }}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}