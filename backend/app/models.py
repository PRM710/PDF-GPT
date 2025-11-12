from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PDFUpload(BaseModel):
    filename: str
    content: str

class ChatMessage(BaseModel):
    pdf_id: str
    question: str
    answer: str
    timestamp: datetime

class QuestionRequest(BaseModel):
    pdf_id: str
    question: str

class PDFResponse(BaseModel):
    id: str
    filename: str
    upload_date: datetime
    content_preview: str

class ChatResponse(BaseModel):
    question: str
    answer: str
    timestamp: datetime