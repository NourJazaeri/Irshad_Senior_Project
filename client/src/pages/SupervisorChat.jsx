// client/src/pages/SupervisorChat.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import ChatMessage from '../components/ChatMessage.jsx';
import { getChatConversation } from '../services/api';
import { FiArrowLeft, FiSend } from 'react-icons/fi';
import '../styles/supervisor.css';
import '../styles/chat.css';

// Socket.io connection
const API_BASE = import.meta.env.VITE_API_BASE ||
                 import.meta.env.VITE_API_URL ||
                 'http://localhost:5002';

export default function SupervisorChat() {
  const { traineeId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [traineeInfo, setTraineeInfo] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState(null);

  const messagesEndRef = useRef(null);
  const supervisorId = localStorage.getItem('userId'); // Assuming userId is stored during login

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to chat server');
      // Join the chat room
      newSocket.emit('join-chat', { supervisorId, traineeId });
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
        console.log('✨ State updated with messages');
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

    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      // Emit through socket for real-time delivery
      socket.emit('send-message', {
        supervisorId,
        traineeId,
        message: newMessage.trim(),
        senderRole: 'supervisor'
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
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="sup-shell">
      {/* LEFT SIDEBAR */}
      <aside className="sup-sidebar">
        <Sidebar />
      </aside>

      {/* MAIN */}
      <main className="sup-main">
        <Topbar />

        <div className="sup-content">
          {/* Back link */}
          <div className="sv-backline">
            <Link to="/supervisor" className="sv-backlink">
              <FiArrowLeft /> Back to Dashboard
            </Link>
          </div>

          {/* Chat Header */}
          <div className="chat-header">
            <h1 className="sv-title">
              {traineeInfo ? `${traineeInfo.fname} ${traineeInfo.lname}` : 'Trainee'}
            </h1>
            {traineeInfo?.email && (
              <p className="chat-header-email">{traineeInfo.email}</p>
            )}
          </div>

          {/* Chat Container */}
          <div className="chat-container">
            {/* Messages Area */}
            <div className="chat-messages">
              {loading ? (
                <div className="chat-loading">Loading conversation...</div>
              ) : messages.length === 0 ? (
                <div className="chat-empty">
                  <p>No messages yet. Start the conversation!</p>
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
            <form className="chat-input-container" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="chat-input"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending || loading}
              />
              <button
                type="submit"
                className="chat-send-btn"
                disabled={!newMessage.trim() || sending || loading}
              >
                <FiSend />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
