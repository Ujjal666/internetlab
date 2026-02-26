import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Auth from './Auth';
import RichTextEditor from './RichTextEditor';
import DrawingCanvas from './DrawingCanvas';
import ImageUploadModal from './ImageUploadModal';
import CommentsSidebar from './CommentsSidebar';
import StatsPanel from './StatsPanel';
import PrintView from './PrintView';
import TableInsertModal from './TableInsertModal';
import DraggableImage from './DraggableImage';
import { 
  Users, MessageSquare, LogOut, Copy, Check, Edit3, UserCircle,
  Pencil, Image as ImageIcon, MessageCircle, BarChart3, Printer,
  Table as TableIcon, FileDown
} from 'lucide-react';
import './App.css';
import ImageManager from './ImageManager';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
let socket = null;

// In App.js, add this debounce function at the TOP (outside component):
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}


function App() {
  // Authentication
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App state
  const [view, setView] = useState('home');
  const [roomCode, setRoomCode] = useState('');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [sharedNote, setSharedNote] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [connected, setConnected] = useState(false);

  // New features state
  const [showDrawing, setShowDrawing] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [comments, setComments] = useState([]);
  const [versions, setVersions] = useState([]);
  const [images, setImages] = useState([]);

  const editorRef = useRef(null);

  const getCurrentUser = () => {
    if (!user) return null;
    return {
      id: user.uid,
      name: user.displayName || user.email.split('@')[0],
      email: user.email,
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    };
  };

  // Then in your App component, create the debounced emit:
const debouncedEmit = useRef(
  debounce((roomId, content, userId, userName) => {
    if (socket) {
      socket.emit('note-update', {
        roomId,
        content,
        userId,
        userName
      });
    }
  }, 300) // Reduced to 300ms for faster sync
).current;

  // Authentication check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
      if (user) console.log('✅ User logged in:', user.email);
    });
    return () => unsubscribe();
  }, []);

  // Socket connection
  useEffect(() => {
    if (user) {
      socket = io(SOCKET_URL);
      socket.on('connect', () => {
        console.log('✅ Connected to server');
        setConnected(true);
      });
      socket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
        setConnected(false);
      });
      return () => {
        if (socket) socket.disconnect();
      };
    }
  }, [user]);

  // Room events
  // In App.js, find the useEffect for room events and replace it with this:

useEffect(() => {
  if (!socket || !currentRoom) return;

  const handleRoomState = (data) => {
    setMembers(data.members);
    setSharedNote(data.note);
    setChatMessages(data.messages);
  };

  const handleUserJoined = (data) => {
    setMembers(data.members);
  };

  const handleUserLeft = (data) => {
    setMembers(prev => prev.filter(m => m.id !== data.userId));
  };

  const handleNoteUpdate = (data) => {
    // Only update if the change came from another user
    if (user && data.userId !== user.uid) {
      setSharedNote(data.content);
    }
  };

  const handleChatMessage = (data) => {
    setChatMessages(prev => [...prev, data]);
  };

  // Register event listeners
  socket.on('room-state', handleRoomState);
  socket.on('user-joined', handleUserJoined);
  socket.on('user-left', handleUserLeft);
  socket.on('note-update', handleNoteUpdate);
  socket.on('chat-message', handleChatMessage);

  // Cleanup
  return () => {
    socket.off('room-state', handleRoomState);
    socket.off('user-joined', handleUserJoined);
    socket.off('user-left', handleUserLeft);
    socket.off('note-update', handleNoteUpdate);
    socket.off('chat-message', handleChatMessage);
  };
}, [currentRoom, user]); // Added 'user' to dependencies

  // Auto-save version every 5 minutes
  useEffect(() => {
    if (currentRoom && sharedNote) {
      const interval = setInterval(() => {
        saveVersion();
      }, 300000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [currentRoom, sharedNote]);

  // Functions
  const handleLogout = async () => {
    try {
      if (currentRoom) leaveRoom();
      await signOut(auth);
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  const createRoom = async () => {
    try {
      const currentUser = getCurrentUser();
      const response = await fetch(`/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, userName: currentUser.name })
      });
      const data = await response.json();
      if (data.success) {
        setCurrentRoom(data.room);
        setView('room');
        socket.emit('join-room', { roomId: data.room.id, user: currentUser });
      }
    } catch (error) {
      console.error('❌ Error creating room:', error);
      alert('Failed to create room');
    }
  };

  const joinRoom = async () => {
    if (!roomCode.trim()) return alert('Please enter a room code');
    try {
      const response = await fetch(`/api/rooms/${roomCode}`);
      const data = await response.json();
      if (data.success) {
        setCurrentRoom(data.room);
        setView('room');
        const currentUser = getCurrentUser();
        socket.emit('join-room', { roomId: data.room.id, user: currentUser });
      } else {
        alert('Room not found!');
      }
    } catch (error) {
      console.error('❌ Error joining room:', error);
      alert('Failed to join room');
    }
  };

  const leaveRoom = () => {
    if (socket && currentRoom) {
      const currentUser = getCurrentUser();
      socket.emit('leave-room', { roomId: currentRoom.id, userId: currentUser.id });
    }
    setCurrentRoom(null);
    setMembers([]);
    setSharedNote('');
    setChatMessages([]);
    setComments([]);
    setImages([]);
    setView('home');
  };

  const handleSave = () => {
    try {
      if (socket && currentRoom) {
        const currentUser = getCurrentUser();
        socket.emit('note-update', {
          roomId: currentRoom.id,
          content: sharedNote,
          userId: currentUser.id,
          userName: currentUser.name
        });
        showNotification('✓ Saved');
        saveVersion();
      }
    } catch (error) {
      console.error('❌ Error saving:', error);
      alert('Failed to save');
    }
  };

  const saveVersion = () => {
    const newVersion = {
      id: Date.now(),
      content: sharedNote,
      timestamp: new Date().toISOString(),
      author: getCurrentUser().name
    };
    setVersions(prev => [newVersion, ...prev].slice(0, 10)); // Keep last 10 versions
  };

  const handleShare = () => {
    if (!currentRoom) return;
    const shareUrl = `${window.location.origin}?room=${currentRoom.code}`;
    navigator.clipboard.writeText(shareUrl);
    alert(`Share this link:\n\n${shareUrl}\n\nRoom Code: ${currentRoom.code}`);
  };

  const handleExport = () => {
    try {
      let textContent = sharedNote;
      try {
        const parsed = JSON.parse(sharedNote);
        textContent = parsed.map(n => n.children?.map(c => c.text).join('')).join('\n\n');
      } catch (e) {}
      
      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notes-${currentRoom.code}-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('📥 Downloaded');
    } catch (error) {
      console.error('❌ Error exporting:', error);
      alert('Failed to export');
    }
  };

  const handleSaveDrawing = (imageData) => {
  try {
    // Insert into editor
    if (editorRef.current) {
      editorRef.current.insertImage(imageData);
    }
    
    // Also add as draggable image
    const newImage = {
      id: Date.now(),
      src: imageData,
      width: 400,
      height: 300
    };
    setImages(prev => [...prev, newImage]);
    showNotification('✓ Drawing inserted');
  } catch (error) {
    console.error('❌ Error inserting drawing:', error);
    alert('Failed to insert drawing');
  }
};

const handleInsertImage = (imageSrc) => {
  try {
    // Insert into editor
    if (editorRef.current) {
      editorRef.current.insertImage(imageSrc);
    }
    
    // Also add as draggable image
    const newImage = {
      id: Date.now(),
      src: imageSrc,
      width: 400,
      height: 300
    };
    setImages(prev => [...prev, newImage]);
    showNotification('✓ Image inserted');
  } catch (error) {
    console.error('❌ Error inserting image:', error);
    alert('Failed to insert image');
  }
};

  const handleAddComment = (comment) => {
    setComments(prev => [...prev, comment]);
    showNotification('✓ Comment added');
  };

  const handleDeleteComment = (id) => {
    setComments(prev => prev.filter(c => c.id !== id));
  };

  const handleResolveComment = (id) => {
    setComments(prev => prev.map(c => 
      c.id === id ? { ...c, resolved: true } : c
    ));
  };

  const handleRestoreVersion = (version) => {
    setSharedNote(version.content);
    showNotification('✓ Version restored');
  };

  const handleInsertTable = (tableData) => {
    // Convert table data to markdown format
    const markdown = tableData.map((row, i) => {
      const rowText = '| ' + row.join(' | ') + ' |';
      if (i === 0) {
        const separator = '| ' + row.map(() => '---').join(' | ') + ' |';
        return rowText + '\n' + separator;
      }
      return rowText;
    }).join('\n');
    
    showNotification('✓ Table inserted');
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const currentUser = getCurrentUser();
    const message = {
      id: Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      content: chatInput,
      timestamp: new Date().toLocaleTimeString()
    };
    if (socket && currentRoom) {
      socket.emit('chat-message', { roomId: currentRoom.id, message });
    }
    setChatInput('');
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(currentRoom.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showNotification = (message) => {
    const notification = document.createElement('div');
    notification.className = 'save-indicator';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  // Loading
  if (authLoading) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <h2>⏳ Loading...</h2>
        </div>
      </div>
    );
  }

  // Login
  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  // Home
  if (view === 'home') {
    return (
      <div className="app">
        <div className="home-container">
          <header className="home-header">
            <div className="user-info">
              <UserCircle size={40} />
              <div>
                <div className="user-name">{user.displayName || 'User'}</div>
                <div className="user-email">{user.email}</div>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
            <h1>📚 Study Together</h1>
            <p>Real-time collaboration with advanced features</p>
            <div className={`status ${connected ? 'connected' : 'disconnected'}`}>
              {connected ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
          </header>

          <div className="home-cards">
            <div className="card">
              <div className="card-icon" style={{backgroundColor: '#6366f1'}}>
                <Users size={32} color="white" />
              </div>
              <h2>Create Study Room</h2>
              <p>Start a new session</p>
              <button className="btn btn-primary" onClick={createRoom}>Create Room</button>
            </div>

            <div className="card">
              <div className="card-icon" style={{backgroundColor: '#8b5cf6'}}>
                <LogOut size={32} color="white" style={{transform: 'rotate(180deg)'}} />
              </div>
              <h2>Join Study Room</h2>
              <p>Enter room code</p>
              <input
                type="text"
                placeholder="Room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="input"
                maxLength={6}
              />
              <button className="btn btn-secondary" onClick={joinRoom}>Join Room</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Room View
  return (
    <div className="app">
      <div className="room-header">
        <div className="header-left">
          <h2>📚 Study Room</h2>
          <div className="room-code">
            <span>Room: <strong>{currentRoom.code}</strong></span>
            <button className="icon-btn" onClick={copyRoomCode}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-icon" onClick={() => setShowDrawing(true)} title="Drawing">
            <Pencil size={18} />
          </button>
          <button className="btn btn-icon" onClick={() => setShowImageUpload(true)} title="Insert Image">
            <ImageIcon size={18} />
          </button>
          <button className="btn btn-icon" onClick={() => setShowTable(true)} title="Insert Table">
            <TableIcon size={18} />
          </button>
          <button className="btn btn-icon" onClick={() => setShowStats(true)} title="Stats & History">
            <BarChart3 size={18} />
          </button>
          <button className="btn btn-icon" onClick={() => setShowPrint(true)} title="Print">
            <Printer size={18} />
          </button>
          <button className="btn btn-icon" onClick={() => setShowComments(!showComments)} title="Comments">
            <MessageCircle size={18} />
            {comments.filter(c => !c.resolved).length > 0 && (
              <span className="badge">{comments.filter(c => !c.resolved).length}</span>
            )}
          </button>
          <button className="btn btn-danger" onClick={leaveRoom}>
            <LogOut size={16} /> Leave
          </button>
        </div>
      </div>

      <div className="room-container">
        <div className="sidebar">
          <h3><Users size={20} /> Members ({members.length})</h3>
          <div className="members-list">
            {members.map(member => (
              <div key={member.id} className="member">
                <div className="avatar" style={{backgroundColor: member.color}}>
                  {member.name.charAt(0)}
                </div>
                <div className="member-info">
                  <div className="member-name">{member.name}</div>
                  <div className="member-status">🟢 Online</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="main-content">
          {/* <RichTextEditor
  ref={editorRef}
  value={sharedNote}
  onChange={(content) => {
    setSharedNote(content);
    
    if (currentRoom) {
      const currentUser = getCurrentUser();
      debouncedEmit(
        currentRoom.id,
        content,
        currentUser.id,
        currentUser.name
      );
    }
  }}
  placeholder="Start typing..."
  onSave={handleSave}
  onShare={handleShare}
  onExport={handleExport}
/> */}

// Then in your RichTextEditor component:
<RichTextEditor
  ref={editorRef}
  value={sharedNote}
  onChange={(content) => {
    setSharedNote(content);
    
    if (currentRoom) {
      const currentUser = getCurrentUser();
      debouncedEmit(
        currentRoom.id,
        content,
        currentUser.id,
        currentUser.name
      );
    }
  }}
  placeholder="Start typing..."
  onSave={handleSave}
  onShare={handleShare}
  onExport={handleExport}
/>
        </div>

        {showComments ? (
          <CommentsSidebar
            comments={comments}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
            onResolveComment={handleResolveComment}
            currentUser={getCurrentUser()}
          />
        ) : (
          <div className="sidebar">
            <h3><MessageSquare size={20} /> Chat</h3>
            <div className="chat-messages">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`message ${msg.userId === getCurrentUser().id ? 'own-message' : ''}`}>
                  {msg.userId !== getCurrentUser().id && (
                    <div className="message-author">{msg.userName}</div>
                  )}
                  <div className="message-content">{msg.content}</div>
                  <div className="message-time">{msg.timestamp}</div>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Message..."
                className="input"
              />
              <button className="btn btn-primary" onClick={sendMessage}>Send</button>
            </div>
          </div>
        )}
      </div>
  <ImageManager 
      images={images} 
      onRemoveImage={(id) => setImages(prev => prev.filter(img => img.id !== id))} 
    />
      {/* Modals */}
      <DrawingCanvas isOpen={showDrawing} onClose={() => setShowDrawing(false)} onSave={handleSaveDrawing} />
      <ImageUploadModal isOpen={showImageUpload} onClose={() => setShowImageUpload(false)} onInsert={handleInsertImage} />
      <StatsPanel isOpen={showStats} onClose={() => setShowStats(false)} content={sharedNote} versions={versions} onRestoreVersion={handleRestoreVersion} />
      {showPrint && <PrintView content={sharedNote} roomCode={currentRoom.code} onClose={() => setShowPrint(false)} />}
      <TableInsertModal isOpen={showTable} onClose={() => setShowTable(false)} onInsert={handleInsertTable} />
    </div>
  );
}

export default App;