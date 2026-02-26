// server.js - Backend Server with Firebase Database

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { initializeFirebase, getDb, getTimestamp } = require('./firebaseAdmin');

// Initialize Firebase
initializeFirebase();
const db = getDb();

// Create Express app
const app = express();
const server = http.createServer(app);

// Setup Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for active users (for real-time presence)
const activeUsers = new Map();

// ========== HELPER FUNCTIONS ==========

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ========== REST API ENDPOINTS ==========

app.get('/', (req, res) => {
  res.json({ message: 'Study Collaboration Server with Database!' });
});

// Create a new room
app.post('/api/rooms/create', async (req, res) => {
  try {
    const { userId, userName } = req.body;
    const roomCode = generateRoomCode();
    
    const roomData = {
      id: `room_${roomCode}`,
      code: roomCode,
      owner: userId,
      ownerName: userName,
      createdAt: getTimestamp(),
      note: '',
      members: []
    };
    
    // Save to Firestore
    await db.collection('rooms').doc(roomData.id).set(roomData);
    
    console.log(`✅ Room created in database: ${roomCode}`);
    res.json({ success: true, room: roomData });
  } catch (error) {
    console.error('❌ Error creating room:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get room details
app.get('/api/rooms/:roomCode', async (req, res) => {
  try {
    const { roomCode } = req.params;
    const roomId = `room_${roomCode}`;
    
    const roomDoc = await db.collection('rooms').doc(roomId).get();
    
    if (!roomDoc.exists) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    
    // Get room data
    const room = { id: roomDoc.id, ...roomDoc.data() };
    
    // Get recent messages (last 50)
    const messagesSnapshot = await db.collection('rooms')
      .doc(roomId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .limit(50)
      .get();
    
    const messages = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ success: true, room, messages });
  } catch (error) {
    console.error('❌ Error fetching room:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all rooms (for dashboard - we'll use this later)
app.get('/api/rooms', async (req, res) => {
  try {
    const snapshot = await db.collection('rooms')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    
    const rooms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ success: true, rooms });
  } catch (error) {
    console.error('❌ Error fetching rooms:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== SOCKET.IO REAL-TIME EVENTS ==========

io.on('connection', (socket) => {
  console.log('🔌 New user connected:', socket.id);
  
  // USER JOINS A ROOM
  socket.on('join-room', async (data) => {
    try {
      const { roomId, user } = data;
      
      socket.join(roomId);
      activeUsers.set(socket.id, { ...user, roomId, socketId: socket.id });
      
      // Update room members in database
      await db.collection('rooms').doc(roomId).update({
        members: require('firebase-admin').firestore.FieldValue.arrayUnion(user.id)
      });
      
      // Get current room state from database
      const roomDoc = await db.collection('rooms').doc(roomId).get();
      const roomData = roomDoc.data();
      
      // Get messages from database
      const messagesSnapshot = await db.collection('rooms')
        .doc(roomId)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .limit(50)
        .get();
      
      const messages = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get active members
      const activeMembers = Array.from(activeUsers.values())
        .filter(u => u.roomId === roomId);
      
      // Send current state to new user
      socket.emit('room-state', {
        members: activeMembers,
        note: roomData.note || '',
        messages: messages
      });
      
      // Notify others
      socket.to(roomId).emit('user-joined', { 
        user,
        members: activeMembers
      });
      
      console.log(`👤 ${user.name} joined room ${roomId}`);
    } catch (error) {
      console.error('❌ Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });
  
  // USER UPDATES THE SHARED NOTE
  socket.on('note-update', async (data) => {
    try {
      const { roomId, content, userId, userName } = data;
      
      // Save to database
      await db.collection('rooms').doc(roomId).update({
        note: content,
        lastUpdated: getTimestamp(),
        lastUpdatedBy: userName
      });
      
      // Broadcast to others
      socket.to(roomId).emit('note-update', {
        content,
        userId,
        userName
      });
      
      console.log(`📝 ${userName} updated note in ${roomId}`);
    } catch (error) {
      console.error('❌ Error updating note:', error);
    }
  });
  
  // USER SENDS A CHAT MESSAGE
  socket.on('chat-message', async (data) => {
    try {
      const { roomId, message } = data;
      
      // Save message to database
      const messageData = {
        ...message,
        timestamp: getTimestamp()
      };
      
      await db.collection('rooms')
        .doc(roomId)
        .collection('messages')
        .add(messageData);
      
      // Broadcast to all users (including sender)
      io.to(roomId).emit('chat-message', message);
      
      console.log(`💬 ${message.userName}: ${message.content}`);
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  });
  
  // USER IS TYPING
  socket.on('user-typing', (data) => {
    const { roomId, userId, userName } = data;
    socket.to(roomId).emit('user-typing', { userId, userName });
  });
  
  // USER LEAVES ROOM
  socket.on('leave-room', async (data) => {
    try {
      const { roomId, userId } = data;
      const user = activeUsers.get(socket.id);
      
      if (user) {
        socket.leave(roomId);
        
        // Update database
        await db.collection('rooms').doc(roomId).update({
          members: require('firebase-admin').firestore.FieldValue.arrayRemove(userId)
        });
        
        socket.to(roomId).emit('user-left', { 
          userId,
          userName: user.name
        });
        
        console.log(`👋 ${user.name} left room ${roomId}`);
        activeUsers.delete(socket.id);
      }
    } catch (error) {
      console.error('❌ Error leaving room:', error);
    }
  });
  
  // USER DISCONNECTS
  socket.on('disconnect', async () => {
    try {
      const user = activeUsers.get(socket.id);
      
      if (user) {
        const { roomId, id, name } = user;
        
        // Update database
        await db.collection('rooms').doc(roomId).update({
          members: require('firebase-admin').firestore.FieldValue.arrayRemove(id)
        });
        
        io.to(roomId).emit('user-left', { userId: id, userName: name });
        
        console.log(`🔴 ${name} disconnected`);
        activeUsers.delete(socket.id);
      }
    } catch (error) {
      console.error('❌ Error handling disconnect:', error);
    }
  });
});

// ========== START SERVER ==========

const PORT = process.env.PORT || 5000;

// server.listen(PORT, () => {
//   console.log(`
// ╔═══════════════════════════════════════╗
// ║  🚀 Server Running on Port ${PORT}     ║
// ║  📡 Socket.io Ready                   ║
// ║  🔥 Firebase Connected                ║
// ║  🌐 Visit: http://localhost:${PORT}   ║
// ╚═══════════════════════════════════════╝
//   `);
// });
module.exports = app;
