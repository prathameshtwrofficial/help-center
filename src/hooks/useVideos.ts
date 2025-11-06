import { useState, useEffect } from "react";
import { firestoreService, Video } from "@/lib/firestore";

export function useVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const allVideos = await firestoreService.getVideos(false);
      setVideos(allVideos);
    } catch (error) {
      console.error('Error loading videos:', error);
      setError('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const refreshVideos = async () => {
    await loadVideos();
  };

  return {
    videos,
    loading,
    error,
    loadVideos,
    refreshVideos
  };
}

export function useVideo(videoId: string) {
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (videoId) {
      loadVideo(videoId);
    }
  }, [videoId]);

  const loadVideo = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const videoData = await firestoreService.getVideo(id);
      setVideo(videoData);
    } catch (error) {
      console.error('Error loading video:', error);
      setError('Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async () => {
    if (video) {
      try {
        const newViewCount = (video.views || 0) + 1;
        await firestoreService.updateVideo(video.id!, { views: newViewCount });
        setVideo(prev => prev ? { ...prev, views: newViewCount } : null);
      } catch (error) {
        console.error('Error incrementing views:', error);
      }
    }
  };

  return {
    video,
    loading,
    error,
    loadVideo,
    incrementViews
  };
}