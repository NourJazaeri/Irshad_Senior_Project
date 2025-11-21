import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Loader, Bot } from 'lucide-react';
import '../styles/chatbot.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function TraineeChatbot() {
  // Load conversation from sessionStorage on mount
  const loadSavedConversation = () => {
    try {
      const saved = sessionStorage.getItem('chatbot_conversation');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsed.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        return {
          messages: messagesWithDates,
          conversationId: parsed.conversationId || null
        };
      }
    } catch (error) {
      console.error('Error loading saved conversation:', error);
    }
    return { messages: [], conversationId: null };
  };

  const savedData = loadSavedConversation();
  const [messages, setMessages] = useState(savedData.messages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(savedData.conversationId);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Save conversation to sessionStorage whenever messages or conversationId changes
  useEffect(() => {
    try {
      sessionStorage.setItem('chatbot_conversation', JSON.stringify({
        messages: messages,
        conversationId: conversationId
      }));
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }, [messages, conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Update document title and favicon when on chatbot page
  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'AI Trainee Assistant - ' + originalTitle.split(' - ').pop() || 'Onboarding System';
    
    // Create Bot icon SVG favicon (using Lucide Bot icon path)
    const botIconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0b2f55" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 8V4H8"/>
        <rect width="16" height="12" x="4" y="8" rx="2"/>
        <path d="M2 14h2"/>
        <path d="M20 14h2"/>
        <path d="M15 13v2"/>
        <path d="M9 13v2"/>
      </svg>
    `;
    
    // Create or update favicon link
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    
    // Set favicon to Bot icon SVG
    const blob = new Blob([botIconSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    link.href = url;
    
    return () => {
      document.title = originalTitle;
      // Restore original favicon if needed
      if (link) {
        link.href = '/favicon.ico';
      }
      URL.revokeObjectURL(url);
    };
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message to UI immediately
    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      text: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: userMessage,
          conversation_id: conversationId
        })
      });

      const data = await response.json().catch(() => ({ error: 'Failed to parse server response' }));

      if (!response.ok) {
        const errorMsg = typeof data.error === 'string' 
          ? data.error 
          : (data.error?.message || JSON.stringify(data.error) || 'Failed to get response from chatbot');
        const suggestion = data.suggestion || '';
        throw new Error(errorMsg + (suggestion ? `\n\n${suggestion}` : ''));
      }

      // Update conversation ID if provided
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      // Add bot response
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: data.answer,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Chatbot error:', error);
      // Extract error message properly
      let errorText = 'Unknown error occurred';
      if (error instanceof Error) {
        errorText = error.message;
      } else if (typeof error === 'string') {
        errorText = error;
      } else if (error?.message) {
        errorText = error.message;
      } else {
        errorText = JSON.stringify(error);
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        text: `Error: ${errorText}${errorText.includes('service') ? '' : '\n\nPlease make sure the chatbot service is running on port 8002.'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };


  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="chatbot-container">
      {/* Chat Container */}
      <div style={{ 
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
        {/* AI Assistant Header inside chat card */}
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
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Bot size={32} style={{ color: '#0b2f55', flexShrink: 0 }} />
            <div>
              <h1 style={{ 
                margin: 0, 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#0b2f55',
                marginBottom: '0.25rem'
              }}>
                AI Trainee Assistant
              </h1>
              <p style={{ 
                margin: 0, 
                fontSize: '0.875rem', 
                color: '#475569' 
              }}>
                Ask me anything about your company, onboarding, or training.
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="chatbot-messages" style={{
          backgroundColor: '#f8fafc'
        }}>
        {messages.length === 0 ? (
          <div className="chatbot-empty">
            <MessageCircle size={64} className="chatbot-empty-icon" />
            <h3>Start a Conversation</h3>
            <p>Ask me anything about your company, onboarding, or training.</p>
            <div className="chatbot-suggestions">
              <button
                onClick={() => setInput('How do I use the trainee dashboard?')}
                className="suggestion-btn"
              >
                How do I use the trainee dashboard?
              </button>
              <button
                onClick={() => setInput('How can I reset my password?')}
                className="suggestion-btn"
              >
                How can I reset my password?
              </button>
              <button
                onClick={() => setInput('Where can I see my quiz score?')}
                className="suggestion-btn"
              >
                Where can I see my quiz score?
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chatbot-message chatbot-message-${message.type}`}
              >
                <div className="chatbot-message-content">
                  <div className="chatbot-message-text">{message.text}</div>
                  <div className="chatbot-message-time">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="chatbot-message chatbot-message-bot">
                <div className="chatbot-message-content">
                  <div className="chatbot-loading">
                    <Loader size={16} className="spinning" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="chatbot-input-container" style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center'
        }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="chatbot-input"
            disabled={loading}
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
            className="chatbot-send-btn"
            disabled={!input.trim() || loading}
            title="Send message"
            style={{
              padding: '0.75rem',
              background: 'transparent',
              border: '2px solid #e0f2fe',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              transition: 'all 0.2s',
              color: '#0b2f55'
            }}
            onMouseEnter={(e) => {
              if (!e.target.disabled) {
                e.target.style.borderColor = '#60a5fa';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(96, 165, 250, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.target.disabled) {
                e.target.style.borderColor = '#e0f2fe';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}

