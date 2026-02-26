// frontend/src/DraggableImage.js
// Simple Draggable and Resizable Image - React 18 Compatible

import React, { useState, useRef, useEffect } from 'react';
import { X, Move } from 'lucide-react';
import './DraggableImage.css';

function DraggableImage({ src, onRemove, initialWidth = 400, initialHeight = 300 }) {
  const [position, setPosition] = useState({ x: 50, y: 100 });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  // Handle dragging
  const handleMouseDown = (e) => {
    if (e.target.classList.contains('drag-handle-area')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (isResizing) {
      const rect = imageRef.current.getBoundingClientRect();
      const newWidth = Math.max(100, e.clientX - rect.left);
      const newHeight = Math.max(100, e.clientY - rect.top);
      setSize({ width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart]);

  return (
    <div
      ref={imageRef}
      className="simple-draggable-image"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`
      }}
    >
      {/* Drag Handle */}
      <div 
        className="drag-handle-area" 
        onMouseDown={handleMouseDown}
      >
        <Move size={16} />
        <span>Drag to move</span>
      </div>

      {/* Remove Button */}
      <button className="remove-btn" onClick={onRemove}>
        <X size={16} />
      </button>

      {/* Image */}
      <img src={src} alt="Inserted" draggable={false} />

      {/* Resize Handle */}
      <div
        className="resize-handle"
        onMouseDown={(e) => {
          e.stopPropagation();
          setIsResizing(true);
        }}
      />
    </div>
  );
}

export default DraggableImage;