import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, User, Eye, HelpCircle, Tag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CommentSystem } from "@/components/common/CommentSystem";
import { ContentFeedback } from "@/components/common/ContentFeedback";
import { firestoreService, FAQ } from "@/lib/firestore";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";
import { useApp } from "@/context/AppContext";

export default function FAQView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userProfile, logout } = useApp();
  const [faq, setFaq] = useState<FAQ | null>(null);
  const [relatedFaqs, setRelatedFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadFAQ();
    }
  }, [id]);

  const loadFAQ = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!id) {
        setError("Invalid FAQ ID");
        return;
      }
      
      // Get all FAQs and find the one with matching ID
      const faqs = await firestoreService.getFAQs(false); // Get all FAQs
      
      const foundFaq = faqs.find((f: any) => f.id === id);
      
      if (!foundFaq) {
        setError(`FAQ not found with ID: ${id}`);
        return;
      }
      
      // Check if FAQ is published (visible to users)
      if (foundFaq.status !== 'published') {
        setError("This FAQ is not publicly available");
        return;
      }
      
      setFaq(foundFaq);
      
      // Update view count
      try {
        await firestoreService.updateFAQ(foundFaq.id, {
          views: (foundFaq.views || 0) + 1
        });
      } catch (updateError) {
        console.error('Failed to update view count:', updateError);
        // Don't fail the entire component if view count update fails
      }
      
      // Load related FAQs from the same category
      const related = faqs
        .filter((f: any) => f.id !== id && f.category === foundFaq.category && f.status === 'published')
        .slice(0, 4);
      setRelatedFaqs(related);
      
    } catch (error) {
      console.error('Error loading FAQ:', error);
      setError(`Failed to load FAQ: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Recently';
    }
  };

  // Single component with conditional rendering - No more multiple returns
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar is now handled globally in App.tsx - no need for duplicate */}

      <div className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => navigate('/faqs')}
            className="mb-6 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to FAQs
          </Button>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading FAQ...</p>
              </div>
            </div>
          ) : error || !faq ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground mb-4">
                  {error || 'FAQ not found'}
                </h1>
                <Button onClick={() => navigate('/faqs')} className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to FAQs
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Main FAQ */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">{faq.category}</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span>{(faq.views || 0).toLocaleString()} views</span>
                    </div>
                  </div>
                  <CardTitle className="text-2xl lg:text-3xl mb-3 flex items-center gap-3">
                    <HelpCircle className="w-8 h-8 text-primary" />
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="prose prose-lg max-w-none">
                    <div className="text-base leading-relaxed text-foreground">
                      {faq.answer.split('\n').map((paragraph, index) => (
                        paragraph.trim() ? (
                          <p key={index} className="mb-4 last:mb-0">
                            {paragraph}
                          </p>
                        ) : <br key={index} />
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  {faq.tags && faq.tags.length > 0 && (
                    <div className="mt-8 pt-6 border-t">
                      <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {faq.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FAQ Metadata */}
                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mt-8 pt-6 border-t">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{faq.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {faq.publishedAt ? `Published ${formatDate(faq.publishedAt)}` : `Created ${formatDate(faq.createdAt)}`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Related FAQs */}
              {relatedFaqs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Related FAQs</CardTitle>
                    <CardDescription>
                      Other questions in the {faq.category} category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {relatedFaqs.map((relatedFaq) => (
                        <AccordionItem key={relatedFaq.id} value={relatedFaq.id}>
                          <AccordionTrigger
                            className="text-left hover:text-primary transition-colors cursor-pointer"
                            onClick={() => navigate(`/faq/${relatedFaq.id}`)}
                          >
                            <div className="flex items-center gap-3">
                              <HelpCircle className="w-4 h-4 text-primary flex-shrink-0" />
                              <span className="font-medium">{relatedFaq.question}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {relatedFaq.answer.substring(0, 200)}
                            {relatedFaq.answer.length > 200 && '...'}
                            <Button
                              variant="link"
                              className="p-0 h-auto ml-2 text-primary"
                              onClick={() => navigate(`/faq/${relatedFaq.id}`)}
                            >
                              Read more
                            </Button>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              )}

              {/* Content Feedback - Rating and Helpful/Not Helpful */}
              <ContentFeedback
                contentType="faq"
                contentId={faq.id!}
                contentTitle={faq.question}
              />

              {/* Comments Section */}
              <CommentSystem
                contentType="faq"
                contentId={faq.id!}
                contentTitle={faq.question}
              />
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}