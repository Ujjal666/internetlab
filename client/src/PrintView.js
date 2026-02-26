// frontend/src/PrintView.js
// Print-Friendly Document View

import React, { useEffect } from 'react';
import './PrintView.css';

function PrintView({ content, roomCode, onClose }) {
  useEffect(() => {
    // Add print styles
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-content, .print-content * {
          visibility: visible;
        }
        .print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .print-actions {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const getPlainText = () => {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed.map(node => {
          return node.children?.map(child => child.text || '').join('') || '';
        }).join('\n\n');
      }
    } catch (e) {
      return content;
    }
  };

  return (
    <div className="print-view-overlay">
      <div className="print-view-container">
        <div className="print-actions">
          <h2>Print Preview</h2>
          <div className="print-buttons">
            <button className="btn btn-primary" onClick={handlePrint}>
              🖨️ Print
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>

        <div className="print-content">
          <div className="print-header">
            <h1>Study Notes</h1>
            <p>Room: {roomCode}</p>
            <p>Date: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="print-body">
            {getPlainText().split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph || '\u00A0'}</p>
            ))}
          </div>

          <div className="print-footer">
            <p>Generated from Study Together App</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrintView;