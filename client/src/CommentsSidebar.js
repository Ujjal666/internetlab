// frontend/src/CommentsSidebar.js
// Comments and Suggestions System

import React, { useState } from 'react';
import { MessageSquare, Send, Trash2, CheckCircle, XCircle } from 'lucide-react';
import './CommentsSidebar.css';

function CommentsSidebar({ comments, onAddComment, onDeleteComment, onResolveComment, currentUser }) {
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('comment'); // 'comment' or 'suggestion'

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment({
        id: Date.now(),
        type: commentType,
        content: newComment,
        author: currentUser.name,
        authorId: currentUser.id,
        timestamp: new Date().toISOString(),
        resolved: false
      });
      setNewComment('');
    }
  };

  const unresolvedComments = comments.filter(c => !c.resolved);
  const resolvedComments = comments.filter(c => c.resolved);

  return (
    <div className="comments-sidebar">
      <div className="comments-header">
        <h3><MessageSquare size={20} /> Comments</h3>
        <span className="comment-count">{unresolvedComments.length}</span>
      </div>

      {/* Add Comment */}
      <div className="add-comment-section">
        <div className="comment-type-tabs">
          <button
            className={`type-tab ${commentType === 'comment' ? 'active' : ''}`}
            onClick={() => setCommentType('comment')}
          >
            Comment
          </button>
          <button
            className={`type-tab ${commentType === 'suggestion' ? 'active' : ''}`}
            onClick={() => setCommentType('suggestion')}
          >
            Suggestion
          </button>
        </div>
        <textarea
          placeholder={commentType === 'comment' ? 'Add a comment...' : 'Suggest an edit...'}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="comment-input"
          rows={3}
        />
        <button className="btn btn-primary btn-sm" onClick={handleSubmit}>
          <Send size={16} /> Post
        </button>
      </div>

      {/* Comments List */}
      <div className="comments-list">
        {unresolvedComments.length === 0 ? (
          <div className="no-comments">
            <MessageSquare size={48} />
            <p>No comments yet</p>
          </div>
        ) : (
          unresolvedComments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={() => onDeleteComment(comment.id)}
              onResolve={() => onResolveComment(comment.id)}
              canDelete={comment.authorId === currentUser.id}
            />
          ))
        )}
      </div>

      {/* Resolved Comments */}
      {resolvedComments.length > 0 && (
        <div className="resolved-section">
          <h4>Resolved ({resolvedComments.length})</h4>
          <div className="comments-list">
            {resolvedComments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onDelete={() => onDeleteComment(comment.id)}
                canDelete={comment.authorId === currentUser.id}
                resolved
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment, onDelete, onResolve, canDelete, resolved }) {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className={`comment-item ${comment.type} ${resolved ? 'resolved' : ''}`}>
      <div className="comment-header">
        <div className="comment-author">
          <strong>{comment.author}</strong>
          <span className="comment-time">{formatTime(comment.timestamp)}</span>
        </div>
        <div className="comment-actions">
          {!resolved && onResolve && (
            <button className="action-btn resolve" onClick={onResolve} title="Resolve">
              <CheckCircle size={16} />
            </button>
          )}
          {canDelete && (
            <button className="action-btn delete" onClick={onDelete} title="Delete">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
      <div className="comment-content">
        {comment.type === 'suggestion' && <span className="suggestion-label">💡 Suggestion:</span>}
        {comment.content}
      </div>
    </div>
  );
}

export default CommentsSidebar;