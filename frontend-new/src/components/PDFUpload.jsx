import React, { useState } from 'react';
import { uploadPDF } from '../utils/api';
import './PDFUpload.css';

const PDFUpload = ({ onUpload }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = async (file) => {
    if (!file) return;

    if (!file.type.includes('pdf')) {
      alert('Please upload a PDF file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      alert('File size must be less than 50MB');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadPDF(file);
      onUpload(result);
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.response?.data?.detail || 'Error uploading PDF. Please try again.');
    } finally {
      setIsUploading(false);
      setDragOver(false);
    }
  };

  const handleFileInput = async (event) => {
    const file = event.target.files[0];
    await handleFileUpload(file);
    event.target.value = '';
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    handleFileUpload(file);
  };

  return (
    <div className="pdf-upload">
      <div className="upload-header">
        <h3>Upload PDF</h3>
      </div>
      
      <div 
        className={`upload-area ${dragOver ? 'drag-over' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="pdf-upload"
          accept=".pdf"
          onChange={handleFileInput}
          disabled={isUploading}
        />
        
        {isUploading ? (
          <div className="upload-state">
            <div className="upload-spinner"></div>
            <div className="upload-text">
              <div className="upload-title">Uploading PDF...</div>
              <div className="upload-subtitle">Extracting text content</div>
            </div>
          </div>
        ) : (
          <label htmlFor="pdf-upload" className="upload-label">
            <div className="upload-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="upload-text">
              <div className="upload-title">Click to upload or drag and drop</div>
              <div className="upload-subtitle">PDF files only (max 50MB)</div>
            </div>
          </label>
        )}
      </div>

      <div className="upload-features">
        <div className="feature">
          <span className="feature-icon">🔍</span>
          <span>Ask questions about content</span>
        </div>
        <div className="feature">
          <span className="feature-icon">📝</span>
          <span>Get summaries and explanations</span>
        </div>
      </div>
    </div>
  );
};

export default PDFUpload;