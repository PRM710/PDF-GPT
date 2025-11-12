import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadPDF = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/upload-pdf', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getPDFs = async () => {
  const response = await api.get('/pdfs');
  return response.data;
};

export const askQuestion = async (pdfId, question) => {
  const response = await api.post('/ask-question', {
    pdf_id: pdfId,
    question: question,
  });
  return response.data;
};

export const getChatHistory = async (pdfId) => {
  const response = await api.get(`/chat-history/${pdfId}`);
  return response.data;
};

export const deletePDF = async (pdfId) => {
  const response = await api.delete(`/pdf/${pdfId}`);
  return response.data;
};

export default api;