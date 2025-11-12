import axios from 'axios';

// Automatically switch between local and deployed backend
const API_BASE_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:8000'
    : 'https://pdf-gpt-mbwo.onrender.com'; // <-- Render backend URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Upload PDF
export const uploadPDF = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/upload-pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// Fetch PDFs
export const getPDFs = async () => {
  const response = await api.get('/pdfs');
  return response.data;
};

// Ask a question
export const askQuestion = async (pdfId, question) => {
  const response = await api.post('/ask-question', {
    pdf_id: pdfId,
    question,
  });
  return response.data;
};

// Get chat history
export const getChatHistory = async (pdfId) => {
  const response = await api.get(`/chat-history/${pdfId}`);
  return response.data;
};

// Delete PDF
export const deletePDF = async (pdfId) => {
  const response = await api.delete(`/pdf/${pdfId}`);
  return response.data;
};

export default api;
