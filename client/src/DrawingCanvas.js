// frontend/src/DrawingCanvas.js
// Drawing/Handwriting Canvas Component

import React, { useRef, useState, useEffect } from 'react';
import { Pencil, Eraser, Trash2, Download, Palette, X } from 'lucide-react';
import './DrawingCanvas.css';

function DrawingCanvas({ isOpen, onClose, onSave }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [tool, setTool] = useState('pen'); // 'pen' or 'eraser'
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colors = [
    '#000000', '#e74c3c', '#3498db', '#2ecc71', 
    '#f39c12', '#9b59b6', '#34495e', '#95a5a6'
  ];

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      // Set white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Set drawing properties
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [isOpen]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    ctx.beginPath();
    ctx.moveTo(
      e.clientX - rect.left || e.touches[0].clientX - rect.left,
      e.clientY - rect.top || e.touches[0].clientY - rect.top
    );
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const x = e.clientX ? e.clientX - rect.left : e.touches[0].clientX - rect.left;
    const y = e.clientY ? e.clientY - rect.top : e.touches[0].clientY - rect.top;
    
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = lineWidth * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.closePath();
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `drawing-${Date.now()}.png`;
    a.click();
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL('image/png');
    if (onSave) {
      onSave(imageData);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="drawing-modal">
      <div className="drawing-container">
        {/* Header */}
        <div className="drawing-header">
          <h3>✍️ Drawing Canvas</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="drawing-toolbar">
          {/* Tools */}
          <div className="tool-group">
            <button
              className={`tool-btn ${tool === 'pen' ? 'active' : ''}`}
              onClick={() => setTool('pen')}
              title="Pen"
            >
              <Pencil size={18} />
            </button>
            <button
              className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
              onClick={() => setTool('eraser')}
              title="Eraser"
            >
              <Eraser size={18} />
            </button>
          </div>

          <div className="toolbar-divider"></div>

          {/* Line Width */}
          <div className="tool-group">
            <label className="tool-label">Size:</label>
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="width-slider"
            />
            <span className="width-value">{lineWidth}px</span>
          </div>

          <div className="toolbar-divider"></div>

          {/* Color Picker */}
          <div className="tool-group">
            <button
              className="tool-btn"
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Color"
            >
              <Palette size={18} />
            </button>
            <div
              className="current-color"
              style={{ backgroundColor: color }}
            ></div>
            
            {showColorPicker && (
              <div className="color-picker-panel">
                {colors.map(c => (
                  <button
                    key={c}
                    className="color-btn"
                    style={{ backgroundColor: c }}
                    onClick={() => {
                      setColor(c);
                      setShowColorPicker(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="toolbar-divider"></div>

          {/* Actions */}
          <div className="tool-group">
            <button className="tool-btn" onClick={clearCanvas} title="Clear">
              <Trash2 size={18} />
            </button>
            <button className="tool-btn" onClick={downloadDrawing} title="Download">
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="drawing-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Footer */}
        <div className="drawing-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={saveDrawing}>
            Insert Drawing
          </button>
        </div>
      </div>
    </div>
  );
}

export default DrawingCanvas;