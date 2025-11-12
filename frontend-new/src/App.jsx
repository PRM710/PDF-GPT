import React, { useState, useEffect } from 'react';
import PDFUpload from './components/PDFUpload';
import PDFList from './components/PDFList';
import ChatInterface from './components/ChatInterface';
import { getPDFs } from './utils/api';
import './App.css';

function App() {
  const [pdfs, setPdfs] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    loadPDFs();
  }, []);

  const loadPDFs = async () => {
    try {
      setLoading(true);
      const pdfList = await getPDFs();
      setPdfs(pdfList);
      if (pdfList.length > 0 && !selectedPdf) {
        setSelectedPdf(pdfList[0]);
      }
    } catch (error) {
      console.error('Error loading PDFs:', error);
      alert('Error loading PDFs. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handlePDFUpload = (newPdf) => {
    setPdfs(prev => [...prev, newPdf]);
    setSelectedPdf(newPdf);
    setSidebarOpen(false);
  };

  const handlePDFDelete = (deletedPdfId) => {
    setPdfs(prev => prev.filter(pdf => pdf.id !== deletedPdfId));
    if (selectedPdf && selectedPdf.id === deletedPdfId) {
      setSelectedPdf(pdfs.length > 1 ? pdfs.find(pdf => pdf.id !== deletedPdfId) : null);
    }
  };

  return (
    <div className="app-container">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button 
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>
        <div className="mobile-title">
          <h1>PDF-Lens</h1>
        </div>
        <div className="header-actions">
          {selectedPdf && (
            <span className="current-pdf">{selectedPdf.name}</span>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          <div className="logo-section">
            <div className="logo">📚</div>
            <div>
              <h1>PDF-Lens</h1>
              <p>Chat with your PDFs</p>
            </div>
          </div>
          <button 
            className="close-sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="sidebar-content">
          <div className="upload-section">
            <PDFUpload onUpload={handlePDFUpload} />
          </div>

          <div className="pdfs-section">
            <div className="section-header">
              <h3>Your Documents</h3>
              <span className="pdf-count">{pdfs.length}</span>
            </div>
            
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <span>Loading PDFs...</span>
              </div>
            ) : (
              <PDFList
                pdfs={pdfs}
                selectedPdf={selectedPdf}
                onSelectPdf={(pdf) => {
                  setSelectedPdf(pdf);
                  setSidebarOpen(false);
                }}
                onPDFDelete={handlePDFDelete}
              />
            )}
          </div>

          <div className="sidebar-footer">
            <div className="user-section">
              <div className="user-avatar">U</div>
              <span>User</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Chat area */}
      <main className="chat-main">
        {selectedPdf ? (
          <ChatInterface selectedPdf={selectedPdf} />
        ) : (
          <div className="welcome-screen">
            <div className="welcome-content">
              <div className="welcome-icon">📚</div>
              <h1>Welcome to PDF-Lens</h1>
              <p>Upload a PDF document to start chatting with AI</p>
              <div className="welcome-features">
                <div className="feature">
                  <span>🔍</span>
                  Ask questions about your document
                </div>
                <div className="feature">
                  <span>📝</span>
                  Get summaries and explanations
                </div>
                <div className="feature">
                  <span>💬</span>
                  Interactive AI conversations
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;