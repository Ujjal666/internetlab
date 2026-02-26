// frontend/src/PageBreak.js
// Page Break Component for Documents

import React from 'react';
import './PageBreak.css';

function PageBreak({ onRemove }) {
  return (
    <div className="page-break-container">
      <div className="page-break-line">
        <span className="page-break-label">Page Break</span>
        {onRemove && (
          <button className="page-break-remove" onClick={onRemove}>
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export default PageBreak;