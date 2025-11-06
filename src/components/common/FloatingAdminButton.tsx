import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { User as FirebaseUser } from "firebase/auth";

interface FloatingAdminButtonProps {
  user?: FirebaseUser | null;
  userProfile?: any;
}

export const FloatingAdminButton = ({ user, userProfile }: FloatingAdminButtonProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Only show if user is admin and we're not in admin routes
  const shouldShow = userProfile?.role === 'admin' && !location.pathname.startsWith('/admin');

  useEffect(() => {
    if (shouldShow) {
      // Show button after a delay to not be immediately visible
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setIsExpanded(false);
    }
  }, [shouldShow, location.pathname]);

  const handleAdminReturn = () => {
    navigate('/admin/dashboard');
  };

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleHide = () => {
    setIsVisible(false);
    // Show again after 30 seconds
    setTimeout(() => {
      if (shouldShow) setIsVisible(true);
    }, 30000);
  };

  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{
            x: 0,
            opacity: 1,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 30
            }
          }}
          exit={{
            x: -100,
            opacity: 0,
            transition: { duration: 0.3 }
          }}
          className="fixed top-1/2 left-0 z-50 transform -translate-y-1/2"
        >
          <div className="relative">
            {/* Main Button Container */}
            <motion.div
              className={`
                bg-card border border-border rounded-r-lg shadow-lg backdrop-blur-sm
                transition-all duration-300 ease-in-out cursor-pointer
                ${isExpanded ? 'w-64' : 'w-12'}
              `}
              onClick={isExpanded ? undefined : handleToggleExpanded}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center">
                {/* Toggle Arrow/Icon */}
                <div className="flex items-center justify-center w-12 h-12">
                  {isExpanded ? (
                    <X className="w-5 h-5 text-muted-foreground" onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(false);
                    }} />
                  ) : (
                    <Settings className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-3 pr-4 py-2"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          Admin Panel
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Return to dashboard
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Action Buttons (when expanded) */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.1 }}
                  className="mt-2 space-y-2"
                >
                  <Button
                    onClick={handleAdminReturn}
                    className="w-full text-sm"
                    size="sm"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Admin Dashboard
                  </Button>
                  <Button
                    onClick={handleHide}
                    variant="outline"
                    className="w-full text-xs"
                    size="sm"
                  >
                    Hide for 30s
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pulse Animation Indicator */}
            {!isExpanded && (
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};