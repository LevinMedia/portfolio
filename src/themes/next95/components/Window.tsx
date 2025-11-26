'use client';

import { useState, useRef, useEffect } from 'react';
import { useWindowManager } from '../context/WindowManagerContext';

interface WindowProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  slug?: string;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultX?: number;
  defaultY?: number;
  resizable?: boolean;
  draggable?: boolean;
  className?: string;
}

export default function Window({
  id,
  title,
  icon,
  children,
  slug,
  onClose,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onMinimize,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onMaximize,
  defaultWidth = 600,
  defaultHeight,
  defaultX = 100,
  defaultY = 100,
  resizable = true,
  draggable = true,
  className = ''
}: WindowProps) {
  const { registerWindow, unregisterWindow, setActiveWindow, windows, minimizeWindow } = useWindowManager();
  
  // Calculate constrained size and position based on viewport
  const getConstrainedDimensions = () => {
    if (typeof window === 'undefined') {
      return { 
        width: defaultWidth, 
        height: defaultHeight ?? 0, 
        x: defaultX, 
        y: defaultY 
      };
    }
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight - 56; // Account for taskbar (56px)
    const padding = 20; // Minimum padding from edges
    
    // Calculate max available dimensions
    const maxWidth = viewportWidth - (padding * 2);
    const maxHeight = viewportHeight - (padding * 2);
    
    // Constrain width and height
    const constrainedWidth = Math.min(defaultWidth, maxWidth);
    const constrainedHeight = defaultHeight ? Math.min(defaultHeight, maxHeight) : 0;
    
    // Constrain position to keep window visible
    let constrainedX = defaultX;
    let constrainedY = defaultY;
    
    // Ensure window doesn't overflow right edge
    if (constrainedX + constrainedWidth > viewportWidth - padding) {
      constrainedX = Math.max(padding, viewportWidth - constrainedWidth - padding);
    }
    
    // Ensure window doesn't overflow bottom edge (accounting for taskbar)
    if (constrainedY + (constrainedHeight || 400) > viewportHeight - padding) {
      constrainedY = Math.max(padding, viewportHeight - (constrainedHeight || 400) - padding);
    }
    
    // Ensure window isn't positioned off-screen to the left or top
    constrainedX = Math.max(padding, constrainedX);
    constrainedY = Math.max(padding, constrainedY);
    
    return {
      width: constrainedWidth,
      height: constrainedHeight,
      x: constrainedX,
      y: constrainedY
    };
  };
  
  const constrained = getConstrainedDimensions();
  
  const [position, setPosition] = useState({ x: constrained.x, y: constrained.y });
  const [size, setSize] = useState({ width: constrained.width, height: constrained.height });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [restoreState, setRestoreState] = useState({ x: constrained.x, y: constrained.y, width: constrained.width, height: constrained.height });
  // const [initialPosition] = useState({ x: constrained.x, y: constrained.y });
  const windowRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Register window on mount, unregister on unmount
  useEffect(() => {
    registerWindow(id, title, slug);
    return () => {
      unregisterWindow(id);
    };
  }, [id, title, slug, registerWindow, unregisterWindow]);

  // Check if this window is active
  const thisWindow = windows.find(w => w.id === id);
  const isActive = thisWindow?.isActive ?? false;
  const zIndex = thisWindow?.zIndex ?? 1;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable || isMaximized) return; // Disable dragging when maximized
    setActiveWindow(id); // Make this window active when title bar is clicked
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleWindowClick = () => {
    setActiveWindow(id); // Make window active when clicked anywhere
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (!resizable || isMaximized) return; // Disable resizing when maximized
    e.stopPropagation();
    setIsResizing(true);
    
    // If height is currently auto (0), get the actual height from the DOM
    const actualHeight = size.height > 0 ? size.height : (windowRef.current?.offsetHeight || 400);
    
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: actualHeight
    });
    
    // If height was auto, set it to actual height before resizing
    if (size.height === 0 && windowRef.current) {
      setSize({ width: size.width, height: windowRef.current.offsetHeight });
    }
    
    setActiveWindow(id);
  };

  const handleTitleBarDoubleClick = () => {
    if (!contentRef.current) return;
    
    const viewportHeight = window.innerHeight - 56; // Account for taskbar
    const padding = 20; // Top and bottom margin
    const titleBarHeight = 30; // Height of title bar
    
    // Get the actual content height
    const contentHeight = contentRef.current.scrollHeight;
    const totalWindowHeight = contentHeight + titleBarHeight;
    const maxHeight = viewportHeight - (padding * 2);
    
    // If total window height is taller than max available height, use max height
    // Otherwise, fit to content height + title bar
    const newHeight = Math.min(totalWindowHeight, maxHeight);
    
    // Center vertically if using max height
    const newY = totalWindowHeight > maxHeight ? padding : position.y;
    
    setSize({ width: size.width, height: newHeight });
    setPosition({ x: position.x, y: newY });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      const headerHeight = 30;
      const taskbarHeight = 56;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Constrain Y so header stays within desktop area (above taskbar)
      const minY = 0;
      const maxY = viewportHeight - taskbarHeight - headerHeight;
      const constrainedY = Math.max(minY, Math.min(newY, maxY));

      // Constrain X so at least some part of the header remains visible
      const minX = 30 - size.width; // Keep at least 30px of right side visible
      const maxX = viewportWidth - 30; // Keep at least 30px of left side visible
      const constrainedX = Math.max(minX, Math.min(newX, maxX));

      setPosition({
        x: constrainedX,
        y: constrainedY
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      setSize({
        width: Math.max(300, resizeStart.width + deltaX),
        height: Math.max(200, resizeStart.height + deltaY)
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart]);

  // Check if window is minimized
  const isMinimized = thisWindow?.isMinimized ?? false;

  // Handle minimize - just hide the window (position stays where it was)
  const handleMinimize = () => {
    minimizeWindow(id);
  };

  // Handle close - call onClose callback to let parent handle unmounting
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // Handle maximize/restore
  const handleMaximize = () => {
    if (isMaximized) {
      // Restore to previous state
      setPosition({ x: restoreState.x, y: restoreState.y });
      setSize({ width: restoreState.width, height: restoreState.height });
      setIsMaximized(false);
    } else {
      // Save current state
      setRestoreState({ x: position.x, y: position.y, width: size.width, height: size.height });
      // Maximize to full screen (accounting for taskbar at bottom - 56px)
      setPosition({ x: 0, y: 0 });
      setSize({ 
        width: typeof window !== 'undefined' ? window.innerWidth : 1024, 
        height: typeof window !== 'undefined' ? window.innerHeight - 56 : 768 
      });
      setIsMaximized(true);
    }
  };

  if (isMinimized) {
    return null; // Hide window when minimized
  }

  return (
    <div
      ref={windowRef}
      onClick={handleWindowClick}
      className={`absolute bg-transparent ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: size.height > 0 ? `${size.height}px` : 'auto',
        zIndex,
        boxShadow: '4px 4px 10px rgba(0,0,0,0.5)'
      }}
    >
      <div
        className="h-full w-full overflow-hidden"
        style={{
          border: '1px solid var(--win95-border-dark, #000000)',
          borderTop: '3px solid var(--win95-border-light, #ffffff)',
          borderLeft: '3px solid var(--win95-border-light, #ffffff)',
          borderBottom: '3px solid var(--win95-border-dark, #000000)',
          borderRight: '3px solid var(--win95-border-dark, #000000)'
        }}
      >
        {/* Title Bar */}
        <div
          className={`flex items-center justify-between px-1 py-1 select-none ${draggable ? 'cursor-move' : ''}`}
          style={{
            background: isActive 
              ? 'var(--next95-window-header, linear-gradient(90deg, #000080 0%, #1084d0 100%))'
              : 'linear-gradient(90deg, var(--win95-inactive-start, #808080) 0%, var(--win95-inactive-end, #a0a0a0) 100%)',
            color: isActive ? 'var(--next95-window-header-text, #ffffff)' : 'var(--win95-text, #ffffff)'
          }}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleTitleBarDoubleClick}
        >
        <div className="flex items-center gap-1 px-1">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span className="text-sm font-bold truncate">{title}</span>
        </div>
        
        {/* Window Controls */}
        <div className="flex gap-[2px]">
          <button
            onClick={handleMinimize}
            className="w-6 h-6 flex items-center justify-center font-bold text-xs"
            style={{
              border: '1px solid var(--win95-border-light, #ffffff)',
              borderBottom: '1px solid var(--win95-border-dark, #000000)',
              borderRight: '1px solid var(--win95-border-dark, #000000)',
              background: 'var(--win95-button-face, #c0c0c0)',
              color: 'var(--win95-text, #000)',
              boxShadow: 'inset 1px 1px 0 var(--win95-border-light, #ffffff), inset -1px -1px 0 var(--win95-border-mid, #808080)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--win95-button-hover, #dfdfdf)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--win95-button-face, #c0c0c0)'}
            onMouseDown={(e) => e.currentTarget.style.boxShadow = 'inset -1px -1px 0 var(--win95-border-light, #ffffff), inset 1px 1px 0 var(--win95-border-mid, #808080)'}
            onMouseUp={(e) => e.currentTarget.style.boxShadow = 'inset 1px 1px 0 var(--win95-border-light, #ffffff), inset -1px -1px 0 var(--win95-border-mid, #808080)'}
          >
            <span className="mb-2">_</span>
          </button>
          <button
            onClick={handleMaximize}
            className="w-6 h-6 flex items-center justify-center font-bold text-xs"
            style={{
              border: '1px solid var(--win95-border-light, #ffffff)',
              borderBottom: '1px solid var(--win95-border-dark, #000000)',
              borderRight: '1px solid var(--win95-border-dark, #000000)',
              background: 'var(--win95-button-face, #c0c0c0)',
              color: 'var(--win95-text, #000)',
              boxShadow: 'inset 1px 1px 0 var(--win95-border-light, #ffffff), inset -1px -1px 0 var(--win95-border-mid, #808080)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--win95-button-hover, #dfdfdf)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--win95-button-face, #c0c0c0)'}
            onMouseDown={(e) => e.currentTarget.style.boxShadow = 'inset -1px -1px 0 var(--win95-border-light, #ffffff), inset 1px 1px 0 var(--win95-border-mid, #808080)'}
            onMouseUp={(e) => e.currentTarget.style.boxShadow = 'inset 1px 1px 0 var(--win95-border-light, #ffffff), inset -1px -1px 0 var(--win95-border-mid, #808080)'}
          >
            □
          </button>
          <button
            onClick={handleClose}
            className="w-6 h-6 flex items-center justify-center font-bold text-sm"
            style={{
              border: '1px solid var(--win95-border-light, #ffffff)',
              borderBottom: '1px solid var(--win95-border-dark, #000000)',
              borderRight: '1px solid var(--win95-border-dark, #000000)',
              background: 'var(--win95-button-face, #c0c0c0)',
              color: 'var(--win95-text, #000)',
              boxShadow: 'inset 1px 1px 0 var(--win95-border-light, #ffffff), inset -1px -1px 0 var(--win95-border-mid, #808080)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--win95-button-hover, #dfdfdf)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--win95-button-face, #c0c0c0)'}
            onMouseDown={(e) => e.currentTarget.style.boxShadow = 'inset -1px -1px 0 var(--win95-border-light, #ffffff), inset 1px 1px 0 var(--win95-border-mid, #808080)'}
            onMouseUp={(e) => e.currentTarget.style.boxShadow = 'inset 1px 1px 0 var(--win95-border-light, #ffffff), inset -1px -1px 0 var(--win95-border-mid, #808080)'}
          >
            ×
          </button>
        </div>
      </div>

        {/* Window Content */}
        <div 
          ref={contentRef}
          className={`flex-1 overflow-auto @container ${size.height > 0 ? '' : 'h-auto'}`} 
          style={{ 
            background: 'var(--win95-button-face, #c0c0c0)',
            ...(size.height > 0 ? { height: 'calc(100% - 30px)' } : {})
          }}
        >
          {children}
        </div>

        {/* Resize Handle */}
        {resizable && !isMaximized && (
          <div
            onMouseDown={handleResizeStart}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            style={{
              background: `linear-gradient(135deg, transparent 0%, transparent 50%, var(--win95-border-mid, #808080) 50%, var(--win95-border-mid, #808080) 100%)`,
              zIndex: 10
            }}
          />
        )}
      </div>
    </div>
  );
}

