import React, { useState, useRef, useEffect, useCallback } from 'react';
import Draggable from 'react-draggable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Move, 
  Maximize2, 
  Minimize2, 
  RotateCw, 
  Trash2, 
  Settings, 
  Image as ImageIcon, 
  Video, 
  Eye, 
  EyeOff,
  Square,
  Circle,
  Type,
  X,
  Upload,
  Download,
  Copy,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';

export interface MediaElement {
  id: string;
  type: 'image' | 'video';
  url: string;
  alt?: string;
  caption?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  isVisible: boolean;
  alignment: 'left' | 'center' | 'right';
  zIndex: number;
  cloudinaryUrl?: string;
}

interface MediaEditorProps {
  elements: MediaElement[];
  onElementsChange: (elements: MediaElement[]) => void;
  onInsertElement: (element: MediaElement) => void;
  isOpen: boolean;
  onClose: () => void;
  content?: string; // Current article content for context
}

export const MediaEditor: React.FC<MediaEditorProps> = ({
  elements,
  onElementsChange,
  onInsertElement,
  isOpen,
  onClose,
  content = ''
}) => {
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<MediaElement | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Extract media from article content
  const extractMediaFromContent = useCallback(() => {
    const mediaElements: MediaElement[] = [];
    
    // Extract images
    const imgMatches = content.match(/<img[^>]*>/gi) || [];
    imgMatches.forEach((imgTag, index) => {
      const srcMatch = imgTag.match(/src=["']([^"']*)["']/i);
      const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);
      
      if (srcMatch) {
        mediaElements.push({
          id: `extracted-img-${index}-${Date.now()}`,
          type: 'image',
          url: srcMatch[1],
          alt: altMatch ? altMatch[1] : '',
          position: { x: 50 + (index * 30), y: 50 + (index * 30) },
          size: { width: 400, height: 300 },
          rotation: 0,
          isVisible: true,
          alignment: 'center',
          zIndex: index,
          cloudinaryUrl: srcMatch[1]
        });
      }
    });

    // Extract videos
    const videoMatches = content.match(/<video[^>]*>.*?<\/video>/gi) || [];
    videoMatches.forEach((videoTag, index) => {
      const srcMatch = videoTag.match(/src=["']([^"']*)["']/i);
      
      if (srcMatch) {
        mediaElements.push({
          id: `extracted-video-${index}-${Date.now()}`,
          type: 'video',
          url: srcMatch[1],
          alt: `Video ${index + 1}`,
          position: { x: 100 + (index * 40), y: 100 + (index * 40) },
          size: { width: 500, height: 300 },
          rotation: 0,
          isVisible: true,
          alignment: 'center',
          zIndex: imgMatches.length + index,
          cloudinaryUrl: srcMatch[1]
        });
      }
    });

    if (mediaElements.length > 0) {
      onElementsChange(mediaElements);
      toast({
        title: "Media Loaded",
        description: `Found ${mediaElements.length} media elements in your article`,
        variant: "default",
      });
    }

    return mediaElements;
  }, [content, onElementsChange]);

  // Initialize with existing content when component mounts
  useEffect(() => {
    if (isOpen && content && elements.length === 0) {
      extractMediaFromContent();
    }
  }, [isOpen, content, extractMediaFromContent, elements.length]);

  const updateElement = (id: string, updates: Partial<MediaElement>) => {
    const updatedElements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    );
    onElementsChange(updatedElements);
  };

  const deleteElement = (id: string) => {
    onElementsChange(elements.filter(el => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
    toast({
      title: "Deleted",
      description: "Media element removed",
      variant: "default",
    });
  };

  const duplicateElement = (element: MediaElement) => {
    const newElement: MediaElement = {
      ...element,
      id: uuidv4(),
      position: { 
        x: element.position.x + 20, 
        y: element.position.y + 20 
      },
      zIndex: elements.length
    };
    onElementsChange([...elements, newElement]);
    setSelectedElement(newElement.id);
    toast({
      title: "Duplicated",
      description: "Media element duplicated successfully",
      variant: "default",
    });
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    try {
      // Get Cloudinary configuration from environment
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UNSIGNED_PRESET;
      
      if (!cloudName || !uploadPreset) {
        console.warn('Cloudinary configuration missing, using local storage');
        return URL.createObjectURL(file);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Cloudinary upload successful:', result.secure_url);
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload failed:', error);
      // Fallback to local URL for development
      return URL.createObjectURL(file);
    }
  };

  const addNewMedia = async (type: 'image' | 'video') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' : 'video/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setUploading(true);
        try {
          const cloudinaryUrl = await uploadToCloudinary(file);
          const newElement: MediaElement = {
            id: uuidv4(),
            type,
            url: cloudinaryUrl,
            position: { x: 100, y: 100 },
            size: { width: type === 'image' ? 400 : 500, height: type === 'image' ? 300 : 300 },
            rotation: 0,
            isVisible: true,
            alignment: 'center',
            zIndex: elements.length,
            cloudinaryUrl: cloudinaryUrl
          };
          onElementsChange([...elements, newElement]);
          setSelectedElement(newElement.id);
          toast({
            title: "Uploaded",
            description: `${type} added successfully`,
            variant: "default",
          });
        } catch (error) {
          toast({
            title: "Upload Failed",
            description: "Could not upload media. Please try again.",
            variant: "destructive",
          });
        } finally {
          setUploading(false);
        }
      }
    };
    
    input.click();
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string, corner: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(`${elementId}-${corner}`);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const element = elements.find(el => el.id === elementId);
    
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newWidth = element.size.width;
      let newHeight = element.size.height;
      let newX = element.position.x;
      let newY = element.position.y;

      switch (corner) {
        case 'se':
          newWidth = Math.max(100, element.size.width + deltaX);
          newHeight = Math.max(100, element.size.height + deltaY);
          break;
        case 'ne':
          newWidth = Math.max(100, element.size.width + deltaX);
          newHeight = Math.max(100, element.size.height - deltaY);
          newY = element.position.y + deltaY;
          break;
        case 'sw':
          newWidth = Math.max(100, element.size.width - deltaX);
          newHeight = Math.max(100, element.size.height + deltaY);
          newX = element.position.x + deltaX;
          break;
        case 'nw':
          newWidth = Math.max(100, element.size.width - deltaX);
          newHeight = Math.max(100, element.size.height - deltaY);
          newX = element.position.x + deltaX;
          newY = element.position.y + deltaY;
          break;
      }

      updateElement(elementId, {
        size: { width: newWidth, height: newHeight },
        position: { x: newX, y: newY }
      });
    };

    const handleMouseUp = () => {
      setIsResizing(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleInsertAll = () => {
    if (elements.length === 0) {
      toast({
        title: "No Media",
        description: "Add some media elements first",
        variant: "destructive",
      });
      return;
    }

    // Generate HTML for all elements
    let contentHtml = '';
    elements.forEach(element => {
      if (!element.isVisible) return;
      
      const style = `width:${element.size.width}px;height:${element.size.height}px;transform:rotate(${element.rotation}deg);float:${element.alignment};margin:10px;`;
      
      if (element.type === 'image') {
        contentHtml += `<img src="${element.url}" alt="${element.alt || ''}" style="${style}" />`;
      } else {
        contentHtml += `<video src="${element.url}" style="${style}" controls></video>`;
      }
    });

    // Insert the first element as a preview, user can add more later
    if (elements[0]) {
      const firstElement = elements[0];
      const htmlElement = firstElement.type === 'image' 
        ? `<img src="${firstElement.url}" alt="${firstElement.alt || ''}" style="width:${firstElement.size.width}px;height:${firstElement.size.height}px;transform:rotate(${firstElement.rotation}deg);float:${firstElement.alignment};margin:10px;" />`
        : `<video src="${firstElement.url}" style="width:${firstElement.size.width}px;height:${firstElement.size.height}px;transform:rotate(${firstElement.rotation}deg);float:${firstElement.alignment};margin:10px;" controls></video>`;
      
      onInsertElement({
        ...firstElement,
        position: { x: 0, y: 0 }
      });
    }

    toast({
      title: "Inserted",
      description: `${elements.length} media elements ready to insert`,
      variant: "default",
    });
  };

  const selectedElementData = selectedElement ? elements.find(el => el.id === selectedElement) : null;

  // Prevent modal close when clicking inside
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Close modal only when clicking the X or outside background
  const handleClose = () => {
    if (isResizing) return; // Don't close while resizing
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center"
      onClick={handleClose}
    >
      <div 
        className="bg-background rounded-lg shadow-lg w-[95vw] h-[90vh] flex"
        onClick={handleModalClick}
      >
        {/* Main Editor Area */}
        <div className="flex-1 relative bg-white">
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <Button
              onClick={() => setShowControls(!showControls)}
              variant="outline"
              size="sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              {showControls ? 'Hide' : 'Show'} Controls
            </Button>
            <Button
              onClick={handleInsertAll}
              variant="default"
              size="sm"
              disabled={elements.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              Insert All ({elements.length})
            </Button>
          </div>

          {/* Canvas Area */}
          <div 
            ref={containerRef}
            className="w-full h-full bg-gray-50 relative overflow-hidden"
            style={{ 
              backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          >
            <AnimatePresence>
              {elements.map((element) => (
                <Draggable
                  key={element.id}
                  position={element.position}
                  onDrag={(e, data) => updateElement(element.id, { 
                    position: { x: data.x, y: data.y } 
                  })}
                  onStop={(e, data) => updateElement(element.id, { 
                    position: { x: data.x, y: data.y } 
                  })}
                  disabled={isResizing !== null}
                >
                  <div
                    className={`absolute cursor-move select-none ${
                      selectedElement === element.id ? 'ring-2 ring-blue-500' : ''
                    } ${isResizing === element.id ? 'cursor-nw-resize' : ''}`}
                    style={{
                      width: element.size.width,
                      height: element.size.height,
                      transform: `rotate(${element.rotation}deg)`,
                      zIndex: element.zIndex,
                      display: element.isVisible ? 'block' : 'none'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedElement(element.id);
                    }}
                  >
                    {/* Media Content */}
                    <div className="w-full h-full relative group">
                      {element.type === 'image' ? (
                        <img
                          src={element.url}
                          alt={element.alt || ''}
                          className="w-full h-full object-cover rounded-lg"
                          draggable={false}
                        />
                      ) : (
                        <video
                          src={element.url}
                          className="w-full h-full object-cover rounded-lg"
                          controls
                          draggable={false}
                        />
                      )}

                      {/* Interactive Resize Handles */}
                      {selectedElement === element.id && (
                        <div className="absolute inset-0 rounded-lg">
                          {/* Corner resize handles */}
                          <div 
                            className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full cursor-nw-resize hover:bg-blue-600"
                            onMouseDown={(e) => handleMouseDown(e, element.id, 'nw')}
                          />
                          <div 
                            className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-ne-resize hover:bg-blue-600"
                            onMouseDown={(e) => handleMouseDown(e, element.id, 'ne')}
                          />
                          <div 
                            className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 rounded-full cursor-sw-resize hover:bg-blue-600"
                            onMouseDown={(e) => handleMouseDown(e, element.id, 'sw')}
                          />
                          <div 
                            className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize hover:bg-blue-600"
                            onMouseDown={(e) => handleMouseDown(e, element.id, 'se')}
                          />

                          {/* Control Toolbar */}
                          <div className="absolute -top-12 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-black/80 text-white px-2 py-1 rounded">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateElement(element.id, { 
                                  rotation: (element.rotation + 90) % 360 
                                });
                              }}
                              title="Rotate 90°"
                            >
                              <RotateCw className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateElement(element.id, { isVisible: !element.isVisible });
                              }}
                              title={element.isVisible ? "Hide" : "Show"}
                            >
                              {element.isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateElement(element);
                              }}
                              title="Duplicate"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteElement(element.id);
                              }}
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Draggable>
              ))}
            </AnimatePresence>

            {/* Empty State */}
            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No media elements found</p>
                  <p className="text-sm">Upload images or videos to start editing</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls Panel */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l bg-background"
            >
              <div className="p-4 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Media Editor</h3>
                  <Button onClick={handleClose} variant="ghost" size="sm">
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Add Media */}
                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Add Media</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      onClick={() => addNewMedia('image')}
                      className="w-full justify-start"
                      variant="outline"
                      size="sm"
                      disabled={uploading}
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Add Image'}
                    </Button>
                    <Button
                      onClick={() => addNewMedia('video')}
                      className="w-full justify-start"
                      variant="outline"
                      size="sm"
                      disabled={uploading}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Add Video'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Elements List */}
                {elements.length > 0 && (
                  <Card className="mb-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Media Elements ({elements.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {elements.map((element) => (
                        <div
                          key={element.id}
                          className={`p-2 rounded border cursor-pointer transition-colors ${
                            selectedElement === element.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedElement(element.id)}
                        >
                          <div className="flex items-center gap-2">
                            {element.type === 'image' ? (
                              <ImageIcon className="w-4 h-4" />
                            ) : (
                              <Video className="w-4 h-4" />
                            )}
                            <span className="text-sm font-medium flex-1 truncate">
                              {element.alt || `${element.type} ${element.id.slice(0, 8)}`}
                            </span>
                            <Badge variant={element.isVisible ? 'default' : 'secondary'}>
                              {element.isVisible ? 'Visible' : 'Hidden'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Selected Element Controls */}
                {selectedElementData && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Selected Element</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Basic Info */}
                      <div>
                        <label className="text-xs font-medium mb-1 block">Alt Text</label>
                        <input
                          type="text"
                          value={selectedElementData.alt || ''}
                          onChange={(e) => updateElement(selectedElementData.id, { alt: e.target.value })}
                          className="w-full p-2 text-sm border rounded"
                          placeholder="Describe this media..."
                        />
                      </div>

                      {/* Size Controls */}
                      <div>
                        <label className="text-xs font-medium mb-2 block">
                          Size: {selectedElementData.size.width} × {selectedElementData.size.height}px
                        </label>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Width</label>
                            <Slider
                              value={[selectedElementData.size.width]}
                              onValueChange={([width]) => updateElement(selectedElementData.id, { 
                                size: { ...selectedElementData.size, width } 
                              })}
                              min={100}
                              max={800}
                              step={10}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Height</label>
                            <Slider
                              value={[selectedElementData.size.height]}
                              onValueChange={([height]) => updateElement(selectedElementData.id, { 
                                size: { ...selectedElementData.size, height } 
                              })}
                              min={100}
                              max={600}
                              step={10}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Rotation */}
                      <div>
                        <label className="text-xs font-medium mb-2 block">
                          Rotation: {selectedElementData.rotation}°
                        </label>
                        <Slider
                          value={[selectedElementData.rotation]}
                          onValueChange={([rotation]) => updateElement(selectedElementData.id, { rotation })}
                          min={0}
                          max={360}
                          step={15}
                          className="w-full"
                        />
                      </div>

                      {/* Alignment */}
                      <div>
                        <label className="text-xs font-medium mb-2 block">Alignment</label>
                        <Select
                          value={selectedElementData.alignment}
                          onValueChange={(alignment: 'left' | 'center' | 'right') => 
                            updateElement(selectedElementData.id, { alignment })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">
                              <div className="flex items-center gap-2">
                                <Square className="w-4 h-4" />
                                Left
                              </div>
                            </SelectItem>
                            <SelectItem value="center">
                              <div className="flex items-center gap-2">
                                <Circle className="w-4 h-4" />
                                Center
                              </div>
                            </SelectItem>
                            <SelectItem value="right">
                              <div className="flex items-center gap-2">
                                <Square className="w-4 h-4 ml-auto" />
                                Right
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => duplicateElement(selectedElementData)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Duplicate
                        </Button>
                        <Button
                          onClick={() => deleteElement(selectedElementData.id)}
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>

                      {/* Insert to Article */}
                      <Button
                        onClick={() => {
                          onInsertElement(selectedElementData);
                          toast({
                            title: "Success",
                            description: "Media inserted into article!",
                            variant: "default",
                          });
                        }}
                        className="w-full"
                        size="sm"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Insert into Article
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};