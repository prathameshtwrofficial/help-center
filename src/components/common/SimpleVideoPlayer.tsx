import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SimpleVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  autoPlay?: boolean;
  controls?: boolean;
  className?: string;
  onProgress?: (currentTime: number, duration: number) => void;
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
  onError?: (error: Error) => void;
}

interface VideoState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  error: string | null;
  buffered: number;
}

export const SimpleVideoPlayer: React.FC<SimpleVideoPlayerProps> = ({
  videoUrl,
  thumbnailUrl,
  autoPlay = false,
  controls = true,
  className = '',
  onProgress,
  onLoadStart,
  onLoadComplete,
  onError
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [videoState, setVideoState] = useState<VideoState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isLoading: false,
    error: null,
    buffered: 0
  });

  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Load video metadata and setup
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      const video = videoRef.current;
      
      const handleLoadStart = () => {
        setVideoState(prev => ({ ...prev, isLoading: true, error: null }));
        onLoadStart?.();
      };

      const handleLoadedMetadata = () => {
        setVideoState(prev => ({
          ...prev,
          duration: video.duration,
          isLoading: false
        }));
        onLoadComplete?.();
      };

      const handleCanPlay = () => {
        setVideoState(prev => ({ ...prev, isLoading: false }));
      };

      const handlePlay = () => {
        setVideoState(prev => ({ ...prev, isPlaying: true }));
      };

      const handlePause = () => {
        setVideoState(prev => ({ ...prev, isPlaying: false }));
      };

      const handleError = (e: Event) => {
        const error = e.target as HTMLVideoElement;
        const errorMessage = error.error?.message || 'Failed to load video';
        console.error('Video Error:', errorMessage, 'URL:', videoUrl);
        setVideoState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
        onError?.(new Error(errorMessage));
      };

      const handleTimeUpdate = () => {
        const currentTime = video.currentTime;
        const buffered = video.buffered.length > 0 
          ? video.buffered.end(video.buffered.length - 1) 
          : 0;
        
        setVideoState(prev => ({
          ...prev,
          currentTime,
          buffered
        }));
        onProgress?.(currentTime, video.duration);
      };

      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('ended', handlePause);
      video.addEventListener('error', handleError);
      video.addEventListener('timeupdate', handleTimeUpdate);

      return () => {
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('ended', handlePause);
        video.removeEventListener('error', handleError);
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [videoUrl, onLoadStart, onLoadComplete, onProgress, onError]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Play/pause functionality
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (videoState.isPlaying) {
      video.pause();
    } else {
      if (video.ended) {
        video.currentTime = 0;
      }
      video.play().catch(error => {
        console.error('Play failed:', error);
        setVideoState(prev => ({ 
          ...prev, 
          error: 'Failed to play video', 
          isPlaying: false 
        }));
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

    if (!document.fullscreenElement) {
      video.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

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

  // Progress calculations
  const progressPercentage = videoState.duration > 0 
    ? (videoState.currentTime / videoState.duration) * 100 
    : 0;

  const bufferPercentage = videoState.duration > 0
    ? (videoState.buffered / videoState.duration) * 100
    : 0;

  return (
    <div
      className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
      style={{ width: '100%', height: '100%' }}
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
            <div className="text-center text-white">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading video...</p>
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
        {!videoState.isPlaying && !videoState.isLoading && !videoState.error && (
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
        {showControls && controls && !videoState.error && (
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
                          isMuted: newMuted
                        }));
                      }
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  >
                    {videoState.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
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
                {/* Fullscreen */}
                <Button
                  onClick={toggleFullscreen}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  <Maximize className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SimpleVideoPlayer;