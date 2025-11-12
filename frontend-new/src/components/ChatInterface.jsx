import React, { useState, useEffect, useRef } from 'react';
import { askQuestion, getChatHistory } from '../utils/api';
import './ChatInterface.css';

const ChatInterface = ({ selectedPdf }) => {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedPdf) {
      loadChatHistory();
    } else {
      setMessages([]);
    }
  }, [selectedPdf]);

  const loadChatHistory = async () => {
    try {
      const history = await getChatHistory(selectedPdf.id);
      setMessages(history);
    } catch (error) {
      console.error('Error loading chat history:', error);
      setMessages([{
        question: "System",
        answer: "Error loading chat history. Please try again.",
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || !selectedPdf || isLoading) return;

    const currentQuestion = question;
    setQuestion('');
    setIsLoading(true);

    // Add user question immediately
    const userMessage = {
      question: currentQuestion,
      answer: '',
      timestamp: new Date().toISOString(),
      isTyping: true
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await askQuestion(selectedPdf.id, currentQuestion);
      
      // Update the message with the response
      setMessages(prev => 
        prev.map((msg, index) => 
          index === prev.length - 1 
            ? { ...response, isTyping: false }
            : msg
        )
      );
    } catch (error) {
      console.error('Error asking question:', error);
      setMessages(prev => 
        prev.map((msg, index) => 
          index === prev.length - 1 
            ? { 
                ...msg, 
                answer: 'Sorry, there was an error processing your question. Please try again.',
                isTyping: false 
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedPdf) {
    return (
      <div className="chat-interface">
        <div className="chat-header">
          <div className="chat-title">
            <div className="chat-icon">💬</div>
            <div>
              <h1>PDF-Lens</h1>
              <p>Select a PDF to start chatting</p>
            </div>
          </div>
        </div>
        <div className="welcome-message">
          <div className="welcome-icon">🤖</div>
          <h2>How can I help you today?</h2>
          <p>Select a PDF document from the sidebar to start asking questions about its content.</p>
          <div className="suggestions">
            <div className="suggestion-item">
              <span className="suggestion-icon">🔍</span>
              <span>Ask about specific content</span>
            </div>
            <div className="suggestion-item">
              <span className="suggestion-icon">📝</span>
              <span>Get summaries and explanations</span>
            </div>
            <div className="suggestion-item">
              <span className="suggestion-icon">💬</span>
              <span>Have interactive conversations</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div className="chat-title">
          <div className="chat-icon">💬</div>
          <div>
            <h1>{selectedPdf.filename}</h1>
            <p>Ask questions about this document</p>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <div className="welcome-icon">💭</div>
            <h2>Ask anything about "{selectedPdf.filename}"</h2>
            <p>I can help you understand and analyze this document.</p>
            <div className="suggestions">
              <div className="suggestion-item" onClick={() => setQuestion("What is the main topic of this document?")}>
                <span className="suggestion-icon">🎯</span>
                <span>"What is the main topic of this document?"</span>
              </div>
              <div className="suggestion-item" onClick={() => setQuestion("Can you summarize the key points?")}>
                <span className="suggestion-icon">📋</span>
                <span>"Can you summarize the key points?"</span>
              </div>
              <div className="suggestion-item" onClick={() => setQuestion("What are the most important findings?")}>
                <span className="suggestion-icon">🔍</span>
                <span>"What are the most important findings?"</span>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className="message-container">
              <div className="message user-message">
                <div className="message-avatar">👤</div>
                <div className="message-content">
                  <div className="message-text">{message.question}</div>
                  <div className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div className="message assistant-message">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  {message.isTyping ? (
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  ) : (
                    <div className="message-text">{message.answer}</div>
                  )}
                  <div className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="message assistant-message">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <div className="input-wrapper">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={`Ask about "${selectedPdf.filename}"...`}
              disabled={isLoading}
              autoFocus
            />
            <button 
              type="submit" 
              disabled={isLoading || !question.trim()}
              className="send-button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </form>
        <div className="chat-disclaimer">
          <p>PDF-Lens can make mistakes. Consider checking important information.</p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;