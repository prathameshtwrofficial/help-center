import React from "react";
import { Link } from "react-router-dom";
import { Home, Search, HelpCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center py-12 px-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* 404 Animation */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            404
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"></div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Oops! Page not found
          </h2>
          <p className="text-xl text-gray-600 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <p className="text-gray-500">
            Don't worry, let's get you back on track with our helpful resources.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to="/">
            <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
              <Home className="w-6 h-6" />
              <span>Home</span>
            </Button>
          </Link>
          
          <Link to="/search">
            <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
              <Search className="w-6 h-6" />
              <span>Search</span>
            </Button>
          </Link>
          
          <Link to="/faqs">
            <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
              <HelpCircle className="w-6 h-6" />
              <span>FAQs</span>
            </Button>
          </Link>
        </div>

        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </Button>

        {/* Decorative Elements */}
        <div className="mt-12 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-96 h-96 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full opacity-20 animate-pulse"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full opacity-30 animate-pulse delay-300"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
