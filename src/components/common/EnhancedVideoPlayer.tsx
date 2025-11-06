/**
 * Enhanced Video Player with Chunked Loading and Adaptive Streaming
 * Supports smooth playback with automatic quality optimization
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Settings, 
  Loader2,
  Wifi,
  WifiOff,
  AlertCircle,
  Download
} from 'lucide-react';
import { getOptimizedVideoUrl, generateVideoChunks, getVideoMetadata } from '@/lib/cloudinary';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

interface EnhancedVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  autoPlay?: boolean;
  controls?: boolean;
  className?: string;
  onProgress?: (currentTime: number, duration: number) => void;
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
  onError?: (error: Error) => void;
  quality?: 'auto' | 'auto:eco' | 'auto:good' | 'auto:best' | 'auto:low';
  chunkSize?: number;
  adaptiveBitrate?: boolean;
}

interface VideoState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  buffered: number;
  quality: string;
  error: string | null;
  connectionSpeed: 'slow' | 'fast' | 'unknown';
}

export const EnhancedVideoPlayer: React.FC<EnhancedVideoPlayerProps> = ({
  videoUrl,
  thumbnailUrl,
  autoPlay = false,
  controls = true,
  className = '',
  onProgress,
  onLoadStart,
  onLoadComplete,
  onError,
  quality = 'auto',
  chunkSize = 5000,
  adaptiveBitrate = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [videoChunks, setVideoChunks] = useState<string[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [preloadedChunks, setPreloadedChunks] = useState(0);
  
  const [videoState, setVideoState] = useState<VideoState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isLoading: false,
    buffered: 0,
    quality: quality,
    error: null,
    connectionSpeed: 'unknown'
  });

  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize video chunks for progressive loading
  useEffect(() => {
    if (videoUrl) {
      const chunks = generateVideoChunks(videoUrl, {
        chunkSize,
        maxChunks: 10,
        quality: quality
      });
      setVideoChunks(chunks);
      setCurrentChunkIndex(0);
    }
  }, [videoUrl, quality, chunkSize]);

  // Check connection speed for adaptive quality
  const checkConnectionSpeed = useCallback(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === '4g') {
          return 'fast';
        } else if (effectiveType === '3g' || effectiveType === '2g') {
          return 'slow';
        }
      }
    }
    return 'unknown';
  }, []);

  // Adaptive quality adjustment
  const adjustQuality = useCallback((currentSpeed: 'slow' | 'fast' | 'unknown') => {
    if (!adaptiveBitrate) return;

    const newQuality = currentSpeed === 'slow' ? 'auto:eco' : 'auto:best';
    if (newQuality !== videoState.quality) {
      setVideoState(prev => ({ ...prev, quality: newQuality }));
      
      // Regenerate chunks with new quality
      const newChunks = generateVideoChunks(videoUrl, {
        chunkSize,
        maxChunks: 10,
        quality: newQuality
      });
      setVideoChunks(newChunks);
      
      toast({
        title: "Quality Adjusted",
        description: `Video quality adjusted to ${newQuality.replace('auto:', '')} based on connection speed`,
        variant: "default"
      });
    }
  }, [adaptiveBitrate, videoState.quality, videoUrl, chunkSize]);

  // Load video metadata and setup
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      const video = videoRef.current;
      
      const handleLoadStart = () => {
        setVideoState(prev => ({ ...prev, isLoading: true, error: null }));
        onLoadStart?.();
      };

      const handleLoadedMetadata = () => {
        const connectionSpeed = checkConnectionSpeed();
        setVideoState(prev => ({
          ...prev,
          duration: video.duration,
          isLoading: false,
          connectionSpeed
        }));
        
        adjustQuality(connectionSpeed);
        onLoadComplete?.();
      };

      const handleCanPlay = () => {
        setVideoState(prev => ({ ...prev, isLoading: false }));
        
        // Start preloading next chunks
        preloadNextChunks();
      };

      const handlePlay = () => {
        setVideoState(prev => ({ ...prev, isPlaying: true }));
      };

      const handlePause = () => {
        setVideoState(prev => ({ ...prev, isPlaying: false }));
      };

      const handleError = (e: Event) => {
        const error = e.target as HTMLVideoElement;
        const errorMessage = `Video failed to load: ${error.error?.message || 'Unknown error'}`;
        console.error('Video Error:', errorMessage, 'URL:', videoUrl);
        setVideoState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
        onError?.(new Error(errorMessage));
      };

      const handleTimeUpdate = () => {
        setVideoState(prev => ({
          ...prev,
          currentTime: video.currentTime,
          buffered: video.buffered.length > 0 ? video.buffered.end(video.buffered.length - 1) : 0
        }));
        onProgress?.(video.currentTime, video.duration);
      };

      const handleProgress = () => {
        if (video.buffered.length > 0) {
          const buffered = video.buffered.end(video.buffered.length - 1);
          setVideoState(prev => ({ ...prev, buffered }));
          
          // Preload next chunks when buffer gets low
          const bufferGap = buffered - video.currentTime;
          if (bufferGap < 10) { // Preload when less than 10 seconds buffered
            preloadNextChunks();
          }
        }
      };

      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('ended', handlePause);
      video.addEventListener('error', handleError);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('progress', handleProgress);

      return () => {
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('ended', handlePause);
        video.removeEventListener('error', handleError);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('progress', handleProgress);
      };
    }
  }, [videoUrl, checkConnectionSpeed, adjustQuality, onLoadStart, onLoadComplete, onProgress, onError]);

  // Preload next video chunks
  const preloadNextChunks = useCallback(() => {
    if (videoChunks.length === 0) return;

    const video = videoRef.current;
    if (!video) return;

    const nextChunkIndex = currentChunkIndex + 1;
    if (nextChunkIndex < videoChunks.length && preloadedChunks < 3) {
      const img = new Image();
      img.src = videoChunks[nextChunkIndex];
      img.onload = () => {
        setCurrentChunkIndex(nextChunkIndex);
        setPreloadedChunks(prev => prev + 1);
      };
    }
  }, [videoChunks, currentChunkIndex, preloadedChunks]);

  // Play/pause functionality
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // Immediately update UI state for better responsiveness
    if (videoState.isPlaying) {
      video.pause();
    } else {
      // Reset video to beginning if it ended
      if (video.ended) {
        video.currentTime = 0;
      }
      video.play().catch(error => {
        console.error('Play failed:', error);
        setVideoState(prev => ({ ...prev, error: 'Failed to play video', isPlaying: false }));
      });
    }
  }, [videoState.isPlaying]);

  // Volume control
  const handleVolumeChange = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value[0] / 100;
    video.volume = newVolume;
    video.muted = newVolume === 0;
    setVideoState(prev => ({
      ...prev,
      volume: newVolume,
      isMuted: newVolume === 0
    }));
  }, []);

  // Seek functionality
  const handleSeek = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = (value[0] / 100) * videoState.duration;
    video.currentTime = newTime;
    setVideoState(prev => ({ ...prev, currentTime: newTime }));
  }, [videoState.duration]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (videoState.isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [videoState.isPlaying]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Progress percentage
  const progressPercentage = videoState.duration > 0 
    ? (videoState.currentTime / videoState.duration) * 100 
    : 0;

  // Buffer percentage
  const bufferPercentage = videoState.duration > 0
    ? (videoState.buffered / videoState.duration) * 100
    : 0;

  return (
    <div
      className={`relative bg-black rounded-lg overflow-hidden group max-w-full ${className}`}
      style={{
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%'
      }}
      onMouseMove={resetControlsTimeout}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => resetControlsTimeout()}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl}
        autoPlay={autoPlay}
        className="w-full h-full object-contain"
        style={{
          maxWidth: '100%',
          maxHeight: '100%'
        }}
        onClick={togglePlayPause}
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
      />

      {/* Loading Overlay */}
      <AnimatePresence>
        {videoState.isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          >
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-2" />
              <p className="text-white text-sm">Loading video...</p>
              <Progress value={bufferPercentage} className="w-48 mt-2" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Overlay */}
      <AnimatePresence>
        {videoState.error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-900 bg-opacity-80 flex items-center justify-center"
          >
            <div className="text-center text-white">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm mb-2">{videoState.error}</p>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
              >
                Retry
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play/Pause Overlay */}
      <AnimatePresence>
        {!videoState.isPlaying && !videoState.isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Button
              onClick={togglePlayPause}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full w-16 h-16 p-0"
              size="lg"
            >
              <Play className="w-8 h-8 text-white ml-1" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <AnimatePresence>
        {showControls && controls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4"
          >
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="relative">
                {/* Buffered Progress */}
                <div className="absolute top-1/2 transform -translate-y-1/2 h-1 bg-white bg-opacity-30 rounded-full w-full">
                  <div 
                    className="h-full bg-white bg-opacity-50 rounded-full"
                    style={{ width: `${bufferPercentage}%` }}
                  />
                </div>
                {/* Playback Progress */}
                <Slider
                  value={[progressPercentage]}
                  onValueChange={handleSeek}
                  className="w-full"
                  step={0.1}
                />
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Play/Pause */}
                <Button
                  onClick={togglePlayPause}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  {videoState.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>

                {/* Volume */}
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => {
                      const video = videoRef.current;
                      if (video) {
                        const newMuted = !video.muted;
                        video.muted = newMuted;
                        setVideoState(prev => ({
                          ...prev,
                          isMuted: newMuted,
                          volume: newMuted ? prev.volume : prev.volume
                        }));
                      }
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  >
                    {videoState.isMuted ?
                      <VolumeX className="w-5 h-5" /> :
                      <Volume2 className="w-5 h-5" />
                    }
                  </Button>
                  <div className="w-20">
                    <Slider
                      value={[videoState.isMuted ? 0 : videoState.volume * 100]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>

                {/* Time Display */}
                <span className="text-white text-sm font-mono">
                  {formatTime(videoState.currentTime)} / {formatTime(videoState.duration)}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                {/* Connection Status */}
                <div className="flex items-center space-x-1">
                  {videoState.connectionSpeed === 'fast' ? (
                    <Wifi className="w-4 h-4 text-green-400" />
                  ) : videoState.connectionSpeed === 'slow' ? (
                    <WifiOff className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <Wifi className="w-4 h-4 text-gray-400" />
                  )}
                </div>

                {/* Quality Indicator */}
                <div className="text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                  {videoState.quality.replace('auto:', '').toUpperCase()}
                </div>

                {/* Settings */}
                <Button
                  onClick={() => setShowSettings(!showSettings)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  <Settings className="w-5 h-5" />
                </Button>

                {/* Fullscreen */}
                <Button
                  onClick={toggleFullscreen}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-4 right-4 bg-black bg-opacity-80 rounded-lg p-3 min-w-[200px]"
          >
            <h4 className="text-white font-medium mb-3">Quality</h4>
            <div className="space-y-2">
              {['auto', 'auto:eco', 'auto:good', 'auto:best'].map((qual) => (
                <Button
                  key={qual}
                  onClick={() => {
                    const qualityValue = qual as 'auto' | 'auto:eco' | 'auto:good' | 'auto:best';
                    setVideoState(prev => ({ ...prev, quality: qualityValue }));
                    setShowSettings(false);
                  }}
                  variant={videoState.quality === qual ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-white hover:bg-white hover:bg-opacity-20"
                >
                  {qual.replace('auto:', '').toUpperCase()}
                </Button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedVideoPlayer;