import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Ticket, Upload, AlertCircle } from 'lucide-react';
import { supportTicketService } from '@/lib/contentService';
import { useApp } from '@/context/AppContext';
import toast from 'react-hot-toast';

interface SupportTicketFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const SupportTicketForm: React.FC<SupportTicketFormProps> = ({ onSuccess, onCancel }) => {
  const { user, userProfile } = useApp();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    description: '',
  });

  const categories = [
    { value: 'technical', label: 'Technical Issue', description: 'Having trouble with the platform' },
    { value: 'billing', label: 'Billing', description: 'Payment or subscription issues' },
    { value: 'account', label: 'Account', description: 'Account management questions' },
    { value: 'feature-request', label: 'Feature Request', description: 'Suggest a new feature' },
    { value: 'bug-report', label: 'Bug Report', description: 'Report a bug or error' },
    { value: 'other', label: 'Other', description: 'Something else' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', description: 'Not urgent, can wait' },
    { value: 'medium', label: 'Medium', description: 'Normal priority' },
    { value: 'high', label: 'High', description: 'Needs attention soon' },
    { value: 'urgent', label: 'Urgent', description: 'Critical issue' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to submit a support ticket');
      return;
    }

    if (!formData.subject.trim() || !formData.category || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const ticketData = {
        userId: user.uid,
        userName: userProfile?.displayName || user.email || 'Anonymous',
        userEmail: user.email || '',
        subject: formData.subject.trim(),
        category: formData.category as any,
        priority: formData.priority as any,
        status: 'open' as const,
        description: formData.description.trim(),
        attachments: [],
        responses: []
      };

      const ticketId = await supportTicketService.create(ticketData);
      
      toast.success('Support ticket submitted successfully! We\'ll get back to you soon.');
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      toast.error('Failed to submit support ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Sign In Required
          </CardTitle>
          <CardDescription>
            Please sign in to submit a support ticket.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          Submit Support Ticket
        </CardTitle>
        <CardDescription>
          Tell us about your issue and we'll help you resolve it as quickly as possible.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subject */}
            <div className="md:col-span-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Brief description of your issue"
                disabled={isSubmitting}
                className="mt-1"
                required
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div>
                        <div className="font-medium">{category.label}</div>
                        <div className="text-sm text-muted-foreground">{category.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      <div>
                        <div className="font-medium">{priority.label}</div>
                        <div className="text-sm text-muted-foreground">{priority.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Please provide detailed information about your issue..."
              disabled={isSubmitting}
              className="mt-1 min-h-[120px]"
              required
            />
          </div>

          {/* File Upload Placeholder */}
          <Alert>
            <Upload className="h-4 w-4" />
            <AlertDescription>
              File attachments coming soon. For now, please include relevant details in the description above.
            </AlertDescription>
          </Alert>

          {/* User Info Display */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Your Information</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Name:</strong> {userProfile?.displayName || 'Not provided'}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Ticket ID:</strong> Will be generated automatically</p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Ticket'
              )}
            </Button>
            
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};