import { Link } from "react-router-dom";
import { Play, Eye, Clock, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video } from "@/lib/firestore";
import { motion } from "framer-motion";
import { getOptimizedVideoUrl } from "@/lib/cloudinary";

interface VideoCardProps {
  video: Video;
}

export const VideoCard = ({ video }: VideoCardProps) => {
  // Handle both old and new field names for backward compatibility
  const videoUrl = video.url || video.videoUrl || '';
  const thumbnailUrl = video.thumbnail || video.thumbnailUrl ||
    (videoUrl ? getOptimizedVideoUrl(videoUrl, { quality: 'auto:eco' }) : null);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/video/${video.id}`}>
        <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group border border-border/50 hover:border-primary/20">
          <div className="relative overflow-hidden rounded-t-lg bg-muted">
            {thumbnailUrl ? (
              <motion.img
                src={thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover aspect-video"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              />
            ) : (
              <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <Play className="h-16 w-16 text-primary/60 group-hover:text-primary/80 transition-colors" />
              </div>
            )}
            
            {/* Play overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.8 }}
                whileHover={{ scale: 1 }}
                className="bg-white/20 backdrop-blur-sm rounded-full p-4"
              >
                <Play className="h-8 w-8 text-white" />
              </motion.div>
            </div>

            {/* Duration badge */}
            {video.duration && (
              <Badge variant="secondary" className="absolute bottom-2 right-2 bg-black/70 text-white">
                <Clock className="h-3 w-3 mr-1" />
                {video.duration}
              </Badge>
            )}
          </div>
          
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">{video.category}</Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="h-3 w-3" />
                <span>{video.views?.toLocaleString() || 0}</span>
              </div>
            </div>
            <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors text-base font-semibold">
              {video.title}
            </CardTitle>
            <CardDescription className="line-clamp-2 text-sm leading-relaxed">
              {video.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Play className="h-4 w-4" />
                <span>Video Tutorial</span>
              </div>
              {video.author && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span className="text-xs">{video.author}</span>
                </div>
              )}
            </div>
            
            {/* Tags */}
            {video.tags && video.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {video.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs px-2 py-0.5">
                    {tag}
                  </Badge>
                ))}
                {video.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">
                    +{video.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};
