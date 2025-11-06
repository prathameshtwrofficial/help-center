import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Brain, User, LogOut, Menu, X, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { User as FirebaseUser } from "firebase/auth";

interface NavbarProps {
  user?: FirebaseUser | null;
  userProfile?: any;
  onLogout?: () => void;
  onAuthClick?: () => void;
}

export function Navbar({ user, userProfile, onLogout, onAuthClick }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (onLogout) {
        await onLogout();
      }
      // Use React Router navigation instead of window.location to avoid loops
      navigate("/", { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate even if logout fails
      navigate("/", { replace: true });
    }
  };

  return (
    <nav className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">Help Centre</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Navigation links can be added here if needed */}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">{userProfile?.displayName || user.email}</div>
                    <div className="text-xs text-muted-foreground capitalize">{userProfile?.role || 'user'}</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Button
                  variant="default"
                  size="sm"
                  onClick={onAuthClick}
                  className="flex items-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In / Sign Up
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-3">
              {user ? (
                <>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center space-x-2 py-2">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">{userProfile?.displayName || user.email}</div>
                        <div className="text-xs text-muted-foreground capitalize">{userProfile?.role || 'user'}</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      onAuthClick?.();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In / Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
