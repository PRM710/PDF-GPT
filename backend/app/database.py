from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    def __init__(self):
        self.client = MongoClient(os.getenv("MONGODB_URI"))
        self.db = self.client[os.getenv("DATABASE_NAME")]
        self.pdfs = self.db["pdfs"]
        self.chat_history = self.db["chat_history"]
    
    def insert_pdf(self, pdf_data):
        return self.pdfs.insert_one(pdf_data)
    
    def get_pdf_by_id(self, pdf_id):
        return self.pdfs.find_one({"_id": pdf_id})
    
    def get_all_pdfs(self):
        return list(self.pdfs.find())
    
    def insert_chat(self, chat_data):
        return self.chat_history.insert_one(chat_data)
    
    def get_chat_history(self, pdf_id, limit=50):
        return list(self.chat_history.find({"pdf_id": pdf_id}).sort("timestamp", -1).limit(limit))

db = Database()