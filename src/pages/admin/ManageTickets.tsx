import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Reply, Trash2, Eye, Calendar, User, MessageCircle, CheckCircle, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { supportTicketService } from '@/lib/contentService';
import { useApp } from '@/context/AppContext';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timestamp } from 'firebase/firestore';

interface SupportTicketItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: string;
  priority: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  description: string;
  assignedTo?: string;
  createdAt: any;
  updatedAt: any;
  responses?: any[];
}

export default function ManageTickets() {
  const { user, userProfile } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0
  });

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, selectedStatus, selectedPriority]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const allTickets = await supportTicketService.getAll(100);
      setTickets(allTickets as SupportTicketItem[]);

      // Calculate stats
      const openCount = allTickets.filter(t => t.status === 'open').length;
      const inProgressCount = allTickets.filter(t => t.status === 'in-progress').length;
      const resolvedCount = allTickets.filter(t => t.status === 'resolved').length;
      const urgentCount = allTickets.filter(t => t.priority === 'urgent').length;
      
      setStats({
        total: allTickets.length,
        open: openCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        urgent: urgentCount
      });

    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = tickets;

    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus !== "All") {
      filtered = filtered.filter(ticket => ticket.status === selectedStatus);
    }

    if (selectedPriority !== "All") {
      filtered = filtered.filter(ticket => ticket.priority === selectedPriority);
    }

    setFilteredTickets(filtered);
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: 'open' | 'in-progress' | 'resolved' | 'closed') => {
    try {
      await supportTicketService.update(ticketId, {
        status: newStatus,
        ...(newStatus === 'resolved' ? { resolvedAt: Timestamp.now() } : {})
      });
      toast.success(`Ticket status updated to ${newStatus}`);
      loadTickets();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Failed to update ticket status');
    }
  };

  const handleAddResponse = async () => {
    if (!selectedTicket || !responseMessage.trim()) return;

    setIsSubmittingResponse(true);
    try {
      const response = {
        ticketId: selectedTicket.id,
        authorId: user?.uid || '',
        authorName: userProfile?.displayName || 'Admin',
        authorType: 'admin' as const,
        message: responseMessage.trim()
      };

      await supportTicketService.addResponse(selectedTicket.id, response);
      toast.success('Response added successfully');
      setResponseMessage('');
      setSelectedTicket(null);
      loadTickets();
    } catch (error) {
      console.error('Error adding response:', error);
      toast.error('Failed to add response');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading support tickets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Support Tickets</h1>
              <p className="text-muted-foreground mt-1">
                Manage user support requests and ticket responses
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.open}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Urgent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search tickets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={selectedStatus === "All" ? "default" : "outline"}
                    onClick={() => setSelectedStatus("All")}
                  >
                    All Status
                  </Button>
                  <Button
                    variant={selectedStatus === "open" ? "default" : "outline"}
                    onClick={() => setSelectedStatus("open")}
                  >
                    Open
                  </Button>
                  <Button
                    variant={selectedStatus === "in-progress" ? "default" : "outline"}
                    onClick={() => setSelectedStatus("in-progress")}
                  >
                    In Progress
                  </Button>
                  <Button
                    variant={selectedStatus === "resolved" ? "default" : "outline"}
                    onClick={() => setSelectedStatus("resolved")}
                  >
                    Resolved
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tickets List */}
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets ({filteredTickets.length})</CardTitle>
              <CardDescription>
                Review and respond to user support requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTickets.map((ticket) => (
                  <div key={ticket.id} className="border border-border rounded-lg p-6 hover:bg-accent transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-foreground truncate">
                            {ticket.subject}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                          <Badge variant="outline">{ticket.category}</Badge>
                        </div>
                        <p className="text-muted-foreground mb-3 line-clamp-2">
                          {ticket.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {ticket.userName} ({ticket.userEmail})
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(ticket.createdAt)}
                          </span>
                          {ticket.responses && ticket.responses.length > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              {ticket.responses.length} responses
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTicket(ticket)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Ticket Details</DialogTitle>
                              <DialogDescription>
                                Review and respond to this support ticket
                              </DialogDescription>
                            </DialogHeader>
                            {selectedTicket && (
                              <div className="space-y-6">
                                {/* Ticket Info */}
                                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                                  <div>
                                    <strong>Subject:</strong> {selectedTicket.subject}
                                  </div>
                                  <div>
                                    <strong>Status:</strong> 
                                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedTicket.status)}`}>
                                      {selectedTicket.status}
                                    </span>
                                  </div>
                                  <div>
                                    <strong>Category:</strong> {selectedTicket.category}
                                  </div>
                                  <div>
                                    <strong>Priority:</strong> 
                                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                                      {selectedTicket.priority}
                                    </span>
                                  </div>
                                  <div>
                                    <strong>User:</strong> {selectedTicket.userName} ({selectedTicket.userEmail})
                                  </div>
                                  <div>
                                    <strong>Created:</strong> {formatDate(selectedTicket.createdAt)}
                                  </div>
                                </div>

                                {/* Description */}
                                <div>
                                  <h4 className="font-medium mb-2">Description</h4>
                                  <p className="text-muted-foreground bg-muted p-4 rounded-lg">
                                    {selectedTicket.description}
                                  </p>
                                </div>

                                {/* Responses */}
                                {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Conversation History</h4>
                                    <div className="space-y-3 max-h-60 overflow-y-auto">
                                      {selectedTicket.responses.map((response: any, index: number) => (
                                        <div key={index} className={`p-3 rounded-lg ${response.authorType === 'admin' ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50'}`}>
                                          <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium text-sm">
                                              {response.authorName} ({response.authorType})
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                              {formatDate(response.createdAt)}
                                            </span>
                                          </div>
                                          <p className="text-sm">{response.message}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Add Response */}
                                <div>
                                  <h4 className="font-medium mb-2">Add Response</h4>
                                  <Textarea
                                    value={responseMessage}
                                    onChange={(e) => setResponseMessage(e.target.value)}
                                    placeholder="Type your response here..."
                                    className="mb-3"
                                    rows={4}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={handleAddResponse}
                                      disabled={!responseMessage.trim() || isSubmittingResponse}
                                    >
                                      {isSubmittingResponse ? 'Sending...' : 'Send Response'}
                                    </Button>
                                  </div>
                                </div>

                                {/* Status Actions */}
                                <div>
                                  <h4 className="font-medium mb-2">Update Status</h4>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleUpdateStatus(ticket.id, 'in-progress')}
                                      disabled={selectedTicket.status === 'in-progress'}
                                    >
                                      Mark In Progress
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                                      disabled={selectedTicket.status === 'resolved'}
                                      className="text-green-600 hover:text-green-700"
                                    >
                                      Mark Resolved
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleUpdateStatus(ticket.id, 'closed')}
                                      disabled={selectedTicket.status === 'closed'}
                                    >
                                      Close Ticket
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}