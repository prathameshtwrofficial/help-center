import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Ticket, X, Loader2, MessageCircle, Clock, Bell, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { User as FirebaseUser } from "firebase/auth";
import { SupportTicketForm } from "./SupportTicketForm";
import { TicketResponsesDialog } from "./TicketResponsesDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supportTicketService, SupportTicket } from "@/lib/contentService";
import { firestoreService, Notification } from "@/lib/firestore";
import toast from "react-hot-toast";

interface FloatingSupportButtonProps {
  user?: FirebaseUser | null;
  userProfile?: any;
}

export const FloatingSupportButton = ({ user, userProfile }: FloatingSupportButtonProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [userTickets, setUserTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [hasLoadedTickets, setHasLoadedTickets] = useState(false);
  const [showResponsesDialog, setShowResponsesDialog] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Only show on non-admin pages
  const shouldShow = !location.pathname.startsWith('/admin');

  // Load user tickets when expanded - SECURITY ENHANCEMENT
  const loadUserTickets = async () => {
    if (!user?.uid || hasLoadedTickets || loadingTickets) return;
    
    setLoadingTickets(true);
    try {
      const tickets = await supportTicketService.getByUser(user.uid);
      
      // SECURITY: Additional validation to ensure only user's tickets
      const validatedTickets = tickets.filter(ticket => {
        if (ticket.userId !== user.uid) {
          console.warn('SECURITY: Filtering out ticket from different user in FloatingSupportButton', {
            ticketUserId: ticket.userId,
            currentUserId: user.uid,
            ticketId: ticket.id
          });
          return false;
        }
        return true;
      });
      
      setUserTickets(validatedTickets);
      setHasLoadedTickets(true);
      
      console.log(`SECURITY: FloatingSupportButton loaded ${validatedTickets.length} validated tickets for user ${user.uid}`);
    } catch (error) {
      console.error('Error loading user tickets:', error);
      // On error, ensure no data is set to prevent showing wrong information
      setUserTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  // Load user notifications
  const loadUserNotifications = async () => {
    if (!user?.uid) return;
    
    setLoadingNotifications(true);
    try {
      const notificationData = await firestoreService.getUserNotifications(user.uid, 10);
      setNotifications(notificationData);
      
      const unreadCount = await firestoreService.getUnreadNotificationCount(user.uid);
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Navigate to specific content and mark notification as read
  const navigateToContent = async (notification: Notification) => {
    if (notification.relatedContentId && notification.relatedContentType) {
      // Mark notification as read
      try {
        await firestoreService.markNotificationAsRead(notification.id!);
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
      
      // Navigate to the content
      const routes = {
        article: `/article/${notification.relatedContentId}`,
        video: `/video/${notification.relatedContentId}`,
        faq: `/faq/${notification.relatedContentId}`
      };
      const route = routes[notification.relatedContentType];
      if (route) {
        navigate(route);
        setIsExpanded(false); // Close the floating button
      }
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user?.uid) return;
    
    try {
      await firestoreService.markAllNotificationsAsRead(user.uid);
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  // Get the latest admin response for a ticket
  const getLatestAdminResponse = (ticket: SupportTicket) => {
    if (!ticket.responses || ticket.responses.length === 0) return null;
    
    const adminResponses = ticket.responses.filter(response => response.authorType === 'admin');
    if (adminResponses.length === 0) return null;
    
    return adminResponses[adminResponses.length - 1]; // Get the latest admin response
  };

  // Format date for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInHours < 48) return 'Yesterday';
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Show button after a delay
  useEffect(() => {
    if (shouldShow) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setIsExpanded(false);
      setHasLoadedTickets(false);
    }
  }, [shouldShow, location.pathname]);

  // Load tickets when expanded
  useEffect(() => {
    if (isExpanded && user?.uid) {
      loadUserTickets();
      loadUserNotifications(); // Load notifications when expanded
    }
  }, [isExpanded, user?.uid]);

  const handleRaiseTicket = () => {
    setIsExpanded(false);
    setShowForm(true);
  };

  const handleHide = () => {
    setIsVisible(false);
    // Show again after 60 seconds
    setTimeout(() => {
      if (shouldShow) setIsVisible(true);
    }, 60000);
  };

  if (!shouldShow) return null;

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
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
              x: 100,
              opacity: 0,
              transition: { duration: 0.3 }
            }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div className="relative">
              {/* Main Button Container */}
              <motion.div
                className={`
                  bg-card border border-border rounded-lg shadow-lg backdrop-blur-sm
                  transition-all duration-300 ease-in-out cursor-pointer
                  ${isExpanded ? 'w-80' : 'w-14'}
                `}
                onClick={isExpanded ? undefined : () => setIsExpanded(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center">
                  {/* Toggle Icon */}
                  <div className="flex items-center justify-center w-14 h-14 relative">
                    {isExpanded ? (
                      <X className="w-5 h-5 text-muted-foreground" onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(false);
                      }} />
                    ) : (
                      <motion.div
                        animate={{
                          rotate: [0, 10, -10, 0],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 5
                        }}
                      >
                        <Ticket className="w-6 h-6 text-primary" />
                      </motion.div>
                    )}
                    
                    {/* Notification Badge */}
                    {unreadCount > 0 && !isExpanded && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </motion.div>
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
                        className="flex items-center gap-3 pr-4 py-3"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">
                            Support Center
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user?.uid ? 'View your tickets & responses' : 'Submit a support ticket'}
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
                    className="mt-3 space-y-3 max-h-64 overflow-y-auto"
                  >
                    {/* User Tickets Responses Section */}
                    {user?.uid && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground px-1">
                          Your Support Tickets
                        </div>
                        
                        {loadingTickets ? (
                          <div className="flex items-center justify-center py-2">
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : userTickets.length > 0 ? (
                          <div className="space-y-2">
                            {userTickets.slice(0, 2).map((ticket) => {
                              const adminResponse = getLatestAdminResponse(ticket);
                              
                              return (
                                <motion.div
                                  key={ticket.id}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="bg-muted/50 rounded-md p-2 text-xs"
                                >
                                  <div className="font-medium text-foreground truncate">
                                    {ticket.subject}
                                  </div>
                                  
                                  {adminResponse ? (
                                    <div className="mt-1 flex items-start gap-1">
                                      <MessageCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                      <div className="text-muted-foreground">
                                        <div className="font-medium text-green-600">Support Response:</div>
                                        <div className="text-xs line-clamp-2">
                                          {adminResponse.message}
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                                      <Clock className="w-3 h-3" />
                                      <span className="text-xs">
                                        We'll get back to you soon
                                      </span>
                                    </div>
                                  )}
                                  
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    Status: <span className="capitalize">{ticket.status}</span>
                                  </div>
                                </motion.div>
                              );
                            })}
                            
                            {userTickets.length > 2 && (
                              <Button
                                onClick={() => navigate('/admin/manage-tickets')}
                                variant="ghost"
                                className="w-full text-xs"
                                size="sm"
                              >
                                View All Tickets ({userTickets.length})
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground text-center py-2">
                            No tickets yet. Raise your first one!
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Notifications Section */}
                    {user?.uid && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Bell className="w-3 h-3" />
                            Notifications
                            {unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-4 text-center">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          {unreadCount > 0 && (
                            <Button
                              onClick={markAllAsRead}
                              variant="ghost"
                              size="sm"
                              className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              Mark all read
                            </Button>
                          )}
                        </div>
                        
                        {loadingNotifications ? (
                          <div className="flex items-center justify-center py-2">
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : notifications.length > 0 ? (
                          <div className="space-y-2">
                            {notifications.slice(0, 3).map((notification) => (
                              <motion.div
                                key={notification.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`bg-muted/50 rounded-md p-2 text-xs cursor-pointer transition-colors hover:bg-muted/70 ${
                                  !notification.isRead ? 'ring-1 ring-primary/20' : ''
                                }`}
                                onClick={() => navigateToContent(notification)}
                              >
                                <div className="font-medium text-foreground truncate">
                                  {notification.title}
                                </div>
                                <div className="text-muted-foreground line-clamp-2 mt-1">
                                  {notification.message}
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(notification.createdAt)}
                                  </span>
                                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                </div>
                              </motion.div>
                            ))}
                            
                            {notifications.length > 3 && (
                              <Button
                                onClick={() => {
                                  // Could open a full notifications dialog
                                  toast('Full notifications view coming soon!');
                                }}
                                variant="ghost"
                                className="w-full text-xs"
                                size="sm"
                              >
                                View All Notifications ({notifications.length})
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground text-center py-2">
                            No notifications yet
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Original Action Buttons */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      {user?.uid && userTickets.length > 0 && (
                        <Button
                          onClick={() => setShowResponsesDialog(true)}
                          className="w-full text-sm"
                          size="sm"
                          variant="default"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          View All Responses
                        </Button>
                      )}
                      
                      <Button
                        onClick={handleRaiseTicket}
                        className="w-full text-sm"
                        size="sm"
                      >
                        <Ticket className="w-4 h-4 mr-2" />
                        {user?.uid ? 'New Ticket' : 'Raise Support Ticket'}
                      </Button>
                      
                     {user?.uid && userTickets.length > 0 && (
                       <Button
                         onClick={() => setShowResponsesDialog(true)}
                         variant="outline"
                         className="w-full text-xs"
                         size="sm"
                       >
                         <MessageCircle className="w-3 h-3 mr-1" />
                         View Responses
                       </Button>
                     )}
                     
                     <Button
                       onClick={handleHide}
                       variant="ghost"
                       className="w-full text-xs"
                       size="sm"
                     >
                       Hide for 1 min
                     </Button>
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>

             {/* Pulse Animation Indicator */}
             {!isExpanded && (
               <motion.div
                 className="absolute -top-1 -right-1 w-4 h-4 bg-primary/20 rounded-full"
                 animate={{
                   scale: [1, 1.3, 1],
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

     {/* Support Ticket Form Dialog */}
     <Dialog open={showForm} onOpenChange={setShowForm}>
       <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
         <SupportTicketForm
           onSuccess={() => setShowForm(false)}
           onCancel={() => setShowForm(false)}
         />
       </DialogContent>
     </Dialog>

     {/* Ticket Responses Dialog */}
     <TicketResponsesDialog
       isOpen={showResponsesDialog}
       onClose={() => setShowResponsesDialog(false)}
       tickets={userTickets}
       user={user}
     />
   </>
 );
};