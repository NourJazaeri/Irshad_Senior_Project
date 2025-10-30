// client/src/pages/TraineeChat.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import ChatMessage from '../components/ChatMessage.jsx';
import { getTraineeConversation, markTraineeMessagesRead } from '../services/api';
import { FiArrowLeft, FiSend, FiMessageCircle } from 'react-icons/fi';
import '../styles/login.css';
import '../styles/chat.css';

// Socket.io connection
const API_BASE = import.meta.env.VITE_API_BASE ||
                 import.meta.env.VITE_API_URL ||
                 'http://localhost:5002';

export default function TraineeChat() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [supervisorInfo, setSupervisorInfo] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const traineeId = localStorage.getItem('userId');

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize socket connection
  useEffect(() => {
    if (!supervisorInfo) return;

    const newSocket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to chat server');
      // Join the chat room
      newSocket.emit('join-chat', { supervisorId: supervisorInfo._id, traineeId });
    });

    newSocket.on('receive-message', (message) => {
      console.log('📨 New message received:', message);
      setMessages((prev) => {
        // Prevent duplicate messages
        const exists = prev.some(msg => msg._id && msg._id === message._id);
        if (exists) {
          console.log('Message already exists, skipping duplicate');
          return prev;
        }
        return [...prev, message];
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
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

    if (!newMessage.trim() || sending || !supervisorInfo) return;

    setSending(true);
    try {
      // Emit through socket for real-time delivery
      socket.emit('send-message', {
        supervisorId: supervisorInfo._id,
        traineeId,
        message: newMessage.trim(),
        senderRole: 'trainee'
      });

      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (loading) {
    return (
      <div className="app-container trainee-chat-page">
        <div className="chat-page-wrapper">
          <div className="chat-loading-full">
            <FiMessageCircle size={48} />
            <p>Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container trainee-chat-page">
        <div className="chat-page-wrapper">
          <div className="chat-error-full">
            <h2>Unable to Load Chat</h2>
            <p>{error}</p>
            <button className="chat-back-btn" onClick={() => navigate('/trainee')}>
              <FiArrowLeft /> Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container trainee-chat-page">
      <div className="chat-page-wrapper">
        {/* Chat Header */}
        <div className="chat-page-header">
          <button className="chat-back-btn" onClick={() => navigate('/trainee')}>
            <FiArrowLeft /> Back
          </button>
          <div className="chat-header-info">
            <h1 className="chat-page-title">
              Chat with {supervisorInfo ? `${supervisorInfo.fname} ${supervisorInfo.lname}` : 'Supervisor'}
            </h1>
            {supervisorInfo?.email && (
              <p className="chat-header-email">{supervisorInfo.email}</p>
            )}
          </div>
        </div>

        {/* Chat Container */}
        <div className="chat-container-full">
          {/* Messages Area */}
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty">
                <FiMessageCircle size={64} />
                <h3>Start a Conversation</h3>
                <p>Send a message to your supervisor!</p>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <ChatMessage
                    key={msg._id || idx}
                    message={msg}
                    isSupervisor={msg.senderRole === 'supervisor' || !msg.senderRole}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Message Input */}
          <form className="chat-input-container" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="chat-input"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending || loading}
              maxLength={1000}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!newMessage.trim() || sending || loading}
              title="Send message"
            >
              <FiSend />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
