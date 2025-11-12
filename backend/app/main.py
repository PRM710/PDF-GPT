from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from bson import ObjectId
import os
from pymongo import MongoClient
from PyPDF2 import PdfReader
import io
from dotenv import load_dotenv
from urllib.parse import quote_plus
import requests

# ====================================
# Load environment variables
# ====================================
load_dotenv()

# ====================================
# MongoDB Configuration
# ====================================
username = "prm710"
password = "Fastasaflash710@"
encoded_password = quote_plus(password)
database_name = "PDF_LLM"

MONGODB_URI = (
    f"mongodb+srv://{username}:{encoded_password}"
    f"@cluster0.2msa8pp.mongodb.net/{database_name}?retryWrites=true&w=majority&appName=Cluster0"
)

try:
    client = MongoClient(MONGODB_URI)
    client.admin.command("ping")
    print("✅ Successfully connected to MongoDB!")
except Exception as e:
    print(f"❌ MongoDB connection error: {e}")
    raise

db = client[database_name]
pdfs_collection = db["pdfs"]
chat_history_collection = db["chat_history"]

# ====================================
# Hugging Face LLM Configuration (Updated 2025)
# ====================================
HF_API_URL = (
    "https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct-v0.2"
)
HF_HEADERS = {"Authorization": f"Bearer {os.getenv('HF_API_KEY')}"}

app = FastAPI(title="PDF_LLM - PDF Querying System (Free LLM Version)")

# ====================================
# CORS Configuration
# ====================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====================================
# PDF Text Extraction
# ====================================
def extract_text_from_pdf(pdf_file):
    try:
        pdf_reader = PdfReader(io.BytesIO(pdf_file))
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")

# ====================================
# LLM Answer Generation (Router API fixed)
# ====================================
def generate_answer(context, question):
    try:
        prompt = f"""
        You are a helpful assistant that answers questions based ONLY on the provided document.
        If the answer is not in the document, respond with:
        "I cannot find the answer in the provided document."

        DOCUMENT CONTENT:
        {context}

        QUESTION:
        {question}

        Please give a concise and factual answer based only on the above content.
        """

        # ✅ New HF Inference Router request payload (2025 format)
        response = requests.post(
            HF_API_URL,
            headers=HF_HEADERS,
            json={
                "inputs": prompt,
                "parameters": {
                    "temperature": 0.3,
                    "max_new_tokens": 300,
                    "return_full_text": False
                }
            },
            timeout=60
        )

        if response.status_code != 200:
            return f"Error from Hugging Face API: {response.status_code} {response.text}"

        data = response.json()
        # Handle both possible formats (list or dict)
        if isinstance(data, list) and "generated_text" in data[0]:
            return data[0]["generated_text"].strip()
        elif isinstance(data, dict) and "generated_text" in data:
            return data["generated_text"].strip()
        else:
            return str(data)
    except Exception as e:
        return f"Error generating answer: {str(e)}"

# ====================================
# Routes
# ====================================
@app.get("/")
async def root():
    return {"message": "PDF_LLM API (Free Hugging Face LLM)", "status": "active"}

@app.get("/health")
async def health_check():
    try:
        client.admin.command("ping")
        return {
            "status": "healthy",
            "database": "connected",
            "model": "Mistral-7B (Hugging Face Free API)"
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    max_file_size = 2 * 1024 * 1024  # 2MB limit
    if len(contents) > max_file_size:
        raise HTTPException(status_code=400, detail="File too large (max 2MB)")

    text_content = extract_text_from_pdf(contents)
    if not text_content:
        raise HTTPException(status_code=400, detail="No text extracted from PDF")

    pdf_data = {
        "filename": file.filename,
        "content": text_content,
        "upload_date": datetime.utcnow(),
        "content_preview": (
            text_content[:200] + "..." if len(text_content) > 200 else text_content
        ),
        "file_size": len(contents),
    }

    result = pdfs_collection.insert_one(pdf_data)

    return {
        "id": str(result.inserted_id),
        "filename": file.filename,
        "message": "PDF uploaded successfully",
        "content_length": len(text_content),
        "file_size": len(contents),
    }

@app.get("/pdfs")
async def get_all_pdfs():
    try:
        pdfs = list(pdfs_collection.find().sort("upload_date", -1))
        return [
            {
                "id": str(pdf["_id"]),
                "filename": pdf["filename"],
                "upload_date": pdf["upload_date"],
                "content_preview": pdf["content_preview"],
                "file_size": pdf.get("file_size", 0),
            }
            for pdf in pdfs
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching PDFs: {str(e)}")

@app.post("/ask-question")
async def ask_question(data: dict):
    pdf_id = data.get("pdf_id")
    question = data.get("question")

    if not pdf_id or not question:
        raise HTTPException(status_code=400, detail="pdf_id and question are required")

    if not ObjectId.is_valid(pdf_id):
        raise HTTPException(status_code=400, detail="Invalid PDF ID format")

    pdf = pdfs_collection.find_one({"_id": ObjectId(pdf_id)})
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")

    answer = generate_answer(pdf["content"], question)

    chat_data = {
        "pdf_id": pdf_id,
        "question": question,
        "answer": answer,
        "timestamp": datetime.utcnow(),
    }
    chat_history_collection.insert_one(chat_data)

    return {
        "question": question,
        "answer": answer,
        "timestamp": chat_data["timestamp"],
    }

@app.get("/chat-history/{pdf_id}")
async def get_chat_history(pdf_id: str):
    if not ObjectId.is_valid(pdf_id):
        raise HTTPException(status_code=400, detail="Invalid PDF ID format")

    history = list(
        chat_history_collection.find({"pdf_id": pdf_id}).sort("timestamp", -1).limit(50)
    )
    return [
        {"question": chat["question"], "answer": chat["answer"], "timestamp": chat["timestamp"]}
        for chat in reversed(history)
    ]

@app.delete("/pdf/{pdf_id}")
async def delete_pdf(pdf_id: str):
    if not ObjectId.is_valid(pdf_id):
        raise HTTPException(status_code=400, detail="Invalid PDF ID format")

    result = pdfs_collection.delete_one({"_id": ObjectId(pdf_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="PDF not found")

    chat_history_collection.delete_many({"pdf_id": pdf_id})
    return {"message": "PDF and associated chat history deleted successfully"}

# ====================================
# Run Server
# ====================================
if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting PDF_LLM Server...")
    print(f"📊 Database: {database_name}")
    print("🤖 Model: Mistral-7B (Hugging Face Free API, Router Fixed)")
    print("💡 Running Free Tier Version (2MB file limit)")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
