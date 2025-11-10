// client/src/pages/TraineeChat.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import ChatMessage from '../components/ChatMessage.jsx';
import { getTraineeConversation, markTraineeMessagesRead, getCurrentUser } from '../services/api';
import { FiArrowLeft, FiSend, FiMessageCircle } from 'react-icons/fi';
import '../styles/login.css';
import '../styles/chat.css';

// Socket.io connection
const API_BASE = import.meta.env.VITE_API_BASE ||
                 import.meta.env.VITE_API_URL ||
                 'http://localhost:5000';

export default function TraineeChat() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [supervisorInfo, setSupervisorInfo] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const messagesEndRef = useRef(null);
  
  // Get trainee ID from JWT token
  const currentUser = getCurrentUser();
  const traineeId = currentUser?.id;

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize socket connection
  useEffect(() => {
    if (!supervisorInfo || !traineeId) {
      console.warn('⚠️ Missing supervisorInfo or traineeId for socket connection');
      return;
    }

    console.log('🔌 Initializing socket connection...');
    console.log('👤 supervisorId:', supervisorInfo._id);
    console.log('👤 traineeId:', traineeId);

    const token = localStorage.getItem('token');
    const newSocket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      auth: {
        token: token
      },
      query: {
        supervisorId: String(supervisorInfo._id),
        traineeId: String(traineeId)
      }
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to chat server, socket ID:', newSocket.id);
      setSocketConnected(true);
      
      // Join the chat room
      const roomData = { 
        supervisorId: String(supervisorInfo._id), 
        traineeId: String(traineeId) 
      };
      console.log('🚪 Joining room with data:', roomData);
      newSocket.emit('join-chat', roomData);
    });

    newSocket.on('room-joined', ({ roomId }) => {
      console.log('✅ Successfully joined room:', roomId);
    });

    newSocket.on('receive-message', (message) => {
      console.log('📨 New message received via socket:', message);
      setMessages((prev) => {
        // Remove any temporary messages with the same text (from optimistic update)
        const filtered = prev.filter(msg => {
          if (msg._id && msg._id.startsWith('temp-')) {
            // Remove temp message if real message arrived
            return false;
          }
          return true;
        });

        // Check if message already exists
        const exists = filtered.some(msg => {
          if (msg._id && message._id) {
            return String(msg._id) === String(message._id);
          }
          // Fallback: check by text and timestamp if IDs don't match
          return msg.messagesText === message.messagesText && 
                 Math.abs(new Date(msg.timestamp) - new Date(message.timestamp)) < 1000;
        });

        if (exists) {
          console.log('⚠️ Message already exists, skipping duplicate');
          return filtered;
        }
        
        console.log('✅ Adding new message to state');
        return [...filtered, message];
      });
    });

    newSocket.on('message-error', (error) => {
      console.error('❌ Message error from server:', error);
      alert(`Failed to send message: ${error.error || 'Unknown error'}`);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setSocketConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setSocketConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('✅ Socket reconnected after', attemptNumber, 'attempts');
      setSocketConnected(true);
      // Rejoin room after reconnection
      newSocket.emit('join-chat', { 
        supervisorId: String(supervisorInfo._id), 
        traineeId: String(traineeId) 
      });
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up socket connection');
      newSocket.disconnect();
      setSocketConnected(false);
    };
  }, [supervisorInfo, traineeId]);

  // Load conversation history
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getTraineeConversation();
        setMessages(data.messages || []);
        setSupervisorInfo(data.supervisor);

        // Mark messages as read when opening chat (non-blocking)
        markTraineeMessagesRead().catch(err => {
          console.log('Note: Could not mark messages as read:', err.message);
        });
      } catch (error) {
        console.error('Failed to load conversation:', error);
        setError(error.message);
        if (error.message.includes('not assigned')) {
          setTimeout(() => navigate('/trainee'), 3000);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || sending || !supervisorInfo || !socket || !socketConnected) {
      if (!socket || !socketConnected) {
        alert('Not connected to chat server. Please wait for connection...');
      }
      return;
    }

    if (!supervisorInfo._id || !traineeId) {
      alert('Missing user information. Please refresh the page.');
      return;
    }

    const messageText = newMessage.trim();
    setSending(true);

    try {
      console.log('📤 Sending message via socket...');
      console.log('  supervisorId:', supervisorInfo._id);
      console.log('  traineeId:', traineeId);
      console.log('  message:', messageText);
      
      // Emit through socket for real-time delivery
      socket.emit('send-message', {
        supervisorId: String(supervisorInfo._id),
        traineeId: String(traineeId),
        message: messageText,
        senderRole: 'trainee'
      });

      // Optimistically add message to UI (will be replaced by server response)
      const tempMessage = {
        _id: `temp-${Date.now()}`,
        messagesText: messageText,
        senderRole: 'trainee',
        timestamp: new Date(),
        supervisorID: supervisorInfo._id,
        traineeID: traineeId
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      
      console.log('✅ Message sent, waiting for server confirmation');
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (loading) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="chat-loading-full">
          <FiMessageCircle size={48} />
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="chat-error-full">
          <h2>Unable to Load Chat</h2>
          <p>{error}</p>
          <button 
            className="chat-back-btn" 
            onClick={() => navigate('/trainee')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              color: '#64748b',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginTop: '1rem'
            }}
          >
            <FiArrowLeft /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Back link */}
      <div style={{ marginBottom: '1rem' }}>
        <button 
          onClick={() => navigate('/trainee')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            color: '#64748b',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          <FiArrowLeft /> Back to Dashboard
        </button>
      </div>

      {/* Chat Header */}
      <div className="chat-page-header" style={{ 
        padding: '1.5rem', 
        background: 'linear-gradient(135deg, #0b2b5a 0%, #173a72 100%)',
        borderRadius: '0.75rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(11, 43, 90, 0.2)'
      }}>
        <div className="chat-header-info" style={{ flex: 1 }}>
          <h1 className="chat-page-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#ffffff', marginBottom: '0.5rem' }}>
            {supervisorInfo ? `${supervisorInfo.fname} ${supervisorInfo.lname}` : 'Supervisor'}
          </h1>
          {supervisorInfo?.email && (
            <p className="chat-header-email" style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)' }}>
              {supervisorInfo.email}
            </p>
          )}
        </div>
        <div className="chat-connection-status">
          {socketConnected ? (
            <span className="status-indicator status-connected" title="Connected" style={{ color: '#10b981', fontSize: '1.25rem' }}>●</span>
          ) : (
            <span className="status-indicator status-disconnected" title="Disconnected" style={{ color: '#ef4444', fontSize: '1.25rem' }}>○</span>
          )}
        </div>
      </div>

      {/* Chat Container */}
      <div className="chat-container-full" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1,
        minHeight: 0,
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Messages Area */}
        <div className="chat-messages" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {messages.length === 0 ? (
            <div className="chat-empty" style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8'
            }}>
              <FiMessageCircle size={64} />
              <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem', color: '#64748b' }}>Start a Conversation</h3>
              <p style={{ color: '#94a3b8' }}>Send a message to your supervisor!</p>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={msg._id || idx}
                  message={msg}
                  isSentByMe={msg.senderRole === 'trainee'}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        <form className="chat-input-container" onSubmit={handleSendMessage} style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center'
        }}>
          <input
            type="text"
            className="chat-input"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending || loading}
            maxLength={1000}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!newMessage.trim() || sending || loading}
            title="Send message"
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #0b2b5a 0%, #173a72 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(11, 43, 90, 0.2)'
            }}
            onMouseEnter={(e) => !e.target.disabled && (e.target.style.background = 'linear-gradient(135deg, #173a72 0%, #1e4a8a 100%)')}
            onMouseLeave={(e) => !e.target.disabled && (e.target.style.background = 'linear-gradient(135deg, #0b2b5a 0%, #173a72 100%)')}
          >
            <FiSend />
          </button>
        </form>
      </div>
    </div>
  );
}
