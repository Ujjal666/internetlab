// frontend/src/StatsPanel.js
// Document Statistics and Version History

import React, { useState, useEffect } from 'react';
import { BarChart3, History, X, FileText, Clock } from 'lucide-react';
import './StatsPanel.css';

function StatsPanel({ isOpen, onClose, content, versions, onRestoreVersion }) {
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' or 'history'
  const [stats, setStats] = useState({
    words: 0,
    characters: 0,
    charactersNoSpaces: 0,
    paragraphs: 0,
    sentences: 0,
    readingTime: 0
  });

  useEffect(() => {
    if (content) {
      calculateStats(content);
    }
  }, [content]);

  const calculateStats = (text) => {
    let plainText = text;
    
    // Try to extract text from JSON (Slate format)
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        plainText = parsed.map(node => {
          return node.children?.map(child => child.text || '').join('') || '';
        }).join('\n');
      }
    } catch (e) {
      // Plain text
    }

    const trimmedText = plainText.trim();
    
    // Calculate stats
    const words = trimmedText ? trimmedText.split(/\s+/).length : 0;
    const characters = trimmedText.length;
    const charactersNoSpaces = trimmedText.replace(/\s/g, '').length;
    const paragraphs = trimmedText ? trimmedText.split(/\n\n+/).length : 0;
    const sentences = trimmedText ? (trimmedText.match(/[.!?]+/g) || []).length : 0;
    const readingTime = Math.ceil(words / 200); // Average reading speed: 200 words/min

    setStats({
      words,
      characters,
      charactersNoSpaces,
      paragraphs,
      sentences,
      readingTime
    });
  };

  if (!isOpen) return null;

  return (
    <div className="stats-panel-modal">
      <div className="stats-panel-container">
        {/* Header */}
        <div className="stats-panel-header">
          <h3>
            {activeTab === 'stats' ? <BarChart3 size={20} /> : <History size={20} />}
            {activeTab === 'stats' ? 'Document Statistics' : 'Version History'}
          </h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="stats-panel-tabs">
          <button
            className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <BarChart3 size={18} />
            Statistics
          </button>
          <button
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} />
            History
          </button>
        </div>

        {/* Content */}
        <div className="stats-panel-content">
          {activeTab === 'stats' ? (
            <div className="stats-grid">
              <StatCard icon={<FileText />} label="Words" value={stats.words} />
              <StatCard icon={<FileText />} label="Characters" value={stats.characters} />
              <StatCard icon={<FileText />} label="Characters (no spaces)" value={stats.charactersNoSpaces} />
              <StatCard icon={<FileText />} label="Paragraphs" value={stats.paragraphs} />
              <StatCard icon={<FileText />} label="Sentences" value={stats.sentences} />
              <StatCard icon={<Clock />} label="Reading time" value={`${stats.readingTime} min`} />
            </div>
          ) : (
            <div className="version-history">
              {versions && versions.length > 0 ? (
                versions.map((version, index) => (
                  <VersionItem
                    key={version.id}
                    version={version}
                    isLatest={index === 0}
                    onRestore={() => onRestoreVersion(version)}
                  />
                ))
              ) : (
                <div className="no-versions">
                  <History size={48} />
                  <p>No version history yet</p>
                  <small>Versions are saved automatically</small>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function VersionItem({ version, isLatest, onRestore }) {
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`version-item ${isLatest ? 'latest' : ''}`}>
      <div className="version-info">
        <div className="version-time">
          {formatDate(version.timestamp)}
          {isLatest && <span className="latest-badge">Current</span>}
        </div>
        <div className="version-author">Edited by {version.author}</div>
      </div>
      {!isLatest && (
        <button className="btn btn-secondary btn-sm" onClick={onRestore}>
          Restore
        </button>
      )}
    </div>
  );
}

export default StatsPanel;