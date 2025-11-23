'use client';

import { useState, useRef, useEffect } from 'react';
import { useWindowManager } from '../context/WindowManagerContext';

interface WindowProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
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
  onClose,
  onMinimize,
  onMaximize,
  defaultWidth = 600,
  defaultHeight,
  defaultX = 100,
  defaultY = 100,
  resizable = true,
  draggable = true,
  className = ''
}: WindowProps) {
  const { registerWindow, unregisterWindow, setActiveWindow, windows, minimizeWindow, restoreWindow } = useWindowManager();
  
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
  const [initialPosition] = useState({ x: constrained.x, y: constrained.y });
  const windowRef = useRef<HTMLDivElement>(null);

  // Register window on mount, unregister on unmount
  useEffect(() => {
    registerWindow(id, title);
    return () => {
      unregisterWindow(id);
    };
  }, [id, title, registerWindow, unregisterWindow]);

  // Check if this window is active
  const thisWindow = windows.find(w => w.id === id);
  const isActive = thisWindow?.isActive ?? false;

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

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
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
        zIndex: isActive ? 100 : 50,
        boxShadow: '4px 4px 10px rgba(0,0,0,0.5)'
      }}
    >
      <div
        className="h-full w-full overflow-hidden"
        style={{
          border: '1px solid #000000',
          borderTop: '3px solid #ffffff',
          borderLeft: '3px solid #ffffff',
          borderBottom: '3px solid #000000',
          borderRight: '3px solid #000000'
        }}
      >
        {/* Title Bar */}
        <div
          className={`flex items-center justify-between px-1 py-1 select-none ${
            isActive
              ? 'bg-gradient-to-r from-[#000080] to-[#1084d0]'
              : 'bg-gradient-to-r from-[#808080] to-[#a0a0a0]'
          } ${draggable ? 'cursor-move' : ''}`}
          onMouseDown={handleMouseDown}
        >
        <div className="flex items-center gap-1 px-1">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span className="text-sm font-bold text-white truncate">{title}</span>
        </div>
        
        {/* Window Controls */}
        <div className="flex gap-[2px]">
          <button
            onClick={handleMinimize}
            className="w-6 h-6 flex items-center justify-center border border-[#ffffff] border-b-[#000000] border-r-[#000000] bg-[#c0c0c0] text-[#000] font-bold text-xs hover:bg-[#dfdfdf] shadow-[inset_1px_1px_0_#ffffff,inset_-1px_-1px_0_#808080] active:shadow-[inset_-1px_-1px_0_#ffffff,inset_1px_1px_0_#808080]"
          >
            <span className="mb-2">_</span>
          </button>
          <button
            onClick={handleMaximize}
            className="w-6 h-6 flex items-center justify-center border border-[#ffffff] border-b-[#000000] border-r-[#000000] bg-[#c0c0c0] text-[#000] font-bold text-xs hover:bg-[#dfdfdf] shadow-[inset_1px_1px_0_#ffffff,inset_-1px_-1px_0_#808080] active:shadow-[inset_-1px_-1px_0_#ffffff,inset_1px_1px_0_#808080]"
          >
            □
          </button>
          <button
            onClick={handleClose}
            className="w-6 h-6 flex items-center justify-center border border-[#ffffff] border-b-[#000000] border-r-[#000000] bg-[#c0c0c0] text-[#000] font-bold text-sm hover:bg-[#dfdfdf] shadow-[inset_1px_1px_0_#ffffff,inset_-1px_-1px_0_#808080] active:shadow-[inset_-1px_-1px_0_#ffffff,inset_1px_1px_0_#808080]"
          >
            ×
          </button>
        </div>
      </div>

        {/* Window Content */}
        <div className={`flex-1 overflow-auto bg-[#c0c0c0] @container ${size.height > 0 ? '' : 'h-auto'}`} style={size.height > 0 ? { height: 'calc(100% - 30px)' } : {}}>
          {children}
        </div>

        {/* Resize Handle */}
        {resizable && !isMaximized && (
          <div
            onMouseDown={handleResizeStart}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            style={{
              background: 'linear-gradient(135deg, transparent 0%, transparent 50%, #808080 50%, #808080 100%)',
              zIndex: 10
            }}
          />
        )}
      </div>
    </div>
  );
}

