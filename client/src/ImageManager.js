// frontend/src/ImageManager.js
// Manages all draggable images in the document

import React from 'react';
import DraggableImage from './DraggableImage';
import './ImageManager.css';

function ImageManager({ images, onRemoveImage }) {
  return (
    <div className="image-manager-overlay">
      {images.map((image) => (
        <DraggableImage 
          key={image.id}
          src={image.src}
          onRemove={() => onRemoveImage(image.id)}
          initialWidth={image.width || 400}
          initialHeight={image.height || 300}
        />
      ))}
    </div>
  );
}

export default ImageManager;