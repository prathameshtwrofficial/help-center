import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Edit, Trash2, Eye, Calendar, User, HelpCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { faqService, FAQ } from "@/lib/contentService";
import { firestoreService } from "@/lib/firestore";
import { useApp } from "@/context/AppContext";
import toast from "react-hot-toast";

export default function ManageFAQs() {
  const { user } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{id: string, timeout: NodeJS.Timeout} | null>(null);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [newFaq, setNewFaq] = useState({
    question: "",
    answer: "",
    category: "",
    tags: "",
    status: "draft" as 'draft' | 'published'
  });
  const [editFaq, setEditFaq] = useState({
    question: "",
    answer: "",
    category: "",
    tags: "",
    status: "draft" as 'draft' | 'published'
  });
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    avgHelpful: 0
  });

  useEffect(() => {
    loadFaqs();
  }, []);

  useEffect(() => {
    filterFaqs();
  }, [faqs, searchTerm, selectedCategory]);

  const loadFaqs = async () => {
    try {
      setLoading(true);
      const allFaqs = await faqService.getAll(100);
      
      // Calculate helpful votes from contentFeedback collection
      const faqsWithHelpfulVotes = await Promise.all(
        allFaqs.map(async (faq) => {
          try {
            const feedback = await firestoreService.getContentFeedback('faq', faq.id!);
            const helpfulVotes = feedback.filter(f => f.helpful).length;
            return { ...faq, helpful: helpfulVotes };
          } catch (error) {
            return { ...faq, helpful: 0 };
          }
        })
      );
      
      setFaqs(faqsWithHelpfulVotes);

      // Calculate stats
      const published = faqsWithHelpfulVotes.filter(f => f.status === 'published').length;
      const draft = faqsWithHelpfulVotes.filter(f => f.status === 'draft').length;
      const totalHelpful = faqsWithHelpfulVotes.reduce((sum, faq) => sum + (faq.helpful || 0), 0);
      const avgHelpful = faqsWithHelpfulVotes.length > 0
        ? Math.round(totalHelpful / faqsWithHelpfulVotes.length)
        : 0;
      
      setStats({
        total: allFaqs.length,
        published,
        draft,
        avgHelpful
      });

    } catch (error) {
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const filterFaqs = () => {
    let filtered = faqs;

    if (searchTerm) {
      filtered = filtered.filter(faq =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }

    setFilteredFaqs(filtered);
  };

  const handleAddFAQ = () => {
    setShowAddDialog(true);
  };

  const handleAddFaqSubmit = async () => {
    if (!user || !newFaq.question.trim() || !newFaq.answer.trim() || !newFaq.category.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await faqService.create({
        question: newFaq.question,
        answer: newFaq.answer,
        category: newFaq.category,
        tags: newFaq.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        author: user.displayName || user.email || 'Admin',
        status: newFaq.status
      });

      toast.success('FAQ created successfully!');
      setShowAddDialog(false);
      setNewFaq({
        question: "",
        answer: "",
        category: "",
        tags: "",
        status: "draft"
      });
      loadFaqs(); // Refresh the list
    } catch (error) {
      toast.error('Failed to create FAQ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (id: string) => {
    // Find the FAQ to edit
    const faqToEdit = faqs.find(faq => faq.id === id);
    if (!faqToEdit) {
      toast.error('FAQ not found');
      return;
    }

    setEditingFaq(faqToEdit);
    setEditFaq({
      question: faqToEdit.question,
      answer: faqToEdit.answer,
      category: faqToEdit.category,
      tags: faqToEdit.tags?.join(', ') || '',
      status: faqToEdit.status
    });
    setShowEditDialog(true);
  };

  const handleEditFaqSubmit = async () => {
    if (!editingFaq || !editFaq.question.trim() || !editFaq.answer.trim() || !editFaq.category.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await faqService.update(editingFaq.id!, {
        question: editFaq.question,
        answer: editFaq.answer,
        category: editFaq.category,
        tags: editFaq.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        status: editFaq.status
      });

      toast.success('FAQ updated successfully!');
      setShowEditDialog(false);
      setEditingFaq(null);
      setEditFaq({
        question: "",
        answer: "",
        category: "",
        tags: "",
        status: "draft"
      });
      loadFaqs(); // Refresh the list
    } catch (error) {
      toast.error('Failed to update FAQ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Check if this delete button was recently clicked
    if (deleteConfirmation?.id === id) {
      // Second click - actually delete
      if (deleteConfirmation.timeout) {
        clearTimeout(deleteConfirmation.timeout);
      }
      setDeleteConfirmation(null);
      
      try {
        await faqService.delete(id);
        toast.success('FAQ deleted successfully');
        loadFaqs();
      } catch (error) {
        toast.error('Failed to delete FAQ');
      }
    } else {
      // First click - show confirmation state
      if (deleteConfirmation?.timeout) {
        clearTimeout(deleteConfirmation.timeout);
      }
      
      const timeout = setTimeout(() => {
        setDeleteConfirmation(null);
        toast('Delete cancelled', { icon: 'ℹ️' });
      }, 3000); // 3 seconds to click again
      
      setDeleteConfirmation({ id, timeout });
      toast('Click delete again to confirm', { icon: '⚠️' });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      await faqService.update(id, { status: newStatus });
      toast.success(`FAQ ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
      loadFaqs(); // Refresh the list
    } catch (error) {
      toast.error('Failed to update FAQ status');
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

  // Extract unique categories from FAQs
  const categories = ["All", ...Array.from(new Set(faqs.map(faq => faq.category).filter(Boolean)))];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading FAQs...</p>
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
              <h1 className="text-3xl font-bold text-foreground">Manage FAQs</h1>
              <p className="text-muted-foreground mt-1">
                Create, edit, and organize your frequently asked questions
              </p>
            </div>
            <Button onClick={handleAddFAQ} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add FAQ
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total FAQs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.published}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Draft</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Helpful</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgHelpful}</div>
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
                      placeholder="Search FAQs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      onClick={() => setSelectedCategory(category)}
                      size="sm"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQs List */}
          <Card>
            <CardHeader>
              <CardTitle>FAQs ({filteredFaqs.length})</CardTitle>
              <CardDescription>
                Manage your FAQ content and categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((faq) => (
                    <div key={faq.id} className="border border-border rounded-lg p-6 hover:bg-accent transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <HelpCircle className="w-5 h-5 text-muted-foreground" />
                            <h3 className="text-lg font-semibold text-foreground truncate">
                              {faq.question}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              faq.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {faq.status.charAt(0).toUpperCase() + faq.status.slice(1)}
                            </span>
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              {faq.category}
                            </span>
                          </div>
                          <p className="text-muted-foreground mb-3 line-clamp-2">
                            {faq.answer}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {faq.author}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(faq.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-4 h-4">👍</span>
                              {faq.helpful || 0} found this helpful
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/faq/${faq.id}`, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(faq.id!)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(faq.id!, faq.status)}
                          >
                            {faq.status === 'published' ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(faq.id!)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {faqs.length === 0
                      ? "No FAQs found. Start by creating your first FAQ!"
                      : "No FAQs match your current filters."
                    }
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Add FAQ Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New FAQ</DialogTitle>
                <DialogDescription>
                  Create a new frequently asked question for your help center.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question">Question *</Label>
                  <Textarea
                    id="question"
                    placeholder="Enter the FAQ question..."
                    value={newFaq.question}
                    onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="answer">Answer *</Label>
                  <Textarea
                    id="answer"
                    placeholder="Enter the detailed answer..."
                    value={newFaq.answer}
                    onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      placeholder="e.g., Getting Started"
                      value={newFaq.category}
                      onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={newFaq.status} onValueChange={(value: 'draft' | 'published') => setNewFaq({ ...newFaq, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    placeholder="e.g., account, billing, security"
                    value={newFaq.tags}
                    onChange={(e) => setNewFaq({ ...newFaq, tags: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowAddDialog(false);
                      setNewFaq({
                        question: "",
                        answer: "",
                        category: "",
                        tags: "",
                        status: "draft"
                      });
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddFaqSubmit} 
                    disabled={isSubmitting || !newFaq.question.trim() || !newFaq.answer.trim() || !newFaq.category.trim()}
                  >
                    {isSubmitting ? 'Creating...' : 'Create FAQ'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit FAQ Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit FAQ</DialogTitle>
                <DialogDescription>
                  Update the frequently asked question details.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-question">Question *</Label>
                  <Textarea
                    id="edit-question"
                    placeholder="Enter the FAQ question..."
                    value={editFaq.question}
                    onChange={(e) => setEditFaq({ ...editFaq, question: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-answer">Answer *</Label>
                  <Textarea
                    id="edit-answer"
                    placeholder="Enter the detailed answer..."
                    value={editFaq.answer}
                    onChange={(e) => setEditFaq({ ...editFaq, answer: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category *</Label>
                    <Input
                      id="edit-category"
                      placeholder="e.g., Getting Started"
                      value={editFaq.category}
                      onChange={(e) => setEditFaq({ ...editFaq, category: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select value={editFaq.status} onValueChange={(value: 'draft' | 'published') => setEditFaq({ ...editFaq, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                  <Input
                    id="edit-tags"
                    placeholder="e.g., account, billing, security"
                    value={editFaq.tags}
                    onChange={(e) => setEditFaq({ ...editFaq, tags: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowEditDialog(false);
                      setEditingFaq(null);
                      setEditFaq({
                        question: "",
                        answer: "",
                        category: "",
                        tags: "",
                        status: "draft"
                      });
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleEditFaqSubmit} 
                    disabled={isSubmitting || !editFaq.question.trim() || !editFaq.answer.trim() || !editFaq.category.trim()}
                  >
                    {isSubmitting ? 'Updating...' : 'Update FAQ'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}