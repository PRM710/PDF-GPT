import os
import io
import requests
from PyPDF2 import PdfReader
from dotenv import load_dotenv

# ====================================
# Load environment variables
# ====================================
load_dotenv()

# ====================================
# Hugging Face API Setup (2025 Router Endpoint)
# ====================================
HF_API_URL = "https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct-v0.2"
HF_HEADERS = {"Authorization": f"Bearer {os.getenv('HF_API_KEY')}"}


def extract_text_from_pdf(pdf_file):
    """
    Extracts all readable text from a given PDF file.
    :param pdf_file: The binary content of the PDF file.
    :return: Extracted text as a string.
    """
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


def generate_answer(context, question):
    """
    Generates an answer using the Hugging Face Mistral model (Free API via router).
    The model only uses the provided context — no external knowledge.
    """
    try:
        prompt = f"""
        You are a helpful assistant that answers questions based ONLY on the provided document content.
        If the answer cannot be found in the document, respond with:
        "I cannot find the answer in the provided document."
        Do not use any external knowledge.

        DOCUMENT CONTENT:
        {context}

        QUESTION:
        {question}

        Please give a concise and factual answer based only on the above content.
        """

        # ✅ Updated for new Hugging Face router (2025)
        response = requests.post(
            HF_API_URL,
            headers=HF_HEADERS,
            json={
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": 300,
                    "temperature": 0.3,
                    "return_full_text": False
                }
            },
            timeout=60
        )

        # Error handling
        if response.status_code != 200:
            return f"Error from Hugging Face API: {response.status_code} {response.text}"

        data = response.json()

        # ✅ Handle both list-based and dict-based responses
        if isinstance(data, list) and len(data) > 0 and "generated_text" in data[0]:
            return data[0]["generated_text"].strip()
        elif isinstance(data, dict) and "generated_text" in data:
            return data["generated_text"].strip()
        else:
            return str(data)

    except Exception as e:
        return f"Error generating answer: {str(e)}"


# ====================================
# Example Usage (Optional)
# ====================================
if __name__ == "__main__":
    print("🔍 Testing PDF Reader and Hugging Face API...\n")

    try:
        # Example usage for local testing
        pdf_path = "sample.pdf"
        if os.path.exists(pdf_path):
            with open(pdf_path, "rb") as f:
                pdf_data = f.read()

            text = extract_text_from_pdf(pdf_data)
            print("✅ Extracted text length:", len(text))

            question = "What is the document mainly about?"
            answer = generate_answer(text[:2000], question)  # Limit context for token safety
            print("\n🤖 Answer:", answer)
        else:
            print("⚠️ No 'sample.pdf' file found for testing.")
    except Exception as e:
        print(f"❌ Error: {e}")
