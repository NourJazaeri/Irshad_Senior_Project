// client/src/pages/SupervisorChat.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import ChatMessage from '../components/ChatMessage.jsx';
import { getChatConversation, getCurrentUser, markSupervisorMessagesRead } from '../services/api';
import { FiArrowLeft, FiSend, FiMessageCircle } from 'react-icons/fi';
import '../styles/chat.css';

// Socket.io connection
const API_BASE = import.meta.env.VITE_API_BASE ||
                 import.meta.env.VITE_API_URL ||
                 'http://localhost:5000';

export default function SupervisorChat() {
  const { traineeId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [traineeInfo, setTraineeInfo] = useState(null);
  const [groupInfo, setGroupInfo] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const messagesEndRef = useRef(null);
  
  // Get supervisor ID from JWT token
  const currentUser = getCurrentUser();
  const supervisorId = currentUser?.id;

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize socket connection
  useEffect(() => {
    if (!supervisorId || !traineeId) {
      console.warn('⚠️ Missing supervisorId or traineeId for socket connection');
      return;
    }

    console.log('🔌 Initializing socket connection...');
    console.log('👤 supervisorId:', supervisorId);
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
        supervisorId,
        traineeId
      }
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to chat server, socket ID:', newSocket.id);
      setSocketConnected(true);
      
      // Join the chat room
      const roomData = { supervisorId: String(supervisorId), traineeId: String(traineeId) };
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
        supervisorId: String(supervisorId), 
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
  }, [traineeId, supervisorId]);

  // Load conversation history
  useEffect(() => {
    console.log('🔄 [SupervisorChat] Loading conversation...');
    console.log('📋 traineeId:', traineeId);
    console.log('👤 supervisorId:', supervisorId);

    (async () => {
      try {
        setLoading(true);
        console.log('🌐 Calling getChatConversation API...');
        const data = await getChatConversation(traineeId);
        console.log('✅ API Response received:', data);
        console.log('💬 Messages count:', data?.messages?.length || 0);
        console.log('📦 Full messages array:', data?.messages);
        console.log('👥 Trainee info:', data?.trainee);

        setMessages(data.messages || []);
        setTraineeInfo(data.trainee);
        
        // Extract group info from trainee data
        if (data.trainee?.group) {
          setGroupInfo(data.trainee.group);
        }
        console.log('✨ State updated with messages');

        // Mark messages as read when opening chat (non-blocking)
        if (traineeId) {
          markSupervisorMessagesRead(traineeId)
            .then(result => {
              console.log('✅ Messages marked as read:', result);
            })
            .catch(err => {
              console.error('❌ Could not mark messages as read:', err.message);
            });
        }
      } catch (error) {
        console.error('❌ Failed to load conversation:', error);
        console.error('❌ Error details:', error.message);
        console.error('❌ Error stack:', error.stack);
        // If trainee not found, redirect back
        if (error.message.includes('not found')) {
          navigate('/supervisor');
        }
      } finally {
        setLoading(false);
        console.log('🏁 Loading complete');
      }
    })();
  }, [traineeId, navigate, supervisorId]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || sending || !socket || !socketConnected) {
      if (!socket || !socketConnected) {
        alert('Not connected to chat server. Please wait for connection...');
      }
      return;
    }

    if (!supervisorId || !traineeId) {
      alert('Missing user information. Please refresh the page.');
      return;
    }

    const messageText = newMessage.trim();
    setSending(true);

    try {
      console.log('📤 Sending message via socket...');
      console.log('  supervisorId:', supervisorId);
      console.log('  traineeId:', traineeId);
      console.log('  message:', messageText);
      
      // Emit through socket for real-time delivery
      socket.emit('send-message', {
        supervisorId: String(supervisorId),
        traineeId: String(traineeId),
        message: messageText,
        senderRole: 'supervisor'
      });

      // Optimistically add message to UI (will be replaced by server response)
      const tempMessage = {
        _id: `temp-${Date.now()}`,
        messagesText: messageText,
        senderRole: 'supervisor',
        timestamp: new Date(),
        supervisorID: supervisorId,
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
      <div className="app-container supervisor-chat-page">
        <div className="chat-page-wrapper">
          <div className="chat-loading-full">
            <FiMessageCircle size={48} />
            <p>Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '18px', display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <span 
          style={{ color: '#6b7280', cursor: 'pointer' }} 
          onClick={() => navigate('/supervisor/groups')}
        >
          Groups
        </span>
        {groupInfo && (
          <>
            <span style={{ margin: '0 8px', color: '#9ca3af' }}>›</span>
            <span 
              style={{ color: '#6b7280', cursor: 'pointer' }} 
              onClick={() => navigate(`/supervisor/groups/${groupInfo._id}`)}
            >
              {groupInfo.groupName}
            </span>
          </>
        )}
        <span style={{ margin: '0 8px', color: '#9ca3af' }}>›</span>
        <span style={{ color: '#111827', fontWeight: '700' }}>
          Chat with {traineeInfo ? `${traineeInfo.fname} ${traineeInfo.lname}` : 'Trainee'}
        </span>
      </div>

      {/* Chat Container */}
      <div className="chat-container-full sv-card sv-group-card-enhanced" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1,
        minHeight: 0,
        animation: 'fadeInUp 0.5s ease-out forwards',
        opacity: 0,
        overflow: 'hidden'
      }}>
        {/* Trainee Name Header inside chat card */}
        <div style={{ 
          padding: '1.5rem 1.5rem 1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff',
          margin: '-1px -1px 0 -1px',
          borderRadius: '0.75rem 0.75rem 0 0'
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ 
              margin: 0, 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              color: '#0b2f55', 
              marginBottom: '0.25rem' 
            }}>
              {traineeInfo ? `${traineeInfo.fname} ${traineeInfo.lname}` : 'Trainee'}
            </h1>
            {traineeInfo?.email && (
              <p style={{ 
                margin: 0, 
                fontSize: '0.875rem', 
                color: '#475569' 
              }}>
                {traineeInfo.email}
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

          {/* Messages Area */}
          <div className="chat-messages" style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
          gap: '1rem',
          backgroundColor: '#f8fafc'
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
                <p style={{ color: '#94a3b8' }}>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <ChatMessage
                    key={msg._id || idx}
                    message={msg}
                    isSentByMe={msg.senderRole === 'supervisor' || !msg.senderRole}
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
                padding: '0.75rem',
                background: '#2563eb',
                border: '2px solid #2563eb',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
                width: '48px',
                height: '48px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
            }}
              onMouseEnter={(e) => {
                if (!e.target.disabled) {
                  e.target.style.background = '#1d4ed8';
                  e.target.style.borderColor = '#1d4ed8';
                  e.target.style.transform = 'translateY(-2px) scale(1.05)';
                  e.target.style.boxShadow = '0 8px 20px rgba(37, 99, 235, 0.35)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.target.disabled) {
                  e.target.style.background = '#2563eb';
                  e.target.style.borderColor = '#2563eb';
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.2)';
                }
              }}
            >
              <FiSend size={20} />
            </button>
          </form>
        </div>
    </div>
  );
}
