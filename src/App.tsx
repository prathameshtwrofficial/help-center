 import { useState, ReactNode, useEffect } from "react";
 import { BrowserRouter, Routes, Route } from "react-router-dom";
 import toast, { Toaster } from "react-hot-toast";
 import { Navbar } from "./components/common/Navbar";
 import { Footer } from "./components/common/Footer";
 import { FloatingAdminButton } from "./components/common/FloatingAdminButton";
 import { FloatingSupportButton } from "./components/common/FloatingSupportButton";
 import { MessageIcon } from "./components/common/MessageIcon";
 import { PageLoader } from "./components/common/PageLoader";
 import { AppProvider, useApp } from "./context/AppContext";
 import AuthDialog from "./components/common/AuthDialog";

// User Pages
import Home from "./pages/user/Home";
import Articles from "./pages/user/Articles";
import ArticleView from "./pages/user/ArticleView";
import Videos from "./pages/user/Videos";
import VideoView from "./pages/user/VideoView";
import FAQs from "./pages/user/FAQs";
import FAQView from "./pages/user/FAQView";
import SearchResults from "./pages/user/SearchResults";
import Auth from "./pages/Auth";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import Dashboard from "./pages/admin/Dashboard";
import ManageArticles from "./pages/admin/ManageArticles";
import ManageVideos from "./pages/admin/ManageVideos";
import MediaGallery from "./components/admin/MediaGallery";
import ManageFAQs from "./pages/admin/ManageFAQs";
import ManageFeedback from "./pages/admin/ManageFeedback";
import ManageTickets from "./pages/admin/ManageTickets";

// Utility Pages
import NotFound from "./pages/NotFound";

// Admin Protected Route Component
function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const { user, userProfile, loading } = useApp();
  
  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">Please sign in to access admin features.</p>
          <Auth />
        </div>
      </div>
    );
  }
  
  if (userProfile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You need admin privileges to access this page.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

// Protected Route Component
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useApp();
  
  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">Please sign in to access this page.</p>
          <Auth />
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

// Main App Routes Component
function AppRoutes() {
  const { user, userProfile, logout } = useApp();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar
        user={user}
        userProfile={userProfile}
        onLogout={logout}
        onAuthClick={() => setAuthDialogOpen(true)}
      />
      
      <main className="flex-1">
        <Routes>
          {/* Home - No authentication required */}
          <Route path="/" element={<Home />} />
          
          {/* Auth - No navbar/footer */}
          <Route path="/auth" element={<Auth />} />
          
          {/* User Protected Routes */}
          <Route
            path="/articles"
            element={<Articles />}
          />
          <Route
            path="/article/:id"
            element={<ArticleView />}
          />
          <Route
            path="/videos"
            element={<Videos />}
          />
          <Route
            path="/video/:id"
            element={<VideoView />}
          />
          <Route
            path="/faqs"
            element={<FAQs />}
          />
          <Route
            path="/faq/:id"
            element={<FAQView />}
          />
          <Route
            path="/search"
            element={<SearchResults />}
          />
          
          {/* Admin Routes - No Navbar/Footer */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <div className="flex min-h-screen bg-background">
                  <Dashboard />
                </div>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/manage-articles"
            element={
              <AdminProtectedRoute>
                <div className="flex min-h-screen bg-background">
                  <ManageArticles />
                </div>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/manage-videos"
            element={
              <AdminProtectedRoute>
                <div className="flex min-h-screen bg-background">
                  <ManageVideos />
                </div>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/media-gallery"
            element={
              <AdminProtectedRoute>
                <div className="flex min-h-screen bg-background">
                  <MediaGallery />
                </div>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/manage-faqs"
            element={
              <AdminProtectedRoute>
                <div className="flex min-h-screen bg-background">
                  <ManageFAQs />
                </div>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/manage-feedback"
            element={
              <AdminProtectedRoute>
                <div className="flex min-h-screen bg-background">
                  <ManageFeedback />
                </div>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/manage-tickets"
            element={
              <AdminProtectedRoute>
                <div className="flex min-h-screen bg-background">
                  <ManageTickets />
                </div>
              </AdminProtectedRoute>
            }
          />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      
      {/* Footer - only for non-admin pages */}
      {/* Footer is now handled inside Navbar component */}
      
      {/* Floating Admin Button - only for public pages when admin is logged in */}
      <FloatingAdminButton user={user} userProfile={userProfile} />
      
      {/* Floating Support Button - available on all public pages */}
      <FloatingSupportButton user={user} userProfile={userProfile} />
      
      {/* Message Icon - available on all public pages for authenticated users */}
      <MessageIcon user={user} />
      
      {/* Auth Dialog - Rendered at top level */}
      <AuthDialog
        isOpen={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
      />
    </div>
  );
}

// Main App Component
const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  useEffect(() => {
    // Show pre-loader on initial page load only
    if (!hasInitialLoad) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        setHasInitialLoad(true);
      }, 3000); // 3 seconds
      
      return () => clearTimeout(timer);
    } else {
      // For subsequent loads (navigation), don't show pre-loader
      setIsLoading(false);
    }
  }, [hasInitialLoad]);

  // Show pre-loader for exactly 3 seconds on initial page load
  if (isLoading && !hasInitialLoad) {
    return (
      <PageLoader
        text="Loading BrainHints..."
        size="large"
        fullScreen={true}
        duration={3}
      />
    );
  }

  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 8px 30px rgba(2, 6, 23, 0.35)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: 'white',
              },
            },
          }}
        />
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
