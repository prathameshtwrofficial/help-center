import React, { useState, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Download, Eye, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedMediaRendererProps {
  content: string;
  className?: string;
}

interface MediaElement {
  type: 'image' | 'video';
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  attributes?: { [key: string]: string };
}

export const EnhancedMediaRenderer: React.FC<EnhancedMediaRendererProps> = ({
  content,
  className = ''
}) => {
  const [lightboxImage, setLightboxImage] = useState<MediaElement | null>(null);
  const [videoPlaying, setVideoPlaying] = useState<{ [key: string]: boolean }>({});
  const [videoMuted, setVideoMuted] = useState<{ [key: string]: boolean }>({});
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  const toggleVideo = useCallback((videoId: string) => {
    const video = videoRefs.current[videoId];
    if (video) {
      if (videoPlaying[videoId]) {
        video.pause();
      } else {
        video.play();
      }
      setVideoPlaying(prev => ({ ...prev, [videoId]: !prev[videoId] }));
    }
  }, [videoPlaying]);

  const toggleMute = useCallback((videoId: string) => {
    const video = videoRefs.current[videoId];
    if (video) {
      video.muted = !videoMuted[videoId];
      setVideoMuted(prev => ({ ...prev, [videoId]: !prev[videoId] }));
    }
  }, [videoMuted]);

  const openLightbox = (media: MediaElement) => {
    setLightboxImage(media);
  };

  const processContent = (htmlContent: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Process images
    const images = doc.querySelectorAll('img');
    images.forEach((img, index) => {
      const mediaElement: MediaElement = {
        type: 'image',
        src: img.src,
        alt: img.alt || '',
        width: parseInt(String(img.style?.width || img.width || '0')),
        height: parseInt(String(img.style?.height || img.height || '0')),
        style: {
          margin: img.style?.margin,
          transform: img.style?.transform,
          ...Object.fromEntries(Object.entries(img.style || {}).filter(([_, v]) => v))
        },
        attributes: {
          'data-media-id': `img-${index}`
        }
      };

      // Replace with enhanced image component
      const container = doc.createElement('div');
      container.className = 'enhanced-media-container';
      container.innerHTML = createEnhancedImageHTML(mediaElement, `img-${index}`);
      img.parentNode?.replaceChild(container, img);
    });

    // Process videos
    const videos = doc.querySelectorAll('video');
    videos.forEach((video, index) => {
      const mediaElement: MediaElement = {
        type: 'video',
        src: video.src || video.querySelector('source')?.src || '',
        alt: video.getAttribute('alt') || '',
        width: parseInt(String(video.style?.width || video.width || '0')),
        height: parseInt(String(video.style?.height || video.height || '0')),
        style: {
          margin: video.style?.margin,
          transform: video.style?.transform,
          ...Object.fromEntries(Object.entries(video.style || {}).filter(([_, v]) => v))
        },
        attributes: {
          'data-media-id': `video-${index}`
        }
      };

      // Replace with enhanced video component
      const container = doc.createElement('div');
      container.className = 'enhanced-media-container';
      container.innerHTML = createEnhancedVideoHTML(mediaElement, `video-${index}`);
      video.parentNode?.replaceChild(container, video);
    });

    return doc.body.innerHTML;
  };

  const createEnhancedImageHTML = (media: MediaElement, id: string) => {
    return `
      <div class="media-wrapper media-image-wrapper" data-media-id="${id}">
        <div class="media-overlay">
          <button class="media-action-btn media-zoom-btn" onclick="window.openLightbox && window.openLightbox(${JSON.stringify(media).replace(/"/g, '"')})">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
            </svg>
          </button>
        </div>
        <img 
          src="${media.src}" 
          alt="${media.alt || ''}" 
          class="enhanced-media-img"
          style="${Object.entries(media.style || {}).map(([k, v]) => `${k}: ${v}`).join('; ')}"
          loading="lazy"
        />
        ${media.alt ? `<div class="media-caption">${media.alt}</div>` : ''}
      </div>
    `;
  };

  const createEnhancedVideoHTML = (media: MediaElement, id: string) => {
    return `
      <div class="media-wrapper media-video-wrapper" data-media-id="${id}">
        <video 
          class="enhanced-media-video"
          style="${Object.entries(media.style || {}).map(([k, v]) => `${k}: ${v}`).join('; ')}"
          preload="metadata"
          playsinline
        >
          <source src="${media.src}" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div class="video-controls-overlay">
          <button class="video-control-btn play-pause-btn" data-video-id="${id}">
            <svg class="w-6 h-6 play-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </button>
          <button class="video-control-btn mute-btn" data-video-id="${id}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M19.07 4.929c4.35 4.35 4.35 11.413 0 15.763m-2.829-12.934a5 5 0 010 7.072M9.88 9.88a3 3 0 104.24 4.24M4 4h16"></path>
            </svg>
          </button>
        </div>
        ${media.alt ? `<div class="media-caption">${media.alt}</div>` : ''}
      </div>
    `;
  };

  // Inject global functions for lightbox and video controls
  React.useEffect(() => {
    (window as any).openLightbox = openLightbox;
    return () => {
      delete (window as any).openLightbox;
    };
  }, []);

  React.useEffect(() => {
    // Setup video control event listeners
    const setupVideoControls = () => {
      document.querySelectorAll('.play-pause-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const videoId = btn.getAttribute('data-video-id');
          if (videoId) {
            toggleVideo(videoId);
            updatePlayButton(videoId);
          }
        });
      });

      document.querySelectorAll('.mute-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const videoId = btn.getAttribute('data-video-id');
          if (videoId) {
            toggleMute(videoId);
            updateMuteButton(videoId);
          }
        });
      });
    };

    setupVideoControls();
  }, [content]);

  const updatePlayButton = (videoId: string) => {
    const btn = document.querySelector(`[data-video-id="${videoId}"] .play-pause-btn svg`);
    if (btn) {
      const isPlaying = videoPlaying[videoId];
      btn.innerHTML = isPlaying ? 
        // Pause icon
        `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>` :
        // Play icon
        `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>`;
    }
  };

  const updateMuteButton = (videoId: string) => {
    const btn = document.querySelector(`[data-video-id="${videoId}"] .mute-btn svg`);
    if (btn) {
      const isMuted = videoMuted[videoId];
      btn.innerHTML = isMuted ?
        // Unmute icon
        `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 10h1m4 0h1m-6 4h8m2 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>` :
        // Mute icon
        `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>`;
    }
  };

  return (
    <>
      <div 
        className={`enhanced-content ${className}`}
        dangerouslySetInnerHTML={{ 
          __html: processContent(content) 
        }}
      />

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
            <DialogContent className="max-w-6xl max-h-[95vh] p-0">
              <div className="relative">
                <img
                  src={lightboxImage.src}
                  alt={lightboxImage.alt || ''}
                  className="w-full h-auto max-h-[85vh] object-contain"
                />
                <div className="absolute bottom-4 left-4 right-4">
                  {lightboxImage.alt && (
                    <div className="bg-black/70 text-white p-3 rounded-lg">
                      <p className="text-sm">{lightboxImage.alt}</p>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Hidden video refs for control */}
      {content.match(/<video[^>]*>/g)?.map((_, index) => (
        <video
          key={index}
          ref={(el) => {
            if (el) videoRefs.current[`video-${index}`] = el;
          }}
          className="hidden"
        />
      ))}
    </>
  );
};