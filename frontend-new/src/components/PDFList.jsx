import React from 'react';
import { deletePDF } from '../utils/api';
import './PDFList.css';

const PDFList = ({ pdfs, selectedPdf, onSelectPdf, onPDFDelete }) => {
  const handleDelete = async (pdfId, event) => {
    event.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this PDF and all its chat history?')) {
      return;
    }

    try {
      await deletePDF(pdfId);
      onPDFDelete(pdfId);
    } catch (error) {
      console.error('Delete error:', error);
      alert(error.response?.data?.detail || 'Error deleting PDF. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (pdfs.length === 0) {
    return (
      <div className="pdf-list-empty">
        <div className="empty-icon">📚</div>
        <h3>No documents</h3>
        <p>Upload your first PDF to get started</p>
      </div>
    );
  }

  return (
    <div className="pdf-list">
      <div className="pdf-list-header">
        <h3>Documents</h3>
        <span className="pdf-count">{pdfs.length}</span>
      </div>
      <div className="pdf-items">
        {pdfs.map((pdf) => (
          <div
            key={pdf.id}
            className={`pdf-item ${selectedPdf?.id === pdf.id ? 'selected' : ''}`}
            onClick={() => onSelectPdf(pdf)}
          >
            <div className="pdf-icon">📄</div>
            <div className="pdf-content">
              <div className="pdf-name">{pdf.filename}</div>
              <div className="pdf-meta">
                <span className="pdf-date">{formatDate(pdf.upload_date)}</span>
                {pdf.file_size && (
                  <span className="pdf-size">• {pdf.file_size}</span>
                )}
              </div>
              {pdf.content_preview && (
                <div className="pdf-preview">
                  {pdf.content_preview}
                </div>
              )}
            </div>
            <button 
              className="pdf-delete-btn"
              onClick={(e) => handleDelete(pdf.id, e)}
              title="Delete PDF"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PDFList;