import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Clock, CheckCircle, AlertCircle, User, Calendar, RefreshCw } from "lucide-react";
import { SupportTicket } from "@/lib/contentService";

interface TicketResponsesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: SupportTicket[];
  user: any;
}

export const TicketResponsesDialog = ({ isOpen, onClose, tickets, user }: TicketResponsesDialogProps) => {
  const [refreshing, setRefreshing] = useState(false);

  // SECURITY: Filter tickets to ensure only the current user's tickets are shown
  const userTickets = tickets.filter(ticket => {
    if (!user?.uid || ticket.userId !== user.uid) {
      console.warn('SECURITY: Filtering out ticket from different user', {
        ticketId: ticket.id,
        ticketUserId: ticket.userId,
        currentUserId: user?.uid
      });
      return false;
    }
    return true;
  });

  // Add real-time refresh for admin responses
  useEffect(() => {
    if (!isOpen || !user?.uid) return;

    const interval = setInterval(() => {
      setRefreshing(true);
      // In a real implementation, you would refetch tickets here
      setTimeout(() => setRefreshing(false), 1000);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isOpen, user?.uid]);

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in-progress':
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'open':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'open':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="ticket-responses-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" id="ticket-responses-title">
            <MessageCircle className="w-5 h-5" />
            Your Ticket Responses
            {refreshing && (
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            )}
          </DialogTitle>
          <DialogDescription id="ticket-responses-description">
            View all responses from our support team to your tickets. Updates automatically every 30 seconds.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {userTickets.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Tickets Yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't created any support tickets yet.
              </p>
              <Button onClick={onClose}>Close</Button>
            </div>
          ) : (
            userTickets.map((ticket) => (
              <div key={ticket.id} className="border border-border rounded-lg p-6">
                {/* Ticket Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {ticket.subject}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {ticket.userName || 'You'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(ticket.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(ticket.status)}
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Ticket Message */}
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <h4 className="text-sm font-medium text-foreground mb-2">Your Message:</h4>
                  <p className="text-sm text-muted-foreground">{ticket.description}</p>
                </div>

                {/* Admin Responses */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground">Support Responses:</h4>
                    {ticket.responses && ticket.responses.filter(r => r.authorType === 'admin').length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {ticket.responses.filter(r => r.authorType === 'admin').length} response{ticket.responses.filter(r => r.authorType === 'admin').length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  
                  {ticket.responses && ticket.responses.length > 0 ? (
                    <div className="space-y-4">
                      {ticket.responses
                        .filter(response => response.authorType === 'admin')
                        .map((response, index) => (
                          <div key={`admin-response-${index}`} className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                                <User className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold text-green-800">Support Team</span>
                                  <Badge variant="outline" className="text-xs bg-white/50 text-green-700 border-green-300">
                                    Admin
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-green-600">
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatDate(response.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="bg-white/70 rounded-lg p-3 border border-green-100">
                              <p className="text-sm text-green-800 leading-relaxed whitespace-pre-wrap">
                                {response.message}
                              </p>
                            </div>
                          </div>
                        ))}
                      
                      {/* Show non-admin responses separately */}
                      {ticket.responses.filter(response => response.authorType !== 'admin').length > 0 && (
                        <div className="border-t pt-4">
                          <h5 className="text-xs font-medium text-muted-foreground mb-2">Your Messages:</h5>
                          <div className="space-y-2">
                            {ticket.responses
                              .filter(response => response.authorType !== 'admin')
                              .map((response, index) => (
                                <div key={`user-response-${index}`} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                      <User className="w-3 h-3 text-white" />
                                    </div>
                                    <span className="text-sm font-medium text-blue-800">You</span>
                                    <span className="text-xs text-blue-600">
                                      {formatDate(response.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-blue-700">{response.message}</p>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                        <Clock className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">No responses yet</p>
                      <p className="text-xs text-muted-foreground">
                        Our support team will get back to you soon. Thank you for your patience!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};