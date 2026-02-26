// frontend/src/ImageUploadModal.js
// Image Upload Modal - Upload from PC or URL

import React, { useState } from 'react';
import { X, Upload, Link, Image as ImageIcon } from 'lucide-react';
import './ImageUploadModal.css';

function ImageUploadModal({ isOpen, onClose, onInsert }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'url'
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select a valid image file');
    }
  };

  const handleUrlPreview = () => {
    if (imageUrl.trim()) {
      setPreviewUrl(imageUrl);
    }
  };

  const handleInsert = () => {
    if (activeTab === 'upload' && previewUrl) {
      onInsert(previewUrl);
      handleClose();
    } else if (activeTab === 'url' && imageUrl.trim()) {
      onInsert(imageUrl);
      handleClose();
    } else {
      alert('Please select an image or enter a valid URL');
    }
  };

  const handleClose = () => {
    setImageUrl('');
    setPreviewUrl('');
    setSelectedFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="image-upload-modal">
      <div className="image-upload-container">
        {/* Header */}
        <div className="image-upload-header">
          <h3><ImageIcon size={20} /> Insert Image</h3>
          <button className="close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="image-upload-tabs">
          <button
            className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={18} />
            Upload from PC
          </button>
          <button
            className={`tab ${activeTab === 'url' ? 'active' : ''}`}
            onClick={() => setActiveTab('url')}
          >
            <Link size={18} />
            Image URL
          </button>
        </div>

        {/* Content */}
        <div className="image-upload-content">
          {activeTab === 'upload' ? (
            <div className="upload-section">
              <div className="upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  id="file-input"
                  style={{ display: 'none' }}
                />
                <label htmlFor="file-input" className="upload-label">
                  <Upload size={48} />
                  <h4>Click to upload an image</h4>
                  <p>Supports: JPG, PNG, GIF, SVG</p>
                </label>
              </div>
              {selectedFile && (
                <div className="file-info">
                  <strong>Selected:</strong> {selectedFile.name}
                </div>
              )}
            </div>
          ) : (
            <div className="url-section">
              <label className="url-label">Image URL</label>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="url-input"
              />
              <button className="btn btn-secondary" onClick={handleUrlPreview}>
                Preview
              </button>
            </div>
          )}

          {/* Preview */}
          {previewUrl && (
            <div className="image-preview">
              <h4>Preview:</h4>
              <img src={previewUrl} alt="Preview" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="image-upload-footer">
          <button className="btn btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleInsert}>
            Insert Image
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageUploadModal;