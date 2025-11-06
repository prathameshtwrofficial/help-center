import { Link } from "react-router-dom";
import { FileText, Eye, Calendar, Clock, Image } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Article } from "@/lib/firestore";

interface ArticleCardProps {
  article: Article;
}

export const ArticleCard = ({ article }: ArticleCardProps) => {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString();
    } catch (error) {
      return 'Recently';
    }
  };

  // Extract first image from content for thumbnail
  const extractThumbnail = (content: string) => {
    if (!content) return null;
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    return imgMatch ? imgMatch[1] : null;
  };

  const thumbnail = extractThumbnail(article.content);

  return (
    <Link to={`/article/${article.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group overflow-hidden">
        {/* Always show thumbnail section - with orange placeholder if no image */}
        <div className={`relative h-48 overflow-hidden ${!thumbnail ? 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600' : ''}`}>
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white">
              {/* Orange placeholder with icon */}
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300">
                <Image className="w-10 h-10 text-white" />
              </div>
              <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-sm text-white font-semibold">
                  {article.category || 'Article'}
                </span>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-4 left-4 w-3 h-3 bg-white/30 rounded-full"></div>
              <div className="absolute top-6 right-8 w-2 h-2 bg-white/20 rounded-full"></div>
              <div className="absolute bottom-4 right-4 w-4 h-4 bg-white/25 rounded-full"></div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Badge variant="secondary">{article.category}</Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              <span>{article.views || 0}</span>
            </div>
          </div>
          <CardTitle className="line-clamp-2 group-hover:text-emerald-500 transition-colors text-lg">
            {article.title}
          </CardTitle>
          <CardDescription className="line-clamp-3">
            {article.excerpt || article.content?.replace(/<[^>]*>/g, '').substring(0, 100) + '...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(article.publishedAt || article.createdAt)}</span>
            </div>
            {article.readTime && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{article.readTime}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{article.author}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
