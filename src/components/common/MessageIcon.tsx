import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Bell, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User as FirebaseUser } from "firebase/auth";
import { supportTicketService, SupportTicket } from "@/lib/contentService";

interface MessageIconProps {
  user?: FirebaseUser | null;
}

interface UserPreferences {
  readResponseIds: string[];
  lastCheck: number;
}

export const MessageIcon = ({ user }: MessageIconProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userTickets, setUserTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasUnreadResponses, setHasUnreadResponses] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const preferencesRef = useRef<UserPreferences>({ readResponseIds: [], lastCheck: 0 });

  // Only show on non-admin pages
  const isPublicPage = !window.location.pathname.startsWith('/admin');

  // Load user preferences from localStorage
  const loadUserPreferences = () => {
    if (!user?.uid) return;
    
    try {
      const stored = localStorage.getItem(`user_prefs_${user.uid}`);
      if (stored) {
        preferencesRef.current = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  // Save user preferences to localStorage
  const saveUserPreferences = () => {
    if (!user?.uid) return;
    
    try {
      localStorage.setItem(`user_prefs_${user.uid}`, JSON.stringify({
        ...preferencesRef.current,
        lastCheck: Date.now()
      }));
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  };

  // Check for new admin responses since last check
  const checkForNewResponses = (tickets: SupportTicket[]) => {
    const { readResponseIds } = preferencesRef.current;
    let newResponses: string[] = [];
    let totalUnread = 0;

    tickets.forEach(ticket => {
      if (!ticket.responses || ticket.responses.length === 0) return;
      
      ticket.responses.forEach(response => {
        // Only consider admin responses
        if (response.authorType !== 'admin') return;
        
        const responseId = `${ticket.id}_${response.createdAt?.toMillis() || Date.now()}`;
        
        // Check if this is a new response (not in read list)
        if (!readResponseIds.includes(responseId)) {
          newResponses.push(responseId);
          totalUnread++;
        }
      });
    });

    return { newResponses, totalUnread };
  };

  // Mark all current responses as read
  const markResponsesAsRead = (tickets: SupportTicket[]) => {
    const readResponseIds: string[] = [];
    
    tickets.forEach(ticket => {
      if (!ticket.responses || ticket.responses.length === 0) return;
      
      ticket.responses.forEach(response => {
        if (response.authorType === 'admin') {
          const responseId = `${ticket.id}_${response.createdAt?.toMillis() || Date.now()}`;
          readResponseIds.push(responseId);
        }
      });
    });

    preferencesRef.current.readResponseIds = readResponseIds;
    saveUserPreferences();
  };

  // Load user tickets - SECURITY ENHANCEMENT
  const loadUserTickets = async () => {
    if (!user?.uid || loading) return;
    
    setLoading(true);
    try {
      const tickets = await supportTicketService.getByUser(user.uid);
      
      // SECURITY: Additional validation to ensure only user's tickets
      const validatedTickets = tickets.filter(ticket => {
        if (ticket.userId !== user.uid) {
          console.warn('SECURITY: Filtering out ticket from different user in MessageIcon', {
            ticketUserId: ticket.userId,
            currentUserId: user.uid,
            ticketId: ticket.id
          });
          return false;
        }
        return true;
      });
      
      setUserTickets(validatedTickets);
      
      // Check for new responses only for user's own tickets
      const { newResponses, totalUnread } = checkForNewResponses(validatedTickets);
      
      setHasUnreadResponses(newResponses.length > 0);
      setUnreadCount(totalUnread);
      
      // Auto-mark as read when dialog is opened
      if (isOpen && newResponses.length > 0) {
        markResponsesAsRead(validatedTickets);
        setHasUnreadResponses(false);
        setUnreadCount(0);
      }
      
      console.log(`SECURITY: MessageIcon loaded ${validatedTickets.length} validated tickets for user ${user.uid}`);
    } catch (error) {
      console.error('Error loading user tickets:', error);
      // On error, ensure no data is set to prevent showing wrong information
      setUserTickets([]);
      setHasUnreadResponses(false);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Handle dialog open - mark all as read
  const handleOpenDialog = () => {
    setIsOpen(true);
    if (hasUnreadResponses && userTickets.length > 0) {
      markResponsesAsRead(userTickets);
      setHasUnreadResponses(false);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    loadUserPreferences();
  }, [user?.uid]);

  useEffect(() => {
    if (isOpen && user?.uid) {
      loadUserTickets();
    }
  }, [isOpen, user?.uid]);

  useEffect(() => {
    // Auto-load tickets for users with tickets
    if (user?.uid) {
      loadUserTickets();
    }
  }, [user?.uid]);

  useEffect(() => {
    // Poll for new responses every 30 seconds when user has tickets
    if (user?.uid && userTickets.length > 0) {
      const interval = setInterval(() => {
        loadUserTickets();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user?.uid, userTickets.length]);

  if (!isPublicPage || !user) return null;

  const getLatestAdminResponse = (ticket: SupportTicket) => {
    if (!ticket.responses || ticket.responses.length === 0) return null;
    const adminResponses = ticket.responses.filter(response => response.authorType === 'admin');
    if (adminResponses.length === 0) return null;
    return adminResponses[adminResponses.length - 1];
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-6 z-50">
        <Button
          onClick={handleOpenDialog}
          className={`rounded-full w-12 h-12 shadow-lg relative transition-all duration-300 ${
            hasUnreadResponses
              ? 'bg-blue-600 hover:bg-blue-700 animate-pulse'
              : 'bg-gray-600 hover:bg-gray-700'
          }`}
          size="sm"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          {hasUnreadResponses && (
            <div className="absolute -top-1 -right-1 flex items-center gap-1">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-xs font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
              </div>
              <div className="w-2 h-2 bg-white rounded-full animate-ping absolute -top-1 -right-1"></div>
            </div>
          )}
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="flex items-center justify-between gap-2 text-xl font-bold text-gray-900">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-blue-600" />
                <span>Support Ticket Responses</span>
                {hasUnreadResponses && (
                  <Badge variant="destructive" className="animate-pulse bg-red-500 text-white">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading responses...</p>
              </div>
            ) : userTickets.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Support Tickets</h3>
                <p className="text-muted-foreground">
                  You haven't created any support tickets yet.
                </p>
              </div>
            ) : (
              userTickets.map((ticket) => {
                const adminResponse = getLatestAdminResponse(ticket);
                const hasNewResponse = ticket.responses?.some(response =>
                  response.authorType === 'admin' &&
                  !preferencesRef.current.readResponseIds.includes(
                    `${ticket.id}_${response.createdAt?.toMillis() || Date.now()}`
                  )
                );

                return (
                  <div key={ticket.id} className={`border rounded-lg p-6 space-y-4 ${
                    hasNewResponse ? 'bg-blue-50 border-blue-200' : ''
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{ticket.subject}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Created {formatDate(ticket.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasNewResponse && (
                          <Badge variant="default" className="bg-blue-600">
                            <Bell className="w-3 h-3 mr-1" />
                            New
                          </Badge>
                        )}
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                          ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          ticket.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {ticket.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    {/* User's original message */}
                    <div className="bg-gray-50 border rounded-lg p-4">
                      <h5 className="font-medium text-sm text-gray-700 mb-2">Your Message:</h5>
                      <p className="text-gray-600">{ticket.description}</p>
                    </div>
                    
                    {/* Admin responses */}
                    {adminResponse ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Support Response Received</span>
                        </div>
                        
                        {ticket.responses?.filter(r => r.authorType === 'admin').map((response, index) => {
                          const responseId = `${ticket.id}_${response.createdAt?.toMillis() || Date.now()}`;
                          const isNew = !preferencesRef.current.readResponseIds.includes(responseId);
                          
                          return (
                            <div key={index} className={`border rounded-lg p-4 ${
                              isNew ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
                            }`}>
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                                    <MessageCircle className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <span className="font-medium text-green-800">Support Team</span>
                                    <p className="text-xs text-green-600">{formatDate(response.createdAt)}</p>
                                  </div>
                                </div>
                                {isNew && (
                                  <Badge variant="outline" className="text-blue-600 border-blue-300">
                                    New
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-green-700 whitespace-pre-wrap">{response.message}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm font-medium text-yellow-800">Pending Response</span>
                        </div>
                        <p className="text-sm text-yellow-700">
                          We'll get back to you soon. Thank you for your patience!
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};